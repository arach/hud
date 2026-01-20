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
  className?: string;
  isFixed?: boolean;
  orientation?: 'vertical' | 'horizontal';
  /** When true, strips fixed positioning for use inside NavigationStack */
  embedded?: boolean;
}

const ContextDock: React.FC<ContextDockProps> = ({ activeView, onSelectView, activeThreads, className = '', isFixed = true, orientation = 'vertical', embedded = false }) => {
  const isHorizontal = orientation === 'horizontal';

  // When embedded, no fixed positioning
  const dockPositionClass = embedded
    ? ''
    : isFixed
      ? (isHorizontal ? 'fixed right-6 top-6 z-50' : 'fixed left-6 top-1/2 -translate-y-1/2 z-50')
      : '';
  
  // Calculate active thread counts per view type for the bubbles
  const getThreadCount = (mode: ViewMode) => {
    if (mode === 'spatial') return activeThreads.length;
    // For specific views, we'd need to map threads to window types, 
    // but for this demo we'll approximate based on simulated data or just show relevant ones
    return activeThreads.filter(t => t.isActive).length; 
  };

  const iconSize = embedded ? 16 : 20;
  const navItems = [
    { id: 'spatial', label: 'Spatial', fullLabel: 'SPATIAL MAP', icon: <Globe size={iconSize} />, color: '#ffffff' },
    { id: 'terminals', label: 'Terminals', fullLabel: 'TERM GRID', icon: <TerminalSquare size={iconSize} />, color: '#f59e0b' },
    { id: 'editors', label: 'Editors', fullLabel: 'CODE GRID', icon: <FileCode size={iconSize} />, color: '#10b981' },
    { id: 'visuals', label: 'Visuals', fullLabel: 'VISUAL GRID', icon: <LayoutGrid size={iconSize} />, color: '#3b82f6' },
  ];

  // Container styling differs based on embedded mode
  const containerClasses = embedded
    ? `flex ${isHorizontal ? 'flex-row items-center justify-center w-full py-2' : 'flex-col py-4 px-2'} gap-4`
    : `flex ${isHorizontal ? 'flex-row items-center px-4 py-2' : 'flex-col py-4 px-2'} bg-black/80 backdrop-blur-xl border border-neutral-800 rounded-full shadow-2xl gap-4`;

  return (
    <div
        className={`${dockPositionClass} flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-6 pointer-events-auto ${className}`}
    >
      {/* Main Navigation Pill */}
      <div className={containerClasses}>
        
        {navItems.map((item) => {
            const isActive = activeView === item.id;
            const threadCount = getThreadCount(item.id as ViewMode);
            const hasActivity = threadCount > 0 && item.id !== 'spatial';

            // Embedded mode: show label buttons
            if (embedded) {
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id as ViewMode)}
                  className={`
                    relative flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 shrink-0
                    ${isActive
                      ? 'bg-white/10 text-white border border-neutral-600/50'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <span style={{ color: isActive ? item.color : undefined }} className="transition-colors">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>

                  {/* Activity indicator */}
                  {hasActivity && (
                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>
              );
            }

            // Default: icon-only buttons with tooltips
            return (
                <div key={item.id} className="relative group flex items-center justify-center shrink-0">
                    {/* Tooltip */}
                    <div className={`absolute px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-bold tracking-wider text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl flex items-center gap-2 ${isHorizontal ? 'bottom-full mb-3 left-1/2 -translate-x-1/2' : 'left-full ml-4'}`}>
                        {item.fullLabel}
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
                                className={`${isHorizontal ? 'absolute -bottom-3 left-1/2 -translate-x-1/2 h-0.5 w-6' : 'absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-6'} rounded-full shadow-[0_0_10px_currentColor] transition-all`}
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
