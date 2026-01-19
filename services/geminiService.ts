import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { GEMINI_MODEL, INITIAL_SYSTEM_INSTRUCTION } from "../constants";
import { Task } from "../types";

// --- Tools Definition ---

const createTaskTool: FunctionDeclaration = {
  name: 'create_task',
  description: 'Create a new task in the work management system.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'The description or title of the task.',
      },
      priority: {
        type: Type.STRING,
        description: 'The priority level: low, medium, or high.',
        enum: ['low', 'medium', 'high']
      },
    },
    required: ['title'],
  },
};

const completeTaskTool: FunctionDeclaration = {
  name: 'complete_task',
  description: 'Mark a task as completed.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskId: {
        type: Type.STRING,
        description: 'The ID of the task to complete. Ask the user for clarification if the ID is ambiguous or unknown, or try to match by title loosely if possible.',
      },
    },
    required: ['taskId'],
  },
};

const tools: Tool[] = [
  {
    functionDeclarations: [createTaskTool, completeTaskTool],
  },
];

// --- Service Class ---

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private chatSession: any;
  private apiKey: string | null = null;

  constructor() {
    // Try to load from storage on init, or check env for dev convenience
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    const envKey = process.env.API_KEY; // Fallback for local dev
    
    if (storedKey) {
      this.initialize(storedKey);
    } else if (envKey) {
      this.initialize(envKey);
    }
  }

  public initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
    this.chatSession = null; // Reset session on new key
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  public async startChat(history: any[] = []) {
    if (!this.ai) return; // Wait for init

    try {
      this.chatSession = this.ai.chats.create({
        model: GEMINI_MODEL,
        config: {
          systemInstruction: INITIAL_SYSTEM_INSTRUCTION,
          tools: tools,
        },
        history: history,
      });
    } catch (error) {
      console.error("Failed to start chat session", error);
    }
  }

  public async sendMessage(
    message: string,
    context: { 
      tasks: Task[], 
      onTaskCreate: (t: Partial<Task>) => string, 
      onTaskComplete: (id: string) => string 
    }
  ): Promise<string> {
    if (!this.ai || !this.isConfigured()) {
        return "System halted: API Key required for uplink.";
    }

    if (!this.chatSession) {
      await this.startChat();
    }

    try {
      // We inject current task state contextually if needed, but for now we rely on the tools.
      // However, to let the model know IDs for completion, we might want to prepend a system note 
      // or just trust the conversational flow. 
      // For a robust HUD, let's append a hidden context about current visible tasks if the user asks about them.
      // For this simplified version, we just send the message.

      // Add context about tasks invisibly if the user is asking about "tasks" or "work"
      let finalMessage = message;
      if (message.toLowerCase().includes('task') || message.toLowerCase().includes('work') || message.toLowerCase().includes('list')) {
        const taskListStr = context.tasks.map(t => `[ID: ${t.id}] ${t.title} (${t.status})`).join(', ');
        finalMessage = `${message}\n\n[SYSTEM CONTEXT: Current Tasks: ${taskListStr || 'None'}]`;
      }

      let result = await this.chatSession.sendMessage({ message: finalMessage });
      
      // Handle Function Calls loop
      // The SDK might return a tool call. We need to execute it and send the response back.
      // Note: The GenAI SDK simplifies this, but we need to check `functionCalls`.
      
      // We iterate while there are function calls to be made
      // Limit iterations to prevent loops
      let maxTurns = 5;
      
      while (result.functionCalls && result.functionCalls.length > 0 && maxTurns > 0) {
        maxTurns--;
        const functionResponses = [];
        
        for (const call of result.functionCalls) {
          const { name, args, id } = call;
          let functionResult = { result: 'Error: Unknown function' };

          if (name === 'create_task') {
            const newId = context.onTaskCreate({ 
              title: args.title as string, 
              priority: (args.priority as 'low'|'medium'|'high') || 'medium' 
            });
            functionResult = { result: `Task created successfully with ID ${newId}` };
          } else if (name === 'complete_task') {
            const status = context.onTaskComplete(args.taskId as string);
            functionResult = { result: status };
          }

          functionResponses.push({
            id: id,
            name: name,
            response: functionResult
          });
        }

        // Send the tool response back to the model
        result = await this.chatSession.sendToolResponse({ functionResponses });
      }

      return result.text || "Command processed.";

    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      return "Error: Uplink unstable. Could not process request.";
    }
  }
}

export const geminiService = new GeminiService();
