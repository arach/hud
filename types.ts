
export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface SystemStat {
  name: string;
  value: number;
  unit: string;
  history: number[];
}

export enum Tab {
  TASKS = 'TASKS',
  CHAT = 'CHAT',
  SYSTEM = 'SYSTEM'
}

export type WindowType =
  | 'editor'
  | 'terminal'
  | 'visual'
  | 'system'
  | 'code'
  | 'docs'
  | 'db'
  | 'arch'
  | 'git'
  | 'pipeline'
  | 'logs'
  | 'ui'
  | 'tasks'
  | 'chat'
  | 'dither'
  | 'textlab';

export interface WindowState {
  id: string;
  contextId?: string;
  namespace: string;
  tags?: string[];
  type: WindowType; // Added for Tiling
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  title: string;
}

export interface AiThread {
  id: string;
  targetId: string; // Window ID or Context ID
  topic: string;
  messageCount: number;
  isActive: boolean;
}
