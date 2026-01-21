import React, { useMemo, useState, useRef, useEffect } from 'react';
import { WindowState } from '../types';
import { ContextDef } from './ContextBar';
import type { CanvasDebugState } from './Canvas';
import { Check, Copy, PanelRightClose, Mic, Cpu, Activity } from 'lucide-react';
import { PANEL_STYLES } from '../lib/hudChrome';

interface Transcript {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

interface InspectorPanelProps {
  windows: WindowState[];
  selectedWindowId: string | null;
  selectedContextId: string | null;
  selectedFilter: { kind: 'view'; id: string } | null;
  namespaceQuery: string;
  activeView: string;
  activeContextId: string;
  contexts: ContextDef[];
  contextSizes: Record<string, { width: number; height: number }>;
  canvasDebug?: CanvasDebugState | null;
  panOffset?: { x: number; y: number };
  scale?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isVoiceConnected?: boolean;
  transcripts?: Transcript[];
}

const InspectorPanel: React.FC<InspectorPanelProps> = ({
  windows,
  selectedWindowId,
  selectedContextId,
  selectedFilter,
  namespaceQuery,
  activeView,
  activeContextId,
  contexts,
  contextSizes,
  canvasDebug,
  panOffset,
  scale,
  isCollapsed = false,
  onToggleCollapse,
  isVoiceConnected = false,
  transcripts = []
}) => {
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isVoiceConnected && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, isVoiceConnected]);

  const recentTranscripts = transcripts.slice(-4);

  const selectedWindow = useMemo(() => {
    if (!selectedWindowId) return null;
    return windows.find(win => win.id === selectedWindowId) || null;
  }, [windows, selectedWindowId]);

  const selectedContext = useMemo(() => {
    if (!selectedContextId) return null;
    return contexts.find(ctx => ctx.id === selectedContextId) || null;
  }, [contexts, selectedContextId]);

  const selectionHeader = useMemo(() => {
    if (selectedWindow || selectedContext) {
      return { label: 'Object', color: 'bg-emerald-500/80' };
    }
    if (selectedFilter) {
      return { label: 'Action', color: 'bg-sky-500/80' };
    }
    return { label: 'Object', color: 'bg-emerald-500/80' };
  }, [selectedWindow, selectedContext, selectedFilter]);

  const viewLabels: Record<string, string> = {
    spatial: 'Spatial Map',
    terminals: 'Terminal Grid',
    editors: 'Code Grid',
    visuals: 'Visual Grid'
  };

  const canvasState = useMemo(() => {
    if (!canvasDebug) return 'IDLE';
    if (canvasDebug.isPanLocked) return 'LOCKED';
    if (canvasDebug.isPanning) return 'PANNING';
    if (canvasDebug.pendingPan) return 'PENDING';
    return 'IDLE';
  }, [canvasDebug]);

  const handleCopyInspector = async () => {
    const selectionType = selectedWindow ? 'window' : selectedContext ? 'context' : selectedFilter ? 'filter' : 'none';
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
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy inspector snapshot', error);
    }
  };

  return (
    <div
      data-hud-panel="inspector"
      className={`${PANEL_STYLES.inspector} pointer-events-none select-none font-mono text-[10px] flex flex-col`}
    >
      {/* Top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />

      <div className="pointer-events-auto flex-1 flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="shrink-0 p-4 border-b border-neutral-800/50">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="tracking-widest font-bold">INSPECTOR</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyInspector}
                className="flex items-center gap-1 text-[9px] text-neutral-500 hover:text-white transition-colors"
                title="Copy inspector snapshot"
              >
                {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-neutral-500 hover:text-white"
                  title="Collapse panel"
                >
                  <PanelRightClose size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] uppercase text-neutral-500 mb-1">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-amber-500/80"></span>
              System
            </div>
            <div className="text-neutral-200 break-all">Query: {namespaceQuery}</div>
            <div className="text-neutral-500">View: {activeView.toUpperCase()}</div>
            <div className="text-neutral-500">Context: {activeContextId.toUpperCase()}</div>
            {canvasDebug && (
              <>
                <div className="text-neutral-500">Canvas: {canvasState}</div>
                {typeof panOffset?.x === 'number' && typeof panOffset?.y === 'number' && (
                  <div className="text-neutral-500">Pan: {panOffset.x.toFixed(1)},{panOffset.y.toFixed(1)}</div>
                )}
                {typeof scale === 'number' && (
                  <div className="text-neutral-500">Scale: {scale.toFixed(2)}</div>
                )}
                <div className="text-neutral-500">Buttons: {canvasDebug.buttons}</div>
                <div className="text-neutral-500">Space: {canvasDebug.isSpaceDown ? 'DOWN' : 'UP'}</div>
                <div className="text-neutral-500">Mouse: {canvasDebug.mouse.x.toFixed(0)},{canvasDebug.mouse.y.toFixed(0)}</div>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-[9px] uppercase text-neutral-500 mb-1">
              <span className={`inline-flex h-1.5 w-1.5 rounded-full ${selectionHeader.color}`}></span>
              {selectionHeader.label}
            </div>
            {selectedWindow ? (
              <div className="space-y-1 text-neutral-200">
                <div>ID: {selectedWindow.id}</div>
                <div>Title: {selectedWindow.title}</div>
                <div>Namespace: {selectedWindow.namespace}</div>
                <div>Context: {selectedWindow.contextId || 'global'}</div>
                <div>Type: {selectedWindow.type}</div>
                {selectedWindow.tags && selectedWindow.tags.length > 0 && (
                  <div>Tags: {selectedWindow.tags.join(', ')}</div>
                )}
                <div className="text-neutral-500">Z: {selectedWindow.zIndex}</div>
                <div className="text-neutral-500">
                  Position (User): X:{selectedWindow.x} Y:{selectedWindow.y}
                </div>
                <div className="text-neutral-500">
                  Size (User): W:{selectedWindow.w} H:{selectedWindow.h}
                </div>
              </div>
            ) : selectedContext ? (
              <div className="space-y-1 text-neutral-200">
                <div>ID: {selectedContext.id}</div>
                <div>Label: {selectedContext.label}</div>
                <div>Color: {selectedContext.color}</div>
                {contextSizes[selectedContext.id] && (
                  <>
                    <div className="text-neutral-500">
                      Origin (System): X:{selectedContext.x} Y:{selectedContext.y}
                    </div>
                    <div className="text-neutral-500">
                      Size (System): W:{contextSizes[selectedContext.id].width} H:{contextSizes[selectedContext.id].height}
                    </div>
                  </>
                )}
              </div>
            ) : selectedFilter ? (
              <div className="space-y-1 text-neutral-200">
                <div>Filter Stack</div>
                <div className="text-neutral-500">
                  Scope Query: {namespaceQuery}
                </div>
                <div className="text-neutral-500">
                  View Filter: {viewLabels[selectedFilter.id] || selectedFilter.id}
                </div>
                <div className="text-neutral-500">
                  Command: set view → {selectedFilter.id}
                </div>
              </div>
            ) : (
              <div className="text-neutral-500">
                Select a window, manifest item, or zone.
              </div>
            )}
          </div>
        </div>

        {/* Voice Chat Section - Live */}
        {isVoiceConnected && (
          <div className="shrink-0 border-t border-neutral-800/50 bg-black/30 flex flex-col" style={{ maxHeight: '50%' }}>
            <div className="shrink-0 px-4 py-2 border-b border-neutral-800/30 flex items-center gap-2">
              <Activity size={10} className="text-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold tracking-widest text-emerald-400 uppercase">Live Chat</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {recentTranscripts.length === 0 ? (
                <div className="text-neutral-600 text-[10px] italic">Listening...</div>
              ) : (
                recentTranscripts.map((t, i) => (
                  <div
                    key={i}
                    className={`
                      relative p-2 rounded border text-[10px] leading-relaxed
                      ${t.role === 'user'
                        ? 'bg-neutral-900/60 border-neutral-700/50 text-neutral-300 ml-4'
                        : 'bg-emerald-950/40 border-emerald-800/30 text-emerald-100 mr-4'
                      }
                    `}
                  >
                    <div className="absolute -top-1.5 left-2 bg-black border border-neutral-800 rounded px-1 py-0.5 text-[7px] uppercase tracking-wider text-neutral-500 flex items-center gap-0.5">
                      {t.role === 'user' ? <Mic size={6} /> : <Cpu size={6} />}
                      {t.role === 'user' ? 'YOU' : 'AI'}
                    </div>
                    <span className="opacity-90">
                      {t.text}
                      {!t.isFinal && <span className="inline-block w-1 h-2.5 ml-1 align-middle bg-emerald-500 animate-pulse" />}
                    </span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Previous Chat Section - When disconnected but has history */}
        {!isVoiceConnected && transcripts.length > 0 && (
          <div className="shrink-0 border-t border-neutral-800/50 bg-neutral-950/50">
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={10} className="text-neutral-600" />
                <span className="text-[9px] font-bold tracking-widest text-neutral-500 uppercase">Previous Chat</span>
                <span className="text-[8px] text-neutral-600">({transcripts.length})</span>
              </div>
            </div>
            <div className="px-3 pb-3 space-y-1.5 max-h-24 overflow-y-auto">
              {transcripts.slice(-3).map((t, i) => (
                <div
                  key={i}
                  className={`
                    text-[9px] px-2 py-1 rounded truncate
                    ${t.role === 'user'
                      ? 'bg-neutral-900/40 text-neutral-500 ml-4'
                      : 'bg-neutral-900/20 text-neutral-600 mr-4'
                    }
                  `}
                >
                  <span className="opacity-60 mr-1">{t.role === 'user' ? 'You:' : 'AI:'}</span>
                  {t.text.slice(0, 60)}{t.text.length > 60 ? '...' : ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectorPanel;
