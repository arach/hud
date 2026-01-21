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

### Text Lab (Code & Email Editing)
- open_text_lab: Open the text editing lab
- get_text: Read the current content of a source (code or email)
- propose_edit: Suggest changes to a source - shows a diff for user to review
- apply_edit: Apply the pending changes after user approval
- switch_text_source: Switch between code and email sources

### Dither Tool (Creative Playground)
- open_dither_tool: Open the dither/pixel art tool
- set_dither_settings: Adjust pixel size, color palette, algorithm, contrast, brightness
  - pixelSize: 1-16 (higher = more pixelated)
  - palette: grayscale, gameboy, cga, sepia, cyber
  - algorithm: ordered, floyd-steinberg, atkinson, none
  - contrast: 0.5-2.0 (1.0 = normal)
  - brightness: -0.5 to 0.5 (0 = normal)

## Guidelines:
- When asked to show something, use focus_window or create_window
- When asked to organize, use set_view or change_context
- When asked "what's on screen" or similar, use list_windows
- Be proactive - if user mentions wanting to code, offer to focus the code window
- Keep responses brief - the interface speaks for itself
- For the dither tool: respond to creative requests like "make it more pixelated", "retro game look", "black and white"
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
          enum: ['code', 'terminal', 'docs', 'db', 'arch', 'git', 'pipeline', 'logs', 'ui', 'system', 'tasks', 'chat', 'dither'],
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
  },
  {
    name: 'open_text_lab',
    description: 'Open the text editing lab for editing code or email drafts.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'get_text',
    description: 'Get the current content of a text source to understand what the user is working on.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        source: {
          type: Type.STRING,
          enum: ['code', 'email'],
          description: 'Which source to read: code (JavaScript) or email (prose)'
        }
      },
      required: ['source']
    }
  },
  {
    name: 'propose_edit',
    description: 'Propose changes to a text source. This shows a diff view for the user to review before accepting.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        source: {
          type: Type.STRING,
          enum: ['code', 'email'],
          description: 'Which source to edit'
        },
        newContent: {
          type: Type.STRING,
          description: 'The complete new content for the source (not a partial diff)'
        },
        description: {
          type: Type.STRING,
          description: 'Brief description of the changes made'
        }
      },
      required: ['source', 'newContent']
    }
  },
  {
    name: 'apply_edit',
    description: 'Apply pending changes to a source after the user has reviewed the diff. Only call this after propose_edit and user approval.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        source: {
          type: Type.STRING,
          enum: ['code', 'email'],
          description: 'Which source to apply changes to'
        }
      },
      required: ['source']
    }
  },
  {
    name: 'switch_text_source',
    description: 'Switch the active view in the text lab between code and email.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        source: {
          type: Type.STRING,
          enum: ['code', 'email'],
          description: 'Which source to switch to'
        }
      },
      required: ['source']
    }
  },
  {
    name: 'open_dither_tool',
    description: 'Open the dither/pixel art tool for creative image processing.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'set_dither_settings',
    description: 'Adjust the dither tool settings. Use this to make images more pixelated, change color palettes, or apply retro effects.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        pixelSize: {
          type: Type.NUMBER,
          description: 'Pixel block size 1-16. Higher = more pixelated/chunky. 1=full detail, 4=retro, 8=very chunky, 16=abstract'
        },
        palette: {
          type: Type.STRING,
          enum: ['grayscale', 'gameboy', 'cga', 'sepia', 'cyber'],
          description: 'Color palette. grayscale=B&W, gameboy=green monochrome, cga=retro PC, sepia=vintage, cyber=neon'
        },
        algorithm: {
          type: Type.STRING,
          enum: ['ordered', 'floyd-steinberg', 'atkinson', 'none'],
          description: 'Dithering algorithm. ordered=bayer pattern, floyd-steinberg=smooth gradients, atkinson=classic Mac, none=hard edges'
        },
        contrast: {
          type: Type.NUMBER,
          description: 'Contrast multiplier 0.5-2.0. 1.0=normal, <1=washed out, >1=punchy'
        },
        brightness: {
          type: Type.NUMBER,
          description: 'Brightness adjustment -0.5 to 0.5. 0=normal, negative=darker, positive=brighter'
        }
      }
    }
  }
];