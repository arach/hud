import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Message, Task, WindowState, AiThread } from '../types';
import { MOCK_TASKS, INITIAL_SYSTEM_INSTRUCTION } from '../constants';
import { geminiService } from '../services/geminiService';
import { 
  Code2, 
  PenTool, 
  Server, 
  Monitor 
} from 'lucide-react';
import { ContextDef } from '../components/ContextBar';
import { ViewMode } from '../components/ContextDock';

// --- INITIAL DATA DEFINITIONS ---

export const CONTEXTS: ContextDef[] = [
  { id: 'dev', label: 'DEV CORE', x: 0, y: 0, color: '#10b981', icon: <Code2 size={18} /> },
  { id: 'design', label: 'BLUEPRINTS', x: 1800, y: 0, color: '#3b82f6', icon: <PenTool size={18} /> },
  { id: 'ops', label: 'SYSTEM OPS', x: 0, y: 1400, color: '#f59e0b', icon: <Server size={18} /> },
  { id: 'studio', label: 'VISUAL STUDIO', x: 1800, y: 1400, color: '#8b5cf6', icon: <Monitor size={18} /> },
];

const INITIAL_WINDOWS: WindowState[] = [
    // --- DEV CORE ---
    { id: 'code', contextId: 'dev', type: 'editor', title: 'Code Editor', x: 100, y: 100, w: 800, h: 600, zIndex: 10 },
    { id: 'docs', contextId: 'dev', type: 'editor', title: 'Documentation', x: 950, y: 100, w: 450, h: 600, zIndex: 9 },
    { id: 'tasks', contextId: 'dev', type: 'terminal', title: 'Mission Control', x: 100, y: 750, w: 400, h: 400, zIndex: 10 },

    // --- BLUEPRINTS ---
    { id: 'db', contextId: 'design', type: 'visual', title: 'Schema Designer', x: 1800, y: 100, w: 700, h: 500, zIndex: 10 },
    { id: 'arch', contextId: 'design', type: 'visual', title: 'Architecture', x: 2550, y: 100, w: 700, h: 500, zIndex: 10 },
    { id: 'git', contextId: 'design', type: 'terminal', title: 'Source Control', x: 1800, y: 650, w: 600, h: 450, zIndex: 10 },

    // --- SYSTEM OPS ---
    { id: 'pipeline', contextId: 'ops', type: 'terminal', title: 'CI/CD Pipeline', x: 100, y: 1400, w: 800, h: 400, zIndex: 10 },
    { id: 'process', contextId: 'ops', type: 'terminal', title: 'Process Dashboard', x: 950, y: 1400, w: 500, h: 400, zIndex: 10 },
    { id: 'logs', contextId: 'ops', type: 'terminal', title: 'System Logs', x: 100, y: 1850, w: 800, h: 400, zIndex: 10 },

    // --- VISUAL STUDIO ---
    { id: 'ui', contextId: 'studio', type: 'visual', title: 'UI Preview', x: 1800, y: 1400, w: 900, h: 600, zIndex: 11 },
    { id: 'diff', contextId: 'studio', type: 'editor', title: 'Diff Viewer', x: 2750, y: 1400, w: 600, h: 600, zIndex: 10 },
];

const INITIAL_THREADS: AiThread[] = [
    { id: 't1', targetId: 'code', topic: 'Refactoring API', messageCount: 3, isActive: true },
    { id: 't2', targetId: 'pipeline', topic: 'Fixing Build Fail', messageCount: 5, isActive: true },
    { id: 't3', targetId: 'db', topic: 'Schema Migration', messageCount: 1, isActive: true },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- CONTEXT DEFINITION ---

interface NexusContextType {
  // Data State
  messages: Message[];
  tasks: Task[];
  windows: WindowState[];
  activeThreads: AiThread[];
  
  // HUD State
  activeContextId: string;
  activeView: ViewMode;
  isProcessing: boolean;
  
  // Constants
  contexts: ContextDef[];

  // Actions
  sendMessage: (text: string, scope?: string) => Promise<void>;
  createTask: (partial: Partial<Task>) => string;
  completeTask: (id: string) => string;
  
  // Navigation / UI Actions
  setActiveContextId: (id: string) => void;
  setActiveView: (view: ViewMode) => void;
  updateWindow: (id: string, updates: Partial<WindowState>) => void;
  selectWindow: (id: string) => void;
  focusWindow: (id: string) => WindowState | undefined;
  resetLayout: () => void;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // -- State: Persistence Enabled --
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('nexus_tasks');
    return saved ? JSON.parse(saved) : MOCK_TASKS;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('nexus_messages');
    if (saved) return JSON.parse(saved);
    return [{
      id: '1',
      role: 'model',
      content: 'Agent operational. Visual primitives loaded. Ready for development cycle.',
      timestamp: Date.now()
    }];
  });

  // -- State: Ephemeral --
  const [windows, setWindows] = useState<WindowState[]>(INITIAL_WINDOWS);
  const [activeThreads, setActiveThreads] = useState<AiThread[]>(INITIAL_THREADS);
  const [activeContextId, setActiveContextId] = useState<string>('dev');
  const [activeView, setActiveView] = useState<ViewMode>('spatial');
  const [isProcessing, setIsProcessing] = useState(false);

  // -- Persistence Effects --
  useEffect(() => {
    localStorage.setItem('nexus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('nexus_messages', JSON.stringify(messages));
  }, [messages]);

  // -- Gemini Initialization --
  useEffect(() => {
    // Re-initialize chat with history on mount
    const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));
    geminiService.startChat(history);
  }, []); // Run once on mount

  // -- Actions --

  const createTask = useCallback((partialTask: Partial<Task>): string => {
    const newTask: Task = {
        id: generateId(),
        title: partialTask.title || 'Untitled Session',
        priority: partialTask.priority || 'medium',
        status: 'pending',
        createdAt: Date.now()
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask.id;
  }, []);

  const completeTask = useCallback((taskId: string): string => {
    let found = false;
    setTasks(prev => prev.map(t => {
        if (t.id === taskId || t.title.toLowerCase().includes(taskId.toLowerCase())) {
            found = true;
            return { ...t, status: 'completed' };
        }
        return t;
    }));
    return found ? "Session marked complete." : "Session ID not found.";
  }, []);

  const sendMessage = useCallback(async (text: string, scope?: string) => {
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // Inject scope context if provided
      let contextText = text;
      if (scope) {
         contextText = `[SCOPE: ${scope}] ${text}`;
      }

      // Pass the callbacks to the service
      const responseText = await geminiService.sendMessage(contextText, {
        tasks,
        onTaskCreate: createTask,
        onTaskComplete: completeTask
      });

      const modelMsg: Message = {
        id: generateId(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'system',
        content: "ERR: LINK_FAILURE",
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [tasks, createTask, completeTask]);

  // -- Window & UI Actions --

  const updateWindow = useCallback((id: string, updates: Partial<WindowState>) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const selectWindow = useCallback((id: string) => {
    setWindows(prev => {
        const maxZ = Math.max(...prev.map(w => w.zIndex));
        return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
    });
  }, []);

  const focusWindow = useCallback((id: string) => {
      selectWindow(id);
      return windows.find(w => w.id === id);
  }, [selectWindow, windows]);

  const resetLayout = useCallback(() => {
    setWindows(INITIAL_WINDOWS);
    setActiveContextId('dev');
    setActiveView('spatial');
  }, []);

  return (
    <NexusContext.Provider value={{
      messages,
      tasks,
      windows,
      activeThreads,
      activeContextId,
      activeView,
      isProcessing,
      contexts: CONTEXTS,
      sendMessage,
      createTask,
      completeTask,
      setActiveContextId,
      setActiveView,
      updateWindow,
      selectWindow,
      focusWindow,
      resetLayout
    }}>
      {children}
    </NexusContext.Provider>
  );
};

export const useNexus = () => {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return context;
};
