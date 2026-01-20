import { FunctionDeclaration, Type } from "@google/genai";
import { Task } from "./types";

export const GEMINI_MODEL = 'gemini-3-flash-preview';

export const INITIAL_SYSTEM_INSTRUCTION = `
You are HUD, an efficient and professional personal workspace assistant.
Your goal is to help the user manage their tasks and information effectively.
Keep responses concise, helpful, and direct.

You have access to tools to managing tasks. 
- If the user wants to add a task, call the create_task function.
- If the user wants to mark a task as done, call the complete_task function.
- If the user asks about their workload, summarize the tasks.

The user prefers a clean, no-nonsense interface. Do not roleplay as a sci-fi computer. Be a helpful AI assistant.
`;

export const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Prepare Q3 Report', status: 'completed', priority: 'high', createdAt: Date.now() - 100000 },
  { id: '2', title: 'Email marketing team', status: 'in-progress', priority: 'medium', createdAt: Date.now() - 50000 },
  { id: '3', title: 'Update server configs', status: 'pending', priority: 'high', createdAt: Date.now() },
];

export const HUD_TOOLS: FunctionDeclaration[] = [
  {
    name: 'change_context',
    description: 'Switch the HUD view to a specific context (Dev, Design, Ops, Studio).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        contextId: {
          type: Type.STRING,
          enum: ['dev', 'design', 'ops', 'studio'],
          description: 'The ID of the context to switch to.'
        }
      },
      required: ['contextId']
    }
  },
  {
    name: 'focus_window',
    description: 'Focus and pan to a specific window on the HUD.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        windowId: {
          type: Type.STRING,
          description: 'The ID of the window (e.g., code, terminal, tasks, db, arch, git, pipeline, logs, ui).'
        }
      },
      required: ['windowId']
    }
  },
  {
    name: 'create_task',
    description: 'Create a new task.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Task title' },
        priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
      },
      required: ['title']
    }
  },
  {
      name: 'complete_task',
      description: 'Mark a task as complete.',
      parameters: {
          type: Type.OBJECT,
          properties: { taskId: { type: Type.STRING } },
          required: ['taskId']
      }
  }
];