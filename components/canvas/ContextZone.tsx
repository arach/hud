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

const BEZEL_SIDE = 8;    // thin chrome on top & sides
const BEZEL_BOTTOM = 32; // thicker bottom chin

const ContextZone: React.FC<ContextZoneProps> = ({ context, isActive, width, height, isSelected = false, isVisible = true, onSelect, panOffset = { x: 0, y: 0 } }) => {
  const worldX = context.x + panOffset.x - BEZEL_SIDE;
  const worldY = context.y + panOffset.y - BEZEL_SIDE;
  const bezelW = width + BEZEL_SIDE * 2;
  const bezelH = height + BEZEL_SIDE + BEZEL_BOTTOM;
  const opacityClass = isVisible ? ((isActive || isSelected) ? 'opacity-100' : 'opacity-30') : 'opacity-0';
  const buttonVisibilityClass = isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';

  return (
    <div
        className={`absolute rounded-[6px] transition-all duration-500 select-none z-0 ${opacityClass}`}
        style={{
            left: worldX,
            top: worldY,
            width: bezelW,
            height: bezelH,
            pointerEvents: 'none',
            background: 'linear-gradient(180deg, #222 0%, #171717 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            borderBottom: '1px solid rgba(0,0,0,0.4)',
            boxShadow: isSelected
              ? `0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 30px ${context.color}15`
              : '0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
    >
        {/* Inner recessed area where windows live */}
        <div
            className="absolute rounded-[3px]"
            style={{
                left: BEZEL_SIDE - 1,
                top: BEZEL_SIDE - 1,
                right: BEZEL_SIDE - 1,
                bottom: BEZEL_BOTTOM - 1,
                border: '1px solid rgba(0,0,0,0.3)',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.4)',
                background: 'rgba(0,0,0,0.15)',
            }}
        />

        {/* Grid Pattern Background for Active Zone */}
        {isActive && (
            <div
                className="absolute rounded-[3px] opacity-[0.03]"
                style={{
                    left: BEZEL_SIDE,
                    top: BEZEL_SIDE,
                    right: BEZEL_SIDE,
                    bottom: BEZEL_BOTTOM,
                    backgroundImage: `linear-gradient(to right, ${context.color} 1px, transparent 1px), linear-gradient(to bottom, ${context.color} 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />
        )}

        {/* Horizontal divider above bottom chin */}
        <div
            className="absolute"
            style={{
                left: BEZEL_SIDE + 8,
                right: BEZEL_SIDE + 8,
                bottom: BEZEL_BOTTOM,
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent)',
            }}
        />

        {/* Figure callout — bottom chin */}
        <button
            onClick={(e) => { e.stopPropagation(); onSelect?.(context.id); }}
            className={`absolute flex items-center gap-1.5 transition-all duration-500 ${buttonVisibilityClass}
                ${isSelected ? 'opacity-100' : isActive ? 'opacity-70' : 'opacity-30 hover:opacity-50'}
            `}
            style={{
                left: BEZEL_SIDE + 8,
                bottom: 8,
            }}
            title={`Select ${context.label} zone`}
        >
            <span className="text-[8px] tracking-[0.08em] text-neutral-500 font-mono whitespace-nowrap">
              view.spatial.ctx.{context.id}
            </span>
            <span className="text-[8px] text-neutral-600 font-mono">/</span>
            <span
              className="text-[9px] font-bold tracking-[0.2em] uppercase font-mono whitespace-nowrap"
              style={{ color: isActive || isSelected ? context.color : 'rgb(100,100,100)' }}
            >
              {context.label}
            </span>
        </button>
    </div>
  );
};

export default ContextZone;
