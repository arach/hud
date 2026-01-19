import React, { useEffect } from 'react';
import Canvas from './Canvas';

interface HUDFrameProps {
  children: React.ReactNode;
  hud?: React.ReactNode;
  panOffset: { x: number; y: number };
  scale: number;
  onPan: (delta: { x: number; y: number }) => void;
  onZoom: (newScale: number) => void;
  isTransitioning?: boolean; // New prop for smooth context switching
  activeContextId?: string; // To control background dimming
}

const HUDFrame: React.FC<HUDFrameProps> = ({ 
  children, 
  hud, 
  panOffset, 
  scale, 
  onPan, 
  onZoom,
  isTransitioning = false,
  activeContextId = 'global'
}) => {
  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Zoom sensitivity
            const delta = -e.deltaY * 0.001; 
            const newScale = Math.min(Math.max(0.2, scale + delta), 3);
            onZoom(newScale);
        }
    };
    
    // Attach passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [scale, onZoom]);

  return (
    <div className="fixed inset-0 bg-black text-neutral-200 overflow-hidden font-sans selection:bg-white selection:text-black select-none z-0">
      <Canvas panOffset={panOffset} onPan={onPan} scale={scale} />
      
      {/* Background Depth/Blur Layer for Scopes */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-in-out z-0
            ${activeContextId !== 'global' ? 'backdrop-blur-md bg-black/60' : 'backdrop-blur-0 bg-black/0'}
        `}
      />
      
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