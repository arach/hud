import React, { useState, useEffect, useCallback, useMemo } from 'react';
import HUDFrame from './components/HUDFrame';
import ChatInterface from './components/ChatInterface';
import TaskManager from './components/TaskManager';
import Minimap from './components/Minimap';
import StatusBar from './components/StatusBar';
import DraggableWindow from './components/DraggableWindow';
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
import { MOCK_TASKS } from './constants';
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
} from 'lucide-react';

import ApiKeyModal from './components/ApiKeyModal';

const generateId = () => Math.random().toString(36).substring(2, 9);

// -- Context Definitions --
// Used for metadata and identity. Initial positions are derived from windows.
const CONTEXTS: ContextDef[] = [
  { id: 'dev', label: 'DEV CORE', x: 0, y: 0, color: '#10b981', icon: <Code2 size={18} /> },
  { id: 'design', label: 'BLUEPRINTS', x: 2200, y: 0, color: '#3b82f6', icon: <PenTool size={18} /> },
  { id: 'ops', label: 'SYSTEM OPS', x: 0, y: 1400, color: '#f59e0b', icon: <Server size={18} /> },
  { id: 'studio', label: 'VISUAL STUDIO', x: 2200, y: 1400, color: '#8b5cf6', icon: <Monitor size={18} /> },
];

const INITIAL_WINDOWS: WindowState[] = [
    // --- DEV CORE ---
    { id: 'code', contextId: 'dev', title: 'Code Editor', x: 50, y: 100, w: 800, h: 600, zIndex: 10 },
    { id: 'terminal', contextId: 'dev', title: 'Agent CLI', x: 900, y: 100, w: 500, h: 600, zIndex: 11 },
    { id: 'docs', contextId: 'dev', title: 'Documentation', x: 1450, y: 100, w: 450, h: 600, zIndex: 9 },
    { id: 'tasks', contextId: 'dev', title: 'Mission Control', x: 50, y: 750, w: 400, h: 400, zIndex: 10 },

    // --- BLUEPRINTS ---
    { id: 'db', contextId: 'design', title: 'Schema Designer', x: 2250, y: 100, w: 700, h: 500, zIndex: 10 },
    { id: 'arch', contextId: 'design', title: 'Architecture', x: 3000, y: 100, w: 700, h: 500, zIndex: 10 },
    { id: 'git', contextId: 'design', title: 'Source Control', x: 2250, y: 650, w: 600, h: 450, zIndex: 10 },

    // --- SYSTEM OPS ---
    { id: 'pipeline', contextId: 'ops', title: 'CI/CD Pipeline', x: 50, y: 1500, w: 800, h: 400, zIndex: 10 },
    { id: 'process', contextId: 'ops', title: 'Process Dashboard', x: 900, y: 1500, w: 500, h: 400, zIndex: 10 },
    { id: 'logs', contextId: 'ops', title: 'System Logs', x: 50, y: 1950, w: 800, h: 400, zIndex: 10 },

    // --- VISUAL STUDIO ---
    { id: 'ui', contextId: 'studio', title: 'UI Preview', x: 2250, y: 1500, w: 900, h: 600, zIndex: 11 },
    { id: 'diff', contextId: 'studio', title: 'Diff Viewer', x: 3200, y: 1500, w: 600, h: 600, zIndex: 10 },
];

const App: React.FC = () => {
  // -- Global State --
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [activeContextId, setActiveContextId] = useState<string>('dev');
  const [hasApiKey, setHasApiKey] = useState(false);

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
  // Memoized bounds calculation to prevent lag during re-renders
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
  }, [hasApiKey]);

  useEffect(() => {
    const handleResize = () => {
        setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCmdPaletteOpen(prev => !prev);
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

    // Determine context centers dynamically
    const contextCenters = CONTEXTS.map(ctx => {
        const bounds = contextBounds[ctx.id];
        if (bounds) {
            return {
                id: ctx.id,
                x: bounds.x + bounds.w / 2,
                y: bounds.y + bounds.h / 2
            };
        }
        return { id: ctx.id, x: ctx.x + 950, y: ctx.y + 625 };
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
          targetX = ctx.x + 950;
          targetY = ctx.y + 625;
      }

      // Center the camera on target
      const targetPanX = (viewport.width / 2 / scale) - targetX;
      const targetPanY = (viewport.height / 2 / scale) - targetY;
      
      setPanOffset({ x: targetPanX, y: targetPanY });
      setActiveContextId(ctx.id);
  }, [viewport, scale, contextBounds]);

  const handleGatherContext = useCallback((contextId: string) => {
     // Find center of current view
     const centerX = (-panOffset.x) + (viewport.width / 2 / scale);
     const centerY = (-panOffset.y) + (viewport.height / 2 / scale);

     setWindows(prev => prev.map(win => {
         if (win.contextId === contextId) {
             // Cascade
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

        // Calculate a nice grid based on current view center
        const centerX = (-panOffset.x) + (viewport.width / 2 / scale);
        const centerY = (-panOffset.y) + (viewport.height / 2 / scale);
        
        const gap = 30;
        const cols = Math.ceil(Math.sqrt(ctxWins.length));
        
        // Simple grid algorithm
        const arranged = ctxWins.map((w, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            // Rough centering math
            const totalW = cols * (800 + gap); // Assuming avg width 800 for centering calc
            const totalH = Math.ceil(ctxWins.length / cols) * (600 + gap);
            
            const startX = centerX - (totalW / 4); 
            const startY = centerY - (totalH / 4);

            return {
                ...w,
                x: startX + (col * (w.w + gap)),
                y: startY + (row * (w.h + gap))
            };
        });
        
        return [...otherWins, ...arranged];
    });
  }, [panOffset, viewport, scale]);

  const handleAutoLayout = useCallback(() => {
      setWindows(INITIAL_WINDOWS);
      handleContextSelect(CONTEXTS[0]);
  }, [handleContextSelect]);

  const handleSaveKey = (key: string) => {
    localStorage.setItem('GEMINI_API_KEY', key);
    geminiService.initialize(key);
    setHasApiKey(true);
  };

  const focusWindow = useCallback((id: string) => {
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

  const handleSendMessage = async (text: string) => {
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
        case 'terminal': return <ChatInterface messages={messages} onSendMessage={handleSendMessage} isLoading={isProcessing} activeContext={CONTEXTS.find(c => c.id === activeContextId)?.label} />;
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
    { id: 'reset', label: 'Auto Layout / Reset View', action: handleAutoLayout, icon: <LayoutTemplate size={16} />, shortcut: '⌘R' },
    { id: 'zoom-in', label: 'Zoom In', action: () => setScale(s => Math.min(3, s + 0.2)), icon: <ZoomIn size={16} /> },
    { id: 'zoom-out', label: 'Zoom Out', action: () => setScale(s => Math.max(0.2, s - 0.2)), icon: <ZoomOut size={16} /> },
    
    // Contexts
    { id: 'ctx-dev', label: 'Switch to Dev Core', action: () => handleContextSelect(CONTEXTS[0]), icon: <Code2 size={16} /> },
    { id: 'ctx-design', label: 'Switch to Blueprints', action: () => handleContextSelect(CONTEXTS[1]), icon: <PenTool size={16} /> },
    { id: 'ctx-ops', label: 'Switch to System Ops', action: () => handleContextSelect(CONTEXTS[2]), icon: <Server size={16} /> },
    { id: 'ctx-studio', label: 'Switch to Visual Studio', action: () => handleContextSelect(CONTEXTS[3]), icon: <Monitor size={16} /> },

    // Windows
    { id: 'focus-term', label: 'Focus Terminal', action: () => focusWindow('terminal'), icon: <Terminal size={16} /> },
    { id: 'focus-code', label: 'Focus Code Editor', action: () => focusWindow('code'), icon: <Code size={16} /> },
    { id: 'focus-tasks', label: 'Focus Mission Control', action: () => focusWindow('tasks'), icon: <Layout size={16} /> },
    { id: 'focus-db', label: 'Focus Schema Designer', action: () => focusWindow('db'), icon: <Database size={16} /> },
    { id: 'focus-arch', label: 'Focus Architecture', action: () => focusWindow('arch'), icon: <Cpu size={16} /> },
    { id: 'focus-git', label: 'Focus Source Control', action: () => focusWindow('git'), icon: <GitBranch size={16} /> },
    { id: 'focus-pipeline', label: 'Focus CI/CD Pipeline', action: () => focusWindow('pipeline'), icon: <Workflow size={16} /> },
  ];

  return (
    <>
      <ApiKeyModal isOpen={!hasApiKey} onSave={handleSaveKey} />
      <HUDFrame 
        panOffset={panOffset} 
        scale={scale} 
        onPan={handlePan} 
        onZoom={handleZoom}
        // -- HUD LAYER (Fixed positioning, no scaling) --
        hud={
        <>
           {/* Top Context Bar (Restored) */}
           <ContextBar 
              contexts={CONTEXTS} 
              activeContextId={activeContextId} 
              onSelect={handleContextSelect} 
           />

           {/* Floating Context Dock (Complementary) */}
           <ContextDock 
              contexts={CONTEXTS} 
              activeContextId={activeContextId} 
              onSelect={handleContextSelect} 
              windows={windows}
              onGather={handleGatherContext}
              onArrange={handleArrangeContext}
           />

           {/* Minimap (Bottom Left) */}
           <div className="absolute bottom-10 left-8 pointer-events-auto shadow-2xl border border-neutral-800 bg-black z-40">
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

           {/* Status Controls (Bottom Right - Zoom & Search) */}
           <div className="absolute bottom-10 right-8 flex flex-col items-end pointer-events-none z-40">
              <div className="pointer-events-auto flex items-center gap-2">
                  {/* Toolbar Row */}
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

                      <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))} className="w-8 h-full flex items-center justify-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border-r border-neutral-800"><ZoomOut size={14} /></button>
                      <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="w-8 h-full flex items-center justify-center hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"><ZoomIn size={14} /></button>
                  </div>
              </div>
           </div>

           {/* Bottom Status Bar */}
           <StatusBar 
              panOffset={panOffset} 
              scale={scale} 
              activeContextId={activeContextId}
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