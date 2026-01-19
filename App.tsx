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
import ContextDock, { ViewMode } from './components/ContextDock';
import { Message, Task, WindowState, AiThread } from './types';
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
  MicOff,
  Globe,
  LayoutGrid
} from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 9);

// -- Context Definitions --
const CONTEXTS: ContextDef[] = [
  { id: 'dev', label: 'DEV CORE', x: 0, y: 0, color: '#10b981', icon: <Code2 size={18} /> },
  { id: 'design', label: 'BLUEPRINTS', x: 1800, y: 0, color: '#3b82f6', icon: <PenTool size={18} /> },
  { id: 'ops', label: 'SYSTEM OPS', x: 0, y: 1400, color: '#f59e0b', icon: <Server size={18} /> },
  { id: 'studio', label: 'VISUAL STUDIO', x: 1800, y: 1400, color: '#8b5cf6', icon: <Monitor size={18} /> },
];

// Categorized Windows with 'type'
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

// Simulated active AI conversations
const INITIAL_THREADS: AiThread[] = [
    { id: 't1', targetId: 'code', topic: 'Refactoring API', messageCount: 3, isActive: true },
    { id: 't2', targetId: 'pipeline', topic: 'Fixing Build Fail', messageCount: 5, isActive: true },
    { id: 't3', targetId: 'db', topic: 'Schema Migration', messageCount: 1, isActive: true },
];

const App: React.FC = () => {
  // -- Global State --
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [activeContextId, setActiveContextId] = useState<string>('dev');
  
  // -- View Mode --
  const [activeView, setActiveView] = useState<ViewMode>('spatial');

  // -- Terminal State --
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);

  // -- Window Management --
  const [windows, setWindows] = useState<WindowState[]>(INITIAL_WINDOWS);
  const [activeThreads, setActiveThreads] = useState<AiThread[]>(INITIAL_THREADS);

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
    geminiService.startChat(messages.slice(1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    })));

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

  // Update active context based on position (Only if in 'spatial' mode)
  useEffect(() => {
    if (activeView !== 'spatial') return;

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
  }, [panOffset, scale, viewport, contextBounds, activeContextId, activeView]);

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
      // Force spatial view if using context bar
      setActiveView('spatial');
      
      const bounds = contextBounds[ctx.id];
      let targetX, targetY;

      if (bounds) {
          targetX = bounds.x + (bounds.w / 2);
          targetY = bounds.y + (bounds.h / 2);
      } else {
          targetX = ctx.x + 700;
          targetY = ctx.y + 400;
      }

      const targetPanX = (viewport.width / 2 / scale) - targetX;
      const targetPanY = (viewport.height / 2 / scale) - targetY;
      
      setPanOffset({ x: targetPanX, y: targetPanY });
      setActiveContextId(ctx.id);
  }, [viewport, scale, contextBounds]);

  const focusWindow = useCallback((id: string) => {
      if (id === 'terminal') {
          setIsTerminalOpen(true);
          return;
      }
      handleWindowSelect(id);
      const win = windows.find(w => w.id === id);
      if (win) {
          // If in grid mode, ensure we see it (might need to switch view or just center)
          // For now, if focusing a window in spatial, pan to it.
          if (activeView === 'spatial') {
              const targetX = -win.x + (viewport.width/2/scale) - (win.w/2);
              const targetY = -win.y + (viewport.height/2/scale) - (win.h/2);
              setPanOffset({ x: targetX, y: targetY });
          }
      }
  }, [handleWindowSelect, windows, viewport, scale, activeView]);

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
     return `
${INITIAL_SYSTEM_INSTRUCTION}
CURRENT HUD ENVIRONMENT:
- Active View Mode: ${activeView.toUpperCase()}
`;
  }, [activeView]);

  // -- Voice Session --
  const { connect: connectVoice, disconnect: disconnectVoice, isConnected: isVoiceConnected, transcripts, volume } = useLiveSession({
    onToolCall: handleToolCall,
    systemInstruction,
    tools: HUD_TOOLS
  });

  const toggleVoice = () => {
      if (isVoiceConnected) disconnectVoice();
      else connectVoice();
  };

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
      setMessages(prev => [...prev, { id: generateId(), role: 'system', content: "ERR: LINK_FAILURE", timestamp: Date.now() }]);
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

  // --- Tiling Layout Engine ---
  // Calculates render props based on active view mode
  const getRenderWindowProps = (win: WindowState) => {
      if (activeView === 'spatial') {
          // In spatial mode, use the window's actual coordinates
          return {
              x: win.x,
              y: win.y,
              w: win.w,
              h: win.h,
              opacity: 1,
              pointerEvents: 'auto'
          };
      }

      // Check if window matches the current grid filter
      let matchesFilter = false;
      if (activeView === 'terminals' && win.type === 'terminal') matchesFilter = true;
      if (activeView === 'editors' && win.type === 'editor') matchesFilter = true;
      if (activeView === 'visuals' && win.type === 'visual') matchesFilter = true;

      if (!matchesFilter) {
          // Dim and disable non-matching windows in grid mode
          return {
              x: win.x,
              y: win.y,
              w: win.w,
              h: win.h,
              opacity: 0.1,
              pointerEvents: 'none'
          };
      }

      // Grid Layout Logic
      // 1. Find all matching windows
      const matchingWindows = windows.filter(w => {
          if (activeView === 'terminals') return w.type === 'terminal';
          if (activeView === 'editors') return w.type === 'editor';
          if (activeView === 'visuals') return w.type === 'visual';
          return false;
      });

      // 2. Determine index
      const index = matchingWindows.findIndex(w => w.id === win.id);
      
      // 3. Calculate grid position (centered in viewport)
      // Viewport center in World Space
      const vpCenterX = (-panOffset.x) + (viewport.width / 2 / scale);
      const vpCenterY = (-panOffset.y) + (viewport.height / 2 / scale);

      const gap = 40;
      const cols = Math.ceil(Math.sqrt(matchingWindows.length));
      const rows = Math.ceil(matchingWindows.length / cols);
      
      const gridW = 700; // Fixed width for uniformity in grid
      const gridH = 500;
      
      const totalW = (cols * gridW) + ((cols - 1) * gap);
      const totalH = (rows * gridH) + ((rows - 1) * gap);
      
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
          pointerEvents: 'auto'
      };
  };

  const handleAutoLayout = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
    setScale(0.8);
    setActiveContextId('dev');
  }, []);

  const commandList: CommandOption[] = [
    { id: 'toggle-term', label: 'Toggle Terminal', action: () => setIsTerminalOpen(p => !p), icon: <Terminal size={16} />, shortcut: 'Ctrl+`' },
    { id: 'toggle-voice', label: 'Toggle Voice Mode', action: toggleVoice, icon: <Mic size={16} /> },
    { id: 'reset', label: 'Reset Spatial View', action: () => { setActiveView('spatial'); handleAutoLayout(); }, icon: <Globe size={16} />, shortcut: '⌘R' },
    { id: 'view-term', label: 'View: Terminal Grid', action: () => setActiveView('terminals'), icon: <Terminal size={16} /> },
    { id: 'view-code', label: 'View: Editor Grid', action: () => setActiveView('editors'), icon: <Code size={16} /> },
    { id: 'view-vis', label: 'View: Visual Grid', action: () => setActiveView('visuals'), icon: <LayoutGrid size={16} /> },
  ];

  const isCompactMode = isTerminalOpen || isVoiceConnected;

  return (
    <HUDFrame 
      panOffset={panOffset} 
      scale={scale} 
      onPan={handlePan} 
      onZoom={handleZoom}
      // -- HUD LAYER --
      hud={
        <>
           {/* Context Bar (Top) */}
           <ContextBar 
              contexts={CONTEXTS} 
              activeContextId={activeContextId} 
              onSelect={handleContextSelect} 
           />

           {/* View Mode Switcher (Left Dock) */}
           <ContextDock 
              activeView={activeView}
              onSelectView={setActiveView}
              activeThreads={activeThreads}
           />

           {/* Minimap */}
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

           {/* Voice HUD Log */}
           <div 
              className={`fixed right-8 pointer-events-none z-50 transition-all duration-300 ease-in-out flex flex-col items-end ${
                  isTerminalOpen ? 'bottom-[340px]' : 'bottom-24'
              }`}
           >
                <div className="pointer-events-auto">
                    <VoiceLog transcripts={transcripts} visible={isVoiceConnected} />
                </div>
           </div>

           {/* Controls */}
           {!isCompactMode && (
             <div className="fixed right-8 bottom-8 flex flex-col items-end pointer-events-none z-50 transition-all duration-300 ease-in-out">
                <div className="pointer-events-auto flex items-center gap-2">
                    <div className="flex bg-black/80 backdrop-blur-sm border border-neutral-800 rounded overflow-hidden shadow-xl items-center h-8">
                        <button 
                          onClick={() => setIsCmdPaletteOpen(true)}
                          className="flex items-center gap-2 px-3 h-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border-r border-neutral-800"
                        >
                           <Search size={14} />
                           <span className="text-[10px] font-mono font-bold hidden sm:inline">CMD+K</span>
                        </button>
                        <button 
                          onClick={toggleVoice}
                          className={`w-10 h-full flex items-center justify-center transition-colors border-r border-neutral-800 ${
                              isVoiceConnected ? 'bg-emerald-900/30 text-emerald-500 animate-pulse' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                           {isVoiceConnected ? <Mic size={14} /> : <MicOff size={14} />}
                        </button>
                        <button 
                          onClick={() => setIsTerminalOpen(p => !p)}
                          className={`w-10 h-full flex items-center justify-center transition-colors border-r border-neutral-800 ${
                              isTerminalOpen ? 'bg-neutral-800 text-white' : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
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
              activeScope={activeView.toUpperCase()}
           >
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isProcessing} 
                isConnected={isVoiceConnected}
                transcripts={transcripts}
                isActive={isTerminalOpen}
                activeScope={activeView.toUpperCase()}
              />
           </TerminalDrawer>

           {/* Status Bar */}
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

           <CommandPalette 
              isOpen={isCmdPaletteOpen} 
              onClose={() => setIsCmdPaletteOpen(false)} 
              commands={commandList} 
           />
        </>
      }
    >
        {/* -- WORLD LAYER -- */}
        
        {/* Render Windows using the layout engine */}
        {windows.map(win => {
            const renderProps = getRenderWindowProps(win);
            const activeThread = activeThreads.find(t => t.targetId === win.id && t.isActive);

            return (
                <DraggableWindow
                    key={win.id}
                    {...win} // pass original props (id, title, etc)
                    // Override spatial props with calculated ones
                    x={renderProps.x}
                    y={renderProps.y}
                    w={renderProps.w}
                    h={renderProps.h}
                    panOffset={panOffset}
                    scale={scale}
                    isSelected={selectedWindowId === win.id}
                    isDimmed={renderProps.opacity < 1} // Logic for dimmed check
                    aiThread={activeThread} // Pass thread for bubble
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
            );
        })}

    </HUDFrame>
  );
};

export default App;