import React, { useState, useEffect, useRef } from 'react';
import { WindowState } from '../types';

interface MinimapProps {
  windows: WindowState[];
  viewport: { x: number; y: number; width: number; height: number };
  panOffset: { x: number; y: number };
  appScale: number;
  onNavigate: (x: number, y: number) => void;
  width?: number;
  height?: number;
}

const Minimap: React.FC<MinimapProps> = ({ windows, viewport, panOffset, appScale, onNavigate, width, height }) => {
  // Minimap scale factor (e.g., 0.1 means 1000px world = 100px minimap)
  const SCALE = 0.08;
  
  // Dynamic map dimensions with fallback
  const mapW = width || 250;
  const mapH = height || 180;
  
  // Calculate center of "World" relative to minimap center
  const mapCenter = { x: mapW / 2, y: mapH / 2 };

  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastMouseRef.current.x;
      const deltaY = e.clientY - lastMouseRef.current.y;
      
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      // Convert minimap delta to world delta
      const worldDeltaX = deltaX / SCALE;
      const worldDeltaY = deltaY / SCALE;

      // Update pan offset (Inverse: Moving viewport right means panning "camera" right, so offset decreases)
      onNavigate(panOffset.x - worldDeltaX, panOffset.y - worldDeltaY);
    };

    const handleMouseUp = () => {
      if (isDragging) {
          setIsDragging(false);
          document.body.style.cursor = 'default';
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onNavigate, panOffset]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Safety check
    if (isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldTargetX = (clickX - mapCenter.x) / SCALE;
    const worldTargetY = (clickY - mapCenter.y) / SCALE;

    const newPanX = (viewport.width / 2 / appScale) - worldTargetX;
    const newPanY = (viewport.height / 2 / appScale) - worldTargetY;

    onNavigate(newPanX, newPanY);
  };

  const handleViewportMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'grabbing';
  };

  return (
    <div className="w-full h-full bg-black border border-neutral-800 flex flex-col overflow-hidden pointer-events-auto">
      {/* Map Area */}
      <div 
        className="flex-1 relative bg-neutral-950 overflow-hidden cursor-crosshair group"
        onClick={handleMinimapClick}
      >
        {/* Grid Background Effect */}
        <div className="absolute inset-0 opacity-20"
             style={{
                backgroundImage: 'radial-gradient(#444 1px, transparent 1px)',
                backgroundSize: '10px 10px'
             }}
        />

        {/* Center Crosshair (World 0,0) */}
        <div className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 bg-neutral-800 rounded-full opacity-50"></div>

        {/* Windows */}
        {windows.map(win => {
            const miniX = (win.x * SCALE) + mapCenter.x;
            const miniY = (win.y * SCALE) + mapCenter.y;
            const miniW = win.w * SCALE;
            const miniH = win.h * SCALE;

            return (
                <div 
                    key={win.id}
                    className="absolute border bg-neutral-700/50 transition-colors"
                    style={{
                        left: miniX,
                        top: miniY,
                        width: Math.max(2, miniW),
                        height: Math.max(2, miniH),
                        borderColor: win.zIndex >= 50 ? '#10b981' : '#525252',
                        zIndex: win.zIndex
                    }}
                />
            );
        })}

        {/* Viewport Rect */}
        {(() => {
            const vpWorldX = -panOffset.x;
            const vpWorldY = -panOffset.y;
            
            const vpMiniX = (vpWorldX * SCALE) + mapCenter.x;
            const vpMiniY = (vpWorldY * SCALE) + mapCenter.y;
            
            const vpWorldW = viewport.width / appScale;
            const vpWorldH = viewport.height / appScale;

            const vpMiniW = vpWorldW * SCALE;
            const vpMiniH = vpWorldH * SCALE;

            return (
                <div 
                    className={`absolute border-2 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)] 
                      ${isDragging ? 'cursor-grabbing bg-white/10' : 'cursor-grab hover:bg-white/5'}
                      transition-colors pointer-events-auto`}
                    style={{
                        left: vpMiniX,
                        top: vpMiniY,
                        width: vpMiniW,
                        height: vpMiniH
                    }}
                    onMouseDown={handleViewportMouseDown}
                    onClick={(e) => e.stopPropagation()} 
                >
                    <div className="absolute top-0 right-0 -mt-3 text-[8px] text-white/50 font-mono pointer-events-none select-none">VIEW</div>
                </div>
            );
        })()}
      </div>
      
      {/* Footer Info */}
      <div className="h-6 border-t border-neutral-800 bg-neutral-900 flex items-center justify-between px-2 text-[10px] text-neutral-500 font-mono select-none">
        <span>PAN: {panOffset.x.toFixed(0)},{panOffset.y.toFixed(0)}</span>
        <span className={isDragging ? 'text-emerald-500' : ''}>{isDragging ? 'DRAGGING' : 'READY'}</span>
      </div>
    </div>
  );
};

export default Minimap;