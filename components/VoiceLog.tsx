import React, { useEffect, useRef } from 'react';
import { Activity, Mic, ChevronRight, Cpu } from 'lucide-react';

interface Transcript {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    isFinal: boolean;
}

interface VoiceLogProps {
  transcripts: Transcript[];
  visible: boolean;
}

const VoiceLog: React.FC<VoiceLogProps> = ({ transcripts, visible }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of log
  useEffect(() => {
    if (visible && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, visible]);

  if (!visible) return null;

  // Get last few items to display in the HUD
  const recentItems = transcripts.slice(-4);

  return (
    <div className="flex flex-col gap-2 w-[400px] max-w-full pointer-events-none font-mono text-xs">
      <div className="flex items-center gap-2 text-emerald-500 mb-1 opacity-80">
          <Activity size={12} className="animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase">Live Transcript</span>
      </div>
      
      <div className="flex flex-col gap-1.5">
          {recentItems.length === 0 && (
              <div className="text-neutral-600 italic">Waiting for voice input...</div>
          )}
          
          {recentItems.map((t, i) => (
              <div 
                key={i} 
                className={`
                    relative p-2 rounded border backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in
                    ${t.role === 'user' 
                        ? 'bg-neutral-900/40 border-neutral-800 text-neutral-300 self-end ml-12' 
                        : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-100 self-start mr-12'
                    }
                `}
              >
                  <div className="absolute -top-1.5 -left-1.5 bg-black border border-neutral-800 rounded px-1 py-0.5 text-[8px] uppercase tracking-wider text-neutral-500 flex items-center gap-1">
                      {t.role === 'user' ? <Mic size={8} /> : <Cpu size={8} />}
                      {t.role === 'user' ? 'OPR' : 'SYS'}
                  </div>
                  <span className="leading-relaxed opacity-90">
                    {t.text}
                    {!t.isFinal && <span className="inline-block w-1 h-3 ml-1 align-middle bg-emerald-500 animate-pulse"/>}
                  </span>
              </div>
          ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
};

export default VoiceLog;