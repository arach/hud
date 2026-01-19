
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

export interface WindowState {
  id: string;
  contextId?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  title: string;
}
