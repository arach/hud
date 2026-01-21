import React from 'react';
import { X, Maximize2, Minimize2, GripHorizontal, Terminal, Link2, Filter } from 'lucide-react';

interface TerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleMaximize?: () => void;
  isMaximized?: boolean;
  activeContextLabel?: string;
  activeScope?: string; // New prop for filter scope
  children: React.ReactNode;
}

const TerminalDrawer: React.FC<TerminalDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onToggleMaximize, 
  isMaximized = false, 
  activeContextLabel = 'GLOBAL',
  activeScope = 'ALL',
  children 
}) => {
  return (
    <div 
      className={`
        fixed left-0 right-0 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] transition-all duration-300 ease-in-out z-40 flex flex-col border-t border-neutral-800 bottom-7
        bg-black/90 backdrop-blur-xl
        ${isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}
      `}
      style={{
        height: isMaximized ? 'calc(100% - 28px)' : '320px' 
      }}
    >
        {/* Drawer Header / Handle */}
        <div className="h-9 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0 select-none backdrop-blur-sm">
             
             {/* Left: Title & Context */}
             <div className="flex items-center gap-4 w-64">
                <div className="flex items-center gap-2 text-emerald-400">
                    <Terminal size={14} />
                    <span className="text-xs font-bold tracking-widest font-mono">TERMINAL_UPLINK</span>
                </div>
                {/* Scope Badge */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-800/80 rounded border border-neutral-700/50">
                    <Filter size={10} className="text-neutral-500" />
                    <span className="text-[9px] font-bold text-neutral-300 uppercase truncate max-w-[120px]">SCOPE: {activeScope}</span>
                </div>
             </div>

             {/* Center: Grip Handle */}
             <div 
                className="flex-1 flex items-center justify-center h-full cursor-ns-resize text-neutral-700 hover:text-neutral-500 transition-colors group"
                title="Drag to Resize"
             >
                <div className="w-16 h-1 rounded-full bg-neutral-800 group-hover:bg-neutral-700 transition-colors"></div>
             </div>

             {/* Right: Window Controls */}
             <div className="flex items-center gap-2 w-64 justify-end">
                <button 
                    onClick={onToggleMaximize}
                    className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
                    title={isMaximized ? "Restore Size" : "Maximize Panel"}
                >
                    {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button 
                    onClick={onClose}
                    className="p-1.5 rounded hover:bg-red-900/20 text-neutral-500 hover:text-red-400 transition-colors"
                    title="Close Terminal"
                >
                    <X size={14} />
                </button>
             </div>
        </div>
        
        {/* Content Container */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-transparent">
             {children}
        </div>
    </div>
  );
};

export default TerminalDrawer;