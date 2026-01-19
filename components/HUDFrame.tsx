import React, { useEffect } from 'react';
import Canvas from './Canvas';

interface HUDFrameProps {
  children: React.ReactNode;
  hud?: React.ReactNode;
  panOffset: { x: number; y: number };
  scale: number;
  onPan: (delta: { x: number; y: number }) => void;
  onZoom: (newScale: number) => void;
}

const HUDFrame: React.FC<HUDFrameProps> = ({ children, hud, panOffset, scale, onPan, onZoom }) => {
  
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
    <div className="relative w-screen h-screen bg-black text-neutral-200 overflow-hidden font-sans selection:bg-white selection:text-black select-none">
      <Canvas panOffset={panOffset} onPan={onPan} scale={scale} />
      
      {/* World Content Layer - Scaled */}
      {/* origin-top-left ensures coordinate system remains logical (0,0 is top left) */}
      <div 
        className="relative z-10 w-full h-full pointer-events-none origin-top-left transition-transform duration-75 ease-out will-change-transform"
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>

      {/* Static HUD Layer - Fixed viewport coordinates */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        {hud}
      </div>
    </div>
  );
};

export default HUDFrame;