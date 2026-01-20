import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, Play, Terminal } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration: string;
}

const PipelineMonitor: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([
    { id: '1', name: 'Lint & Typecheck', status: 'success', duration: '4s' },
    { id: '2', name: 'Unit Tests', status: 'success', duration: '12s' },
    { id: '3', name: 'Build Container', status: 'running', duration: '45s' },
    { id: '4', name: 'Integration Tests', status: 'pending', duration: '-' },
    { id: '5', name: 'Deploy to Staging', status: 'pending', duration: '-' },
  ]);

  const [logs, setLogs] = useState<string[]>([
    '> docker build -t hud-agent:latest .',
    '[+] Building 2.4s (3/3) FINISHED',
    ' => [internal] load build definition from Dockerfile',
    ' => [internal] load metadata for docker.io/library/node:18',
    ' => [internal] load .dockerignore',
    'CACHED [1/5] FROM docker.io/library/node:18@sha256:...',
    '[+] Installing dependencies...',
    'added 142 packages in 4s',
    'running build script...'
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
        // Simulate log streaming
        const newLogs = [
            `[${new Date().toISOString().split('T')[1].slice(0,8)}] Compiling modules... ${Math.floor(Math.random() * 100)}%`,
            `[${new Date().toISOString().split('T')[1].slice(0,8)}] Optimizing chunks...`
        ];
        setLogs(prev => [...prev.slice(-15), newLogs[Math.floor(Math.random() * 2)]]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (status: Stage['status']) => {
    switch (status) {
        case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
        case 'failed': return <XCircle size={16} className="text-red-500" />;
        case 'running': return <Loader2 size={16} className="text-blue-500 animate-spin" />;
        default: return <Circle size={16} className="text-neutral-700" />;
    }
  };

  const getBarColor = (status: Stage['status']) => {
    switch (status) {
        case 'success': return 'bg-emerald-500';
        case 'failed': return 'bg-red-500';
        case 'running': return 'bg-blue-500 animate-pulse';
        default: return 'bg-neutral-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      <div className="h-10 border-b border-neutral-800 flex items-center px-4 justify-between bg-[#111]">
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="font-bold text-xs text-neutral-300">PIPELINE #8492</span>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-[10px] text-neutral-400">
                <Play size={10} /> RERUN
            </button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto">
        {/* Stages Visualization */}
        <div className="flex items-center justify-between relative mb-8">
            {/* Connecting Line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-neutral-800 -z-0"></div>
            
            {stages.map((stage, idx) => (
                <div key={stage.id} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-[#0d0d0d] border-2 flex items-center justify-center ${
                        stage.status === 'running' ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 
                        stage.status === 'success' ? 'border-emerald-500' : 'border-neutral-700'
                    }`}>
                        {getIcon(stage.status)}
                    </div>
                    <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-bold ${stage.status === 'running' ? 'text-blue-400' : 'text-neutral-400'}`}>{stage.name}</span>
                        <span className="text-[9px] text-neutral-600 font-mono">{stage.duration}</span>
                    </div>
                </div>
            ))}
        </div>

        {/* Current Stage Details */}
        <div className="border border-neutral-800 rounded bg-black/50 overflow-hidden flex flex-col h-64">
            <div className="h-8 bg-neutral-900/50 border-b border-neutral-800 flex items-center px-3 gap-2">
                <Terminal size={12} className="text-neutral-500" />
                <span className="text-[10px] font-mono text-neutral-400">BUILD LOGS</span>
            </div>
            <div className="flex-1 p-3 font-mono text-[10px] text-neutral-400 overflow-y-auto space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className="hover:bg-white/5 px-1 rounded">{log}</div>
                ))}
                <div className="w-2 h-4 bg-neutral-500 animate-pulse inline-block"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineMonitor;