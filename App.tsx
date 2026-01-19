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
import { WindowState } from './types';
import { useNexus } from './contexts/NexusContext';
import { INITIAL_SYSTEM_INSTRUCTION, HUD_TOOLS } from './constants';
import { useLiveSession } from './hooks/useLiveSession';
import { 
  LayoutTemplate, 
  Terminal, 
  Code, 
  Database, 
  Workflow,
  ZoomIn,
  ZoomOut,
  Search,
  ChevronUp,
  Mic,
  MicOff,
  Globe,
  LayoutGrid
} from 'lucide-react';

const App: React.FC = () => {
  // -- Global UI State (Viewport / Interactivity) --
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.8);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);

  // -- Consume Nexus Context --
  const {
    tasks,
    messages,
    windows,
    activeThreads,
    activeContextId,
    activeView,
    isProcessing,
    contexts,
    sendMessage,
    createTask,
    completeTask,
    setActiveContextId,
    setActiveView,
    updateWindow,
    selectWindow,
    focusWindow: focusWindowInContext,
    resetLayout,
    checkAuth
  } = useNexus();

  // -- Helpers (Layout Engine) --
  const contextBounds = useMemo(() => {
    const bounds: Record<string, { x: number; y: number; w: number; h: number } | null> = {};
    const padding = 60;

    contexts.forEach(ctx => {
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
  }, [windows, contexts]);

  // -- Effects --
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

  // Update active context based on position (Only if in 'spatial' mode)
  useEffect(() => {
    if (activeView !== 'spatial') return;

    const centerX = (-panOffset.x) + (viewport.width / 2 / scale);
    const centerY = (-panOffset.y) + (viewport.height / 2 / scale);

    let closest = contexts[0];
    let minDist = Infinity;

    const contextCenters = contexts.map(ctx => {
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
            closest = contexts.find(ctx => ctx.id === c.id)!;
        }
    }
    
    if (closest && closest.id !== activeContextId) {
        setActiveContextId(closest.id);
    }
  }, [panOffset, scale, viewport, contextBounds, activeContextId, activeView, contexts, setActiveContextId]);

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
    updateWindow(id, { x, y });
  }, [updateWindow]);

  const handleWindowResize = useCallback((id: string, w: number, h: number) => {
    updateWindow(id, { w, h });
  }, [updateWindow]);

  const handleWindowSelect = useCallback((id: string) => {
    setSelectedWindowId(id);
    selectWindow(id);
  }, [selectWindow]);

  const handleNavigate = useCallback((newPanX: number, newPanY: number) => {
      setPanOffset({ x: newPanX, y: newPanY });
  }, []);

  const handleContextSelect = useCallback((ctx: ContextDef) => {
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
  }, [viewport, scale, contextBounds, setActiveContextId, setActiveView]);

  const handleAutoLayout = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
    setScale(0.8);
    resetLayout();
  }, [resetLayout]);

  const handleFocusWindow = useCallback((id: string) => {
      if (id === 'terminal') {
          setIsTerminalOpen(true);
          return;
      }
      const win = focusWindowInContext(id);
      if (win) {
          if (activeView === 'spatial') {
              const targetX = -win.x + (viewport.width/2/scale) - (win.w/2);
              const targetY = -win.y + (viewport.height/2/scale) - (win.h/2);
              setPanOffset({ x: targetX, y: targetY });
          }
      }
  }, [focusWindowInContext, activeView, viewport, scale]);

  // -- Chat / Voice Integration --
  
  // Tool Execution Handler for Voice
  const handleToolCall = useCallback(async (name: string, args: any): Promise<any> => {
      switch (name) {
          case 'change_context': {
              const ctxId = args.contextId;
              const ctx = contexts.find(c => c.id === ctxId);
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
                  handleFocusWindow(winId);
                  return { result: `Focused window ${winId}` };
              }
              return { error: 'Window not found' };
          }
          case 'create_task': {
              const newId = createTask({
                  title: args.title,
                  priority: args.priority
              });
              return { result: `Task created: ${newId}` };
          }
          case 'complete_task': {
              const res = completeTask(args.taskId);
              return { result: res };
          }
          default:
              return { error: 'Unknown tool' };
      }
  }, [handleContextSelect, handleFocusWindow, createTask, completeTask, windows, contexts]);

  const systemInstruction = useMemo(() => {
     return `
${INITIAL_SYSTEM_INSTRUCTION}
CURRENT HUD ENVIRONMENT:
- Active View Mode: ${activeView.toUpperCase()}
`;
  }, [activeView]);

  // Voice Hook
  const { connect: connectVoice, disconnect: disconnectVoice, isConnected: isVoiceConnected, transcripts } = useLiveSession({
    onToolCall: handleToolCall,
    systemInstruction,
    tools: HUD_TOOLS
  });

  const toggleVoice = () => {
      if (!checkAuth()) return;
      if (isVoiceConnected) disconnectVoice();
      else connectVoice();
  };

  const handleTextSendMessage = (text: string) => {
      const scope = activeView !== 'spatial' ? activeView.toUpperCase() : undefined;
      sendMessage(text, scope);
  };

  const renderWindowContent = (id: string) => {
    switch(id) {
        case 'tasks': return <TaskManager tasks={tasks} onComplete={completeTask} />;
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

  // --- Tiling Layout Engine (Calculates Props for View Mode) ---
  const getRenderWindowProps = (win: WindowState) => {
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

      let matchesFilter = false;
      if (activeView === 'terminals' && win.type === 'terminal') matchesFilter = true;
      if (activeView === 'editors' && win.type === 'editor') matchesFilter = true;
      if (activeView === 'visuals' && win.type === 'visual') matchesFilter = true;

      if (!matchesFilter) {
          return {
              x: win.x,
              y: win.y,
              w: win.w,
              h: win.h,
              opacity: 0.1,
              pointerEvents: 'none'
          };
      }

      const matchingWindows = windows.filter(w => {
          if (activeView === 'terminals') return w.type === 'terminal';
          if (activeView === 'editors') return w.type === 'editor';
          if (activeView === 'visuals') return w.type === 'visual';
          return false;
      });

      const index = matchingWindows.findIndex(w => w.id === win.id);
      const vpCenterX = (-panOffset.x) + (viewport.width / 2 / scale);
      const vpCenterY = (-panOffset.y) + (viewport.height / 2 / scale);
      const gap = 40;
      const cols = Math.ceil(Math.sqrt(matchingWindows.length));
      const rows = Math.ceil(matchingWindows.length / cols);
      const gridW = 700;
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

  const commandList: CommandOption[] = [
    { id: 'toggle-term', label: 'Toggle Terminal', action: () => setIsTerminalOpen(p => !p), icon: <Terminal size={16} />, shortcut: 'Ctrl+`' },
    { id: 'toggle-voice', label: 'Toggle Voice Mode', action: toggleVoice, icon: <Mic size={16} /> },
    { id: 'reset', label: 'Reset Spatial View', action: () => { handleAutoLayout(); }, icon: <Globe size={16} />, shortcut: '⌘R' },
    { id: 'view-term', label: 'View: Terminal Grid', action: () => setActiveView('terminals'), icon: <Terminal size={16} /> },
    { id: 'view-code', label: 'View: Editor Grid', action: () => setActiveView('editors'), icon: <Code size={16} /> },
    { id: 'view-vis', label: 'View: Visual Grid', action: () => setActiveView('visuals'), icon: <LayoutGrid size={16} /> },
  ];

  const isCompactMode = isTerminalOpen || isVoiceConnected;

  return (
    <>
      <HUDFrame 
        panOffset={panOffset} 
        scale={scale} 
        onPan={handlePan} 
        onZoom={handleZoom}
        // -- HUD LAYER --
        hud={
          <>
            <ContextBar 
                contexts={contexts} 
                activeContextId={activeContextId} 
                onSelect={handleContextSelect} 
            />

            <ContextDock 
                activeView={activeView}
                onSelectView={setActiveView}
                activeThreads={activeThreads}
            />

            {!isCompactMode && (
              <div className="fixed left-8 bottom-8 pointer-events-auto shadow-2xl border border-neutral-800 bg-black z-50 transition-all duration-300 ease-in-out">
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

            <div className={`fixed right-8 pointer-events-none z-50 transition-all duration-300 ease-in-out flex flex-col items-end ${isTerminalOpen ? 'bottom-[340px]' : 'bottom-24'}`}>
                  <div className="pointer-events-auto">
                      <VoiceLog transcripts={transcripts} visible={isVoiceConnected} />
                  </div>
            </div>

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

            <TerminalDrawer 
                isOpen={isTerminalOpen} 
                onClose={() => setIsTerminalOpen(false)}
                onToggleMaximize={() => setIsTerminalMaximized(p => !p)}
                isMaximized={isTerminalMaximized}
                activeContextLabel={contexts.find(c => c.id === activeContextId)?.label}
                activeScope={activeView.toUpperCase()}
            >
                <ChatInterface 
                  messages={messages} 
                  onSendMessage={handleTextSendMessage} 
                                  isLoading={isProcessing} 
                                  isConnected={isVoiceConnected}
                                  transcripts={transcripts}
                                  isActive={isTerminalOpen}
                                  activeScope={activeView.toUpperCase()}
                                  onRequireAuth={checkAuth}
                                />
                             </TerminalDrawer>
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
          {windows.map(win => {
              const renderProps = getRenderWindowProps(win);
              const activeThread = activeThreads.find(t => t.targetId === win.id && t.isActive);

              return (
                  <DraggableWindow
                      key={win.id}
                      {...win}
                      x={renderProps.x}
                      y={renderProps.y}
                      w={renderProps.w}
                      h={renderProps.h}
                      panOffset={panOffset}
                      scale={scale}
                      isSelected={selectedWindowId === win.id}
                      isDimmed={renderProps.opacity < 1}
                      aiThread={activeThread}
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
      
      {/* Global Overlay Slot */}
      <div id="global-overlays" className="fixed inset-0 pointer-events-none z-[100]">
         {/* This area is reserved for modals, toasts, or authentication screens that sit above the HUD */}
      </div>
    </>
  );
};

export default App;