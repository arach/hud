import React from 'react';
import { ContextDef } from './ContextBar';

interface ContextZoneProps {
  context: ContextDef;
  isActive: boolean;
  width: number;
  height: number;
}

const ContextZone: React.FC<ContextZoneProps> = ({ context, isActive, width, height }) => {
  return (
    <div 
        className={`absolute border transition-all duration-500 pointer-events-none select-none z-0
            ${isActive ? 'border-neutral-700 opacity-100' : 'border-neutral-800/50 opacity-30'}
        `}
        style={{
            left: context.x,
            top: context.y,
            width: width,
            height: height,
        }}
    >
        {/* Corner Markers */}
        <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-current"></div>
        <div className="absolute -top-px -right-px w-4 h-4 border-t border-r border-current"></div>
        <div className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-current"></div>
        <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-current"></div>

        {/* Label */}
        <div className={`absolute -top-6 left-0 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-500 flex items-center gap-2
            ${isActive ? 'text-white' : 'text-neutral-700'}
        `}>
            <span style={{ color: isActive ? context.color : undefined }}>{context.icon}</span>
            {context.label} // SECTOR
        </div>

        {/* Grid Pattern Background for Active Zone */}
        {isActive && (
            <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(to right, ${context.color} 1px, transparent 1px), linear-gradient(to bottom, ${context.color} 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />
        )}
    </div>
  );
};

export default ContextZone;