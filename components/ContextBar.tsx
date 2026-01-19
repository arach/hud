import React from 'react';
import { Layers, Monitor, Cpu, Code2, PenTool, Globe } from 'lucide-react';

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
  
  // Separate Global from specific scopes
  const globalContext = contexts.find(c => c.id === 'global');
  const specificContexts = contexts.filter(c => c.id !== 'global');

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 pointer-events-auto">
      
      {/* Global Scope Button */}
      {globalContext && (
          <button
            onClick={() => onSelect(globalContext)}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold tracking-wide transition-all duration-300 shadow-xl border backdrop-blur-md
                ${activeContextId === 'global' 
                    ? 'bg-neutral-100/90 text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                    : 'bg-black/40 text-neutral-400 border-neutral-800 hover:bg-black/60 hover:text-white'}
            `}
          >
             <Globe size={14} className={activeContextId === 'global' ? 'animate-spin-slow' : ''} />
             <span>GLOBAL NETWORK</span>
          </button>
      )}

      {/* Vertical Divider */}
      <div className="w-px h-6 bg-white/10"></div>

      {/* Specific Scopes Pill */}
      <div className="flex bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-full p-1 shadow-2xl gap-1 transition-colors duration-300 hover:bg-neutral-900/80">
        {specificContexts.map((ctx) => {
            const isActive = activeContextId === ctx.id;
            return (
                <button
                    key={ctx.id}
                    onClick={() => onSelect(ctx)}
                    className={`
                        relative flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-300
                        ${isActive ? 'text-black shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/10'}
                    `}
                    style={{
                        backgroundColor: isActive ? ctx.color : 'transparent',
                        boxShadow: isActive ? `0 0 15px ${ctx.color}60` : 'none'
                    }}
                >
                    {/* Icon */}
                    <span className={isActive ? 'opacity-90' : 'opacity-60'}>
                        {ctx.icon}
                    </span>
                    
                    {/* Label */}
                    <span>{ctx.label}</span>

                    {/* Active Glow */}
                    {isActive && (
                        <div className="absolute inset-0 rounded-full bg-white/20 blur-[4px] -z-10"></div>
                    )}
                </button>
            );
        })}
      </div>
    </div>
  );
};

export default ContextBar;