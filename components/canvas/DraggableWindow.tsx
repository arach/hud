import React, { useState, useEffect } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

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
  isDimmed?: boolean;
  isDragDisabled?: boolean; 
  aiThread?: { topic: string; messageCount: number };
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onSelect: (id: string) => void;
  onClose?: (id: string) => void; // New Prop
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
  isDragDisabled = false,
  aiThread,
  onMove, 
  onResize,
  onSelect,
  onClose,
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
    // Only start drag if left click and dragging is enabled
    if (e.button !== 0) return;
    
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection start
    onSelect(id);
    
    if (isDragDisabled) return; // Stop here if locked

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ x, y });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(id);
    
    if (isDragDisabled) return; // Stop resize in grid mode too

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
        transition: 'all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)', // Smooth transition for layout changes
        pointerEvents: isDimmed ? 'none' : 'auto' 
      }}
      className={`
        flex flex-col animate-in zoom-in-95 duration-300
        ${isDragging ? 'cursor-grabbing' : 'cursor-default'}
        ${className}
      `}
      onMouseDown={handleContentMouseDown} 
    >
      {/* Selection Border / Glow */}
      <div className={`absolute -inset-[3px] pointer-events-none transition-opacity duration-300 ${isSelected && !isDimmed ? 'opacity-100' : 'opacity-0'}`}>
         <div className={`absolute inset-0 border shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-pulse rounded-sm ${isDragDisabled ? 'border-blue-500/40' : 'border-emerald-500/40'}`}></div>
         
         {/* Tech Corners - Change color based on mode */}
         <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${isDragDisabled ? 'border-blue-400' : 'border-emerald-400'}`}></div>
         <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${isDragDisabled ? 'border-blue-400' : 'border-emerald-400'}`}></div>
         <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${isDragDisabled ? 'border-blue-400' : 'border-emerald-400'}`}></div>
         <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${isDragDisabled ? 'border-blue-400' : 'border-emerald-400'}`}></div>
      </div>

      {/* AI Activity Badge (Floating above window) */}
      {aiThread && !isDimmed && (
          <div className="absolute -top-10 left-4 z-50 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-500">
              <div className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-100 text-[10px] px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2">
                  <div className="relative">
                      <MessageCircle size={12} className="text-emerald-400" />
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                  </div>
                  <span className="font-bold tracking-wide max-w-[120px] truncate">{aiThread.topic}</span>
              </div>
              {/* Connecting Line */}
              <div className="h-4 w-px bg-emerald-500/50 absolute left-4 top-full"></div>
          </div>
      )}

      {/* DRAG HANDLE */}
      <div 
          className={`absolute top-0 left-0 right-0 h-6 z-50 ${isDragDisabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
          onMouseDown={handleMouseDown}
          title={isDragDisabled ? "Position Locked (Grid View)" : "Drag to move"}
      ></div>

      {children}

      {/* Resize Handle */}
      {!isDimmed && !isDragDisabled && (
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