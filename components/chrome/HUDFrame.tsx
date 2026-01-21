import React, { useEffect, useRef } from 'react';
import Canvas, { CanvasDebugState } from '../canvas/Canvas';

interface HUDFrameProps {
  children: React.ReactNode;
  hud?: React.ReactNode;
  panOffset: { x: number; y: number };
  scale: number;
  onPan: (delta: { x: number; y: number }) => void;
  onZoom: (newScale: number, panAdjust?: { x: number; y: number }) => void;
  onPanStart?: () => void;
  onPanEnd?: () => void;
  isTransitioning?: boolean; // New prop for smooth context switching
  activeContextId?: string; // To control background dimming
  filterActive?: boolean;
  onCanvasDebug?: (state: CanvasDebugState) => void;
  onViewportChange?: (size: { width: number; height: number }) => void;
  onCanvasClick?: (e: React.MouseEvent) => void; // Click handler for overview mode
}

const HUDFrame: React.FC<HUDFrameProps> = ({
  children,
  hud,
  panOffset,
  scale,
  onPan,
  onZoom,
  onPanStart,
  onPanEnd,
  isTransitioning = false,
  activeContextId = 'global',
  filterActive = false,
  onCanvasDebug,
  onViewportChange,
  onCanvasClick
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Zoom sensitivity
            const delta = -e.deltaY * 0.001;
            const newScale = Math.min(Math.max(0.2, scale + delta), 3);

            // Zoom to cursor: adjust pan so point under cursor stays fixed
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Calculate pan adjustment to keep cursor point stationary
            // worldX = (mouseX - centerX) / scale - panX
            // To keep same worldX: newPanX = (mouseX - centerX) / newScale - worldX
            const panAdjustX = (mouseX - centerX) * (1 / newScale - 1 / scale);
            const panAdjustY = (mouseY - centerY) * (1 / newScale - 1 / scale);

            onZoom(newScale, { x: panAdjustX, y: panAdjustY });
        }
    };

    // Attach passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [scale, onZoom]);

  useEffect(() => {
    if (!onViewportChange) return;
    let rafId: number | null = null;
    const notify = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        onViewportChange({
          width: Math.max(0, Math.round(window.innerWidth)),
          height: Math.max(0, Math.round(window.innerHeight))
        });
      });
    };
    notify();
    window.addEventListener('resize', notify);
    return () => {
      window.removeEventListener('resize', notify);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [onViewportChange]);

  return (
    <div ref={frameRef} className="fixed inset-0 bg-black text-neutral-200 overflow-hidden font-sans selection:bg-white selection:text-black select-none z-0">
      <Canvas
        panOffset={panOffset}
        onPan={onPan}
        onPanStart={onPanStart}
        onPanEnd={onPanEnd}
        scale={scale}
        isPanLocked={isTransitioning}
        onDebug={onCanvasDebug}
        onClick={onCanvasClick}
      />
      
      {/* Background Depth/Blur Layer for Scopes */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out z-0
            ${activeContextId !== 'global' ? 'backdrop-blur-md bg-black/60' : 'backdrop-blur-0 bg-black/0'}
        `}
      />

      {/* Filter Backdrop Layer */}
      {filterActive && (
        <div className="absolute inset-0 pointer-events-none z-[5] bg-black/35"></div>
      )}
      
      {/* World Content Layer - Scaled */}
      {/* origin-top-left ensures coordinate system remains logical (0,0 is top left) */}
      <div 
        className={`absolute inset-0 z-10 w-full h-full pointer-events-none origin-top-left will-change-transform
            ${isTransitioning ? 'transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]' : 'transition-transform duration-75 ease-out'}
        `}
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>

      {/* Static HUD Layer - Fixed viewport coordinates */}
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        {hud}
      </div>
    </div>
  );
};

export default HUDFrame;
