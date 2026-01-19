import React, { useMemo } from 'react';
import { ArrowUp, Target, MapPin, Navigation } from 'lucide-react';
import { WindowState } from '../types';

interface SectorLocatorProps {
  windows: WindowState[];
  viewport: { width: number; height: number };
  panOffset: { x: number; y: number };
  scale: number;
  onLocate: () => void;
}

const SectorLocator: React.FC<SectorLocatorProps> = ({ windows, viewport, panOffset, scale, onLocate }) => {
  // 1. Calculate Centroid of active content
  const target = useMemo(() => {
    if (windows.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    windows.forEach(w => {
        if (w.x < minX) minX = w.x;
        if (w.y < minY) minY = w.y;
        if (w.x + w.w > maxX) maxX = w.x + w.w;
        if (w.y + w.h > maxY) maxY = w.y + w.h;
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return { x: centerX, y: centerY };
  }, [windows]);

  if (!target) return null;

  // 2. Project to Screen Coordinates
  const screenX = (target.x + panOffset.x) * scale;
  const screenY = (target.y + panOffset.y) * scale;

  // 3. Check if centered content is visible
  const padding = 200; // Increased padding for earlier detection
  const isCentered = 
    screenX > padding && 
    screenX < viewport.width - padding && 
    screenY > padding && 
    screenY < viewport.height - padding;

  if (isCentered) return null;

  // 4. Calculate Angle and Edge Position
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  
  const dx = screenX - centerX;
  const dy = screenY - centerY;
  const angle = Math.atan2(dy, dx);
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Clamp to screen edge box
  const edgePadding = 80;
  const w = (viewport.width / 2) - edgePadding;
  const h = (viewport.height / 2) - edgePadding;

  // Ray-Box Intersection to find edge point
  let t = Infinity;
  // Check vertical edges
  if (Math.cos(angle) !== 0) {
      const t1 = (w * Math.sign(Math.cos(angle))) / Math.cos(angle);
      if (t1 > 0) t = Math.min(t, t1);
  }
  // Check horizontal edges
  if (Math.sin(angle) !== 0) {
      const t2 = (h * Math.sign(Math.sin(angle))) / Math.sin(angle);
      if (t2 > 0) t = Math.min(t, t2);
  }

  const indicatorX = centerX + Math.cos(angle) * t;
  const indicatorY = centerY + Math.sin(angle) * t;

  // Rotation for the arrow
  const rotation = (angle * 180) / Math.PI + 90;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
          left: indicatorX,
          top: indicatorY,
          transform: 'translate(-50%, -50%)' 
      }}
    >
        <button 
            onClick={onLocate}
            className="group relative flex flex-col items-center justify-center pointer-events-auto transition-all duration-300 hover:scale-110"
        >
            {/* Pulsing Ring for high distance */}
            {distance > 2000 && (
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping opacity-75"></div>
            )}

            {/* Main Circle */}
            <div className="w-14 h-14 bg-[#0a0a0a] rounded-full shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center justify-center border border-emerald-500/50 backdrop-blur-md z-10">
                <Navigation 
                    size={24} 
                    className="text-emerald-500 fill-emerald-500/20" 
                    style={{ transform: `rotate(${rotation}deg)` }} 
                />
            </div>

            {/* Label Badge */}
            <div className="absolute top-full mt-3 px-3 py-1.5 bg-black/90 border border-emerald-500/30 rounded-full flex items-center gap-2 whitespace-nowrap shadow-xl">
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider">RETURN TO WORK</span>
                <span className="text-[9px] font-mono text-neutral-500 border-l border-neutral-800 pl-2">
                    {Math.round(distance / 100)}m
                </span>
            </div>
            
            {/* Decorative Line to edge */}
            <div 
                className="absolute w-px h-[50vh] bg-gradient-to-b from-emerald-500/50 to-transparent pointer-events-none -z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ 
                    transform: `rotate(${rotation - 180}deg)`, 
                    transformOrigin: 'top center',
                    top: '50%'
                }}
            />
        </button>
    </div>
  );
};

export default SectorLocator;