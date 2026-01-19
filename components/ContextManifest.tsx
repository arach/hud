import React, { useEffect, useState } from 'react';
import { WindowState } from '../types';
import { Check, Activity, Circle, Terminal, MousePointer2 } from 'lucide-react';

interface ContextManifestProps {
  activeContextId: string;
  windows: WindowState[];
  contextLabel?: string;
  onItemClick?: (id: string) => void;
}

interface LogItem {
  id: string;
  text: string;
  status: 'pending' | 'loading' | 'done';
  type: 'window' | 'system';
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

const ContextManifest: React.FC<ContextManifestProps> = ({ activeContextId, windows, contextLabel, onItemClick }) => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [headerText, setHeaderText] = useState('');
  
  useEffect(() => {
    // 1. Reset
    setLogs([]);
    setHeaderText(`BOOTING ${contextLabel || activeContextId.toUpperCase()}`);

    // 2. Generate Mixed Sequence
    const sysLogs = SYSTEM_LOGS[activeContextId] || ["SYSTEM CHECK", "LOADING MODULES"];
    
    // Create a list that interleaves system logs and actual windows
    const sequence: LogItem[] = [];
    
    // Add initial system logs
    sysLogs.forEach((text, i) => {
        sequence.push({
            id: `sys-${i}`,
            text: text,
            status: 'pending',
            type: 'system'
        });
    });

    // Add actual windows (The "Work")
    windows.forEach(w => {
        sequence.push({
            id: w.id,
            text: `MOUNTING: ${w.title.toUpperCase()}`,
            status: 'pending',
            type: 'window'
        });
    });

    // Add final ready state
    sequence.push({ id: 'ready', text: "CONTEXT ACTIVE", status: 'pending', type: 'system' });

    if (windows.length === 0 && activeContextId !== 'global') {
        sequence.push({ id: 'empty', text: 'NO MODULES FOUND', status: 'pending', type: 'system' });
    }

    setLogs(sequence);

    // 3. Playback Animation
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
        
        // Simulating async completion for each item with varied delay
        setTimeout(() => {
             setLogs(prev => prev.map((item, idx) => {
                if (idx === currentIndex) return { ...item, status: 'done' };
                return item;
             }));
             currentIndex++;
        }, 100 + Math.random() * 150); 

    }, 250);

    return () => clearInterval(interval);
  }, [activeContextId, windows, contextLabel]);

  if (activeContextId === 'global') return null;

  return (
    <div className="fixed top-24 left-8 z-40 pointer-events-none select-none font-mono text-[10px] w-64">
      {/* Container must be pointer-events-auto to capture clicks on children */}
      <div className="pointer-events-auto bg-black/80 backdrop-blur-md border border-neutral-800 p-4 rounded-lg shadow-2xl animate-in fade-in slide-in-from-left-4 duration-500">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10 text-neutral-400">
            <Activity size={12} className={logs.some(l => l.status !== 'done') ? "animate-spin" : "text-emerald-500"} />
            <span className="tracking-widest font-bold">{headerText}</span>
        </div>

        {/* List */}
        <div className="flex flex-col gap-1">
            {logs.map((log) => (
                <div 
                    key={log.id} 
                    onClick={() => log.type === 'window' && onItemClick?.(log.id)}
                    className={`
                        flex items-center gap-3 transition-all duration-300 rounded px-1.5 py-0.5 -mx-1.5
                        ${log.status === 'pending' ? 'opacity-30' : 'opacity-100'}
                        ${log.type === 'window' ? 'cursor-pointer hover:bg-neutral-800 hover:text-white group' : ''}
                    `}
                >
                    <div className="w-3 flex justify-center shrink-0">
                        {log.status === 'pending' && <Circle size={4} className="text-neutral-700" />}
                        {log.status === 'loading' && <div className="w-1.5 h-1.5 bg-blue-500 animate-pulse rounded-full" />}
                        {log.status === 'done' && (
                            log.type === 'window' ? <Terminal size={10} className="text-emerald-400 group-hover:text-emerald-300" /> : <Check size={10} className="text-neutral-600" />
                        )}
                    </div>
                    
                    <span className={`
                        truncate tracking-tight flex-1
                        ${log.status === 'loading' ? 'text-blue-400' : ''}
                        ${log.status === 'done' ? (log.type === 'window' ? 'text-neutral-200 font-bold group-hover:underline decoration-neutral-600 decoration-dotted underline-offset-4' : 'text-neutral-500') : ''}
                    `}>
                        {log.text}
                    </span>
                    
                    {log.status === 'done' && log.type === 'window' && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MousePointer2 size={10} className="text-emerald-500" />
                        </div>
                    )}
                </div>
            ))}
        </div>
        
        {/* Footer */}
         <div className="mt-4 pt-2 border-t border-neutral-800 flex justify-between text-[8px] text-neutral-600">
             <span>ALLOC.MEM: OK</span>
             <span>PID: {Math.floor(Math.random() * 9000) + 1000}</span>
        </div>
      </div>
    </div>
  );
};

export default ContextManifest;