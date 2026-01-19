import React from 'react';
import { RefreshCw, Globe, Smartphone, Monitor, BarChart3, PieChart, Activity, MoreHorizontal } from 'lucide-react';

const UiPreview: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-black text-neutral-200 font-sans">
        {/* Browser Chrome */}
        <div className="h-10 bg-[#0a0a0a] border-b border-neutral-800 flex items-center px-3 gap-3 shrink-0">
            <div className="flex gap-1.5 mr-1">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-700/50" />
            </div>
            
            <button className="text-neutral-600 hover:text-neutral-300 transition-colors">
                <RefreshCw size={12} />
            </button>

            {/* URL Bar */}
            <div className="flex-1 bg-[#050505] rounded-md h-7 border border-neutral-800 flex items-center px-3 text-[10px] text-neutral-400 font-mono group hover:border-neutral-700 transition-colors relative overflow-hidden">
                <div className="flex items-center gap-1 z-10">
                    <span className="text-emerald-600">https://</span>
                    <span className="text-neutral-300">localhost:3000</span>
                    <span className="text-neutral-600">/dashboard/analytics</span>
                </div>
            </div>

            <div className="flex gap-3 text-neutral-600 px-1 border-l border-neutral-800 pl-3">
                 <Smartphone size={14} className="hover:text-white cursor-pointer transition-colors" />
                 <Monitor size={14} className="text-emerald-500 cursor-pointer" />
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative bg-black overflow-y-auto p-8 custom-scrollbar">
            <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
                 
                 {/* Dashboard Header */}
                 <div className="flex items-end justify-between border-b border-neutral-900 pb-4">
                     <div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Overview</h1>
                        <p className="text-xs text-neutral-500">System performance metrics</p>
                     </div>
                     <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded text-xs transition-colors">Filter</button>
                        <button className="px-3 py-1.5 bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-900/50 text-emerald-400 rounded text-xs font-medium transition-all">Export Report</button>
                     </div>
                 </div>
                 
                 {/* Key Stats */}
                 <div className="grid grid-cols-3 gap-4">
                     {[
                        { label: 'Total Requests', val: '2.4M', change: '+12%', color: 'text-emerald-400', sub: 'requests/sec' },
                        { label: 'Avg Latency', val: '42ms', change: '-4%', color: 'text-emerald-400', sub: 'global avg' },
                        { label: 'Error Rate', val: '0.01%', change: '+0.002%', color: 'text-amber-500', sub: 'last 24h' }
                     ].map((stat, i) => (
                         <div key={i} className="p-5 bg-[#080808] border border-neutral-800/60 rounded-xl hover:border-neutral-700 transition-all group hover:bg-[#0c0c0c]">
                             <div className="flex justify-between items-start mb-3">
                                <div className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">{stat.label}</div>
                                <Activity size={14} className="text-neutral-800 group-hover:text-neutral-600 transition-colors" />
                             </div>
                             <div className="flex items-baseline gap-2">
                                <div className="text-3xl font-light text-white tracking-tight">{stat.val}</div>
                                <div className={`text-[10px] ${stat.color} font-mono bg-neutral-900/50 px-1.5 rounded`}>{stat.change}</div>
                             </div>
                             <div className="text-[10px] text-neutral-600 mt-2">{stat.sub}</div>
                         </div>
                     ))}
                 </div>

                 {/* Charts Section */}
                 <div className="grid grid-cols-3 gap-4 min-h-[250px]">
                    <div className="col-span-2 bg-[#080808] border border-neutral-800/60 rounded-xl p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-sm font-medium text-neutral-200">Traffic Volume</h3>
                                <div className="text-[10px] text-neutral-600">Inbound HTTP requests</div>
                            </div>
                            <BarChart3 size={16} className="text-neutral-700" />
                        </div>
                        <div className="flex-1 flex items-end gap-1 px-1 border-b border-neutral-800/50 pb-1">
                             {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95, 85, 60, 70, 50, 40, 60].map((h, i) => (
                                 <div key={i} className="flex-1 flex flex-col justify-end group h-full">
                                    <div 
                                        className="w-full bg-neutral-800/50 group-hover:bg-emerald-500/80 transition-all rounded-sm relative" 
                                        style={{ height: `${h}%` }}
                                    ></div>
                                 </div>
                             ))}
                        </div>
                    </div>
                    
                    <div className="bg-[#080808] border border-neutral-800/60 rounded-xl p-5 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-neutral-200">Distribution</h3>
                            <PieChart size={16} className="text-neutral-700" />
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <div className="relative w-32 h-32">
                                <svg viewBox="0 0 100 100" className="rotate-[-90deg]">
                                    <circle cx="50" cy="50" r="40" stroke="#1f1f1f" strokeWidth="12" fill="none" />
                                    <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="12" fill="none" strokeDasharray="200" strokeDashoffset="50" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-bold text-white">75%</span>
                                    <span className="text-[9px] text-neutral-500">Mobile</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Data Table */}
                 <div className="bg-[#080808] border border-neutral-800/60 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-neutral-800/50 flex justify-between items-center bg-neutral-900/20">
                        <span className="text-xs font-medium text-neutral-400">Recent Transactions</span>
                        <MoreHorizontal size={14} className="text-neutral-600 cursor-pointer hover:text-neutral-400" />
                    </div>
                    <div className="divide-y divide-neutral-800/30">
                        {[1,2,3,4].map((_, i) => (
                            <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-neutral-900/30 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-500 group-hover:border-neutral-700 group-hover:text-neutral-300 transition-colors">
                                        TX
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs text-neutral-300">Stripe Payment Processed</span>
                                        <span className="text-[10px] text-neutral-600">ID #99283-22 • 2 mins ago</span>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-emerald-500/80">+$240.00</span>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default UiPreview;