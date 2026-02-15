import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';

// Chrome components (HUD frame/shell)
import {
  HUDFrame,
  NavigationStack,
  ContextManifest,
  InspectorPanel,
  StatusBar,
  CommandDock,
  ZoomControls,
  VoiceControl,
  type ContextDef,
  type ViewMode
} from './components/chrome';

// Canvas components (spatial workspace)
import {
  DraggableWindow,
  ContextZone,
  type CanvasDebugState
} from './components/canvas';

// Overlay components (modals/drawers/palettes)
import {
  CommandPalette,
  TerminalDrawer,
  WelcomeModal,
  type CommandOption
} from './components/overlays';

// Shared components (reusable UI)
import { ChatInterface, TaskManager } from './components/shared';

// Tool registry and types
import { getToolComponent } from './components/tools/registry';
import type { DitherSettings } from './components/tools/DitherTool';
import type { TextSource } from './components/tools/TextLab';

import { useHud } from './contexts/HudContext';
import { INITIAL_SYSTEM_INSTRUCTION, HUD_TOOLS } from './constants';
import { useLiveSession } from './hooks/useLiveSession';
import { matchesNamespace, DEFAULT_NAMESPACE_QUERY } from './lib/namespace';
import { logPanEvent, HUD_PAN_EVENT, HudLogEntry } from './lib/hudLogger';
import { thock, blipDown, whoosh, pop, slideIn, slideOut, click, sounds, preview, isMuted, setMuted, type SoundName } from './lib/sounds';
import type { WindowState } from './types';
import {
  Terminal,
  Code,
  Globe,
  LayoutGrid,
  Power,
  Mic,
  PanelLeft,
  PanelRight
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
  const [isMinimapCollapsed, setIsMinimapCollapsed] = useState(false);
  const [isManifestCollapsed, setIsManifestCollapsed] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<{ kind: 'view'; id: ViewMode } | null>(null);
  const [isPanActive, setIsPanActive] = useState(false);
  const [isPanSettling, setIsPanSettling] = useState(false);
  const [pendingContextFocusId, setPendingContextFocusId] = useState<string | null>(null);
  const [isOverviewMode, setIsOverviewMode] = useState(true); // Start in overview mode
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('hud_welcomed'));
  const [hudLogs, setHudLogs] = useState<HudLogEntry[]>([]);
  const [canvasDebug, setCanvasDebug] = useState<CanvasDebugState | null>(null);
  const canvasDebugRef = useRef<CanvasDebugState | null>(null);
  const panOffsetRef = useRef(panOffset);
  const scaleRef = useRef(scale);
  const viewportRef = useRef(viewport);
  const panSettleTimerRef = useRef<number | null>(null);
  const focusDebugTimerRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);
  
  // Transition State
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Dither Tool State
  const [ditherSettings, setDitherSettings] = useState<DitherSettings>({
    pixelSize: 4,
    palette: 'grayscale',
    algorithm: 'ordered',
    contrast: 1,
    brightness: 0
  });

  // Text Lab State
  const [textSources, setTextSources] = useState<TextSource[]>([
    {
      id: 'code',
      type: 'code',
      label: 'utils.js',
      content: `// Utility functions for data processing
function processData(items) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.active === true) {
      if (item.value > 0) {
        results.push({
          id: item.id,
          name: item.name,
          value: item.value * 2
        });
      }
    }
  }
  return results;
}

function formatCurrency(amount) {
  return '$' + amount.toFixed(2);
}

function validateEmail(email) {
  if (email.indexOf('@') > -1) {
    return true;
  }
  return false;
}`
    },
    {
      id: 'email',
      type: 'email',
      label: 'draft.txt',
      content: `Subject: Quick update on the project

Hey team,

Just wanted to give you a quick update. Things are going pretty good I think. We finished the main features yesterday and the testing is almost done.

There's still some bugs we need to fix but nothing too bad. The client meeting is on Thursday so we should be ready by then hopefully.

Let me know if you have any questions or whatever.

Thanks,
Alex`
    }
  ]);
  const [activeTextSourceId, setActiveTextSourceId] = useState('code');

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
    addWindow,
    restoreContextDefaults,
    selectWindow,
    focusWindow: focusWindowInContext,
    resetLayout,
    checkAuth,
    getSyntheticLayout,
    addLocalMessage
  } = useHud();

  // Context zone sizes (used by findNearestContext and other components)
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

  // -- Effects --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            pop();
            setIsCmdPaletteOpen(prev => !prev);
        }
        if (e.ctrlKey && e.key === '`') {
            e.preventDefault();
            setIsTerminalOpen(prev => {
              if (prev) slideOut(); else slideIn();
              return !prev;
            });
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

  // Initial mount effect to show "view all" state
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Small delay to let layout settle
    const timer = setTimeout(() => {
      focusContext('global');
      setIsOverviewMode(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [focusContext]);

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

  // Find nearest context zone to a screen coordinate
  const findNearestContext = useCallback((screenX: number, screenY: number) => {
    const safeViewport = getHudSafeViewport();
    // Convert screen coords to world coords
    const worldX = (screenX - safeViewport.centerX) / scale - panOffset.x;
    const worldY = (screenY - safeViewport.centerY) / scale - panOffset.y;

    // Find nearest context zone center
    let nearestCtx: ContextDef | null = null;
    let minDist = Infinity;

    contexts.forEach(ctx => {
      if (ctx.id === 'global') return;
      const size = contextSizes[ctx.id];
      if (!size) return;
      const centerX = ctx.x + size.width / 2;
      const centerY = ctx.y + size.height / 2;
      const dist = Math.hypot(worldX - centerX, worldY - centerY);
      if (dist < minDist) {
        minDist = dist;
        nearestCtx = ctx;
      }
    });

    return nearestCtx;
  }, [scale, panOffset, contexts, contextSizes, getHudSafeViewport]);

  const handleZoom = useCallback((newScale: number, panAdjust?: { x: number; y: number }) => {
      setIsOverviewMode(false); // Exit overview mode on manual zoom
      setScale(newScale);
      if (panAdjust) {
        setPanOffset(prev => ({
          x: prev.x + panAdjust.x,
          y: prev.y + panAdjust.y
        }));
      }
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
    thock();
    setSelectedWindowId(id);
    setSelectedContextId(null);
    setSelectedFilter(null);
    selectWindow(id);
  }, [selectWindow]);

  const handleNavigate = useCallback((newPanX: number, newPanY: number) => {
      setPanOffsetWithLog({ x: newPanX, y: newPanY }, 'minimap');
  }, [setPanOffsetWithLog]);

  const handleContextSelect = useCallback((ctx: ContextDef) => {
      whoosh();
      setIsOverviewMode(false); // Exit overview mode when selecting a context
      setActiveView('spatial');
      setActiveContextId(ctx.id);
      setSelectedContextId(ctx.id);
      setSelectedWindowId(null);
      setSelectedFilter(null);
      setPendingContextFocusId(ctx.id);
  }, [setActiveContextId, setActiveView]);

  // Canvas click handler
  // - Overview mode: zoom into nearest context zone
  // - Normal mode: deselect current focus (stay in place)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isOverviewMode) {
      const nearest = findNearestContext(e.clientX, e.clientY);
      if (nearest) {
        setIsOverviewMode(false);
        handleContextSelect(nearest);
      }
      return;
    }

    // Only deselect if something is actually selected
    const hasSelection = selectedWindowId || selectedContextId || selectedFilter || activeView !== 'spatial';
    if (hasSelection) {
      setSelectedWindowId(null);
      setSelectedContextId(null);
      setSelectedFilter(null);
      if (activeView !== 'spatial') {
        setActiveView('spatial');
      }
    }
  }, [isOverviewMode, findNearestContext, handleContextSelect, activeView, setActiveView, selectedWindowId, selectedContextId, selectedFilter]);

  const handleAutoLayout = useCallback(() => {
    resetLayout();
    setTimeout(() => {
      focusContext('global');
      setIsOverviewMode(true);
    }, 10);
  }, [resetLayout, focusContext]);

  const handleFocusWindow = useCallback((id: string) => {
      console.log('[HUD] focusWindow triggered', { id });
      thock();
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

      const win = windows.find(w => w.id === id);
      if (!win) return;

      // If already expanded, minimize back to original size
      if (win.preExpandSize) {
          console.log('[HUD] minimizing window', { id, restoreTo: win.preExpandSize });
          updateWindow(id, { w: win.preExpandSize.w, h: win.preExpandSize.h, preExpandSize: undefined });
          return;
      }

      // Save original size, then expand
      selectWindow(id);
      setIsTransitioning(true);
      const safeViewport = getHudSafeViewport();
      const padX = 80;
      const padTop = 80;
      const padBottom = 60;

      const targetW = Math.round(safeViewport.safeWidth - padX * 2);
      const targetH = Math.round(safeViewport.safeHeight - padTop - padBottom);
      console.log('[HUD] expanding window', { id, from: { w: win.w, h: win.h }, to: { w: targetW, h: targetH } });
      updateWindow(id, { w: targetW, h: targetH, preExpandSize: { w: win.w, h: win.h } });

      const winCenterX = win.x + (targetW / 2);
      const winCenterY = win.y + (targetH / 2);
      const targetPanX = safeViewport.centerX - winCenterX;
      const targetPanY = safeViewport.centerY - winCenterY + (padTop - padBottom) / 2;

      setScale(1);
      setPanOffsetWithLog({ x: targetPanX, y: targetPanY }, 'focusWindow');

      setTimeout(() => setIsTransitioning(false), 750);
  }, [windows, activeView, getHudSafeViewport, setActiveView, setPanOffsetWithLog, updateWindow, selectWindow]);

  const handleContextZoneSelect = useCallback((contextId: string) => {
      setSelectedContextId(contextId);
      setSelectedWindowId(null);
      setSelectedFilter(null);
  }, []);

  const handleViewSelect = useCallback((view: ViewMode) => {
      click();
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

  // -- Dither Tool Helper --
  const openDitherTool = useCallback(() => {
    const existingDither = windows.find(w => w.type === 'dither');
    if (existingDither) {
      handleFocusWindow(existingDither.id);
      return;
    }
    const newWindow: WindowState = {
      id: `dither-${Date.now()}`,
      title: 'Dither Lab',
      type: 'dither',
      x: 200 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      w: 450,
      h: 380,
      zIndex: windows.length + 1,
      contextId: activeContextId,
      namespace: namespaceQuery,
      tags: ['creative', 'visual']
    };
    addWindow(newWindow);
    setTimeout(() => handleFocusWindow(newWindow.id), 50);
  }, [windows, addWindow, activeContextId, namespaceQuery, handleFocusWindow]);

  // -- Text Lab Helpers --
  const openTextLab = useCallback(() => {
    const existingLab = windows.find(w => w.type === 'textlab');
    if (existingLab) {
      handleFocusWindow(existingLab.id);
      return;
    }
    const newWindow: WindowState = {
      id: `textlab-${Date.now()}`,
      title: 'Text Lab',
      type: 'textlab',
      x: 250 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      w: 550,
      h: 450,
      zIndex: windows.length + 1,
      contextId: activeContextId,
      namespace: namespaceQuery,
      tags: ['editor', 'creative']
    };
    addWindow(newWindow);
    setTimeout(() => handleFocusWindow(newWindow.id), 50);
  }, [windows, addWindow, activeContextId, namespaceQuery, handleFocusWindow]);

  const handleAcceptTextChange = useCallback((sourceId: string) => {
    setTextSources(prev => prev.map(s =>
      s.id === sourceId && s.pendingContent
        ? { ...s, content: s.pendingContent, pendingContent: undefined }
        : s
    ));
  }, []);

  const handleRejectTextChange = useCallback((sourceId: string) => {
    setTextSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, pendingContent: undefined } : s
    ));
  }, []);

  const handleTextContentUpdate = useCallback((sourceId: string, content: string) => {
    setTextSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, content } : s
    ));
  }, []);

  const proposeTextEdit = useCallback((sourceId: string, newContent: string) => {
    setTextSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, pendingContent: newContent } : s
    ));
    setActiveTextSourceId(sourceId);
  }, []);

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
          case 'set_view': {
              const view = args.view;
              if (['spatial', 'terminals', 'editors', 'visuals'].includes(view)) {
                  setActiveView(view);
                  return { result: `View changed to ${view}` };
              }
              return { error: 'Invalid view mode' };
          }
          case 'zoom': {
              const level = Math.max(0.2, Math.min(3, args.level));
              setScale(level);
              return { result: `Zoom set to ${Math.round(level * 100)}%` };
          }
          case 'toggle_terminal': {
              if (args.open !== undefined) {
                  setIsTerminalOpen(args.open);
              } else {
                  setIsTerminalOpen(prev => !prev);
              }
              return { result: args.open !== undefined ? (args.open ? 'Terminal opened' : 'Terminal closed') : 'Terminal toggled' };
          }
          case 'open_command_palette': {
              setIsCmdPaletteOpen(true);
              return { result: 'Command palette opened' };
          }
          case 'create_window': {
              const newWindow: WindowState = {
                  id: `${args.type}-${Date.now()}`,
                  title: args.title || args.type.charAt(0).toUpperCase() + args.type.slice(1),
                  type: args.type,
                  x: 100 + Math.random() * 200,
                  y: 100 + Math.random() * 200,
                  w: 400,
                  h: 300,
                  zIndex: windows.length + 1,
                  contextId: args.contextId || activeContextId,
                  namespace: namespaceQuery,
                  tags: []
              };
              addWindow(newWindow);
              return { result: `Created ${args.type} window: ${newWindow.id}` };
          }
          case 'close_window': {
              const winId = args.windowId;
              const win = windows.find(w => w.id === winId);
              if (win) {
                  closeWindow(winId);
                  return { result: `Closed window ${winId}` };
              }
              return { error: 'Window not found' };
          }
          case 'list_windows': {
              const windowList = windows.map(w => ({
                  id: w.id,
                  title: w.title,
                  type: w.type,
                  context: w.contextId || 'global'
              }));
              return { result: windowList };
          }
          case 'view_all': {
              focusContext('global');
              setIsOverviewMode(true);
              return { result: 'View reset to show all windows' };
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
          case 'open_dither_tool': {
              openDitherTool();
              return { result: 'Dither tool opened' };
          }
          case 'set_dither_settings': {
              const updates: Partial<DitherSettings> = {};
              if (args.pixelSize !== undefined) updates.pixelSize = Math.max(1, Math.min(16, args.pixelSize));
              if (args.palette !== undefined) updates.palette = args.palette;
              if (args.algorithm !== undefined) updates.algorithm = args.algorithm;
              if (args.contrast !== undefined) updates.contrast = Math.max(0.5, Math.min(2, args.contrast));
              if (args.brightness !== undefined) updates.brightness = Math.max(-0.5, Math.min(0.5, args.brightness));

              setDitherSettings(prev => ({ ...prev, ...updates }));

              const changedKeys = Object.keys(updates);
              return { result: `Dither settings updated: ${changedKeys.join(', ')}` };
          }
          case 'open_text_lab': {
              openTextLab();
              return { result: 'Text Lab opened' };
          }
          case 'get_text': {
              const source = textSources.find(s => s.id === args.source);
              if (source) {
                  return { result: { content: source.content, type: source.type, label: source.label } };
              }
              return { error: `Source not found: ${args.source}` };
          }
          case 'propose_edit': {
              const source = textSources.find(s => s.id === args.source);
              if (source) {
                  proposeTextEdit(args.source, args.newContent);
                  openTextLab(); // Make sure TextLab is visible
                  return { result: `Proposed changes to ${source.label}. User can now review the diff and accept or reject.` };
              }
              return { error: `Source not found: ${args.source}` };
          }
          case 'apply_edit': {
              const source = textSources.find(s => s.id === args.source);
              if (source?.pendingContent) {
                  handleAcceptTextChange(args.source);
                  return { result: `Changes applied to ${source.label}` };
              }
              return { error: 'No pending changes to apply' };
          }
          case 'switch_text_source': {
              setActiveTextSourceId(args.source);
              return { result: `Switched to ${args.source}` };
          }
          default:
              return { error: 'Unknown tool' };
      }
  }, [handleContextSelect, handleFocusWindow, createTask, completeTask, windows, contexts, addWindow, closeWindow, activeContextId, namespaceQuery, focusContext, setDitherSettings, openDitherTool, openTextLab, textSources, proposeTextEdit, handleAcceptTextChange]);

  const systemInstruction = useMemo(() => {
     return `
${INITIAL_SYSTEM_INSTRUCTION}
CURRENT HUD ENVIRONMENT:
- Scope Query: ${namespaceQuery}
- Active View Mode: ${activeView.toUpperCase()}
`;
  }, [activeView, namespaceQuery]);

  const { connect: connectVoice, disconnect: disconnectVoice, isConnected: isVoiceConnected, transcripts, sendText: sendVoiceText } = useLiveSession({
    onToolCall: handleToolCall,
    systemInstruction,
    tools: HUD_TOOLS
  });

  const toggleVoice = () => {
      if (!checkAuth()) return;
      if (isVoiceConnected) disconnectVoice();
      else connectVoice();
  };

  // Auto-connect voice after API key activation, then greet
  useEffect(() => {
    const handler = () => {
      setTimeout(async () => {
        await connectVoice();
        // Give the session a moment to fully open, then prompt a welcome
        setTimeout(() => {
          sendVoiceText('You just activated for the first time. Say a brief, warm welcome to HUD — keep it short and natural, one sentence.');
        }, 2000);
      }, 300);
    };
    window.addEventListener('hud:voice-activate', handler);
    return () => window.removeEventListener('hud:voice-activate', handler);
  }, [connectVoice, sendVoiceText]);

  const soundNames = Object.keys(sounds) as SoundName[];

  const handleTextSendMessage = (text: string) => {
      const trimmed = text.trim().toLowerCase();

      // /sounds — list all sounds
      if (trimmed === '/sounds' || trimmed === '/sound') {
        addLocalMessage('user', text);
        const muteState = isMuted() ? 'MUTED' : 'UNMUTED';
        const listing = soundNames.map(name => {
          const descs: Record<SoundName, string> = {
            click: 'button press, toggle',
            thock: 'window focus, panel open',
            blipUp: 'task complete, success',
            blipDown: 'dismiss, close, undo',
            pop: 'tooltip, hover reveal',
            confirm: 'save, commit',
            error: 'validation fail',
            whoosh: 'context switch, transition',
            chime: 'activation, welcome',
            tick: 'checkbox, step progress',
            slideIn: 'drawer open, expand',
            slideOut: 'drawer close, collapse',
            boot: 'system init',
            ping: 'notification, alert',
            type: 'keyboard keystroke',
          };
          return `  /sounds play ${name.padEnd(10)} — ${descs[name]}`;
        }).join('\n');
        addLocalMessage('system', `SOUND_ENGINE [${muteState}]\n\n${listing}\n\n  /sounds play <name>    preview a sound\n  /sounds on             unmute sounds\n  /sounds off            mute sounds`);
        return;
      }

      // /sounds play <name> — preview a sound
      const playMatch = trimmed.match(/^\/sounds?\s+play\s+(\w+)$/);
      if (playMatch) {
        const name = playMatch[1] as SoundName;
        addLocalMessage('user', text);
        if (name in sounds) {
          preview(name);
          addLocalMessage('system', `▶ ${name}`);
        } else {
          addLocalMessage('system', `Unknown sound: ${name}\nAvailable: ${soundNames.join(', ')}`);
        }
        return;
      }

      // /sounds on|off — mute toggle
      if (trimmed === '/sounds on') {
        addLocalMessage('user', text);
        setMuted(false);
        addLocalMessage('system', 'SOUND_ENGINE UNMUTED — UI sounds are now active');
        return;
      }
      if (trimmed === '/sounds off') {
        addLocalMessage('user', text);
        setMuted(true);
        addLocalMessage('system', 'SOUND_ENGINE MUTED');
        return;
      }

      const viewScope = activeView !== 'spatial' ? ` | ${activeView.toUpperCase()}` : '';
      const scope = `${namespaceQuery}${viewScope}`;
      sendMessage(text, scope);
  };

  const ToolLoader = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-neutral-500 text-xs font-mono animate-pulse">Loading module...</div>
    </div>
  );

  const getToolProps = useCallback((win: WindowState) => {
    const type = win.type || win.id;
    switch (type) {
      case 'dither':
        return { settings: ditherSettings, onSettingsChange: setDitherSettings };
      case 'textlab':
        return {
          sources: textSources,
          activeSourceId: activeTextSourceId,
          onSourceChange: setActiveTextSourceId,
          onAcceptChange: handleAcceptTextChange,
          onRejectChange: handleRejectTextChange,
          onContentUpdate: handleTextContentUpdate
        };
      default:
        return {};
    }
  }, [ditherSettings, textSources, activeTextSourceId, handleAcceptTextChange, handleRejectTextChange, handleTextContentUpdate]);

  const renderWindowContent = (win: WindowState) => {
    const type = win.type || win.id;

    // Special case: Index navigation card
    if (type === 'index') {
      return (
        <div className="flex flex-col h-full overflow-auto p-4 gap-3">
          <div className="text-[10px] text-neutral-500 tracking-widest uppercase font-mono">Workspaces</div>
          {contexts.filter(c => c.id !== 'global').map(ctx => {
            const ctxWindows = windows.filter(w => w.contextId === ctx.id);
            return (
              <button
                key={ctx.id}
                onClick={() => handleContextSelect(ctx)}
                className="text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: ctx.color }} />
                  <span className="text-[11px] font-bold tracking-widest uppercase group-hover:text-white transition-colors" style={{ color: ctx.color }}>
                    {ctx.label}
                  </span>
                  <span className="text-[9px] text-neutral-600 font-mono">{ctxWindows.length}</span>
                </div>
                <div className="pl-3.5 flex flex-col gap-0.5">
                  {ctxWindows.map(w => (
                    <div
                      key={w.id}
                      onClick={(e) => { e.stopPropagation(); handleFocusWindow(w.id); }}
                      className="text-[10px] text-neutral-500 hover:text-white transition-colors cursor-pointer py-0.5 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-neutral-700" />
                      {w.title}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
          <div className="mt-auto pt-3 border-t border-neutral-800/50">
            <div className="text-[9px] text-neutral-600 font-mono leading-relaxed">
              {windows.length} modules · {contexts.filter(c => c.id !== 'global').length} zones
            </div>
          </div>
        </div>
      );
    }

    // Special case: TaskManager for tasks/terminal windows
    if (type === 'tasks' || type === 'terminal') {
      return <TaskManager tasks={tasks} onComplete={completeTask} />;
    }

    // Use registry for all other tools
    const Tool = getToolComponent(type);
    if (!Tool) {
      return <div className="p-4 text-neutral-500">Unknown module: {type}</div>;
    }

    return (
      <Suspense fallback={<ToolLoader />}>
        <Tool {...getToolProps(win)} />
      </Suspense>
    );
  };

  const commandList: CommandOption[] = [
    { id: 'toggle-term', label: 'Toggle Terminal', action: () => setIsTerminalOpen(p => !p), icon: <Terminal size={16} />, shortcut: 'Ctrl+`' },
    { id: 'toggle-voice', label: 'Toggle Voice Mode', action: toggleVoice, icon: <Mic size={16} /> },
    { id: 'open-dither', label: 'Open Dither Lab', action: openDitherTool, icon: <LayoutGrid size={16} /> },
    { id: 'open-textlab', label: 'Open Text Lab', action: openTextLab, icon: <Code size={16} /> },
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
  const viewTypeMap: Record<string, string[]> = { terminals: ['terminal'], editors: ['editor'], visuals: ['visual'] };
  const viewWindowCount = activeView === 'spatial' ? scopedWindows.length : scopedWindows.filter(w => viewTypeMap[activeView]?.includes(w.type)).length;
  const isViewEmpty = activeView !== 'spatial' && viewWindowCount === 0;
  const shouldShowZones = !isPanActive && !isPanSettling;
  const visibleZones = useMemo(() => {
    if (activeView !== 'spatial') return [];
    if (activeContextId === 'global') {
      return isScoped ? [] : contexts.filter(ctx => ctx.id !== 'global');
    }
    return contexts.filter(ctx => ctx.id === activeContextId);
  }, [activeView, activeContextId, contexts, isScoped]);

  // ARCHITECTURE: Chrome vs Content
  // 
  // CHROME (structural framework - always present):
  // - HUDFrame, NavigationStack, ContextManifest, InspectorPanel, StatusBar, etc.
  // - Fixed viewport positioning, provides infrastructure
  //
  // CONTENT (user-created instances - dynamic):
  // - DraggableWindow components containing tool instances
  // - World-space positioned, can be created/destroyed
  // - Each window is an instantiation of a tool from the registry
  //
  // See ARCHITECTURE.md for detailed explanation.

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
        onCanvasClick={handleCanvasClick}
        hud={
          <>
            <NavigationStack
                contexts={contexts}
                activeContextId={activeContextId}
                onContextSelect={handleContextSelect}
                onResetToGlobal={handleAutoLayout}
                namespaceQuery={namespaceQuery}
                onNamespaceQueryChange={setNamespaceQuery}
            />
            
            {!isManifestCollapsed && (
              <ContextManifest
                  activeContextId={activeContextId}
                  windows={scopedWindows}
                  tasks={tasks}
                  contextLabel={contexts.find(c => c.id === activeContextId)?.label || 'CUSTOM'}
                  onItemClick={handleFocusWindow}
                  onDiscuss={handleDiscussTask}
                  namespaceQuery={namespaceQuery}
                  activeView={activeView}
                  onSelectView={handleViewSelect}
                  activeThreads={activeThreads}
                  contexts={contexts}
                  contextSizes={contextSizes}
                  selectedWindowId={selectedWindowId}
                  selectedContextId={selectedContextId}
                  selectedFilter={selectedFilter}
                  hudLogs={hudLogs}
                  canvasDebug={canvasDebug}
                  panOffset={panOffset}
                  scale={scale}
                  forceDebug={false}
                  logsExpanded={isLogDockOpen}
                  onToggleLogs={() => setIsLogDockOpen(prev => !prev)}
                  isCollapsed={isManifestCollapsed}
                  onToggleCollapse={() => setIsManifestCollapsed(prev => !prev)}
                  viewport={viewport}
                  onNavigate={handleNavigate}
                  onViewAll={() => {
                    focusContext('global');
                    setIsOverviewMode(true);
                  }}
                  onOpenWelcome={() => setShowWelcome(true)}
              />
            )}

            {/* Collapsed Manifest Toggle */}
            {isManifestCollapsed && (
              <button
                onClick={() => setIsManifestCollapsed(false)}
                className="fixed top-[56px] left-2 z-40 p-2 bg-black/90 backdrop-blur-xl border border-neutral-800 rounded-lg hover:bg-white/10 transition-colors pointer-events-auto"
                title="Expand sidebar"
              >
                <PanelLeft size={16} className="text-neutral-400" />
              </button>
            )}

            {!isInspectorCollapsed && (
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
                  isCollapsed={isInspectorCollapsed}
                  onToggleCollapse={() => setIsInspectorCollapsed(prev => !prev)}
                  isVoiceConnected={isVoiceConnected}
                  transcripts={transcripts}
              />
            )}

            {/* Collapsed Inspector Toggle */}
            {isInspectorCollapsed && (
              <button
                onClick={() => setIsInspectorCollapsed(false)}
                className="fixed top-[56px] right-2 z-40 p-2 bg-black/90 backdrop-blur-xl border border-neutral-800 rounded-lg hover:bg-white/10 transition-colors pointer-events-auto"
                title="Expand inspector"
              >
                <PanelRight size={16} className="text-neutral-400" />
              </button>
            )}
            
            {/* Zoom Controls - floating on canvas bottom-right */}
            <ZoomControls
              scale={scale}
              onZoomIn={() => setScale(s => Math.min(3, s + 0.2))}
              onZoomOut={() => setScale(s => Math.max(0.2, s - 0.2))}
            />

            {/* Canvas Toolbar - floating top-right: voice, cmd palette, help */}
            <VoiceControl
              isConnected={isVoiceConnected}
              onToggle={toggleVoice}
              onOpenCommandPalette={() => { pop(); setIsCmdPaletteOpen(true); }}
            />

            {!isCompactMode && (
              <CommandDock
                  onOpenCommandPalette={() => { pop(); setIsCmdPaletteOpen(true); }}
                  onToggleVoice={toggleVoice}
                  onToggleTerminal={() => setIsTerminalOpen(p => { if (p) slideOut(); else slideIn(); return !p; })}
                  isVoiceConnected={isVoiceConnected}
                  isTerminalOpen={isTerminalOpen}
              />
            )}

            <TerminalDrawer 
                isOpen={isTerminalOpen} 
                onClose={() => { slideOut(); setIsTerminalOpen(false); }}
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
                isMinimapCollapsed={isMinimapCollapsed}
                onToggleMinimap={() => setIsMinimapCollapsed(prev => !prev)}
            />

            <CommandPalette
                isOpen={isCmdPaletteOpen}
                onClose={() => setIsCmdPaletteOpen(false)}
                commands={commandList}
            />

            <WelcomeModal
                isOpen={showWelcome}
                onClose={() => setShowWelcome(false)}
            />

            {(isScopeEmpty || isViewEmpty) && (
                <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-xl border border-neutral-800 p-6 rounded-xl flex flex-col items-center gap-3 animate-in zoom-in-95 fade-in duration-500 pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        <p className="text-neutral-400 text-[11px] font-mono max-w-[240px] text-center leading-relaxed">
                            {isViewEmpty
                              ? <>No <span className="text-white font-bold">{activeView}</span> in <span className="text-white font-bold">{contexts.find(c => c.id === activeContextId)?.label || 'this context'}</span></>
                              : <>No modules matching <span className="text-emerald-500">{namespaceQuery}</span></>
                            }
                        </p>
                        <button
                            onClick={() => { setActiveView('spatial'); }}
                            className="px-4 py-1.5 text-[10px] font-bold tracking-wide text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-full transition-all"
                        >
                            Back to Spatial
                        </button>
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

          {/* CONTENT LAYER: User-created tool instances */}
          {/* Each window is a dynamic content instance, not chrome */}
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
                      isExpanded={!!win.preExpandSize}
                      aiThread={activeThread}
                      onMove={handleWindowMove}
                      onResize={handleWindowResize}
                      onSelect={handleWindowSelect}
                      onFocus={handleFocusWindow}
                      onClose={(id) => { blipDown(); closeWindow(id); }}
                      className={'bg-black border border-neutral-600 ring-1 ring-white/[0.04] flex flex-col'}
                  >
                      <div className="h-7 bg-neutral-900 border-b border-neutral-700 flex items-center justify-center px-2 select-none shrink-0">
                          <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">{win.title}</span>
                      </div>
                      <div className="flex-1 min-h-0 overflow-hidden relative">
                          {renderWindowContent(win)}
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
