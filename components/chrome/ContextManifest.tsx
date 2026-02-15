import React, { useEffect, useState, useRef } from 'react';
import { WindowState, Task, AiThread } from '../../types';
import { Check, Activity, Circle, Terminal, MousePointer2, Database, Copy, ClipboardCheck, MessageSquare, Sparkles, ChevronDown, ChevronUp, ChevronRight, Compass, TerminalSquare, FileCode, LayoutGrid, PanelLeftClose, PanelLeft, Layers, Radio, Mic, Search, Key, ExternalLink } from 'lucide-react';
import type { CanvasDebugState } from '../canvas/Canvas';
import { PANEL_STYLES } from '../../lib/hudChrome';
import { ViewMode } from './ContextDock';
import Minimap from '../canvas/Minimap';

interface HudLogEntry {
  id: string;
  label: string;
  tag: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

interface ContextManifestProps {
  activeContextId: string;
  windows: WindowState[];
  tasks?: Task[];
  contextLabel?: string;
  onItemClick?: (id: string) => void;
  onDiscuss?: (taskId: string) => void;
  namespaceQuery: string;
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  activeThreads: AiThread[];
  contexts: { id: string; label: string; color: string; x: number; y: number }[];
  contextSizes: Record<string, { width: number; height: number }>;
  selectedWindowId: string | null;
  selectedContextId: string | null;
  selectedFilter: { kind: 'view'; id: string } | null;
  hudLogs?: HudLogEntry[];
  canvasDebug?: CanvasDebugState | null;
  panOffset?: { x: number; y: number };
  scale?: number;
  forceDebug?: boolean;
  // Collapsible sections
  logsExpanded?: boolean;
  onToggleLogs?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  // Minimap props
  viewport?: { width: number; height: number };
  onNavigate?: (x: number, y: number) => void;
  onViewAll?: () => void;
  onOpenWelcome?: () => void;
}

interface LogItem {
  id: string;
  text: string;
  status: 'pending' | 'loading' | 'done';
  type: 'window' | 'system' | 'task';
}

const SYSTEM_LOGS: Record<string, string[]> = {
  dev: [
    "INIT_KERNEL_DEV",
    "MOUNTING VIRTUAL_FS",
    "STARTING LSP_SERVER",
    "CHECKING GIT_HEAD"
  ],
  design: [
    "INIT_RENDER_ENGINE",
    "LOADING VECTORS",
    "CALIBRATING GRID",
    "FETCHING SCHEMAS"
  ],
  ops: [
    "INIT_SECURE_LINK",
    "CONNECTING CLUSTER",
    "STREAMING METRICS",
    "SYNCING LOG_BUFFER"
  ],
  studio: [
    "INIT_DISPLAY_DRIVER",
    "COMPILING ASSETS",
    "WARMING GPU_CACHE",
    "CONNECTING PREVIEW"
  ]
};

const ContextManifest: React.FC<ContextManifestProps> = ({
  activeContextId,
  windows,
  tasks = [],
  contextLabel,
  onItemClick,
  onDiscuss,
  namespaceQuery,
  activeView,
  onSelectView,
  activeThreads,
  contexts,
  contextSizes,
  selectedWindowId,
  selectedContextId,
  selectedFilter,
  hudLogs = [],
  canvasDebug,
  panOffset,
  scale,
  forceDebug = false,
  logsExpanded = false,
  onToggleLogs,
  isCollapsed = false,
  onToggleCollapse,
  viewport,
  onNavigate,
  onViewAll,
  onOpenWelcome
}) => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [headerText, setHeaderText] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [globalCopySuccess, setGlobalCopySuccess] = useState(false);
  const [stateCopySuccess, setStateCopySuccess] = useState(false);
  const [canvasCopySuccess, setCanvasCopySuccess] = useState(false);

  // Collapsible section states
  const [viewModesExpanded, setViewModesExpanded] = useState(true);
  const [modulesExpanded, setModulesExpanded] = useState(true);
  const [minimapExpanded, setMinimapExpanded] = useState(true);
  const [commsExpanded, setCommsExpanded] = useState(true);
  const [voiceExpanded, setVoiceExpanded] = useState(false);
  
  const logsRef = useRef(logs);
  const windowsRef = useRef(windows);
  const tasksRef = useRef(tasks);
  const activeContextIdRef = useRef(activeContextId);

  logsRef.current = logs;
  windowsRef.current = windows;
  tasksRef.current = tasks;
  activeContextIdRef.current = activeContextId;

  const handleSystemCopy = async () => {
    const currentLogs = logsRef.current;
    const currentWindows = windowsRef.current;
    
    const fullDump = {
        timestamp: new Date().toISOString(),
        context: activeContextIdRef.current,
        system_status: 'ONLINE',
        canvas_snapshot: canvasDebug ? {
            panOffset,
            scale,
            canvas: canvasDebug
        } : null,
        manifest_snapshot: currentLogs.map(l => {
             let data;
             if (l.type === 'window') data = currentWindows.find(w => w.id === l.id);
             else if (l.type === 'task') data = tasksRef.current.find(t => t.id === l.id);
             else data = { _sys_id: l.id, op_code: l.text, state: l.status };

             return { 
                 log_id: l.id, 
                 type: l.type,
                 description: l.text,
                 debug_data: data 
             };
        })
    };
    
    try {
        await navigator.clipboard.writeText(JSON.stringify(fullDump, null, 2));
        setGlobalCopySuccess(true);
        setTimeout(() => setGlobalCopySuccess(false), 2000);
    } catch (err) {
        console.error('Global copy failed', err);
    }
  };

  const handleStateCopy = async () => {
    const selectedWindow = selectedWindowId ? windows.find(win => win.id === selectedWindowId) || null : null;
    const selectedContext = selectedContextId ? contexts.find(ctx => ctx.id === selectedContextId) || null : null;
    const selectionType = selectedWindow ? 'window' : selectedContext ? 'context' : selectedFilter ? 'filter' : 'none';
    const viewLabels: Record<string, string> = {
      spatial: 'Spatial Map',
      terminals: 'Terminal Grid',
      editors: 'Code Grid',
      visuals: 'Visual Grid'
    };
    const snapshot = {
      timestamp: new Date().toISOString(),
      system: {
        namespaceQuery,
        activeView,
        activeContextId,
        panOffset,
        scale
      },
      canvas: canvasDebug
        ? {
            state: canvasState,
            ...canvasDebug
          }
        : null,
      selection: {
        type: selectionType,
        window: selectedWindow
          ? {
              id: selectedWindow.id,
              title: selectedWindow.title,
              namespace: selectedWindow.namespace,
              contextId: selectedWindow.contextId,
              type: selectedWindow.type,
              tags: selectedWindow.tags,
              zIndex: selectedWindow.zIndex,
              position: { x: selectedWindow.x, y: selectedWindow.y },
              size: { w: selectedWindow.w, h: selectedWindow.h }
            }
          : null,
        context: selectedContext
          ? {
              id: selectedContext.id,
              label: selectedContext.label,
              color: selectedContext.color,
              origin: { x: selectedContext.x, y: selectedContext.y },
              size: contextSizes[selectedContext.id] || null
            }
          : null,
        filter: selectedFilter
          ? {
              kind: selectedFilter.kind,
              id: selectedFilter.id,
              label: viewLabels[selectedFilter.id] || selectedFilter.id
            }
          : null
      }
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
      setStateCopySuccess(true);
      setTimeout(() => setStateCopySuccess(false), 1500);
    } catch (err) {
      console.error('State copy failed', err);
    }
  };

  const handleCanvasCopy = async () => {
    if (!canvasDebug) return;
    const payload = {
      timestamp: new Date().toISOString(),
      panOffset,
      scale,
      canvas: canvasDebug
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCanvasCopySuccess(true);
      setTimeout(() => setCanvasCopySuccess(false), 1500);
    } catch (err) {
      console.error('Canvas copy failed', err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Debug mode requires Cmd/Ctrl + Shift + D (more intentional)
        const isMod = e.metaKey || e.ctrlKey;
        if (isMod && e.shiftKey && e.code === 'KeyD') {
             e.preventDefault();
             setShowDebug(prev => !prev);
        }
        // System copy shortcut
        if (e.shiftKey && (isMod || e.altKey) && e.code === 'KeyC') {
             e.preventDefault();
             handleSystemCopy();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setLogs([]);
    setHeaderText(`BOOTING ${contextLabel || activeContextId.toUpperCase()}`);

    const sysLogs = SYSTEM_LOGS[activeContextId] || ["SYSTEM CHECK", "LOADING MODULES"];
    const sequence: LogItem[] = [];
    
    sysLogs.forEach((text, i) => {
        sequence.push({
            id: `sys-${i}`,
            text: text,
            status: 'pending',
            type: 'system'
        });
    });

    // Make tasks look like Active Operations / Thoughts
    const activeTasks = tasks.filter(t => t.status !== 'completed').slice(0, 3);
    activeTasks.forEach(t => {
        sequence.push({
            id: t.id,
            text: `ACTIVE_TASK: ${t.title}`,
            status: 'pending',
            type: 'task'
        });
    });

    windows.forEach(w => {
        sequence.push({
            id: w.id,
            text: `MOUNTING: ${w.title.toUpperCase()}`,
            status: 'pending',
            type: 'window'
        });
    });

    sequence.push({ id: 'ready', text: "CONTEXT ACTIVE", status: 'pending', type: 'system' });

    if (windows.length === 0 && activeContextId !== 'global') {
        sequence.push({ id: 'empty', text: 'NO MODULES FOUND', status: 'pending', type: 'system' });
    }

    setLogs(sequence);

    let currentIndex = 0;
    const interval = setInterval(() => {
        if (currentIndex >= sequence.length) {
            clearInterval(interval);
            setHeaderText(`${contextLabel || activeContextId.toUpperCase()} ONLINE`);
            return;
        }

        setLogs(prev => prev.map((item, idx) => {
            if (idx === currentIndex) return { ...item, status: 'loading' }; 
            if (idx < currentIndex) return { ...item, status: 'done' };
            return item;
        }));
        
        setTimeout(() => {
             setLogs(prev => prev.map((item, idx) => {
                if (idx === currentIndex) return { ...item, status: 'done' };
                return item;
             }));
             currentIndex++;
        }, 100 + Math.random() * 150); 

    }, 250);

    return () => clearInterval(interval);
  }, [activeContextId, windows, contextLabel, tasks]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyHudLogs = () => {
    const payload = hudLogs.slice(-50).map(entry => ({
      ...entry,
      formatted: formatHudLog(entry)
    }));
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedId('hud-log');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatHudLog = (entry: HudLogEntry) => {
    const payload = entry.payload || {};
    const timestamp = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const source = typeof payload.source === 'string' ? payload.source : undefined;
    const delta = payload.delta as { x?: number; y?: number } | undefined;
    const targetPan = payload.targetPan as { x?: number; y?: number } | undefined;
    const next = payload.next as { x?: number; y?: number } | undefined;
    const canvas = payload.canvas as CanvasDebugState | undefined;

    let detail = '';
    if (delta && typeof delta.x === 'number' && typeof delta.y === 'number') {
      detail = ` dx:${delta.x.toFixed(1)} dy:${delta.y.toFixed(1)}`;
    } else if (targetPan && typeof targetPan.x === 'number' && typeof targetPan.y === 'number') {
      detail = ` tx:${targetPan.x.toFixed(0)} ty:${targetPan.y.toFixed(0)}`;
    } else if (next && typeof next.x === 'number' && typeof next.y === 'number') {
      detail = ` x:${next.x.toFixed(0)} y:${next.y.toFixed(0)}`;
    }

    let canvasDetail = '';
    if (canvas) {
      const state = canvas.isPanLocked ? 'LOCK' : canvas.isPanning ? 'PAN' : canvas.pendingPan ? 'PEND' : 'IDLE';
      canvasDetail = ` c:${state} b:${canvas.buttons}`;
    }

    return `${timestamp} ${entry.tag} ${entry.label}${source ? ` ${source}` : ''}${detail}${canvasDetail}`;
  };

  const canvasState = (() => {
    if (!canvasDebug) return 'IDLE';
    if (canvasDebug.isPanLocked) return 'LOCKED';
    if (canvasDebug.isPanning) return 'PANNING';
    if (canvasDebug.pendingPan) return 'PENDING';
    return 'IDLE';
  })();

  const isDebugExpanded = showDebug || forceDebug;
  const isGlobalView = activeContextId === 'global';

  return (
    <div
      data-hud-panel="manifest"
      className={`${PANEL_STYLES.manifest} pointer-events-none select-none font-mono text-[10px] flex flex-col`}
    >
      {/* Top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />

      <div className={`pointer-events-auto flex-1 flex flex-col overflow-hidden transition-colors ${globalCopySuccess ? 'bg-emerald-950/20' : ''}`}>
        
        {/* Header - Fixed */}
        <div className="shrink-0 p-3 border-b border-neutral-800/50">
          <div className="flex items-center justify-between text-neutral-400">
              <div className="flex items-center gap-2">
                  {globalCopySuccess ? <ClipboardCheck size={12} className="text-white" /> : <Activity size={12} className={isGlobalView ? "text-neutral-500" : logs.some(l => l.status !== 'done') ? "animate-spin" : "text-emerald-500"} />}
                  <span className={`tracking-widest font-bold text-[9px] ${globalCopySuccess ? 'text-white' : ''}`}>
                      {globalCopySuccess ? 'COPIED' : isGlobalView ? 'GLOBAL' : headerText}
                  </span>
              </div>
              <div className="flex items-center gap-2">
                  {!globalCopySuccess && (
                      <button
                          onClick={handleStateCopy}
                          className="flex items-center gap-1 text-[8px] text-neutral-500 hover:text-white transition-colors"
                          title="Copy state snapshot (Cmd+Shift+C)"
                      >
                          {stateCopySuccess ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                      </button>
                  )}
                  {showDebug && (
                      <span className="text-[8px] text-emerald-500 bg-emerald-950/50 px-1 py-0.5 rounded">DBG</span>
                  )}
                  {onToggleCollapse && (
                      <button
                          onClick={onToggleCollapse}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-500 hover:text-white"
                          title="Collapse sidebar"
                      >
                          <PanelLeftClose size={12} />
                      </button>
                  )}
              </div>
          </div>
        </div>

        {/* CENTRALCOMS Section - Collapsible */}
        <div className="shrink-0 border-b border-neutral-800/50">
          <div className="w-full px-3 py-2 flex items-center justify-between text-neutral-400">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenWelcome}
                className="hover:text-white transition-colors"
                title="Open welcome guide"
              >
                <Radio size={12} className={commsExpanded ? 'text-emerald-400 hover:text-emerald-300' : 'text-neutral-500 hover:text-white'} />
              </button>
              <button
                onClick={() => setCommsExpanded(!commsExpanded)}
                className="flex items-center gap-2 hover:bg-white/5 transition-colors rounded px-1 -mx-1"
              >
                <span className="text-[9px] tracking-widest font-bold">CENTRALCOMS</span>
              </button>
            </div>
            <button
              onClick={() => setCommsExpanded(!commsExpanded)}
              className="hover:bg-white/5 rounded p-0.5 transition-colors"
            >
              {commsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {commsExpanded && (
            <div className="px-3 pb-3">
              <div className="text-[10px] text-neutral-500 mb-2 leading-relaxed">
                <span className="text-neutral-400">Built by arach</span>
                <br />
                Spatial canvas for organizing context, windows &amp; workflows
              </div>
              <div className="flex flex-col gap-1">
                {/* VOICE_MODE - expandable accordion */}
                <div>
                  <button
                    onClick={() => setVoiceExpanded(!voiceExpanded)}
                    className="w-full flex items-center gap-2 px-1.5 py-1 rounded hover:bg-white/5 transition-colors"
                  >
                    <Mic size={12} className="text-emerald-500 shrink-0" />
                    <span className="text-[10px] text-neutral-400 font-bold tracking-wide flex-1 text-left">VOICE_MODE</span>
                    <span className="text-[10px] text-neutral-600 mr-1">bottom-right</span>
                    <ChevronRight size={10} className={`text-neutral-600 transition-transform duration-150 ${voiceExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {voiceExpanded && (
                    <div className="ml-5 mt-1 mb-1 pl-2 border-l border-neutral-800">
                      <p className="text-[9px] text-neutral-500 leading-relaxed mb-2">
                        Voice mode uses the <span className="text-neutral-300">Gemini Live API</span> for real-time voice interaction. HUD has no backend &mdash; your key stays in your browser and calls go directly to Google.
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <Key size={10} className="text-neutral-600" />
                        <span className="text-[9px] text-neutral-500">
                          {localStorage.getItem('GEMINI_API_KEY')
                            ? <span className="text-emerald-500">Key configured</span>
                            : <span className="text-amber-500">No key set</span>
                          }
                        </span>
                      </div>
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[9px] text-emerald-600 hover:text-emerald-400 transition-colors"
                      >
                        <ExternalLink size={9} />
                        Get a Gemini API key
                      </a>
                    </div>
                  )}
                </div>

                {/* CONSOLE */}
                <div className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-white/5 transition-colors">
                  <Terminal size={12} className="text-emerald-500 shrink-0" />
                  <span className="text-[10px] text-neutral-400 font-bold tracking-wide flex-1">CONSOLE</span>
                  <span className="text-[10px] text-neutral-600">Ctrl + `</span>
                </div>

                {/* CMD_PALETTE */}
                <div className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-white/5 transition-colors">
                  <Search size={12} className="text-emerald-500 shrink-0" />
                  <span className="text-[10px] text-neutral-400 font-bold tracking-wide flex-1">CMD_PALETTE</span>
                  <span className="text-[10px] text-neutral-600">{'\u2318K'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View Modes Section - Collapsible */}
        <div className="shrink-0 border-b border-neutral-800/50">
          <button
            onClick={() => setViewModesExpanded(!viewModesExpanded)}
            className="w-full px-3 py-2 flex items-center justify-between text-neutral-400 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Compass size={12} className={viewModesExpanded ? 'text-white' : 'text-neutral-500'} />
              <span className="text-[9px] tracking-widest font-bold">VIEW MODE</span>
              <span className="text-[8px] text-neutral-600 uppercase">{activeView}</span>
            </div>
            {viewModesExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {viewModesExpanded && (
            <div className="px-3 pb-3">
              <div className="flex flex-col gap-1">
                {([
                  { id: 'spatial' as ViewMode, label: 'Spatial', icon: <Compass size={14} />, color: '#ffffff' },
                  { id: 'terminals' as ViewMode, label: 'Terminals', icon: <TerminalSquare size={14} />, color: '#f59e0b', types: ['terminal'] },
                  { id: 'editors' as ViewMode, label: 'Editors', icon: <FileCode size={14} />, color: '#10b981', types: ['editor'] },
                  { id: 'visuals' as ViewMode, label: 'Visuals', icon: <LayoutGrid size={14} />, color: '#3b82f6', types: ['visual'] },
                ] as const).map((mode) => {
                  const isActive = activeView === mode.id;
                  const count = mode.id === 'spatial'
                    ? windows.length
                    : windows.filter(w => ('types' in mode) && (mode as any).types.includes(w.type)).length;
                  const isEmpty = mode.id !== 'spatial' && count === 0;

                  return (
                    <button
                      key={mode.id}
                      onClick={() => !isEmpty && onSelectView(mode.id)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-200 w-full text-left
                        ${isEmpty
                          ? 'text-neutral-700 cursor-default'
                          : isActive
                            ? 'bg-white/10 text-white'
                            : 'text-neutral-500 hover:text-white hover:bg-white/5'}
                      `}
                    >
                      <span
                        className="w-5 h-5 flex items-center justify-center rounded"
                        style={{ color: isActive ? mode.color : isEmpty ? 'rgb(55,55,55)' : undefined }}
                      >
                        {mode.icon}
                      </span>
                      <span className="flex-1">{mode.label}</span>
                      {mode.id !== 'spatial' && (
                        <span className={`text-[9px] font-mono ${isEmpty ? 'text-neutral-700' : isActive ? 'text-neutral-400' : 'text-neutral-600'}`}>
                          {count}
                        </span>
                      )}
                      {isActive && !isEmpty && (
                        <span className="text-[8px] text-neutral-500 font-normal">ACTIVE</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modules Section - Collapsible (boot sequence) */}
        <div className="shrink-0 border-b border-neutral-800/50">
          <button
            onClick={() => setModulesExpanded(!modulesExpanded)}
            className="w-full px-3 py-2 flex items-center justify-between text-neutral-400 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers size={12} className={modulesExpanded ? 'text-emerald-400' : 'text-neutral-500'} />
              <span className="text-[9px] tracking-widest font-bold">MODULES</span>
              {!isGlobalView && (
                <span className="text-[8px] text-neutral-600">({windows.length})</span>
              )}
            </div>
            {modulesExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {modulesExpanded && (
            <div className="max-h-[250px] overflow-y-auto px-3 pb-3">
              {logs.length === 0 ? (
                <div className="text-neutral-500 text-center py-6">
                  <div className="text-[9px] uppercase tracking-widest mb-2">{isGlobalView ? 'All Contexts' : 'Loading...'}</div>
                  <div className="text-neutral-600 text-[10px]">{isGlobalView ? 'Select a context to view modules' : 'Initializing boot sequence'}</div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {logs.map((log) => {
                    let debugData: any;
                    if (log.type === 'window') debugData = windows.find(w => w.id === log.id);
                    else if (log.type === 'task') debugData = tasks.find(t => t.id === log.id);
                    else debugData = { _sys_id: log.id, op_code: log.text, state: log.status, ts: Date.now() };

                    return (
                      <div key={log.id} className="flex flex-col">
                        <div
                          onClick={() => {
                            if (log.type === 'window') onItemClick?.(log.id);
                            if (log.type === 'task') onDiscuss?.(log.id);
                          }}
                          className={`
                            flex items-center gap-3 transition-all duration-300 rounded px-1.5 py-0.5 -mx-1.5 group
                            ${log.status === 'pending' ? 'opacity-30' : 'opacity-100'}
                            ${log.type === 'window' ? 'cursor-pointer hover:bg-neutral-800 hover:text-white' : ''}
                            ${log.type === 'task' ? 'cursor-pointer bg-amber-900/10 hover:bg-amber-900/30 text-amber-500' : ''}
                          `}
                        >
                          <div className="w-3 flex justify-center shrink-0">
                            {log.status === 'pending' && <Circle size={4} className="text-neutral-700" />}
                            {log.status === 'loading' && <div className="w-1.5 h-1.5 bg-blue-500 animate-pulse rounded-full" />}
                            {log.status === 'done' && (
                              log.type === 'window' ? <Terminal size={10} className="text-emerald-400 group-hover:text-emerald-300" /> :
                              log.type === 'task' ? <MessageSquare size={10} className="text-amber-500" /> :
                              <Check size={10} className="text-neutral-600" />
                            )}
                          </div>

                          <span className={`
                            truncate tracking-tight flex-1
                            ${log.status === 'loading' ? 'text-blue-400' : ''}
                            ${log.status === 'done' && log.type === 'window' ? 'text-neutral-200 font-bold group-hover:underline decoration-neutral-600 decoration-dotted underline-offset-4' : ''}
                            ${log.status === 'done' && log.type === 'task' ? 'text-amber-500/90 font-medium' : ''}
                            ${log.status === 'done' && log.type === 'system' ? 'text-neutral-500' : ''}
                          `}>
                            {log.text}
                          </span>

                          {log.status === 'done' && log.type === 'window' && !isDebugExpanded && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MousePointer2 size={10} className="text-emerald-500" />
                            </div>
                          )}
                          {log.status === 'done' && log.type === 'task' && !isDebugExpanded && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <span className="text-[8px] uppercase">Discuss</span>
                              <Sparkles size={10} className="text-amber-400" />
                            </div>
                          )}
                          {isDebugExpanded && log.status === 'done' && <Database size={10} className="text-neutral-600" />}
                        </div>

                        {isDebugExpanded && log.status !== 'pending' && (
                          <div className="pl-6 pr-1 py-1 animate-in slide-in-from-top-1 fade-in duration-200">
                            <div className="bg-[#0b0b0b] border border-neutral-800/80 rounded p-2 shadow-inner overflow-hidden relative group/code">
                              <pre className="text-[9px] text-emerald-500/90 font-mono leading-relaxed whitespace-pre-wrap break-all">
                                {JSON.stringify(debugData, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logs Section - Collapsible */}
        <div className="shrink-0 border-b border-neutral-800/50">
          <button
            onClick={onToggleLogs}
            className="w-full px-3 py-2 flex items-center justify-between text-neutral-400 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity size={12} className={logsExpanded ? 'text-emerald-400' : 'text-neutral-500'} />
              <span className="text-[9px] tracking-widest font-bold">LOGS</span>
              {hudLogs.length > 0 && (
                <span className="text-[8px] text-neutral-600">({hudLogs.length})</span>
              )}
            </div>
            {logsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {logsExpanded && (
            <div className="px-3 pb-3 max-h-32 overflow-y-auto">
              {hudLogs.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {hudLogs.slice(-15).map(entry => (
                    <div key={entry.id} className="font-mono text-[8px] text-neutral-500 truncate">
                      {formatHudLog(entry)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-neutral-600 text-[10px] text-center py-4">
                  No logs yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spacer to push minimap and footer to bottom */}
        <div className="flex-1" />

        {/* Minimap Section - Collapsible (bottom-aligned) */}
        <div className="shrink-0 border-t border-neutral-800/50 bg-black/30">
          <button
            onClick={() => setMinimapExpanded(!minimapExpanded)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-neutral-400 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Compass size={12} className={minimapExpanded ? 'text-emerald-400' : 'text-neutral-500'} />
              <span className="text-[9px] tracking-widest font-bold">MINIMAP</span>
            </div>
            {minimapExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {minimapExpanded && (
            <div className="px-3 pb-3">
              <div className="rounded overflow-hidden border border-neutral-700/50 bg-neutral-900/50">
                <Minimap
                  windows={windows}
                  viewport={{
                    width: viewport?.width || window.innerWidth,
                    height: viewport?.height || window.innerHeight,
                    x: -(panOffset?.x || 0),
                    y: -(panOffset?.y || 0)
                  }}
                  panOffset={panOffset || { x: 0, y: 0 }}
                  appScale={typeof scale === 'number' ? scale : 1}
                  onNavigate={onNavigate || (() => {})}
                  onViewAll={onViewAll}
                  width={254}
                  height={150}
                  fixedPosition={false}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ContextManifest;
