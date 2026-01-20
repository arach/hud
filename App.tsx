import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import HUDFrame from './components/HUDFrame';
import type { CanvasDebugState } from './components/Canvas';
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
import ContextManifest from './components/ContextManifest'; 
import ContextZone from './components/ContextZone';
import SectorLocator from './components/SectorLocator';
import { ScreenDraggable } from './components/ScreenDraggable';
import InspectorPanel from './components/InspectorPanel';
import { useHud } from './contexts/HudContext';
import { INITIAL_SYSTEM_INSTRUCTION, HUD_TOOLS } from './constants';
import { useLiveSession } from './hooks/useLiveSession';
import { matchesNamespace, DEFAULT_NAMESPACE_QUERY } from './lib/namespace';
import { logPanEvent, HUD_PAN_EVENT, HudLogEntry } from './lib/hudLogger';
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
  const [isLogDockOpen, setIsLogDockOpen] = useState(false);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<{ kind: 'view'; id: ViewMode } | null>(null);
  const [isPanActive, setIsPanActive] = useState(false);
  const [isPanSettling, setIsPanSettling] = useState(false);
  const [pendingContextFocusId, setPendingContextFocusId] = useState<string | null>(null);
  const [hudLogs, setHudLogs] = useState<HudLogEntry[]>([]);
  const [canvasDebug, setCanvasDebug] = useState<CanvasDebugState | null>(null);
  const canvasDebugRef = useRef<CanvasDebugState | null>(null);
  const panOffsetRef = useRef(panOffset);
  const scaleRef = useRef(scale);
  const viewportRef = useRef(viewport);
  const panSettleTimerRef = useRef<number | null>(null);
  const focusDebugTimerRef = useRef<number | null>(null);
  
  // Transition State
  const [isTransitioning, setIsTransitioning] = useState(false);

  // -- Consume HUD Context --
  const {
    tasks,
    messages,
    windows,
    activeThreads,
    activeContextId,
    activeView,
    namespaceQuery,
    isProcessing,
    contexts,
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
    focusWindow: focusWindowInContext,
    resetLayout,
    checkAuth,
    getSyntheticLayout
  } = useHud();

  // -- Effects --
  useEffect(() => {
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

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleViewportChange = useCallback((next: { width: number; height: number }) => {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    const clamped = {
      width: Math.min(next.width, maxWidth),
      height: Math.min(next.height, maxHeight)
    };
    setViewport(prev => {
      if (prev.width === clamped.width && prev.height === clamped.height) return prev;
      logPanEvent('viewport', { prev, next: clamped, raw: next, max: { width: maxWidth, height: maxHeight } });
      return clamped;
    });
  }, []);

  const handleCanvasDebug = useCallback((state: CanvasDebugState) => {
    canvasDebugRef.current = state;
    setCanvasDebug(state);
  }, []);

  useEffect(() => {
    const handleHudPanLog = (event: Event) => {
      const detail = (event as CustomEvent<HudLogEntry>).detail;
      if (!detail) return;
      setHudLogs(prev => {
        const next = [...prev, detail];
        return next.slice(-80);
      });
    };
    window.addEventListener(HUD_PAN_EVENT, handleHudPanLog as EventListener);
    return () => window.removeEventListener(HUD_PAN_EVENT, handleHudPanLog as EventListener);
  }, []);

  useEffect(() => {
    return () => {
      if (panSettleTimerRef.current) {
        window.clearTimeout(panSettleTimerRef.current);
      }
      if (focusDebugTimerRef.current) {
        window.clearTimeout(focusDebugTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  const setPanOffsetWithLog = useCallback((next: { x: number; y: number }, source: string) => {
    setPanOffset(prev => {
      logPanEvent('set', { source, prev, next, viewport, scale, canvas: canvasDebugRef.current });
      return next;
    });
  }, [viewport, scale]);

  // -- Focus / Recenter Logic --
  const getHudSafeViewport = useCallback(() => {
      const base = viewportRef.current;
      const width = base.width || window.innerWidth;
      const height = base.height || window.innerHeight;
      let left = 0;
      let right = 0;
      let top = 0;
      let bottom = 0;

      const manifest = document.querySelector('[data-hud-panel="manifest"]') as HTMLElement | null;
      if (manifest) {
        const rect = manifest.getBoundingClientRect();
        left = Math.max(left, rect.right);
      }
      const inspector = document.querySelector('[data-hud-panel="inspector"]') as HTMLElement | null;
      if (inspector) {
        const rect = inspector.getBoundingClientRect();
        right = Math.max(right, width - rect.left);
      }
      const contextBar = document.querySelector('[data-hud-panel="context-bar"]') as HTMLElement | null;
      if (contextBar) {
        const rect = contextBar.getBoundingClientRect();
        top = Math.max(top, rect.bottom);
      }
      const statusBar = document.querySelector('[data-hud-panel="status-bar"]') as HTMLElement | null;
      if (statusBar) {
        const rect = statusBar.getBoundingClientRect();
        bottom = Math.max(bottom, height - rect.top);
      }

      const safeWidth = Math.max(0, width - left - right);
      const safeHeight = Math.max(0, height - top - bottom);
      return {
        width,
        height,
        left,
        top,
        safeWidth,
        safeHeight,
        centerX: left + safeWidth / 2,
        centerY: top + safeHeight / 2
      };
  }, []);

  const focusContext = useCallback((ctxId: string) => {
      let targetWindows = windows;
      if (ctxId !== 'global') {
          targetWindows = windows.filter(w => w.contextId === ctxId);
      }

      if (targetWindows.length === 0) {
          if (ctxId === 'global') {
              setIsTransitioning(true);
              setScale(0.8);
              setPanOffsetWithLog({ x: 0, y: 0 }, 'focusContext');
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

      const safeViewport = getHudSafeViewport();
      const scaleX = safeViewport.safeWidth / boundingW;
      const scaleY = safeViewport.safeHeight / boundingH;
      
      let targetScale = Math.min(scaleX, scaleY);
      targetScale = Math.max(0.4, Math.min(targetScale, 1.1));

      const targetPanX = (safeViewport.centerX / targetScale) - centerW;
      const targetPanY = (safeViewport.centerY / targetScale) - centerH;

      setIsTransitioning(true);
      setScale(targetScale);
      logPanEvent('focus', {
        source: 'focusContext',
        ctxId,
        bounds: { minX, minY, maxX, maxY },
        viewport: { width: safeViewport.width, height: safeViewport.height },
        scale,
        targetScale,
        targetPan: { x: targetPanX, y: targetPanY },
        canvas: canvasDebugRef.current
      });
      setPanOffsetWithLog({ x: targetPanX, y: targetPanY }, 'focusContext');

      setTimeout(() => setIsTransitioning(false), 750);

      if (focusDebugTimerRef.current) {
        window.clearTimeout(focusDebugTimerRef.current);
      }
      focusDebugTimerRef.current = window.setTimeout(() => {
        const finalPan = panOffsetRef.current;
        const finalScale = scaleRef.current;
        const finalViewport = viewportRef.current;
        const viewportCenter = {
          x: finalViewport.width / 2,
          y: finalViewport.height / 2
        };
        const boundsCenter = { x: centerW, y: centerH };
        const actualCenter = {
          x: (boundsCenter.x + finalPan.x) * finalScale,
          y: (boundsCenter.y + finalPan.y) * finalScale
        };
        const error = {
          x: actualCenter.x - viewportCenter.x,
          y: actualCenter.y - viewportCenter.y
        };
        logPanEvent('focus:resolve', {
          source: 'focusContext',
          ctxId,
          boundsCenter,
          viewportCenter,
          actualCenter,
          error,
          finalPan,
          finalScale,
          viewport: finalViewport,
          targetScale,
          targetPan: { x: targetPanX, y: targetPanY },
          canvas: canvasDebugRef.current
        });
      }, 800);

  }, [windows, scale, setPanOffsetWithLog, getHudSafeViewport]);

  useEffect(() => {
    if (!pendingContextFocusId) return;
    if (activeView !== 'spatial') return;
    if (activeContextId !== pendingContextFocusId) return;
    const targetId = pendingContextFocusId;
    setPendingContextFocusId(null);
    window.requestAnimationFrame(() => focusContext(targetId));
  }, [pendingContextFocusId, activeView, activeContextId, focusContext]);

  // -- Handlers --
  const handlePan = useCallback((delta: { x: number; y: number }, source = 'canvas') => {
    if (isTransitioning) {
      logPanEvent('skip', { source, reason: 'transitioning', canvas: canvasDebugRef.current }, true);
      return;
    }
    setPanOffset(prev => {
        const next = {
          x: prev.x + delta.x,
          y: prev.y + delta.y
        };
        logPanEvent('delta', { source, delta, prev, next, viewport, scale, canvas: canvasDebugRef.current }, true);
        return next;
    });
  }, [viewport, scale, isTransitioning]);

  const handlePanStart = useCallback(() => {
    if (panSettleTimerRef.current) {
      window.clearTimeout(panSettleTimerRef.current);
      panSettleTimerRef.current = null;
    }
    setIsPanSettling(false);
    setIsPanActive(true);
    logPanEvent('start', { source: 'canvas', canvas: canvasDebugRef.current });
  }, []);

  const handlePanEnd = useCallback(() => {
    setIsPanActive(false);
    setIsPanSettling(true);
    logPanEvent('end', { source: 'canvas', canvas: canvasDebugRef.current });
    if (panSettleTimerRef.current) {
      window.clearTimeout(panSettleTimerRef.current);
    }
    panSettleTimerRef.current = window.setTimeout(() => {
      setIsPanSettling(false);
      panSettleTimerRef.current = null;
    }, 350);
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
    setSelectedContextId(null);
    setSelectedFilter(null);
    selectWindow(id);
  }, [selectWindow]);

  const handleNavigate = useCallback((newPanX: number, newPanY: number) => {
      setPanOffsetWithLog({ x: newPanX, y: newPanY }, 'minimap');
  }, [setPanOffsetWithLog]);

  const handleContextSelect = useCallback((ctx: ContextDef) => {
      setActiveView('spatial');
      setActiveContextId(ctx.id);
      setSelectedContextId(ctx.id);
      setSelectedWindowId(null);
      setSelectedFilter(null);
      setPendingContextFocusId(ctx.id);
  }, [setActiveContextId, setActiveView]);

  const handleAutoLayout = useCallback(() => {
    resetLayout();
    setTimeout(() => focusContext('global'), 10);
  }, [resetLayout, focusContext]);

  const handleFocusWindow = useCallback((id: string) => {
      setSelectedWindowId(id);
      setSelectedContextId(null);
      setSelectedFilter(null);
      
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
          const safeViewport = getHudSafeViewport();
          const scaleX = safeViewport.safeWidth / (win.w * fitPadding);
          const scaleY = safeViewport.safeHeight / (win.h * fitPadding);
          
          let targetScale = Math.min(scaleX, scaleY);
          targetScale = Math.max(0.5, Math.min(targetScale, 1.2));

          const winCenterX = win.x + (win.w / 2);
          const winCenterY = win.y + (win.h / 2);

          const targetPanX = (safeViewport.centerX / targetScale) - winCenterX;
          const targetPanY = (safeViewport.centerY / targetScale) - winCenterY;

          setScale(targetScale);
          setPanOffsetWithLog({ x: targetPanX, y: targetPanY }, 'focusWindow');

          setTimeout(() => setIsTransitioning(false), 750);
      }
  }, [focusWindowInContext, activeView, getHudSafeViewport, setActiveView, setPanOffsetWithLog]);

  const handleContextZoneSelect = useCallback((contextId: string) => {
      setSelectedContextId(contextId);
      setSelectedWindowId(null);
      setSelectedFilter(null);
  }, []);

  const handleViewSelect = useCallback((view: ViewMode) => {
      setActiveView(view);
      setSelectedFilter({ kind: 'view', id: view });
      setSelectedWindowId(null);
      setSelectedContextId(null);
  }, [setActiveView]);

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
- Scope Query: ${namespaceQuery}
- Active View Mode: ${activeView.toUpperCase()}
`;
  }, [activeView, namespaceQuery]);

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
      const viewScope = activeView !== 'spatial' ? ` | ${activeView.toUpperCase()}` : '';
      const scope = `${namespaceQuery}${viewScope}`;
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
    { id: 'view-term', label: 'View: Terminal Grid', action: () => handleViewSelect('terminals'), icon: <Terminal size={16} /> },
    { id: 'view-code', label: 'View: Editor Grid', action: () => handleViewSelect('editors'), icon: <Code size={16} /> },
    { id: 'view-vis', label: 'View: Visual Grid', action: () => handleViewSelect('visuals'), icon: <LayoutGrid size={16} /> },
  ];

  const isCompactMode = isTerminalOpen || isVoiceConnected;
  const scopedWindows = useMemo(() => {
    return windows.filter(win => matchesNamespace(namespaceQuery, win.namespace));
  }, [windows, namespaceQuery]);
  const isScoped = namespaceQuery !== DEFAULT_NAMESPACE_QUERY;
  const isFilterActive = isScoped || activeView !== 'spatial';
  const canRestoreDefaults = activeContextId !== 'global';
  const isScopeEmpty = isScoped && scopedWindows.length === 0;
  const shouldShowZones = !isPanActive && !isPanSettling;
  const visibleZones = useMemo(() => {
    if (activeView !== 'spatial') return [];
    if (activeContextId === 'global') {
      return isScoped ? [] : contexts.filter(ctx => ctx.id !== 'global');
    }
    return contexts.filter(ctx => ctx.id === activeContextId);
  }, [activeView, activeContextId, contexts, isScoped]);
  const contextSizes = useMemo(() => {
    const sizes: Record<string, { width: number; height: number }> = {};
    contexts.forEach(ctx => {
      if (ctx.id === 'global') return;
      let width = 1220;
      let height = 800;
      if (ctx.id === 'dev') { width = 1220; height = 620; }
      if (ctx.id === 'design') { width = 1220; height = 770; }
      if (ctx.id === 'ops') { width = 1220; height = 770; }
      if (ctx.id === 'studio') { width = 1220; height = 720; }
      sizes[ctx.id] = { width, height };
    });
    return sizes;
  }, [contexts]);

  return (
    <>
      <HUDFrame 
        panOffset={panOffset} 
        scale={scale} 
        onPan={handlePan} 
        onZoom={handleZoom}
        onPanStart={handlePanStart}
        onPanEnd={handlePanEnd}
        isTransitioning={isTransitioning}
        activeContextId={activeContextId}
        filterActive={isFilterActive}
        onCanvasDebug={handleCanvasDebug}
        onViewportChange={handleViewportChange}
        hud={
          <>
            <ContextBar 
                contexts={contexts} 
                activeContextId={activeContextId} 
                onSelect={handleContextSelect}
                namespaceQuery={namespaceQuery}
                onNamespaceQueryChange={setNamespaceQuery}
                logsOpen={isLogDockOpen}
                onToggleLogs={() => setIsLogDockOpen(prev => !prev)}
            />

            <ScreenDraggable
                initialRight={24}
                initialTop={112}
                storageKey="hud:context-dock:top"
                className="z-[70]"
            >
              <ContextDock 
                  activeView={activeView}
                  onSelectView={handleViewSelect}
                  activeThreads={activeThreads}
                  isFixed={false}
                  orientation="horizontal"
              />
            </ScreenDraggable>
            
            <ContextManifest 
                activeContextId={activeContextId} 
                windows={scopedWindows}
                tasks={tasks} 
                contextLabel={contexts.find(c => c.id === activeContextId)?.label || 'CUSTOM'}
                onItemClick={handleFocusWindow}
                onDiscuss={handleDiscussTask} // Wired up
                namespaceQuery={namespaceQuery}
                activeView={activeView}
                contexts={contexts}
                contextSizes={contextSizes}
                selectedWindowId={selectedWindowId}
                selectedContextId={selectedContextId}
                selectedFilter={selectedFilter}
                hudLogs={hudLogs}
                canvasDebug={canvasDebug}
                panOffset={panOffset}
                scale={scale}
                forceDebug={isLogDockOpen}
            />

            <InspectorPanel
                windows={windows}
                selectedWindowId={selectedWindowId}
                selectedContextId={selectedContextId}
                selectedFilter={selectedFilter}
                namespaceQuery={namespaceQuery}
                activeView={activeView}
                activeContextId={activeContextId}
                contexts={contexts}
                contextSizes={contextSizes}
                canvasDebug={canvasDebug}
                panOffset={panOffset}
                scale={scale}
            />
            
            {/* Enhanced Sector Locator */}
            {activeView === 'spatial' && scopedWindows.length > 0 && (
              <SectorLocator 
                windows={scopedWindows} 
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
                        windows={scopedWindows} 
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
                          <button
                            onClick={handleAutoLayout}
                            className="px-2 h-full flex items-center justify-center text-[10px] font-mono font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors border-r border-neutral-800"
                            title="Recenter & reset layout"
                          >
                            {Math.round(scale * 100)}%
                          </button>
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
                activeScope={namespaceQuery}
            >
                <ChatInterface 
                  messages={messages} 
                  onSendMessage={handleTextSendMessage} 
                                  isLoading={isProcessing} 
                                  isConnected={isVoiceConnected}
                                  transcripts={transcripts}
                                  isActive={isTerminalOpen}
                                  activeScope={namespaceQuery}
                                  onRequireAuth={checkAuth}
                                />
                             </TerminalDrawer>
            <StatusBar 
                panOffset={panOffset} 
                scale={scale} 
                viewport={viewport}
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

            {isScopeEmpty && (
                <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 fade-in duration-500 pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-2 shadow-inner">
                            <Power size={24} className="text-neutral-500" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white tracking-tight mb-1">System Offline</h2>
                            <p className="text-neutral-400 text-xs font-mono max-w-[200px]">
                                No active modules found for <span className="text-emerald-500">{namespaceQuery}</span>.
                            </p>
                        </div>
                        {canRestoreDefaults && (
                            <button 
                                onClick={() => restoreContextDefaults(activeContextId)}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm tracking-wide rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-2"
                            >
                                Initialize Protocol
                            </button>
                        )}
                    </div>
                </div>
            )}
          </>
        }
      >
          {visibleZones.map(ctx => {
              const size = contextSizes[ctx.id] || { width: 1220, height: 800 };

              return (
                  <ContextZone 
                      key={ctx.id} 
                      context={ctx} 
                      isActive={activeContextId === 'global' || activeContextId === ctx.id}
                      isSelected={selectedContextId === ctx.id}
                      isVisible={shouldShowZones}
                      width={size.width}
                      height={size.height}
                      onSelect={handleContextZoneSelect}
                      panOffset={panOffset}
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
