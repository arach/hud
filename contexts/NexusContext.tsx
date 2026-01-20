import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Message, Task, WindowState, AiThread, WindowType } from '../types';
import { MOCK_TASKS, INITIAL_SYSTEM_INSTRUCTION } from '../constants';
import { geminiService } from '../services/geminiService';
import { useAuth } from './AuthContext';
import { 
  Code2, 
  PenTool, 
  Server, 
  Monitor,
  Globe
} from 'lucide-react';
import { ContextDef } from '../components/ContextBar';
import { ViewMode } from '../components/ContextDock';
import { matchesNamespace, deriveContextIdFromQuery, normalizeNamespaceQuery, DEFAULT_NAMESPACE_QUERY } from '../lib/namespace';

// --- LAYOUT SYSTEM CONSTANTS ---
// We define a coordinate system where contexts are spaced out generously.
// Origins for each context:
const ORIGIN_DEV = { x: 0, y: 0 };
const ORIGIN_DESIGN = { x: 1800, y: 0 };
const ORIGIN_OPS = { x: 0, y: 1200 };
const ORIGIN_STUDIO = { x: 1800, y: 1200 };

// Helper to offset windows relative to their context origin
// This makes "Tiling" easy to reason about.
const layout = (origin: {x: number, y: number}, x: number, y: number, w: number, h: number) => ({
    x: origin.x + x,
    y: origin.y + y,
    w,
    h
});

const buildNamespace = (contextId: string, type: WindowType, id: string, groups: string[] = []) => {
  return ['hud', contextId, type, ...groups, id].join('.');
};

export const CONTEXTS: ContextDef[] = [
  { id: 'global', label: 'GLOBAL NETWORK', x: 0, y: 0, color: '#ec4899', icon: <Globe size={18} /> }, 
  { id: 'dev', label: 'DEV CORE', ...ORIGIN_DEV, color: '#10b981', icon: <Code2 size={18} /> },
  { id: 'design', label: 'BLUEPRINTS', ...ORIGIN_DESIGN, color: '#3b82f6', icon: <PenTool size={18} /> },
  { id: 'ops', label: 'SYSTEM OPS', ...ORIGIN_OPS, color: '#f59e0b', icon: <Server size={18} /> },
  { id: 'studio', label: 'VISUAL STUDIO', ...ORIGIN_STUDIO, color: '#8b5cf6', icon: <Monitor size={18} /> },
];

const DEFAULT_WINDOWS: WindowState[] = [
    // --- DEV CORE (Bento Grid) ---
    // Main Code Editor takes left side
    { id: 'code', contextId: 'dev', namespace: buildNamespace('dev', 'editor', 'code'), type: 'editor', title: 'Code Editor', ...layout(ORIGIN_DEV, 0, 0, 800, 620), zIndex: 10 },
    // Docs top right
    { id: 'docs', contextId: 'dev', namespace: buildNamespace('dev', 'editor', 'docs'), type: 'editor', title: 'Documentation', ...layout(ORIGIN_DEV, 820, 0, 400, 400), zIndex: 9 },
    // Tasks bottom right
    { id: 'tasks', contextId: 'dev', namespace: buildNamespace('dev', 'terminal', 'tasks'), type: 'terminal', title: 'Mission Control', ...layout(ORIGIN_DEV, 820, 420, 400, 200), zIndex: 10 },

    // --- BLUEPRINTS (Top Row Split, Bottom Full) ---
    // DB Schema Top Left
    { id: 'db', contextId: 'design', namespace: buildNamespace('design', 'visual', 'db'), type: 'visual', title: 'Schema Designer', ...layout(ORIGIN_DESIGN, 0, 0, 600, 450), zIndex: 10 },
    // Arch Top Right
    { id: 'arch', contextId: 'design', namespace: buildNamespace('design', 'visual', 'arch'), type: 'visual', title: 'Architecture', ...layout(ORIGIN_DESIGN, 620, 0, 600, 450), zIndex: 10 },
    // Git Timeline Bottom Full
    { id: 'git', contextId: 'design', namespace: buildNamespace('design', 'terminal', 'git'), type: 'terminal', title: 'Source Control', ...layout(ORIGIN_DESIGN, 0, 470, 1220, 300), zIndex: 10 },

    // --- SYSTEM OPS (Top Full, Bottom Split) ---
    // Pipeline Monitor Top Full
    { id: 'pipeline', contextId: 'ops', namespace: buildNamespace('ops', 'terminal', 'pipeline'), type: 'terminal', title: 'CI/CD Pipeline', ...layout(ORIGIN_OPS, 0, 0, 1220, 350), zIndex: 10 },
    // Process Monitor Bottom Left
    { id: 'process', contextId: 'ops', namespace: buildNamespace('ops', 'terminal', 'process'), type: 'terminal', title: 'Process Dashboard', ...layout(ORIGIN_OPS, 0, 370, 600, 400), zIndex: 10 },
    // System Logs Bottom Right
    { id: 'logs', contextId: 'ops', namespace: buildNamespace('ops', 'terminal', 'logs'), type: 'terminal', title: 'System Logs', ...layout(ORIGIN_OPS, 620, 370, 600, 400), zIndex: 10 },

    // --- VISUAL STUDIO (Left/Right Split) ---
    // UI Preview Large Left
    { id: 'ui', contextId: 'studio', namespace: buildNamespace('studio', 'visual', 'ui'), type: 'visual', title: 'UI Preview', ...layout(ORIGIN_STUDIO, 0, 0, 800, 720), zIndex: 11 },
    // Diff Viewer Narrow Right
    { id: 'diff', contextId: 'studio', namespace: buildNamespace('studio', 'editor', 'diff'), type: 'editor', title: 'Diff Viewer', ...layout(ORIGIN_STUDIO, 820, 0, 400, 720), zIndex: 10 },
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
  namespaceQuery: string;
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
  setNamespaceQuery: (query: string) => void;
  updateWindow: (id: string, updates: Partial<WindowState>) => void;
  closeWindow: (id: string) => void; // New
  restoreContextDefaults: (contextId: string) => void; // New
  selectWindow: (id: string) => void;
  focusWindow: (id: string) => WindowState | undefined;
  resetLayout: () => void;
  checkAuth: () => boolean;
  // Layout Engine
  getSyntheticLayout: (win: WindowState, viewport: {width: number, height: number}, panOffset: {x: number, y: number}, scale: number) => { x: number, y: number, w: number, h: number, opacity: number, pointerEvents: 'auto' | 'none' };
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasApiKey, checkAuth } = useAuth();

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
  const [windows, setWindows] = useState<WindowState[]>(DEFAULT_WINDOWS);
  const [activeThreads, setActiveThreads] = useState<AiThread[]>(INITIAL_THREADS);
  const [activeContextIdState, setActiveContextIdState] = useState<string>('global'); // Default to Global
  const [activeView, setActiveView] = useState<ViewMode>('spatial');
  const [namespaceQuery, setNamespaceQueryState] = useState<string>(DEFAULT_NAMESPACE_QUERY);
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
    if (!hasApiKey) return;

    // Re-initialize chat with history on mount
    const history = messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));
    geminiService.startChat(history);
  }, [hasApiKey]); // Run when API key becomes available

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
    if (!checkAuth()) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      let contextText = text;
      if (scope) {
         contextText = `[SCOPE: ${scope}] ${text}`;
      }

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
  const setActiveContextId = useCallback((id: string) => {
    setActiveContextIdState(id);
    const nextQuery = id === 'global' ? DEFAULT_NAMESPACE_QUERY : `hud.${id}.**`;
    setNamespaceQueryState(nextQuery);
  }, []);

  const setNamespaceQuery = useCallback((query: string) => {
    const normalized = normalizeNamespaceQuery(query);
    setNamespaceQueryState(normalized);
    const derived = deriveContextIdFromQuery(normalized, CONTEXTS.map(ctx => ctx.id));
    setActiveContextIdState(derived);
  }, []);

  const updateWindow = useCallback((id: string, updates: Partial<WindowState>) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const restoreContextDefaults = useCallback((contextId: string) => {
    const defaults = DEFAULT_WINDOWS.filter(w => w.contextId === contextId);
    setWindows(prev => {
        const existingIds = new Set(prev.map(w => w.id));
        const toAdd = defaults.filter(w => !existingIds.has(w.id));
        return [...prev, ...toAdd];
    });
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
    setWindows(DEFAULT_WINDOWS);
    setActiveContextIdState('global');
    setActiveView('spatial');
    setNamespaceQueryState(DEFAULT_NAMESPACE_QUERY);
  }, []);

  // -- SYNTHETIC LAYOUT ENGINE (HIERARCHICAL) --
  const getSyntheticLayout = useCallback((win: WindowState, viewport: {width: number, height: number}, panOffset: {x: number, y: number}, scale: number) => {
      
      // -- FILTER LEVEL 1: SCOPE (Namespace Query) --
      // If the window doesn't match the active namespace query, it is hidden.
      if (!matchesNamespace(namespaceQuery, win.namespace)) {
          return {
              x: win.x,
              y: win.y,
              w: win.w,
              h: win.h,
              opacity: 0, // Fully hidden
              pointerEvents: 'none' as const
          };
      }

      // -- FILTER LEVEL 2: VIEW MODE (Left Dock) --
      // Even if in scope, we might filter by type (Terminal vs Editor).
      let matchesType = true;
      if (activeView === 'terminals' && win.type !== 'terminal') matchesType = false;
      if (activeView === 'editors' && win.type !== 'editor') matchesType = false;
      if (activeView === 'visuals' && win.type !== 'visual') matchesType = false;

      if (!matchesType) {
          return {
              x: win.x,
              y: win.y,
              w: win.w,
              h: win.h,
              opacity: 0, // Fully hidden
              pointerEvents: 'none' as const
          };
      }

      // -- LAYOUT LEVEL: SPATIAL vs GRID --
      
      // If Spatial View: Return actual coordinates
      if (activeView === 'spatial') {
          return {
              x: win.x,
              y: win.y,
              w: win.w,
              h: win.h,
              opacity: 1,
              pointerEvents: 'auto' as const
          };
      }

      // If Grid View: Calculate Grid Position based on FILTERED list
      // 1. Get list of ALL windows that satisfy the current Scope AND View filters
      const matchingWindows = [...windows]
          .filter(w => {
              const scopeMatch = matchesNamespace(namespaceQuery, w.namespace);
              
              let typeMatch = true;
              if (activeView === 'terminals' && w.type !== 'terminal') typeMatch = false;
              if (activeView === 'editors' && w.type !== 'editor') typeMatch = false;
              if (activeView === 'visuals' && w.type !== 'visual') typeMatch = false;
              
              return scopeMatch && typeMatch;
          })
          .sort((a, b) => a.id.localeCompare(b.id)); // Stable Sort

      const index = matchingWindows.findIndex(w => w.id === win.id);
      
      // Grid Constants
      const gap = 40;
      const gridW = 700;
      const gridH = 500;
      
      const cols = Math.ceil(Math.sqrt(matchingWindows.length));
      
      const totalW = (cols * gridW) + ((cols - 1) * gap);
      const totalH = (Math.ceil(matchingWindows.length / cols) * gridH) + ((Math.ceil(matchingWindows.length / cols) - 1) * gap);
      
      const vpCenterX = (-panOffset.x) + (viewport.width / 2 / scale);
      const vpCenterY = (-panOffset.y) + (viewport.height / 2 / scale);
      
      const startX = vpCenterX - (totalW / 2);
      const startY = vpCenterY - (totalH / 2);
      
      const col = index % cols;
      const row = Math.floor(index / cols);

      return {
          x: startX + (col * (gridW + gap)),
          y: startY + (row * (gridH + gap)),
          w: gridW,
          h: gridH,
          opacity: 1,
          pointerEvents: 'auto' as const
      };
  }, [activeView, windows, namespaceQuery]);

  return (
    <NexusContext.Provider value={{
      messages,
      tasks,
      windows,
      activeThreads,
      activeContextId: activeContextIdState,
      activeView,
      namespaceQuery,
      isProcessing,
      contexts: CONTEXTS,
      sendMessage,
      createTask,
      completeTask,
      setActiveContextId,
      setActiveView,
      setNamespaceQuery,
      updateWindow,
      closeWindow,
      restoreContextDefaults,
      selectWindow,
      focusWindow,
      resetLayout,
      checkAuth,
      getSyntheticLayout
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
