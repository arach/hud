import { lazy, ComponentType } from 'react';

/**
 * Tool Registry - CHROME/FRAMEWORK CONCEPT
 * 
 * This registry defines AVAILABLE tool types (templates/blueprints).
 * It is part of the HUD chrome/scaffolding - the framework that knows
 * what tools can be instantiated.
 * 
 * Tool INSTANCES (content) are created separately via WindowState objects
 * and rendered using DraggableWindow containers. Each instance has:
 * - Unique id, position (x, y), size (w, h)
 * - Its own state/data
 * - Can be created/destroyed dynamically
 * 
 * See ARCHITECTURE.md for distinction between Chrome and Content.
 */

export interface ToolDefinition {
  id: string;
  type: string;           // WindowType value
  label: string;
  icon: string;           // lucide icon name
  component: ComponentType<any>;
  category: 'dev' | 'ops' | 'creative' | 'system';
}

type ToolConfig = {
  label: string;
  icon: string;
  componentName: string;
  category: ToolDefinition['category'];
  type?: string; // Optional override, defaults to key
};

// Helper to create a tool definition from config
const createTool = (
  id: string,
  config: ToolConfig
): ToolDefinition => ({
  id,
  type: config.type ?? id,
  label: config.label,
  icon: config.icon,
  component: lazy(() => import(`./${config.componentName}`)),
  category: config.category,
});

// Tool configurations - data structure only
const toolConfigs: Record<string, ToolConfig> = {
  code: {
    label: 'Code Editor',
    icon: 'Code',
    componentName: 'CodeEditor',
    category: 'dev'
  },
  editor: {
    label: 'Code Editor',
    icon: 'Code',
    componentName: 'CodeEditor',
    category: 'dev'
  },
  db: {
    label: 'Database Schema',
    icon: 'Database',
    componentName: 'DbSchema',
    category: 'dev'
  },
  git: {
    label: 'Git Graph',
    icon: 'GitBranch',
    componentName: 'GitGraph',
    category: 'dev'
  },
  arch: {
    label: 'Architecture Diagram',
    icon: 'Boxes',
    componentName: 'ArchDiagram',
    category: 'dev'
  },
  pipeline: {
    label: 'Pipeline Monitor',
    icon: 'Workflow',
    componentName: 'PipelineMonitor',
    category: 'ops'
  },
  logs: {
    label: 'Log Viewer',
    icon: 'ScrollText',
    componentName: 'LogViewer',
    category: 'ops'
  },
  diff: {
    label: 'Diff Viewer',
    icon: 'FileDiff',
    componentName: 'DiffViewer',
    category: 'dev'
  },
  docs: {
    label: 'Docs Editor',
    icon: 'FileText',
    componentName: 'DocsEditor',
    category: 'dev'
  },
  ui: {
    label: 'UI Preview',
    icon: 'Layout',
    componentName: 'UiPreview',
    category: 'creative'
  },
  visual: {
    label: 'UI Preview',
    icon: 'Layout',
    componentName: 'UiPreview',
    category: 'creative'
  },
  process: {
    label: 'System Monitor',
    icon: 'Activity',
    componentName: 'SystemMonitor',
    category: 'system'
  },
  dither: {
    label: 'Dither Lab',
    icon: 'Grid3x3',
    componentName: 'DitherTool',
    category: 'creative'
  },
  textlab: {
    label: 'Text Lab',
    icon: 'Type',
    componentName: 'TextLab',
    category: 'creative'
  }
};

// Generate tools from configs
const tools: Record<string, ToolDefinition> = Object.fromEntries(
  Object.entries(toolConfigs).map(([id, config]) => [id, createTool(id, config)])
);

/**
 * Get a tool component by type
 */
export const getToolComponent = (type: string): ComponentType<any> | undefined => {
  return tools[type]?.component;
};

/**
 * Get a tool definition by type
 */
export const getToolDefinition = (type: string): ToolDefinition | undefined => {
  return tools[type];
};

/**
 * Get all tools in a specific category
 */
export const getToolsByCategory = (category: ToolDefinition['category']): ToolDefinition[] => {
  return Object.values(tools).filter(t => t.category === category);
};

/**
 * Get all registered tools
 */
export const getAllTools = (): ToolDefinition[] => {
  return Object.values(tools);
};

/**
 * Check if a tool type is registered
 */
export const isRegisteredTool = (type: string): boolean => {
  return type in tools;
};
