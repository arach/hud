import React, { useState, useEffect } from 'react';

interface DraggableWindowProps {
  id: string;
  title?: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  panOffset: { x: number; y: number };
  scale: number;
  zIndex: number;
  isSelected: boolean;
  isDimmed?: boolean; // New Prop
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onSelect: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({ 
  id,
  x, 
  y, 
  w,
  h,
  panOffset,
  scale,
  zIndex, 
  isSelected,
  isDimmed = false,
  onMove, 
  onResize,
  onSelect,
  children, 
  className = '' 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // We need to divide delta by scale to translate screen pixels to world pixels
        const deltaX = (e.clientX - dragStart.x) / scale;
        const deltaY = (e.clientY - dragStart.y) / scale;
        onMove(id, initialPos.x + deltaX, initialPos.y + deltaY);
      }
      if (isResizing && w !== undefined && h !== undefined) {
        const deltaX = (e.clientX - dragStart.x) / scale;
        const deltaY = (e.clientY - dragStart.y) / scale;
        onResize(id, Math.max(250, initialSize.w + deltaX), Math.max(150, initialSize.h + deltaY));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, initialPos, initialSize, id, onMove, onResize, w, h, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag if left click
    if (e.button !== 0) return;
    
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection start
    onSelect(id);
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ x, y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(id);
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialSize({ w: w || 0, h: h || 0 });
  };

  const handleContentMouseDown = (e: React.MouseEvent) => {
     e.stopPropagation();
     // Do not prevent default here to allow text selection
     onSelect(id);
  };

  // Position is calculated in world space + pan offset
  const worldX = x + panOffset.x;
  const worldY = y + panOffset.y;

  return (
    <div 
      style={{ 
        left: worldX, 
        top: worldY,
        width: w,
        height: h,
        zIndex: zIndex,
        position: 'absolute',
        touchAction: 'none',
        // Visual styling for dimmed state
        opacity: isDimmed ? 0.3 : 1,
        filter: isDimmed ? 'grayscale(100%) blur(1px)' : 'none',
        transition: 'opacity 0.3s ease, filter 0.3s ease',
        pointerEvents: isDimmed ? 'none' : 'auto' // Prevent interaction when dimmed
      }}
      className={`
        flex flex-col
        ${isDragging ? 'cursor-grabbing' : ''} 
        ${className}
      `}
      onMouseDown={handleContentMouseDown} // Capture selection clicks
    >
      {/* Selection Border / Glow */}
      <div className={`absolute -inset-[3px] pointer-events-none transition-opacity duration-300 ${isSelected && !isDimmed ? 'opacity-100' : 'opacity-0'}`}>
         <div className="absolute inset-0 border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-pulse rounded-sm"></div>
         {/* Tech Corners */}
         <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-400"></div>
         <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></div>
         <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-400"></div>
         <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-400"></div>
      </div>

      {/* DRAG HANDLE */}
      <div 
          className="absolute top-0 left-0 right-0 h-6 z-50 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          title="Drag to move"
      ></div>

      {children}

      {/* Resize Handle */}
      {!isDimmed && (
          <div 
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize group flex items-end justify-end p-1 pointer-events-auto z-50"
            onMouseDown={handleResizeMouseDown}
          >
            <div className="w-1.5 h-1.5 bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors mb-0.5 mr-0.5" />
            <div className="absolute bottom-1 right-3 w-1 h-1 bg-emerald-500/30 group-hover:bg-emerald-400/50 transition-colors" />
            <div className="absolute bottom-3 right-1 w-1 h-1 bg-emerald-500/30 group-hover:bg-emerald-400/50 transition-colors" />
          </div>
      )}
    </div>
  );
};

export default DraggableWindow;