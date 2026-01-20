import React, { useState, useEffect, useRef } from 'react';
import { Search, RotateCcw, Download, Filter } from 'lucide-react';

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate initial logs
    const initial = Array.from({length: 20}, (_, i) => `[${new Date().toISOString()}] INFO: System module initialized (pid: ${1000+i})`);
    setLogs(initial);

    const interval = setInterval(() => {
        const types = ['INFO', 'DEBUG', 'WARN', 'TRACE'];
        const type = types[Math.floor(Math.random() * types.length)];
        const color = type === 'WARN' ? 'text-yellow-500' : type === 'INFO' ? 'text-blue-400' : 'text-neutral-500';
        
        const newLog = `[${new Date().toISOString()}] ${type}: Process tick execution cycle #${Math.floor(Math.random()*99999)}`;
        
        setLogs(prev => [...prev.slice(-100), newLog]); // Keep last 100
    }, 800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#050505] text-[10px] font-mono">
        <div className="h-8 bg-[#111] border-b border-neutral-800 flex items-center px-2 gap-2">
            <div className="bg-black border border-neutral-700 rounded flex items-center px-2 py-0.5 w-48">
                <Search size={10} className="text-neutral-500 mr-2" />
                <input className="bg-transparent border-none outline-none text-neutral-300 w-full placeholder-neutral-600" placeholder="Filter logs..." />
            </div>
            <div className="flex-1"></div>
            <button className="p-1 hover:bg-neutral-800 rounded text-neutral-400"><RotateCcw size={12} /></button>
            <button className="p-1 hover:bg-neutral-800 rounded text-neutral-400"><Filter size={12} /></button>
            <button className="p-1 hover:bg-neutral-800 rounded text-neutral-400"><Download size={12} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {logs.map((log, i) => {
                const isWarn = log.includes('WARN');
                const isDebug = log.includes('DEBUG');
                return (
                    <div key={i} className={`hover:bg-white/5 px-1 rounded whitespace-nowrap ${isWarn ? 'text-yellow-500' : isDebug ? 'text-neutral-500' : 'text-neutral-300'}`}>
                        {log}
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
        
        <div className="h-5 bg-[#080808] border-t border-neutral-800 flex items-center px-2 justify-between text-neutral-500">
            <span>/var/log/hud_agent.log</span>
            <span>{logs.length} lines</span>
        </div>
    </div>
  );
};

export default LogViewer;