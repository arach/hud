import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  // Dynamic map dimensions with fallback
  const mapW = width || 250;
  const mapH = height || 180;
  const padding = 16;

  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const vpWorldX = -panOffset.x;
  const vpWorldY = -panOffset.y;
  const vpWorldW = viewport.width / appScale;
  const vpWorldH = viewport.height / appScale;

  const bounds = useMemo(() => {
    if (windows.length === 0) {
      return {
        minX: vpWorldX,
        minY: vpWorldY,
        maxX: vpWorldX + vpWorldW,
        maxY: vpWorldY + vpWorldH
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    windows.forEach(win => {
      minX = Math.min(minX, win.x);
      minY = Math.min(minY, win.y);
      maxX = Math.max(maxX, win.x + win.w);
      maxY = Math.max(maxY, win.y + win.h);
    });

    minX = Math.min(minX, vpWorldX);
    minY = Math.min(minY, vpWorldY);
    maxX = Math.max(maxX, vpWorldX + vpWorldW);
    maxY = Math.max(maxY, vpWorldY + vpWorldH);

    return { minX, minY, maxX, maxY };
  }, [windows, vpWorldX, vpWorldY, vpWorldW, vpWorldH]);

  const mapScale = useMemo(() => {
    const worldW = Math.max(1, bounds.maxX - bounds.minX);
    const worldH = Math.max(1, bounds.maxY - bounds.minY);
    const availableW = Math.max(1, mapW - padding * 2);
    const availableH = Math.max(1, mapH - padding * 2);
    return Math.min(availableW / worldW, availableH / worldH);
  }, [bounds, mapW, mapH, padding]);

  const mapOffset = useMemo(() => {
    const worldW = bounds.maxX - bounds.minX;
    const worldH = bounds.maxY - bounds.minY;
    const availableW = mapW - padding * 2;
    const availableH = mapH - padding * 2;
    const offsetX = padding + Math.max(0, (availableW - (worldW * mapScale)) / 2);
    const offsetY = padding + Math.max(0, (availableH - (worldH * mapScale)) / 2);
    return { x: offsetX, y: offsetY };
  }, [bounds, mapW, mapH, mapScale, padding]);

  const toMinimap = useCallback((worldX: number, worldY: number) => {
    return {
      x: (worldX - bounds.minX) * mapScale + mapOffset.x,
      y: (worldY - bounds.minY) * mapScale + mapOffset.y
    };
  }, [bounds.minX, bounds.minY, mapScale, mapOffset.x, mapOffset.y]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastMouseRef.current.x;
      const deltaY = e.clientY - lastMouseRef.current.y;
      
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      // Convert minimap delta to world delta
      const worldDeltaX = deltaX / mapScale;
      const worldDeltaY = deltaY / mapScale;

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
  }, [isDragging, onNavigate, panOffset, mapScale]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Safety check
    if (isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldTargetX = ((clickX - mapOffset.x) / mapScale) + bounds.minX;
    const worldTargetY = ((clickY - mapOffset.y) / mapScale) + bounds.minY;

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
            const miniPos = toMinimap(win.x, win.y);
            const miniW = win.w * mapScale;
            const miniH = win.h * mapScale;

            return (
                <div 
                    key={win.id}
                    className="absolute border bg-neutral-700/50 transition-colors"
                    style={{
                        left: miniPos.x,
                        top: miniPos.y,
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
            const vpMiniPos = toMinimap(vpWorldX, vpWorldY);
            const vpMiniW = vpWorldW * mapScale;
            const vpMiniH = vpWorldH * mapScale;

            return (
                <div 
                    className={`absolute border-2 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)] 
                      ${isDragging ? 'cursor-grabbing bg-white/10' : 'cursor-grab hover:bg-white/5'}
                      transition-colors pointer-events-auto`}
                    style={{
                        left: vpMiniPos.x,
                        top: vpMiniPos.y,
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
