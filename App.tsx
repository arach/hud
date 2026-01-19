import React, { useState, useEffect, useCallback, useMemo } from 'react';
import HUDFrame from './components/HUDFrame';
import ChatInterface from './components/ChatInterface';
import TaskManager from './components/TaskManager';
import Minimap from './components/Minimap';
import StatusBar from './components/StatusBar';
import VoiceLog from './components/VoiceLog';
import DraggableWindow from './components/DraggableWindow';
import TerminalDrawer from './components/TerminalDrawer';
import DbSchema from './components/tools/DbSchema';
import ArchDiagram from './components/tools/ArchDiagram';
import CodeEditor from './components/tools/CodeEditor';
import GitGraph from './components/tools/GitGraph';
import DocsEditor from './components/tools/DocsEditor';
import UiPreview from './components/tools/UiPreview';
import PipelineMonitor from './components/tools/PipelineMonitor';
import DiffViewer from './components/tools/DiffViewer';
import LogViewer from './components/tools/LogViewer';
import SystemMonitor from './components/SystemMonitor';
import CommandPalette, { CommandOption } from './components/CommandPalette';
import ContextBar, { ContextDef } from './components/ContextBar';
import ContextDock from './components/ContextDock';
import { Message, Task, WindowState } from './types';
import { geminiService } from './services/geminiService';
import { MOCK_TASKS, INITIAL_SYSTEM_INSTRUCTION, HUD_TOOLS } from './constants';
import { useLiveSession } from './hooks/useLiveSession';
import { 
  LayoutTemplate, 
  Terminal, 
  Code, 
  Database, 
  Cpu, 
  GitBranch, 
  Layout, 
  Monitor,
  Workflow,
  ZoomIn,
  ZoomOut,
  Code2,
  PenTool,
  Server,
  Search,
  ChevronUp,
  Mic,
  MicOff
} from 'lucide-react';

import ApiKeyModal from './components/ApiKeyModal';

const generateId = () => Math.random().toString(36).substring(2, 9);


// -- Context Definitions --
// Compacted layout coordinates for better centering on laptop screens
const CONTEXTS: ContextDef[] = [
  { id: 'dev', label: 'DEV CORE', x: 0, y: 0, color: '#10b981', icon: <Code2 size={18} /> },
  { id: 'design', label: 'BLUEPRINTS', x: 1800, y: 0, color: '#3b82f6', icon: <PenTool size={18} /> },
  { id: 'ops', label: 'SYSTEM OPS', x: 0, y: 1400, color: '#f59e0b', icon: <Server size={18} /> },
  { id: 'studio', label: 'VISUAL STUDIO', x: 1800, y: 1400, color: '#8b5cf6', icon: <Monitor size={18} /> },
];

const INITIAL_WINDOWS: WindowState[] = [
    // --- DEV CORE (Top Left) ---
    { id: 'code', contextId: 'dev', title: 'Code Editor', x: 100, y: 100, w: 800, h: 600, zIndex: 10 },
    { id: 'docs', contextId: 'dev', title: 'Documentation', x: 950, y: 100, w: 450, h: 600, zIndex: 9 },
    { id: 'tasks', contextId: 'dev', title: 'Mission Control', x: 100, y: 750, w: 400, h: 400, zIndex: 10 },

    // --- BLUEPRINTS (Top Right) ---
    { id: 'db', contextId: 'design', title: 'Schema Designer', x: 1800, y: 100, w: 700, h: 500, zIndex: 10 },
    { id: 'arch', contextId: 'design', title: 'Architecture', x: 2550, y: 100, w: 700, h: 500, zIndex: 10 },
    { id: 'git', contextId: 'design', title: 'Source Control', x: 1800, y: 650, w: 600, h: 450, zIndex: 10 },

    // --- SYSTEM OPS (Bottom Left) ---
    { id: 'pipeline', contextId: 'ops', title: 'CI/CD Pipeline', x: 100, y: 1400, w: 800, h: 400, zIndex: 10 },
    { id: 'process', contextId: 'ops', title: 'Process Dashboard', x: 950, y: 1400, w: 500, h: 400, zIndex: 10 },
    { id: 'logs', contextId: 'ops', title: 'System Logs', x: 100, y: 1850, w: 800, h: 400, zIndex: 10 },

    // --- VISUAL STUDIO (Bottom Right) ---
    { id: 'ui', contextId: 'studio', title: 'UI Preview', x: 1800, y: 1400, w: 900, h: 600, zIndex: 11 },
    { id: 'diff', contextId: 'studio', title: 'Diff Viewer', x: 2750, y: 1400, w: 600, h: 600, zIndex: 10 },
];

const App: React.FC = () => {
  // -- Global State --
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [activeContextId, setActiveContextId] = useState<string>('dev');
  
  // -- Terminal State --
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  const [hasApiKey, setHasApiKey] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // -- Window Management --
  const [windows, setWindows] = useState<WindowState[]>(INITIAL_WINDOWS);

  // -- Content State --
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: 'Agent operational. Visual primitives loaded. Ready for development cycle.',
      timestamp: Date.now()
    }
  ]);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [isProcessing, setIsProcessing] = useState(false);

  // -- Helpers --
  const contextBounds = useMemo(() => {
    const bounds: Record<string, { x: number; y: number; w: number; h: number } | null> = {};
    const padding = 60;

    CONTEXTS.forEach(ctx => {
      const ctxWindows = windows.filter(w => w.contextId === ctx.id);
      if (ctxWindows.length === 0) {
        bounds[ctx.id] = null;
        return;
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      ctxWindows.forEach(w => {
          if (w.x < minX) minX = w.x;
          if (w.y < minY) minY = w.y;
          if (w.x + w.w > maxX) maxX = w.x + w.w;
          if (w.y + w.h > maxY) maxY = w.y + w.h;
      });

      bounds[ctx.id] = {
          x: minX - padding,
          y: minY - padding - 40,
          w: (maxX - minX) + (padding * 2),
          h: (maxY - minY) + (padding * 2) + 40
      };
    });
    return bounds;
  }, [windows]);

  // -- Effects --
  useEffect(() => {
    // Check for API Key on mount
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    const envKey = process.env.API_KEY;
    
    if (storedKey || envKey) {
        setHasApiKey(true);
        // Ensure service is initialized if using stored key
        if (storedKey && !geminiService.isConfigured()) {
            geminiService.initialize(storedKey);
        }
    }
  }, []);

  useEffect(() => {
    if (!hasApiKey) return;

    geminiService.startChat(messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    })));
  }, [hasApiKey, messages]);

  useEffect(() => {
    const handleResize = () => {
        setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCmdPaletteOpen(prev => !prev);
        }
        if (e.ctrlKey && e.key === '`') {
            e.preventDefault();
            setIsTerminalOpen(prev => !prev);
        }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update active context based on position
  useEffect(() => {
    const centerX = (-panOffset.x) + (viewport.width / 2 / scale);
    const centerY = (-panOffset.y) + (viewport.height / 2 / scale);

    let closest = CONTEXTS[0];
    let minDist = Infinity;

    const contextCenters = CONTEXTS.map(ctx => {
        const bounds = contextBounds[ctx.id];
        if (bounds) {
            return {
                id: ctx.id,
                x: bounds.x + bounds.w / 2,
                y: bounds.y + bounds.h / 2
            };
        }
        // Fallback center for empty contexts
        return { id: ctx.id, x: ctx.x + 700, y: ctx.y + 400 }; 
    });

    for (const c of contextCenters) {
        const dist = Math.sqrt(Math.pow(centerX - c.x, 2) + Math.pow(centerY - c.y, 2));
        if (dist < minDist) {
            minDist = dist;
            closest = CONTEXTS.find(ctx => ctx.id === c.id)!;
        }
    }
    
    if (closest && closest.id !== activeContextId) {
        setActiveContextId(closest.id);
    }
  }, [panOffset, scale, viewport, contextBounds, activeContextId]);

  // -- Handlers --
  const handlePan = useCallback((delta: { x: number; y: number }) => {
    setPanOffset(prev => ({
        x: prev.x + delta.x,
        y: prev.y + delta.y
    }));
  }, []);

  const handleZoom = useCallback((newScale: number) => {
      setScale(newScale);
  }, []);

  const handleWindowMove = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const handleWindowResize = useCallback((id: string, w: number, h: number) => {
    setWindows(prev => prev.map(win => win.id === id ? { ...win, w, h } : win));
  }, []);

  const handleWindowSelect = useCallback((id: string) => {
    setSelectedWindowId(id);
    setWindows(prev => {
        const maxZ = Math.max(...prev.map(w => w.zIndex));
        return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
    });
  }, []);

  const handleNavigate = useCallback((newPanX: number, newPanY: number) => {
      setPanOffset({ x: newPanX, y: newPanY });
  }, []);

  const handleContextSelect = useCallback((ctx: ContextDef) => {
      const bounds = contextBounds[ctx.id];
      let targetX, targetY;

      if (bounds) {
          targetX = bounds.x + (bounds.w / 2);
          targetY = bounds.y + (bounds.h / 2);
      } else {
          // Compact fallback for empty contexts
          targetX = ctx.x + 700;
          targetY = ctx.y + 400;
      }

      const targetPanX = (viewport.width / 2 / scale) - targetX;
      const targetPanY = (viewport.height / 2 / scale) - targetY;
      
      setPanOffset({ x: targetPanX, y: targetPanY });
      setActiveContextId(ctx.id);
  }, [viewport, scale, contextBounds]);

  const handleGatherContext = useCallback((contextId: string) => {
     const centerX = (-panOffset.x) + (viewport.width / 2 / scale);
     const centerY = (-panOffset.y) + (viewport.height / 2 / scale);

     setWindows(prev => prev.map(win => {
         if (win.contextId === contextId) {
             const offsetX = (Math.random() * 200) - 100;
             const offsetY = (Math.random() * 200) - 100;
             return { ...win, x: centerX + offsetX - (win.w/2), y: centerY + offsetY - (win.h/2) };
         }
         return win;
     }));
  }, [panOffset, viewport, scale]);

  const handleArrangeContext = useCallback((contextId: string) => {
    setWindows(prev => {
        const ctxWins = prev.filter(w => w.contextId === contextId);
        const otherWins = prev.filter(w => w.contextId !== contextId);
        
        if (ctxWins.length === 0) return prev;

        // Arrange relative to the current bounding box top-left, or viewport center if undefined
        const currentBounds = contextBounds[contextId];
        const startX = currentBounds ? currentBounds.x + 60 : (-panOffset.x) + (viewport.width / 2 / scale) - 400;
        const startY = currentBounds ? currentBounds.y + 60 : (-panOffset.y) + (viewport.height / 2 / scale) - 300;
        
        const gap = 30;
        const cols = Math.ceil(Math.sqrt(ctxWins.length));
        
        const arranged = ctxWins.map((w, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            return {
                ...w,
                x: startX + (col * (w.w + gap)),
                y: startY + (row * (w.h + gap))
            };
        });
        
        return [...otherWins, ...arranged];
    });
  }, [panOffset, viewport, scale, contextBounds]);

  const handleAutoLayout = useCallback(() => {
      setWindows(INITIAL_WINDOWS);
      // Wait a tick for state update before centering
      setTimeout(() => {
          const bounds = { x: 40, y: 60, w: 1400, h: 1100 }; // Approx bounds of Dev Core
          const targetX = bounds.x + (bounds.w / 2);
          const targetY = bounds.y + (bounds.h / 2);
          const targetPanX = (viewport.width / 2 / scale) - targetX;
          const targetPanY = (viewport.height / 2 / scale) - targetY;
          setPanOffset({ x: targetPanX, y: targetPanY });
          setActiveContextId('dev');
      }, 0);
  }, [viewport, scale]);

  const handleSaveKey = (key: string) => {
    localStorage.setItem('GEMINI_API_KEY', key);
    geminiService.initialize(key);
    setHasApiKey(true);
    setIsApiKeyModalOpen(false);
  };
  
  const checkApiKey = useCallback(() => {
      if (!hasApiKey) {
          setIsApiKeyModalOpen(true);
          return false;
      }
      return true;
  }, [hasApiKey]);

  const focusWindow = useCallback((id: string) => {
      // Special handling for terminal which is now a drawer
      if (id === 'terminal') {
          setIsTerminalOpen(true);
          return;
      }
      handleWindowSelect(id);
      const win = windows.find(w => w.id === id);
      if (win) {
          const targetX = -win.x + (viewport.width/2/scale) - (win.w/2);
          const targetY = -win.y + (viewport.height/2/scale) - (win.h/2);
          setPanOffset({ x: targetX, y: targetY });
      }
  }, [handleWindowSelect, windows, viewport, scale]);

  // -- Chat Logic --
  const handleTaskCreate = useCallback((partialTask: Partial<Task>): string => {
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

  const handleTaskComplete = useCallback((taskId: string): string => {
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

  // -- Tool Execution --
  const handleToolCall = useCallback(async (name: string, args: any): Promise<any> => {
      console.log('Tool Executing:', name, args);
      
      switch (name) {
          case 'change_context': {
              const ctxId = args.contextId;
              const ctx = CONTEXTS.find(c => c.id === ctxId);
              if (ctx) {
                  handleContextSelect(ctx);
                  return { result: `Switched to ${ctx.label}` };
              }
              return { error: 'Context not found' };
          }
          case 'focus_window': {
              const winId = args.windowId;
              const win = windows.find(w => w.id === winId) || (winId === 'terminal' ? { id: 'terminal' } : null);
              if (win) {
                  focusWindow(win.id);
                  return { result: `Focused window ${winId}` };
              }
              return { error: 'Window not found' };
          }
          case 'create_task': {
              const newId = handleTaskCreate({
                  title: args.title,
                  priority: args.priority
              });
              return { result: `Task created: ${newId}` };
          }
          case 'complete_task': {
              const res = handleTaskComplete(args.taskId);
              return { result: res };
          }
          default:
              return { error: 'Unknown tool' };
      }
  }, [handleContextSelect, focusWindow, handleTaskCreate, handleTaskComplete, windows]);

  const systemInstruction = useMemo(() => {
     const contextList = CONTEXTS.map(c => `${c.label} (id: ${c.id})`).join(', ');
     const windowList = windows.map(w => `${w.title} (id: ${w.id}) in ${w.contextId}`).join(', ');
     const taskList = tasks.map(t => `[${t.id}] ${t.title} (${t.status})`).join(', ');
     
     return `
${INITIAL_SYSTEM_INSTRUCTION}

CURRENT HUD ENVIRONMENT:
- Available Contexts: ${contextList}
- Active Windows: ${windowList}
- Active Tasks: ${taskList}

You can control the HUD using tools:
- change_context(contextId)
- focus_window(windowId)
- create_task(title, priority)
- complete_task(taskId)

When the user asks to "go to" or "show" something, use the appropriate tool.
     `;
  }, [windows, tasks]);

  // -- Voice Session (Hoisted) --
  const { connect: connectVoice, disconnect: disconnectVoice, isConnected: isVoiceConnected, transcripts, volume } = useLiveSession({
    onToolCall: handleToolCall,
    systemInstruction,
    tools: HUD_TOOLS
  });

  const toggleVoice = () => {
      if (!checkApiKey()) return;
      if (isVoiceConnected) disconnectVoice();
      else connectVoice();
  };

  const handleSendMessage = async (text: string) => {
    if (!checkApiKey()) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const responseText = await geminiService.sendMessage(text, {
        tasks,
        onTaskCreate: handleTaskCreate,
        onTaskComplete: handleTaskComplete
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
  };

  const renderWindowContent = (id: string) => {
    switch(id) {
        case 'tasks': return <TaskManager tasks={tasks} onComplete={handleTaskComplete} />;
        case 'code': return <CodeEditor />;
        case 'db': return <DbSchema />;
        case 'arch': return <ArchDiagram />;
        case 'git': return <GitGraph />;
        case 'pipeline': return <PipelineMonitor />;
        case 'diff': return <DiffViewer />;
        case 'logs': return <LogViewer />;
        case 'process': return <SystemMonitor />;
        case 'docs': return <DocsEditor />;
        case 'ui': return <UiPreview />;
        default: return <div className="p-4 text-neutral-500">Module Loading...</div>;
    }
  };

  // -- Command Options --
  const commandList: CommandOption[] = [
    { id: 'toggle-term', label: 'Toggle Terminal', action: () => setIsTerminalOpen(p => !p), icon: <Terminal size={16} />, shortcut: 'Ctrl+`' },
    { id: 'toggle-voice', label: 'Toggle Voice Mode', action: toggleVoice, icon: <Mic size={16} /> },
    { id: 'reset', label: 'Auto Layout / Reset View', action: handleAutoLayout, icon: <LayoutTemplate size={16} />, shortcut: '⌘R' },
    { id: 'zoom-in', label: 'Zoom In', action: () => setScale(s => Math.min(3, s + 0.2)), icon: <ZoomIn size={16} /> },
    { id: 'zoom-out', label: 'Zoom Out', action: () => setScale(s => Math.max(0.2, s - 0.2)), icon: <ZoomOut size={16} /> },
    
    // Contexts
    { id: 'ctx-dev', label: 'Switch to Dev Core', action: () => handleContextSelect(CONTEXTS[0]), icon: <Code2 size={16} /> },
    { id: 'ctx-design', label: 'Switch to Blueprints', action: () => handleContextSelect(CONTEXTS[1]), icon: <PenTool size={16} /> },
    { id: 'ctx-ops', label: 'Switch to System Ops', action: () => handleContextSelect(CONTEXTS[2]), icon: <Server size={16} /> },
    { id: 'ctx-studio', label: 'Switch to Visual Studio', action: () => handleContextSelect(CONTEXTS[3]), icon: <Monitor size={16} /> },

    // Windows
    { id: 'focus-code', label: 'Focus Code Editor', action: () => focusWindow('code'), icon: <Code size={16} /> },
    { id: 'focus-tasks', label: 'Focus Mission Control', action: () => focusWindow('tasks'), icon: <Layout size={16} /> },
    { id: 'focus-db', label: 'Focus Schema Designer', action: () => focusWindow('db'), icon: <Database size={16} /> },
    { id: 'focus-arch', label: 'Focus Architecture', action: () => focusWindow('arch'), icon: <Cpu size={16} /> },
    { id: 'focus-git', label: 'Focus Source Control', action: () => focusWindow('git'), icon: <GitBranch size={16} /> },
    { id: 'focus-pipeline', label: 'Focus CI/CD Pipeline', action: () => focusWindow('pipeline'), icon: <Workflow size={16} /> },
  ];

  // Compact Mode Logic: Activated if Terminal or Voice is active
  const isCompactMode = isTerminalOpen || isVoiceConnected;

  return (
    <>
    <ApiKeyModal isOpen={isApiKeyModalOpen} onSave={handleSaveKey} />
    <HUDFrame 
      panOffset={panOffset} 
      scale={scale} 
      onPan={handlePan} 
      onZoom={handleZoom}
      // -- HUD LAYER (Fixed positioning) --
      hud={
        <>
           {/* Top Context Bar */}
           <ContextBar 
              contexts={CONTEXTS} 
              activeContextId={activeContextId} 
              onSelect={handleContextSelect} 
           />

           {/* Floating Context Dock */}
           <ContextDock 
              contexts={CONTEXTS} 
              activeContextId={activeContextId} 
              onSelect={handleContextSelect} 
              windows={windows}
              onGather={handleGatherContext}
              onArrange={handleArrangeContext}
           />

           {/* Minimap - Hidden in Compact Mode */}
           {!isCompactMode && (
             <div 
                className="fixed left-8 bottom-8 pointer-events-auto shadow-2xl border border-neutral-800 bg-black z-50 transition-all duration-300 ease-in-out"
             >
               <div className="w-[200px] h-[150px]">
                   <Minimap 
                      windows={windows} 
                      viewport={{ ...viewport, x: -panOffset.x, y: -panOffset.y }} 
                      panOffset={panOffset} 
                      appScale={scale}
                      onNavigate={handleNavigate} 
                      width={200} 
                      height={150} 
                  />
               </div>
             </div>
           )}

           {/* Voice HUD Log - Position dynamically based on Terminal state */}
           <div 
              className={`fixed right-8 pointer-events-none z-50 transition-all duration-300 ease-in-out flex flex-col items-end ${
                  isTerminalOpen ? 'bottom-[340px]' : 'bottom-24'
              }`}
           >
                <div className="pointer-events-auto">
                    <VoiceLog transcripts={transcripts} visible={isVoiceConnected} />
                </div>
           </div>

           {/* Status Controls (Toolbar) - Hidden in Compact Mode */}
           {!isCompactMode && (
             <div 
                className="fixed right-8 bottom-8 flex flex-col items-end pointer-events-none z-50 transition-all duration-300 ease-in-out"
             >
                <div className="pointer-events-auto flex items-center gap-2">
                    <div className="flex bg-black/80 backdrop-blur-sm border border-neutral-800 rounded overflow-hidden shadow-xl items-center h-8">
                        {/* Search / Command */}
                        <button 
                          onClick={() => setIsCmdPaletteOpen(true)}
                          className="flex items-center gap-2 px-3 h-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border-r border-neutral-800"
                          title="Command Palette (Cmd+K)"
                        >
                           <Search size={14} />
                           <span className="text-[10px] font-mono font-bold hidden sm:inline">CMD+K</span>
                        </button>

                        {/* Global Voice Toggle */}
                        <button 
                          onClick={toggleVoice}
                          className={`w-10 h-full flex items-center justify-center transition-colors border-r border-neutral-800 ${
                              isVoiceConnected 
                                ? 'bg-emerald-900/30 text-emerald-500 animate-pulse' 
                                : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                          title={isVoiceConnected ? "Disconnect Voice" : "Enable Voice Link"}
                        >
                           {isVoiceConnected ? <Mic size={14} /> : <MicOff size={14} />}
                           {isVoiceConnected && (
                              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                           )}
                        </button>

                        {/* Terminal Toggle */}
                        <button 
                          onClick={() => setIsTerminalOpen(p => !p)}
                          className={`w-10 h-full flex items-center justify-center transition-colors border-r border-neutral-800 ${
                              isTerminalOpen ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                          title="Toggle Terminal (Ctrl+`)"
                        >
                           {isTerminalOpen ? <ChevronUp size={14} className="rotate-180" /> : <Terminal size={14} />}
                        </button>

                        <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))} className="w-8 h-full flex items-center justify-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border-r border-neutral-800"><ZoomOut size={14} /></button>
                        <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="w-8 h-full flex items-center justify-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"><ZoomIn size={14} /></button>
                    </div>
                </div>
             </div>
           )}

           {/* Terminal Drawer */}
           <TerminalDrawer 
              isOpen={isTerminalOpen} 
              onClose={() => setIsTerminalOpen(false)}
              onToggleMaximize={() => setIsTerminalMaximized(p => !p)}
              isMaximized={isTerminalMaximized}
              activeContextLabel={CONTEXTS.find(c => c.id === activeContextId)?.label}
           >
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isProcessing} 
                isConnected={isVoiceConnected}
                transcripts={transcripts}
                onRequireAuth={checkApiKey}
              />
           </TerminalDrawer>

           {/* Bottom Status Bar - handles compact toggles */}
           <StatusBar 
              panOffset={panOffset} 
              scale={scale} 
              activeContextId={activeContextId}
              isVoiceConnected={isVoiceConnected}
              isCompact={isCompactMode}
              onToggleTerminal={() => setIsTerminalOpen(p => !p)}
              onToggleVoice={toggleVoice}
              isTerminalOpen={isTerminalOpen}
           />

           {/* Command Palette */}
           <CommandPalette 
              isOpen={isCmdPaletteOpen} 
              onClose={() => setIsCmdPaletteOpen(false)} 
              commands={commandList} 
           />
        </>
      }
    >
        {/* -- WORLD LAYER (Scaled content) -- */}

        {/* Dynamic Context Borders */}
        {CONTEXTS.map(ctx => {
            const bounds = contextBounds[ctx.id];
            if (!bounds) return null;

            return (
                <div 
                    key={ctx.id}
                    className="absolute border transition-colors duration-300 pointer-events-none rounded-lg"
                    style={{
                        left: bounds.x + panOffset.x, 
                        top: bounds.y + panOffset.y,
                        width: bounds.w,
                        height: bounds.h,
                        borderColor: ctx.id === activeContextId ? ctx.color : '#262626',
                        borderWidth: '1px',
                        backgroundColor: ctx.id === activeContextId ? `${ctx.color}05` : 'transparent',
                        boxShadow: ctx.id === activeContextId ? `0 0 100px ${ctx.color}10` : 'none',
                    }}
                >
                    <div 
                        className="absolute top-0 left-4 px-3 py-1 text-[10px] font-bold tracking-[0.2em] -translate-y-1/2 rounded-full border bg-black shadow-lg"
                        style={{ 
                            color: ctx.id === activeContextId ? ctx.color : '#525252',
                            borderColor: ctx.id === activeContextId ? ctx.color : '#262626'
                        }}
                    >
                        {ctx.label}
                    </div>
                </div>
            );
        })}

        {/* Windows */}
        {windows.map(win => (
            <DraggableWindow
                key={win.id}
                {...win}
                panOffset={panOffset}
                scale={scale}
                isSelected={selectedWindowId === win.id}
                onMove={handleWindowMove}
                onResize={handleWindowResize}
                onSelect={handleWindowSelect}
                className={'bg-black border border-neutral-700 shadow-2xl flex flex-col'}
            >
                <div className="h-6 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-2 select-none shrink-0">
                    <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">{win.title}</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-700 hover:bg-red-500/50 transition-colors"></div>
                    </div>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden relative">
                    {renderWindowContent(win.id)}
                </div>
            </DraggableWindow>
        ))}

    </HUDFrame>
    </>
  );
};

export default App;