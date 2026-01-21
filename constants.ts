import { FunctionDeclaration, Type } from "@google/genai";
import { Task } from "./types";

export const GEMINI_MODEL = 'gemini-3-flash-preview';

export const INITIAL_SYSTEM_INSTRUCTION = `
You are HUD, an AI assistant integrated into a spatial workspace interface.
Your goal is to help the user navigate, organize, and manage their workspace efficiently.
Keep responses concise, helpful, and direct. You can control the interface.

## Your Capabilities:

### Navigation & View Control
- change_context: Switch between workspaces (dev, design, ops, studio)
- focus_window: Pan to and focus a specific window
- set_view: Change view mode (spatial, terminals, editors, visuals)
- zoom: Adjust zoom level (0.2 to 3.0, default 1.0)
- view_all: Zoom out to see all windows

### Window Management
- create_window: Open new windows (code, terminal, docs, db, arch, git, pipeline, logs, ui, system, tasks, chat)
- close_window: Close a window by ID
- list_windows: Get all current windows and their IDs

### Interface Controls
- toggle_terminal: Open/close the terminal drawer
- open_command_palette: Open the command palette (CMD+K)

### Task Management
- create_task: Add a new task
- complete_task: Mark a task as done

## Guidelines:
- When asked to show something, use focus_window or create_window
- When asked to organize, use set_view or change_context
- When asked "what's on screen" or similar, use list_windows
- Be proactive - if user mentions wanting to code, offer to focus the code window
- Keep responses brief - the interface speaks for itself
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
    name: 'set_view',
    description: 'Change the HUD view mode to show different types of windows.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        view: {
          type: Type.STRING,
          enum: ['spatial', 'terminals', 'editors', 'visuals'],
          description: 'spatial = free canvas, terminals = terminal grid, editors = code grid, visuals = visual grid'
        }
      },
      required: ['view']
    }
  },
  {
    name: 'zoom',
    description: 'Adjust the zoom level of the HUD canvas.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.NUMBER,
          description: 'Zoom level between 0.2 and 3.0. 1.0 is default. Use 0.5 to zoom out, 1.5 to zoom in.'
        }
      },
      required: ['level']
    }
  },
  {
    name: 'toggle_terminal',
    description: 'Open or close the terminal drawer at the bottom of the screen.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        open: {
          type: Type.BOOLEAN,
          description: 'true to open, false to close, omit to toggle'
        }
      }
    }
  },
  {
    name: 'open_command_palette',
    description: 'Open the command palette (CMD+K) for quick actions.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'create_window',
    description: 'Create a new window on the canvas.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['code', 'terminal', 'docs', 'db', 'arch', 'git', 'pipeline', 'logs', 'ui', 'system', 'tasks', 'chat'],
          description: 'The type of window to create'
        },
        title: {
          type: Type.STRING,
          description: 'Title for the window'
        },
        contextId: {
          type: Type.STRING,
          enum: ['global', 'dev', 'design', 'ops', 'studio'],
          description: 'Which context to place the window in. Defaults to current context.'
        }
      },
      required: ['type']
    }
  },
  {
    name: 'close_window',
    description: 'Close a window by its ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        windowId: { type: Type.STRING, description: 'The ID of the window to close' }
      },
      required: ['windowId']
    }
  },
  {
    name: 'list_windows',
    description: 'Get a list of all windows currently on the canvas with their IDs, titles, and types.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
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
  },
  {
    name: 'view_all',
    description: 'Reset the view to show all windows on the canvas (zoom to fit all content).',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  }
];