import React from 'react';
import { ContextDef } from '../chrome/ContextBar';

interface ContextZoneProps {
  context: ContextDef;
  isActive: boolean;
  width: number;
  height: number;
  isSelected?: boolean;
  isVisible?: boolean;
  onSelect?: (contextId: string) => void;
  panOffset?: { x: number; y: number };
}

const ContextZone: React.FC<ContextZoneProps> = ({ context, isActive, width, height, isSelected = false, isVisible = true, onSelect, panOffset = { x: 0, y: 0 } }) => {
  const worldX = context.x + panOffset.x;
  const worldY = context.y + panOffset.y;
  const opacityClass = isVisible ? ((isActive || isSelected) ? 'opacity-100' : 'opacity-30') : 'opacity-0';
  const borderClass = isSelected ? 'border-white/70' : isActive ? 'border-neutral-700' : 'border-neutral-800/50';
  const buttonVisibilityClass = isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';

  return (
    <>
      <div 
          className={`absolute border transition-all duration-500 pointer-events-none select-none z-0 ${opacityClass} ${borderClass}
          `}
          style={{
              left: worldX,
              top: worldY,
              width: width,
              height: height,
          }}
      >
          {/* Corner Markers */}
          <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-current"></div>
          <div className="absolute -top-px -right-px w-4 h-4 border-t border-r border-current"></div>
          <div className="absolute -bottom-px -left-px w-4 h-4 border-b border-l border-current"></div>
          <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-current"></div>

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

      <button
          onClick={() => onSelect?.(context.id)}
          className={`absolute z-10 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-300 px-2 py-1 rounded-full border ${buttonVisibilityClass}
              ${isSelected ? 'text-white border-white/60 bg-white/10' : isActive ? 'text-white border-neutral-700/60 bg-black/60' : 'text-neutral-700 border-neutral-800/60 bg-black/40 hover:text-white'}
          `}
          style={{
              left: worldX,
              top: worldY - 24
          }}
          title={`Select ${context.label} zone`}
      >
          <span style={{ color: isActive || isSelected ? context.color : undefined }}>{context.icon}</span>
          {context.label} // SECTOR
      </button>
    </>
  );
};

export default ContextZone;
