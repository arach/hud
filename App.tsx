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
import ContextManifest from './components/ContextManifest'; 
import ContextZone from './components/ContextZone';
import SectorLocator from './components/SectorLocator';
import { ScreenDraggable } from './components/ScreenDraggable';
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
  LayoutGrid,
  Power
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
  
  // Transition State
  const [isTransitioning, setIsTransitioning] = useState(false);

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
    closeWindow,
    restoreContextDefaults,
    selectWindow,
    focusWindow: focusWindowInContext,
    resetLayout,
    checkAuth,
    getSyntheticLayout
  } = useNexus();

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

  // -- Focus / Recenter Logic --
  const focusContext = useCallback((ctxId: string) => {
      let targetWindows = windows;
      if (ctxId !== 'global') {
          targetWindows = windows.filter(w => w.contextId === ctxId);
      }

      if (targetWindows.length === 0) {
          if (ctxId === 'global') {
              setIsTransitioning(true);
              setScale(0.8);
              setPanOffset({ x: 0, y: 0 });
              setTimeout(() => setIsTransitioning(false), 750);
          }
          return;
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      targetWindows.forEach(w => {
          if (w.x < minX) minX = w.x;
          if (w.y < minY) minY = w.y;
          if (w.x + w.w > maxX) maxX = w.x + w.w;
          if (w.y + w.h > maxY) maxY = w.y + w.h;
      });

      const padding = 150; 
      const boundingW = (maxX - minX) + (padding * 2);
      const boundingH = (maxY - minY) + (padding * 2);
      const centerW = (maxX + minX) / 2;
      const centerH = (maxY + minY) / 2;

      const scaleX = viewport.width / boundingW;
      const scaleY = viewport.height / boundingH;
      
      let targetScale = Math.min(scaleX, scaleY);
      targetScale = Math.max(0.4, Math.min(targetScale, 1.1));

      const targetPanX = (viewport.width / 2 / targetScale) - centerW;
      const targetPanY = (viewport.height / 2 / targetScale) - centerH;

      setIsTransitioning(true);
      setScale(targetScale);
      setPanOffset({ x: targetPanX, y: targetPanY });

      setTimeout(() => setIsTransitioning(false), 750);

  }, [windows, viewport]);

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
    if (activeView === 'spatial') {
        updateWindow(id, { x, y });
    }
  }, [updateWindow, activeView]);

  const handleWindowResize = useCallback((id: string, w: number, h: number) => {
    if (activeView === 'spatial') {
        updateWindow(id, { w, h });
    }
  }, [updateWindow, activeView]);

  const handleWindowSelect = useCallback((id: string) => {
    setSelectedWindowId(id);
    selectWindow(id);
  }, [selectWindow]);

  const handleNavigate = useCallback((newPanX: number, newPanY: number) => {
      setPanOffset({ x: newPanX, y: newPanY });
  }, []);

  const handleContextSelect = useCallback((ctx: ContextDef) => {
      setActiveView('spatial');
      setActiveContextId(ctx.id);
      focusContext(ctx.id);
  }, [setActiveContextId, setActiveView, focusContext]);

  const handleAutoLayout = useCallback(() => {
    resetLayout();
    setTimeout(() => focusContext('global'), 10);
  }, [resetLayout, focusContext]);

  const handleFocusWindow = useCallback((id: string) => {
      setSelectedWindowId(id);
      
      if (id === 'terminal') {
          setIsTerminalOpen(true);
          return;
      }

      if (activeView !== 'spatial') {
        setActiveView('spatial');
      }
      
      const win = focusWindowInContext(id);
      if (win) {
          setIsTransitioning(true);
          const fitPadding = 1.4;
          const scaleX = viewport.width / (win.w * fitPadding);
          const scaleY = viewport.height / (win.h * fitPadding);
          
          let targetScale = Math.min(scaleX, scaleY);
          targetScale = Math.max(0.5, Math.min(targetScale, 1.2));

          const winCenterX = win.x + (win.w / 2);
          const winCenterY = win.y + (win.h / 2);

          const targetPanX = (viewport.width / 2 / targetScale) - winCenterX;
          const targetPanY = (viewport.height / 2 / targetScale) - winCenterY;

          setScale(targetScale);
          setPanOffset({ x: targetPanX, y: targetPanY });

          setTimeout(() => setIsTransitioning(false), 750);
      }
  }, [focusWindowInContext, activeView, viewport, setActiveView]);

  // -- Task Discussion Handler --
  const handleDiscussTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        setIsTerminalOpen(true);
        // Inject a conversational prompt about the task
        sendMessage(`I'm working on the task "${task.title}". Can you give me a status update or suggest next steps?`, activeView.toUpperCase());
    }
  }, [tasks, sendMessage, activeView]);

  // -- Chat / Voice Integration --
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
- Active Context: ${activeContextId.toUpperCase()}
- Active View Mode: ${activeView.toUpperCase()}
`;
  }, [activeView, activeContextId]);

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

  const commandList: CommandOption[] = [
    { id: 'toggle-term', label: 'Toggle Terminal', action: () => setIsTerminalOpen(p => !p), icon: <Terminal size={16} />, shortcut: 'Ctrl+`' },
    { id: 'toggle-voice', label: 'Toggle Voice Mode', action: toggleVoice, icon: <Mic size={16} /> },
    { id: 'reset', label: 'Reset Global View', action: () => { handleAutoLayout(); }, icon: <Globe size={16} />, shortcut: '⌘R' },
    { id: 'view-term', label: 'View: Terminal Grid', action: () => setActiveView('terminals'), icon: <Terminal size={16} /> },
    { id: 'view-code', label: 'View: Editor Grid', action: () => setActiveView('editors'), icon: <Code size={16} /> },
    { id: 'view-vis', label: 'View: Visual Grid', action: () => setActiveView('visuals'), icon: <LayoutGrid size={16} /> },
  ];

  const isCompactMode = isTerminalOpen || isVoiceConnected;
  const activeContextWindows = windows.filter(w => w.contextId === activeContextId);
  const isContextEmpty = activeContextId !== 'global' && activeContextWindows.length === 0;

  return (
    <>
      <HUDFrame 
        panOffset={panOffset} 
        scale={scale} 
        onPan={handlePan} 
        onZoom={handleZoom}
        isTransitioning={isTransitioning}
        activeContextId={activeContextId}
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
            
            <ContextManifest 
                activeContextId={activeContextId} 
                windows={activeContextWindows}
                tasks={tasks} 
                contextLabel={contexts.find(c => c.id === activeContextId)?.label}
                onItemClick={handleFocusWindow}
                onDiscuss={handleDiscussTask} // Wired up
            />
            
            {/* Enhanced Sector Locator */}
            {activeView === 'spatial' && !isContextEmpty && (
              <SectorLocator 
                windows={activeContextId === 'global' ? windows : activeContextWindows} 
                viewport={viewport}
                panOffset={panOffset}
                scale={scale}
                onLocate={() => focusContext(activeContextId)}
              />
            )}

            {!isCompactMode && (
              <ScreenDraggable initialLeft={32} initialBottom={32}>
                <div className="w-[200px] h-[150px] border border-neutral-800 bg-black">
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
              </ScreenDraggable>
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

            {isContextEmpty && (
                <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 fade-in duration-500 pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-2 shadow-inner">
                            <Power size={24} className="text-neutral-500" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white tracking-tight mb-1">System Offline</h2>
                            <p className="text-neutral-400 text-xs font-mono max-w-[200px]">
                                No active modules found in <span className="text-emerald-500">{contexts.find(c => c.id === activeContextId)?.label}</span> sector.
                            </p>
                        </div>
                        <button 
                            onClick={() => restoreContextDefaults(activeContextId)}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-wide rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-2"
                        >
                            Initialize Protocol
                        </button>
                    </div>
                </div>
            )}
          </>
        }
      >
          {activeView === 'spatial' && contexts.filter(c => c.id !== 'global').map(ctx => {
              let width = 1220; 
              let height = 800;
              if (ctx.id === 'dev') { width = 1220; height = 620; }
              if (ctx.id === 'design') { width = 1220; height = 770; }
              if (ctx.id === 'ops') { width = 1220; height = 770; }
              if (ctx.id === 'studio') { width = 1220; height = 720; }

              return (
                  <ContextZone 
                      key={ctx.id} 
                      context={ctx} 
                      isActive={activeContextId === 'global' || activeContextId === ctx.id}
                      width={width}
                      height={height}
                  />
              );
          })}

          {windows.map(win => {
              const renderProps = getSyntheticLayout(win, viewport, panOffset, scale);
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
                      isDragDisabled={activeView !== 'spatial'}
                      aiThread={activeThread}
                      onMove={handleWindowMove}
                      onResize={handleWindowResize}
                      onSelect={handleWindowSelect}
                      onClose={closeWindow}
                      className={'bg-black border border-neutral-700 shadow-2xl flex flex-col'}
                  >
                      <div className="h-6 bg-neutral-900 border-b border-neutral-800 flex items-center justify-center px-2 select-none shrink-0 relative">
                          <span className="text-[10px] font-bold tracking-widest text-neutral-500 uppercase">{win.title}</span>
                          <div className="absolute right-2 flex gap-1 group">
                              <div 
                                onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                                className="w-1.5 h-1.5 rounded-full bg-neutral-700 hover:bg-red-500 transition-colors cursor-pointer"
                                title="Close Window"
                              ></div>
                          </div>
                      </div>
                      <div className="flex-1 min-h-0 overflow-hidden relative">
                          {renderWindowContent(win.id)}
                      </div>
                  </DraggableWindow>
              );
          })}
      </HUDFrame>
      <div id="global-overlays" className="fixed inset-0 pointer-events-none z-[100]"></div>
    </>
  );
};

export default App;
