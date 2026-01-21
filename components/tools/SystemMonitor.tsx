import React, { useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Activity, Cpu, HardDrive, Zap, MemoryStick } from 'lucide-react';

const generateData = (length: number) => Array.from({ length }, (_, i) => ({
  time: i,
  value: Math.floor(Math.random() * 30) + 40
}));

const SystemMonitor: React.FC = () => {
  const [data, setData] = useState(generateData(20));
  const [cpuVal, setCpuVal] = useState(45);
  const [memVal, setMemVal] = useState(32);
  const [processes, setProcesses] = useState([
    { name: 'hud_core', cpu: 12, mem: 250, status: 'active' },
    { name: 'gemini_link', cpu: 8, mem: 120, status: 'active' },
    { name: 'ui_renderer', cpu: 25, mem: 400, status: 'warning' },
    { name: 'db_worker', cpu: 2, mem: 80, status: 'idle' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [...prev.slice(1), { time: Date.now(), value: Math.floor(Math.random() * 30) + 40 }]);
      setCpuVal(prev => Math.floor((prev + Math.random() * 10 - 5 + 100) % 100));
      setMemVal(prev => Math.floor((prev + Math.random() * 5 - 2 + 100) % 100));
      
      setProcesses(prev => prev.map(p => ({
          ...p,
          cpu: Math.max(0, Math.min(100, p.cpu + (Math.random() * 10 - 5)))
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col gap-2 bg-[#0a0a0a] p-2">
      
      {/* Top Metrics Row */}
      <div className="flex h-24 gap-2">
          {/* CPU Card */}
          <div className="flex-1 bg-neutral-900/50 border border-neutral-800 p-3 flex flex-col rounded">
             <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2 text-neutral-400">
                    <Cpu size={12} />
                    <span className="text-[9px] font-bold">CPU</span>
                </div>
                <span className="text-lg font-light text-white">{cpuVal}%</span>
             </div>
             <div className="flex-1 w-full" style={{ minHeight: 40 }}>
               <ResponsiveContainer width="100%" height={40}>
                 <AreaChart data={data}>
                   <defs>
                     <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1} fill="url(#colorCpu)" isAnimationActive={false} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Memory Card */}
          <div className="flex-1 bg-neutral-900/50 border border-neutral-800 p-3 flex flex-col rounded">
             <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2 text-neutral-400">
                    <Zap size={12} />
                    <span className="text-[9px] font-bold">MEM</span>
                </div>
                <span className="text-lg font-light text-white">{memVal}%</span>
             </div>
             <div className="flex-1 w-full min-h-0 flex items-end gap-1">
                 {[...Array(10)].map((_, i) => (
                     <div key={i} className={`flex-1 rounded-t ${i < (memVal/10) ? 'bg-blue-500' : 'bg-neutral-800'}`} style={{ height: `${20 + Math.random() * 80}%` }} />
                 ))}
             </div>
          </div>
      </div>

      {/* Process List */}
      <div className="flex-1 bg-neutral-900/30 border border-neutral-800 rounded flex flex-col min-h-0">
          <div className="h-7 border-b border-neutral-800 flex items-center px-3 justify-between bg-neutral-900">
              <span className="text-[9px] font-bold text-neutral-500 uppercase">Active Processes</span>
              <Activity size={10} className="text-neutral-600" />
          </div>
          <div className="flex-1 overflow-y-auto p-1 space-y-1">
              <div className="flex px-2 text-[8px] text-neutral-600 uppercase mb-1">
                  <div className="flex-1">Name</div>
                  <div className="w-12 text-right">CPU</div>
                  <div className="w-12 text-right">MEM</div>
                  <div className="w-16 text-right">Status</div>
              </div>
              {processes.map((p, i) => (
                  <div key={i} className="flex items-center px-2 py-1.5 bg-black/40 hover:bg-white/5 rounded text-[10px] font-mono">
                      <div className="flex-1 text-neutral-300">{p.name}</div>
                      <div className="w-12 text-right text-neutral-500">{p.cpu.toFixed(1)}%</div>
                      <div className="w-12 text-right text-neutral-500">{p.mem}M</div>
                      <div className="w-16 text-right flex justify-end">
                          <span className={`px-1.5 rounded-sm text-[8px] ${p.status === 'active' ? 'text-emerald-400 bg-emerald-900/20' : p.status === 'warning' ? 'text-amber-400 bg-amber-900/20' : 'text-neutral-500'}`}>
                              {p.status.toUpperCase()}
                          </span>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default SystemMonitor;