import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { GEMINI_MODEL, INITIAL_SYSTEM_INSTRUCTION } from "../../../constants";
import { Task } from "../../../types";

// --- Tools Definition ---
const createTaskTool: FunctionDeclaration = {
  name: 'create_task',
  description: 'Create a new task in the work management system.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'The description or title of the task.' },
      priority: { type: Type.STRING, description: 'The priority level: low, medium, or high.', enum: ['low', 'medium', 'high'] },
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
      taskId: { type: Type.STRING, description: 'The ID of the task to complete.' },
    },
    required: ['taskId'],
  },
};

const tools: Tool[] = [{ functionDeclarations: [createTaskTool, completeTaskTool] }];

// --- Client Class ---
export class HudClient {
  private ai: GoogleGenAI | null = null;
  private chatSession: any;
  private apiKey: string | null = null;

  constructor() {
    // Initial load handled by context/hooks, but constructor checks storage for safety
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    if (storedKey) {
      this.initialize(storedKey);
    }
  }

  public initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.ai = new GoogleGenAI({ apiKey });
    this.chatSession = null;
  }

  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  public async startChat(history: any[] = []) {
    if (!this.ai) return;
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
      console.error("HudClient: Failed to start chat session", error);
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
    if (!this.ai || !this.isConfigured()) return "System halted: API Key required.";
    if (!this.chatSession) await this.startChat();

    try {
      let finalMessage = message;
      if (message.toLowerCase().includes('task') || message.toLowerCase().includes('work') || message.toLowerCase().includes('list')) {
        const taskListStr = context.tasks.map(t => `[ID: ${t.id}] ${t.title} (${t.status})`).join(', ');
        finalMessage = `${message}\n\n[SYSTEM CONTEXT: Current Tasks: ${taskListStr || 'None'}]`;
      }

      let result = await this.chatSession.sendMessage({ message: finalMessage });
      
      let maxTurns = 5;
      while (result.functionCalls && result.functionCalls.length > 0 && maxTurns > 0) {
        maxTurns--;
        const functionResponses = [];
        for (const call of result.functionCalls) {
          const { name, args, id } = call;
          let functionResult = { result: 'Error: Unknown function' };

          if (name === 'create_task') {
            const newId = context.onTaskCreate({ title: args.title as string, priority: args.priority as any || 'medium' });
            functionResult = { result: `Task created successfully with ID ${newId}` };
          } else if (name === 'complete_task') {
            const status = context.onTaskComplete(args.taskId as string);
            functionResult = { result: status };
          }
          functionResponses.push({ id, name, response: functionResult });
        }
        result = await this.chatSession.sendToolResponse({ functionResponses });
      }
      return result.text || "Command processed.";
    } catch (error) {
      console.error("HudClient: Error sending message", error);
      return "Error: Uplink unstable.";
    }
  }
}

export const hudClient = new HudClient();
