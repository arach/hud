import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ scale, onZoomIn, onZoomOut }) => {
  return (
    <div className="fixed bottom-10 right-6 z-40 pointer-events-auto flex flex-col gap-1">
      <button
        onClick={onZoomIn}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/80 backdrop-blur-xl border border-neutral-700/50 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        title="Zoom In"
      >
        <Plus size={14} />
      </button>

      <div className="h-8 flex items-center justify-center rounded-lg bg-black/80 backdrop-blur-xl border border-neutral-700/50 text-[10px] font-mono text-neutral-400 select-none">
        {Math.round(scale * 100)}%
      </div>

      <button
        onClick={onZoomOut}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/80 backdrop-blur-xl border border-neutral-700/50 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        title="Zoom Out"
      >
        <Minus size={14} />
      </button>
    </div>
  );
};

export default ZoomControls;
