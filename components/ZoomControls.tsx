import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/**
 * Map-style zoom controls that float on the canvas
 * Positioned at bottom-right of the canvas viewport (not the inspector area)
 */
const ZoomControls: React.FC<ZoomControlsProps> = ({ scale, onZoomIn, onZoomOut }) => {
  return (
    <div className="fixed bottom-12 right-[296px] z-30 pointer-events-auto flex items-center gap-1 bg-black/80 backdrop-blur-xl border border-neutral-800 rounded-lg p-1">
      <button
        onClick={onZoomOut}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        title="Zoom Out"
      >
        <Minus size={14} />
      </button>

      <span className="w-12 text-center text-[10px] font-mono text-neutral-400 select-none tabular-nums">
        {Math.round(scale * 100)}%
      </span>

      <button
        onClick={onZoomIn}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        title="Zoom In"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

export default ZoomControls;
