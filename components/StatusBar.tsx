import React, { useState, useEffect } from 'react';
import { Wifi, GitBranch, Activity, Clock, Mic, Radio } from 'lucide-react';

interface StatusBarProps {
  panOffset: { x: number; y: number };
  scale: number;
  activeContextId: string;
  isVoiceConnected?: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ panOffset, scale, activeContextId, isVoiceConnected }) => {
  const [time, setTime] = useState(new Date());
  const [latency, setLatency] = useState(24);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const latencyTimer = setInterval(() => {
        setLatency(prev => {
            const change = Math.floor(Math.random() * 10) - 5;
            return Math.max(10, Math.min(100, prev + change));
        });
    }, 2000);
    return () => {
        clearInterval(timer);
        clearInterval(latencyTimer);
    };
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-7 bg-[#09090b]/90 backdrop-blur-md border-t border-neutral-800 flex items-center justify-between px-3 z-[60] select-none font-mono text-[10px] text-neutral-500 pointer-events-auto shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      
      {/* LEFT: System Health */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-emerald-500">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="font-bold tracking-wider">ONLINE</span>
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        <div className="flex items-center gap-1.5 hover:text-neutral-300 transition-colors cursor-pointer">
            <GitBranch size={10} />
            <span>main</span>
            <span className="text-neutral-600">*</span>
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        <div className="flex items-center gap-1.5">
            <Wifi size={10} className={latency > 80 ? "text-amber-500" : "text-neutral-600"} />
            <span className="tabular-nums">{latency}ms</span>
        </div>
      </div>

      {/* CENTER: Viewport Data */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 hidden md:flex opacity-70 hover:opacity-100 transition-opacity">
         <div className="flex items-center gap-1">
             <span className="text-neutral-600">X:</span>
             <span className="tabular-nums w-8 text-right">{panOffset.x.toFixed(0)}</span>
         </div>
         <div className="flex items-center gap-1">
             <span className="text-neutral-600">Y:</span>
             <span className="tabular-nums w-8 text-right">{panOffset.y.toFixed(0)}</span>
         </div>
         <div className="h-3 w-px bg-neutral-800" />
         <div className="flex items-center gap-1">
             <span className="text-neutral-600">ZM:</span>
             <span className="tabular-nums">{(scale * 100).toFixed(0)}%</span>
         </div>
      </div>

      {/* RIGHT: Context & Voice Status */}
      <div className="flex items-center gap-4">
        
        {/* Voice Status Indicator */}
        {isVoiceConnected ? (
           <div className="flex items-center gap-2 animate-pulse text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
               <Mic size={10} />
               <span className="font-bold tracking-wider">VOICE ACTIVE</span>
               <div className="flex gap-0.5 items-end h-2 ml-1">
                   <div className="w-0.5 h-full bg-emerald-500 animate-[bounce_1s_infinite]"></div>
                   <div className="w-0.5 h-2/3 bg-emerald-500 animate-[bounce_1.2s_infinite]"></div>
                   <div className="w-0.5 h-full bg-emerald-500 animate-[bounce_0.8s_infinite]"></div>
               </div>
           </div>
        ) : (
           <div className="flex items-center gap-1.5">
              <Activity size={10} className="text-neutral-600" />
              <span className="uppercase text-neutral-400">System: Nominal</span>
           </div>
        )}

        <div className="h-3 w-px bg-neutral-800" />

        <div className="flex items-center gap-1.5 text-neutral-400">
             <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
             <span className="uppercase">{activeContextId}</span>
        </div>

        <div className="h-3 w-px bg-neutral-800" />

        <div className="flex items-center gap-1.5 text-neutral-300 min-w-[60px] justify-end">
            <Clock size={10} className="text-neutral-600" />
            <span>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      </div>

    </div>
  );
};

export default StatusBar;