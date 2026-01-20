import React, { useEffect, useState, useRef } from 'react';
import { WindowState, Task } from '../types';
import { Check, Activity, Circle, Terminal, MousePointer2, Database, Copy, ClipboardCheck, MessageSquare, Sparkles } from 'lucide-react';
import type { CanvasDebugState } from './Canvas';

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
  onDiscuss?: (taskId: string) => void; // New prop for conversational interaction
  namespaceQuery: string;
  activeView: string;
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
  contexts,
  contextSizes,
  selectedWindowId,
  selectedContextId,
  selectedFilter,
  hudLogs = [],
  canvasDebug,
  panOffset,
  scale,
  forceDebug = false
}) => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [headerText, setHeaderText] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [globalCopySuccess, setGlobalCopySuccess] = useState(false);
  const [stateCopySuccess, setStateCopySuccess] = useState(false);
  const [canvasCopySuccess, setCanvasCopySuccess] = useState(false);
  
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
        const isMod = e.metaKey || e.ctrlKey;
        if (isMod) setShowDebug(true);
        if (e.shiftKey && (isMod || e.altKey) && e.code === 'KeyC') {
             e.preventDefault();
             handleSystemCopy();
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (!e.metaKey && !e.ctrlKey) setShowDebug(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
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

  if (activeContextId === 'global') return null;

  const isExpanded = showDebug || forceDebug;

  return (
    <div data-hud-panel="manifest" className={`fixed top-4 left-4 z-40 pointer-events-none select-none font-mono text-[10px] transition-all duration-300 ease-out ${isExpanded ? 'w-[400px]' : 'w-64'}`}>
      <div className={`pointer-events-auto backdrop-blur-md border p-4 rounded-lg shadow-2xl animate-in fade-in slide-in-from-left-4 duration-500 transition-colors ${globalCopySuccess ? 'bg-emerald-950/80 border-emerald-500/50' : 'bg-black/80 border-neutral-800'}`}>
        
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10 text-neutral-400">
            <div className="flex items-center gap-2">
                {globalCopySuccess ? <ClipboardCheck size={12} className="text-white" /> : <Activity size={12} className={logs.some(l => l.status !== 'done') ? "animate-spin" : "text-emerald-500"} />}
                <span className={`tracking-widest font-bold ${globalCopySuccess ? 'text-white' : ''}`}>
                    {globalCopySuccess ? 'SYSTEM DUMP COPIED' : headerText}
                </span>
            </div>
            {showDebug && !globalCopySuccess && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleStateCopy}
                        className="flex items-center gap-1 text-[8px] text-neutral-500 hover:text-white transition-colors"
                        title="Copy canvas/state snapshot"
                    >
                        {stateCopySuccess ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                        {stateCopySuccess ? 'COPIED' : 'COPY'}
                    </button>
                    <span className="text-[8px] text-neutral-500">SHIFT+CMD+C</span>
                    <span className="text-[9px] text-emerald-500 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/50">DEBUG</span>
                </div>
            )}
        </div>

        <div className="flex flex-col gap-1">
            {logs.map((log) => {
                let debugData;
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
                            
                            {log.status === 'done' && log.type === 'window' && !isExpanded && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MousePointer2 size={10} className="text-emerald-500" />
                                </div>
                            )}
                            {log.status === 'done' && log.type === 'task' && !isExpanded && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <span className="text-[8px] uppercase">Discuss</span>
                                    <Sparkles size={10} className="text-amber-400" />
                                </div>
                            )}
                             {isExpanded && log.status === 'done' && <Database size={10} className="text-neutral-600" />}
                        </div>

                        {isExpanded && log.status !== 'pending' && (
                            <div className="pl-6 pr-1 py-1 animate-in slide-in-from-top-1 fade-in duration-200">
                                <div className="bg-[#0b0b0b] border border-neutral-800/80 rounded p-2 shadow-inner overflow-hidden relative group/code">
                                    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
                                        <div className="text-[8px] bg-neutral-900 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-800">JSON</div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopy(log.id, JSON.stringify(debugData, null, 2));
                                            }}
                                            className="p-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                        >
                                            {copiedId === log.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                                        </button>
                                    </div>
                                    <pre className="text-[9px] text-emerald-500/90 font-mono leading-relaxed whitespace-pre-wrap break-all relative z-0">
                                        {JSON.stringify(debugData, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        {hudLogs.length > 0 && (
          <div className="mt-4 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] uppercase tracking-widest text-neutral-500">HUD PAN LOG</span>
              <button
                onClick={handleCopyHudLogs}
                className="flex items-center gap-1 text-[8px] text-neutral-500 hover:text-white transition-colors"
                title="Copy HUD pan logs"
              >
                {copiedId === 'hud-log' ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                {copiedId === 'hud-log' ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div className="max-h-24 overflow-y-auto flex flex-col gap-1 text-[9px] text-neutral-500">
              {hudLogs.slice(-12).map(entry => (
                <div key={entry.id} className="font-mono text-[9px] text-neutral-500">
                  {formatHudLog(entry)}
                </div>
              ))}
            </div>
          </div>
        )}

        {canvasDebug && (
          <div className="mt-4 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[8px] uppercase tracking-widest text-neutral-500">CANVAS</div>
              <button
                onClick={handleCanvasCopy}
                className="flex items-center gap-1 text-[8px] text-neutral-500 hover:text-white transition-colors"
                title="Copy canvas snapshot"
              >
                {canvasCopySuccess ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                {canvasCopySuccess ? 'COPIED' : 'COPY'}
              </button>
            </div>
            <div className="flex flex-col gap-1 text-[9px] text-neutral-500 font-mono">
              <div>STATE: {canvasState}</div>
              {typeof panOffset?.x === 'number' && typeof panOffset?.y === 'number' && (
                <div>PAN: {panOffset.x.toFixed(1)},{panOffset.y.toFixed(1)}</div>
              )}
              {typeof scale === 'number' && (
                <div>SCALE: {scale.toFixed(2)}</div>
              )}
              <div>BUTTONS: {canvasDebug.buttons}</div>
              <div>SPACE: {canvasDebug.isSpaceDown ? 'DOWN' : 'UP'}</div>
              <div>MOUSE: {canvasDebug.mouse.x.toFixed(0)},{canvasDebug.mouse.y.toFixed(0)}</div>
              {canvasDebug.pendingStart && (
                <div>PENDING: {canvasDebug.pendingStart.x.toFixed(0)},{canvasDebug.pendingStart.y.toFixed(0)}</div>
              )}
              <div>LAST PAN: {canvasDebug.lastPan.x.toFixed(0)},{canvasDebug.lastPan.y.toFixed(0)}</div>
              <div>TS: {new Date(canvasDebug.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        )}
        
         <div className="mt-4 pt-2 border-t border-neutral-800 flex justify-between text-[8px] text-neutral-600">
             <span>ALLOC.MEM: OK</span>
             <span>PID: {Math.floor(Math.random() * 9000) + 1000}</span>
        </div>
      </div>
    </div>
  );
};

export default ContextManifest;
