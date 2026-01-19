import React from 'react';
import { Layers, Monitor, Cpu, Code2, PenTool } from 'lucide-react';

export interface ContextDef {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  icon: React.ReactNode;
}

interface ContextBarProps {
  contexts: ContextDef[];
  activeContextId: string;
  onSelect: (context: ContextDef) => void;
}

const ContextBar: React.FC<ContextBarProps> = ({ contexts, activeContextId, onSelect }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-auto">
      <div className="flex bg-black/80 backdrop-blur-md border border-neutral-800 rounded-full p-1.5 shadow-2xl gap-1">
        {contexts.map((ctx) => {
            const isActive = activeContextId === ctx.id;
            return (
                <button
                    key={ctx.id}
                    onClick={() => onSelect(ctx)}
                    className={`
                        relative flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-300
                        ${isActive ? 'text-black' : 'text-neutral-400 hover:text-white hover:bg-white/10'}
                    `}
                    style={{
                        backgroundColor: isActive ? ctx.color : 'transparent',
                    }}
                >
                    {/* Icon */}
                    <span className={isActive ? 'opacity-80' : 'opacity-60'}>
                        {ctx.icon}
                    </span>
                    
                    {/* Label */}
                    <span>{ctx.label}</span>

                    {/* Active Glow */}
                    {isActive && (
                        <div className="absolute inset-0 rounded-full bg-white/20 blur-[8px] -z-10"></div>
                    )}
                </button>
            );
        })}
      </div>
      
      {/* Connector Line to Active Context (Visual Flourish) */}
      <div className="h-4 w-px bg-gradient-to-b from-neutral-800 to-transparent"></div>
    </div>
  );
};

export default ContextBar;