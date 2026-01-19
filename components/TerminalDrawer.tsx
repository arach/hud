import React from 'react';
import { X, Maximize2, Minimize2, GripHorizontal, Terminal, Link2 } from 'lucide-react';

interface TerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleMaximize?: () => void;
  isMaximized?: boolean;
  activeContextLabel?: string;
  children: React.ReactNode;
}

const TerminalDrawer: React.FC<TerminalDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onToggleMaximize, 
  isMaximized = false, 
  activeContextLabel = 'GLOBAL',
  children 
}) => {
  return (
    <div 
      className={`
        absolute left-0 right-0 bg-black shadow-[0_-10px_40px_rgba(0,0,0,0.8)] transition-all duration-300 ease-in-out z-40 flex flex-col border-t border-neutral-800
        ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
      `}
      style={{
        bottom: '28px', // Height of status bar
        height: isMaximized ? 'calc(100% - 28px)' : '320px' 
      }}
    >
        {/* Drawer Header / Handle */}
        <div className="h-8 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-3 shrink-0 select-none">
             
             {/* Left: Title & Context */}
             <div className="flex items-center gap-4 w-48">
                <div className="flex items-center gap-2 text-neutral-400">
                    <Terminal size={12} className="text-emerald-500" />
                    <span className="text-xs font-bold tracking-widest">TERMINAL_UPLINK</span>
                </div>
                {/* Context Badge */}
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-neutral-900 rounded border border-neutral-800/50">
                    <Link2 size={10} className="text-neutral-600" />
                    <span className="text-[9px] font-bold text-neutral-500 uppercase truncate max-w-[80px]">{activeContextLabel}</span>
                </div>
             </div>

             {/* Center: Grip Handle */}
             <div 
                className="flex-1 flex items-center justify-center h-full cursor-ns-resize text-neutral-800 hover:text-neutral-600 transition-colors"
                title="Drag to Resize"
             >
                <GripHorizontal size={16} />
             </div>

             {/* Right: Window Controls */}
             <div className="flex items-center gap-1 w-48 justify-end">
                <button 
                    onClick={onToggleMaximize}
                    className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors"
                    title={isMaximized ? "Restore Size" : "Maximize Panel"}
                >
                    {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button 
                    onClick={onClose}
                    className="p-1.5 rounded hover:bg-red-900/30 text-neutral-500 hover:text-red-400 transition-colors"
                    title="Close Terminal"
                >
                    <X size={14} />
                </button>
             </div>
        </div>
        
        {/* Content Container */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-black">
             {children}
        </div>
    </div>
  );
};

export default TerminalDrawer;