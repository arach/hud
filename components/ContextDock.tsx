import React from 'react';
import { 
  Globe, 
  Code2, 
  Cpu, 
  PenTool, 
  LayoutDashboard, 
  MessageSquare
} from 'lucide-react';

export type FilterType = 'all' | 'dev' | 'ops' | 'design';

interface ContextDockProps {
  activeFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  onVisualOverview: () => void;
}

const ContextDock: React.FC<ContextDockProps> = ({ activeFilter, onSelectFilter, onVisualOverview }) => {
  
  const navItems = [
    { id: 'all', label: 'SPATIAL VIEW', icon: <Globe size={20} />, color: '#ffffff' },
    { id: 'dev', label: 'DEV STREAM', icon: <Code2 size={20} />, color: '#10b981' },
    { id: 'ops', label: 'OPS COMMAND', icon: <Cpu size={20} />, color: '#f59e0b' },
    { id: 'design', label: 'DESIGN LAB', icon: <PenTool size={20} />, color: '#3b82f6' },
  ];

  return (
    <div 
        className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 pointer-events-auto"
    >
      {/* Main Navigation Pill */}
      <div className="flex flex-col bg-black/80 backdrop-blur-xl border border-neutral-800 rounded-full py-4 px-2 shadow-2xl gap-4">
        
        {navItems.map((item) => {
            const isActive = activeFilter === item.id;
            
            return (
                <div key={item.id} className="relative group flex items-center justify-center shrink-0">
                    {/* Tooltip */}
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-bold tracking-wider text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                        {item.label}
                        {isActive && <span className="ml-2 text-emerald-500">• ACTIVE</span>}
                    </div>

                    <button
                        onClick={() => onSelectFilter(item.id as FilterType)}
                        className={`
                            relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group
                            ${isActive ? 'bg-neutral-800 scale-110' : 'hover:bg-neutral-800/50 hover:scale-105'}
                        `}
                    >
                        <div style={{ color: isActive ? item.color : '#525252' }} className="transition-colors">
                            {item.icon}
                        </div>
                        
                        {/* Active Indicator Ring */}
                        {isActive && (
                            <div className="absolute inset-0 rounded-full border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"></div>
                        )}
                        
                        {/* Vertical Active Line */}
                        {isActive && (
                            <div 
                                className="absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full shadow-[0_0_10px_currentColor] transition-all"
                                style={{ backgroundColor: item.color }}
                            ></div>
                        )}
                    </button>
                    
                    {/* Chat Context Indicator (Small Dot) */}
                    {isActive && (
                        <div className="absolute -bottom-1 -right-1 bg-neutral-950 rounded-full p-0.5 border border-neutral-800">
                             <MessageSquare size={8} className="text-neutral-500" />
                        </div>
                    )}
                </div>
            );
        })}

        <div className="w-full h-px bg-neutral-800/50 my-1 shrink-0"></div>

        {/* Visual Overview Action */}
        <div className="relative group flex items-center justify-center shrink-0">
             <div className="absolute left-full ml-4 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-bold tracking-wider text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                VISUAL OVERVIEW
             </div>
             <button 
                onClick={onVisualOverview}
                className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all hover:scale-105"
             >
                <LayoutDashboard size={20} />
             </button>
        </div>

      </div>
    </div>
  );
};

export default ContextDock;