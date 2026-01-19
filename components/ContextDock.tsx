import React from 'react';
import { ContextDef } from './ContextBar'; 
import { WindowState } from '../types';
import { Magnet, LayoutGrid } from 'lucide-react';

interface ContextDockProps {
  contexts: ContextDef[];
  activeContextId: string;
  onSelect: (context: ContextDef) => void;
  windows: WindowState[];
  onGather: (contextId: string) => void;
  onArrange: (contextId: string) => void;
}

const ContextDock: React.FC<ContextDockProps> = ({ contexts, activeContextId, onSelect, windows, onGather, onArrange }) => {
  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4 pointer-events-auto">
      {/* Main Dock Pill */}
      <div className="flex flex-col bg-black/80 backdrop-blur-xl border border-neutral-800 rounded-full py-3 px-2 shadow-2xl gap-3">
        
        {/* Context Navigation */}
        {contexts.map((ctx) => {
            const isActive = activeContextId === ctx.id;
            const count = windows.filter(w => w.contextId === ctx.id).length;
            
            return (
                <div key={ctx.id} className="relative group flex items-center justify-center">
                    {/* Tooltip (Left side) */}
                    <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {ctx.label}
                    </div>

                    <button
                        onClick={() => onSelect(ctx)}
                        className={`
                            relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group
                            ${isActive ? 'bg-neutral-800' : 'hover:bg-neutral-800/50'}
                        `}
                    >
                        <div style={{ color: isActive ? ctx.color : '#525252' }} className="transition-colors">
                            {ctx.icon}
                        </div>
                        
                        {/* Active Indicator */}
                        {isActive && (
                            <div className="absolute inset-0 rounded-full border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"></div>
                        )}
                        
                        {/* Vertical Active Line */}
                        {isActive && (
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                        )}
                    </button>

                    {/* Window Count Dot */}
                    {count > 0 && (
                        <div className="absolute top-0 right-0 w-3 h-3 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                             <div className="w-1 h-1 rounded-full bg-neutral-500"></div>
                        </div>
                    )}
                </div>
            );
        })}

        <div className="w-full h-px bg-neutral-800/50 my-1"></div>

        {/* Intra-Context Tools */}
        
        {/* Action: Gather Windows */}
        <div className="relative group flex items-center justify-center">
             <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Gather Windows (Magnet)
             </div>
             <button 
                onClick={() => onGather(activeContextId)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all"
             >
                <Magnet size={18} />
             </button>
        </div>

        {/* Action: Arrange Grid */}
        <div className="relative group flex items-center justify-center">
             <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Arrange Grid
             </div>
             <button 
                onClick={() => onArrange(activeContextId)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all"
             >
                <LayoutGrid size={18} />
             </button>
        </div>

      </div>
    </div>
  );
};

export default ContextDock;