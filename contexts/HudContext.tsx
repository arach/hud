import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Message, Task, WindowState, AiThread, WindowType } from '../types';
import { MOCK_TASKS, INITIAL_SYSTEM_INSTRUCTION } from '../constants';
import { geminiService } from '../services/geminiService';
import { useAuth } from './AuthContext';
import { usePersistentState } from '../lib/hud-core/hooks/usePersistentState';
import { 
  Code2, 
  PenTool, 
  Server, 
  Monitor,
  Globe
} from 'lucide-react';
import { ContextDef, type ViewMode } from '../components/chrome';
import { matchesNamespace, deriveContextIdFromQuery, normalizeNamespaceQuery, DEFAULT_NAMESPACE_QUERY } from '../lib/namespace';

// --- CONSTANTS ---

const WORKSPACE_ORIGINS = {
  dev: { x: 0, y: 0 },
  design: { x: 1800, y: 0 },
  ops: { x: 0, y: 1200 },
  studio: { x: 1800, y: 1200 },
} as const;

const GRID_LAYOUT = {
  gap: 40,
  width: 700,
  height: 500,
} as const;

// --- HELPER FUNCTIONS ---

const layout = (origin: {x: number, y: number}, x: number, y: number, w: number, h: number) => ({
  x: origin.x + x,
  y: origin.y + y,
  w,
  h
});

const buildNamespace = (contextId: string, type: WindowType, id: string, groups: string[] = []) => {
  return ['hud', contextId, type, ...groups, id].join('.');
};

const generateId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};

// Helper function for type matching (extracted to avoid duplication)
const matchesViewType = (windowType: WindowType, viewMode: ViewMode): boolean => {
  if (viewMode === 'spatial') return true;
  if (viewMode === 'terminals') return windowType === 'terminal';
  if (viewMode === 'editors') return windowType === 'editor';
  if (viewMode === 'visuals') return windowType === 'visual';
  return false;
};

// --- CONTENT DEFINITION ---
// This is where the actual CONTENT (tool instances/windows) is defined.
// See CONTENT_LOCATION.md for detailed explanation of content management.
//
// DEFAULT_WINDOWS: Initial/default content instances
// windows state: Current/live content instances (managed via React state)
// Content is NOT persisted (unlike tasks/messages)

export const CONTEXTS: ContextDef[] = [
  { id: 'global', label: 'GLOBAL NETWORK', x: 0, y: 0, color: '#ec4899', icon: <Globe size={18} /> }, 
  { id: 'dev', label: 'DEV CORE', ...WORKSPACE_ORIGINS.dev, color: '#10b981', icon: <Code2 size={18} /> },
  { id: 'design', label: 'BLUEPRINTS', ...WORKSPACE_ORIGINS.design, color: '#3b82f6', icon: <PenTool size={18} /> },
  { id: 'ops', label: 'SYSTEM OPS', ...WORKSPACE_ORIGINS.ops, color: '#f59e0b', icon: <Server size={18} /> },
  { id: 'studio', label: 'VISUAL STUDIO', ...WORKSPACE_ORIGINS.studio, color: '#8b5cf6', icon: <Monitor size={18} /> },
];

const DEFAULT_WINDOWS: WindowState[] = [
  // DEV CORE
  { id: 'code', contextId: 'dev', namespace: buildNamespace('dev', 'editor', 'code'), type: 'editor', title: 'Code Editor', ...layout(WORKSPACE_ORIGINS.dev, 0, 0, 800, 620), zIndex: 10 },
  { id: 'docs', contextId: 'dev', namespace: buildNamespace('dev', 'editor', 'docs'), type: 'editor', title: 'Documentation', ...layout(WORKSPACE_ORIGINS.dev, 820, 0, 400, 400), zIndex: 9 },
  { id: 'tasks', contextId: 'dev', namespace: buildNamespace('dev', 'terminal', 'tasks'), type: 'terminal', title: 'Mission Control', ...layout(WORKSPACE_ORIGINS.dev, 820, 420, 400, 200), zIndex: 10 },
  
  // BLUEPRINTS
  { id: 'db', contextId: 'design', namespace: buildNamespace('design', 'visual', 'db'), type: 'visual', title: 'Schema Designer', ...layout(WORKSPACE_ORIGINS.design, 0, 0, 600, 450), zIndex: 10 },
  { id: 'arch', contextId: 'design', namespace: buildNamespace('design', 'visual', 'arch'), type: 'visual', title: 'Architecture', ...layout(WORKSPACE_ORIGINS.design, 620, 0, 600, 450), zIndex: 10 },
  { id: 'git', contextId: 'design', namespace: buildNamespace('design', 'terminal', 'git'), type: 'terminal', title: 'Source Control', ...layout(WORKSPACE_ORIGINS.design, 0, 470, 1220, 300), zIndex: 10 },
  
  // SYSTEM OPS
  { id: 'pipeline', contextId: 'ops', namespace: buildNamespace('ops', 'terminal', 'pipeline'), type: 'terminal', title: 'CI/CD Pipeline', ...layout(WORKSPACE_ORIGINS.ops, 0, 0, 1220, 350), zIndex: 10 },
  { id: 'process', contextId: 'ops', namespace: buildNamespace('ops', 'terminal', 'process'), type: 'terminal', title: 'Process Dashboard', ...layout(WORKSPACE_ORIGINS.ops, 0, 370, 600, 400), zIndex: 10 },
  { id: 'logs', contextId: 'ops', namespace: buildNamespace('ops', 'terminal', 'logs'), type: 'terminal', title: 'System Logs', ...layout(WORKSPACE_ORIGINS.ops, 620, 370, 600, 400), zIndex: 10 },
  
  // VISUAL STUDIO
  { id: 'ui', contextId: 'studio', namespace: buildNamespace('studio', 'visual', 'ui'), type: 'visual', title: 'UI Preview', ...layout(WORKSPACE_ORIGINS.studio, 0, 0, 800, 720), zIndex: 11 },
  { id: 'diff', contextId: 'studio', namespace: buildNamespace('studio', 'editor', 'diff'), type: 'editor', title: 'Diff Viewer', ...layout(WORKSPACE_ORIGINS.studio, 820, 0, 400, 720), zIndex: 10 },
];

const INITIAL_THREADS: AiThread[] = [
  { id: 't1', targetId: 'code', topic: 'Refactoring API', messageCount: 3, isActive: true },
  { id: 't2', targetId: 'pipeline', topic: 'Fixing Build Fail', messageCount: 5, isActive: true },
  { id: 't3', targetId: 'db', topic: 'Schema Migration', messageCount: 1, isActive: true },
];

// --- TYPES ---

export interface SyntheticLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  pointerEvents: 'auto' | 'none';
}

interface HudContextType {
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
  closeWindow: (id: string) => void;
  addWindow: (window: WindowState) => void;
  restoreContextDefaults: (contextId: string) => void;
  selectWindow: (id: string) => void;
  focusWindow: (id: string) => WindowState | undefined;
  resetLayout: () => void;
  checkAuth: () => boolean;
  getSyntheticLayout: (win: WindowState, viewport: {width: number, height: number}, panOffset: {x: number, y: number}, scale: number) => SyntheticLayout;
}

const HudContext = createContext<HudContextType | undefined>(undefined);

export const HudProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasApiKey, checkAuth } = useAuth();

  // -- State: Persistence Enabled (using hook) --
  const [tasks, setTasks] = usePersistentState<Task[]>('hud_tasks', MOCK_TASKS);
  
  const [messages, setMessages] = usePersistentState<Message[]>('hud_messages', [{
    id: '1',
    role: 'model',
    content: 'Agent operational. Visual primitives loaded. Ready for development cycle.',
    timestamp: Date.now()
  }]);

  // -- State: Ephemeral --
  // CONTENT: Current tool instances/windows (not persisted)
  // This is the live array of WindowState instances that exist right now.
  // Starts with DEFAULT_WINDOWS, can be modified via addWindow/updateWindow/closeWindow
  const [windows, setWindows] = useState<WindowState[]>(DEFAULT_WINDOWS);
  const [activeThreads, setActiveThreads] = useState<AiThread[]>(INITIAL_THREADS);
  const [activeContextIdState, setActiveContextIdState] = useState<string>('global');
  const [activeView, setActiveView] = useState<ViewMode>('spatial');
  const [namespaceQuery, setNamespaceQueryState] = useState<string>(DEFAULT_NAMESPACE_QUERY);
  const [isProcessing, setIsProcessing] = useState(false);

  // -- Memoized Filtered Windows (Performance Improvement) --
  const filteredWindows = useMemo(() => {
    return windows
      .filter(w => matchesNamespace(namespaceQuery, w.namespace))
      .filter(w => matchesViewType(w.type, activeView))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [windows, namespaceQuery, activeView]);

  // -- Gemini Initialization --
  useEffect(() => {
    if (!hasApiKey) return;

    const history = messages.slice(1).map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));
    geminiService.startChat(history);
  }, [hasApiKey, messages]);

  // -- Actions --

  const createTask = useCallback((partialTask: Partial<Task>): string => {
    const newTask: Task = {
      id: generateId('task'),
      title: partialTask.title || 'Untitled Session',
      priority: partialTask.priority || 'medium',
      status: 'pending',
      createdAt: Date.now()
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask.id;
  }, [setTasks]);

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
  }, [setTasks]);

  const sendMessage = useCallback(async (text: string, scope?: string) => {
    if (!checkAuth()) return;

    const userMsg: Message = {
      id: generateId('msg'),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const contextText = scope ? `[SCOPE: ${scope}] ${text}` : text;

      const responseText = await geminiService.sendMessage(contextText, {
        tasks,
        onTaskCreate: createTask,
        onTaskComplete: completeTask
      });

      const modelMsg: Message = {
        id: generateId('msg'),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg: Message = {
        id: generateId('msg'),
        role: 'system',
        content: error instanceof Error 
          ? `ERR: ${error.message}` 
          : "ERR: LINK_FAILURE",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  }, [tasks, createTask, completeTask, checkAuth, setMessages]);

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

  const addWindow = useCallback((window: WindowState) => {
    setWindows(prev => {
      const maxZ = prev.length > 0 
        ? Math.max(...prev.map(w => w.zIndex))
        : 0;
      return [...prev, { ...window, zIndex: maxZ + 1 }];
    });
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
      const maxZ = prev.length > 0
        ? Math.max(...prev.map(w => w.zIndex))
        : 0;
      return prev.map(w => 
        w.id === id ? { ...w, zIndex: maxZ + 1 } : w
      );
    });
  }, []);

  // Fixed: Use functional update to avoid stale closure
  const focusWindow = useCallback((id: string) => {
    selectWindow(id);
    // Use functional update pattern - get latest windows
    let found: WindowState | undefined;
    setWindows(prev => {
      found = prev.find(w => w.id === id);
      return prev; // No change, just reading
    });
    return found;
  }, [selectWindow]);

  const resetLayout = useCallback(() => {
    setWindows(DEFAULT_WINDOWS);
    setActiveContextIdState('global');
    setActiveView('spatial');
    setNamespaceQueryState(DEFAULT_NAMESPACE_QUERY);
  }, []);

  // -- IMPROVED SYNTHETIC LAYOUT ENGINE --
  const getSyntheticLayout = useCallback((
    win: WindowState, 
    viewport: {width: number, height: number}, 
    panOffset: {x: number, y: number}, 
    scale: number
  ): SyntheticLayout => {
    // Check if window matches filters (using memoized filteredWindows)
    const scopeMatch = matchesNamespace(namespaceQuery, win.namespace);
    const typeMatch = matchesViewType(win.type, activeView);
    
    if (!scopeMatch || !typeMatch) {
      return {
        x: win.x,
        y: win.y,
        w: win.w,
        h: win.h,
        opacity: 0,
        pointerEvents: 'none'
      };
    }

    // Spatial view: use actual coordinates
    if (activeView === 'spatial') {
      return {
        x: win.x,
        y: win.y,
        w: win.w,
        h: win.h,
        opacity: 1,
        pointerEvents: 'auto'
      };
    }

    // Grid view: calculate position from filtered list
    const index = filteredWindows.findIndex(w => w.id === win.id);
    if (index === -1) {
      return {
        x: win.x,
        y: win.y,
        w: win.w,
        h: win.h,
        opacity: 0,
        pointerEvents: 'none'
      };
    }

    const cols = Math.ceil(Math.sqrt(filteredWindows.length));
    const totalW = (cols * GRID_LAYOUT.width) + ((cols - 1) * GRID_LAYOUT.gap);
    const totalH = (Math.ceil(filteredWindows.length / cols) * GRID_LAYOUT.height) + 
                   ((Math.ceil(filteredWindows.length / cols) - 1) * GRID_LAYOUT.gap);
    
    const vpCenterX = (-panOffset.x) + (viewport.width / 2 / scale);
    const vpCenterY = (-panOffset.y) + (viewport.height / 2 / scale);
    
    const startX = vpCenterX - (totalW / 2);
    const startY = vpCenterY - (totalH / 2);
    
    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      x: startX + (col * (GRID_LAYOUT.width + GRID_LAYOUT.gap)),
      y: startY + (row * (GRID_LAYOUT.height + GRID_LAYOUT.gap)),
      w: GRID_LAYOUT.width,
      h: GRID_LAYOUT.height,
      opacity: 1,
      pointerEvents: 'auto'
    };
  }, [namespaceQuery, activeView, filteredWindows]);

  return (
    <HudContext.Provider value={{
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
      addWindow,
      restoreContextDefaults,
      selectWindow,
      focusWindow,
      resetLayout,
      checkAuth,
      getSyntheticLayout
    }}>
      {children}
    </HudContext.Provider>
  );
};

export const useHud = () => {
  const context = useContext(HudContext);
  if (!context) {
    throw new Error('useHud must be used within a HudProvider');
  }
  return context;
};
