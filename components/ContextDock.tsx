import React from 'react';
import { 
  Globe, 
  TerminalSquare,
  FileCode,
  LayoutGrid,
  MessageCircle
} from 'lucide-react';
import { AiThread } from '../types';

export type ViewMode = 'spatial' | 'terminals' | 'editors' | 'visuals';

interface ContextDockProps {
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  activeThreads: AiThread[];
}

const ContextDock: React.FC<ContextDockProps> = ({ activeView, onSelectView, activeThreads }) => {
  
  // Calculate active thread counts per view type for the bubbles
  const getThreadCount = (mode: ViewMode) => {
    if (mode === 'spatial') return activeThreads.length;
    // For specific views, we'd need to map threads to window types, 
    // but for this demo we'll approximate based on simulated data or just show relevant ones
    return activeThreads.filter(t => t.isActive).length; 
  };

  const navItems = [
    { id: 'spatial', label: 'SPATIAL MAP', icon: <Globe size={20} />, color: '#ffffff' },
    { id: 'terminals', label: 'TERM GRID', icon: <TerminalSquare size={20} />, color: '#f59e0b' },
    { id: 'editors', label: 'CODE GRID', icon: <FileCode size={20} />, color: '#10b981' },
    { id: 'visuals', label: 'VISUAL GRID', icon: <LayoutGrid size={20} />, color: '#3b82f6' },
  ];

  return (
    <div 
        className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 pointer-events-auto"
    >
      {/* Main Navigation Pill */}
      <div className="flex flex-col bg-black/80 backdrop-blur-xl border border-neutral-800 rounded-full py-4 px-2 shadow-2xl gap-4">
        
        {navItems.map((item) => {
            const isActive = activeView === item.id;
            const threadCount = getThreadCount(item.id as ViewMode);
            const hasActivity = threadCount > 0 && item.id !== 'spatial'; // Show specific bubbles on specific tabs

            return (
                <div key={item.id} className="relative group flex items-center justify-center shrink-0">
                    {/* Tooltip */}
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-bold tracking-wider text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl flex items-center gap-2">
                        {item.label}
                        {isActive && <span className="text-emerald-500">• ACTIVE</span>}
                    </div>

                    <button
                        onClick={() => onSelectView(item.id as ViewMode)}
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
                    
                    {/* AI Conversation Bubble (Sidebar Level) */}
                    {hasActivity && (
                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-black shadow-lg animate-in zoom-in duration-300">
                             {threadCount}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ContextDock;