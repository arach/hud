import React, { useEffect, useState, useRef } from 'react';

interface CanvasProps {
  panOffset: { x: number; y: number };
  scale: number;
  onPan: (delta: { x: number; y: number }) => void;
}

const Canvas: React.FC<CanvasProps> = ({ panOffset, scale, onPan }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGuides, setShowGuides] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const lastPanRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      if (isPanning) {
        const deltaX = (e.clientX - lastPanRef.current.x) / scale;
        const deltaY = (e.clientY - lastPanRef.current.y) / scale;
        onPan({ x: deltaX, y: deltaY });
        lastPanRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      document.body.style.cursor = 'default';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setShowGuides(prev => !prev);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPanning, onPan, scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { 
        setIsPanning(true);
        lastPanRef.current = { x: e.clientX, y: e.clientY };
        document.body.style.cursor = 'grabbing';
    }
  };

  const majorGridSize = 100 * scale;
  const minorGridSize = 20 * scale;
  const bgPosX = panOffset.x * scale;
  const bgPosY = panOffset.y * scale;

  return (
    <div 
        className="absolute inset-0 z-0 overflow-hidden bg-[#050505] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
    >
      {/* Blueprint Grid - Major */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
            backgroundImage: `
                linear-gradient(to right, #404050 1px, transparent 1px),
                linear-gradient(to bottom, #404050 1px, transparent 1px)
            `,
            backgroundSize: `${majorGridSize}px ${majorGridSize}px`,
            backgroundPosition: `${bgPosX}px ${bgPosY}px`
        }}
      />
      
      {/* Blueprint Grid - Minor */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
            backgroundImage: `
                linear-gradient(to right, #303040 1px, transparent 1px),
                linear-gradient(to bottom, #303040 1px, transparent 1px)
            `,
            backgroundSize: `${minorGridSize}px ${minorGridSize}px`,
            backgroundPosition: `${bgPosX}px ${bgPosY}px`
        }}
      />

      {/* Center Axis */}
       <div 
         className="absolute top-0 bottom-0 w-px bg-white/5 pointer-events-none"
         style={{ left: `calc(50% + ${bgPosX}px)` }}
       ></div>
       <div 
         className="absolute left-0 right-0 h-px bg-white/5 pointer-events-none"
         style={{ top: `calc(50% + ${bgPosY}px)` }}
       ></div>

      {/* Cursor Guides */}
      {showGuides && (
        <>
          <div 
            className="absolute top-0 bottom-0 w-px pointer-events-none"
            style={{ 
                left: mousePos.x,
                borderLeft: '1px dashed rgba(100, 100, 100, 0.2)' 
            }}
          />
          <div 
            className="absolute left-0 right-0 h-px pointer-events-none"
            style={{ 
                top: mousePos.y,
                borderTop: '1px dashed rgba(100, 100, 100, 0.2)'
            }}
          />
          
          <div 
             className="absolute text-[9px] font-mono text-neutral-600 pl-2 pt-2 whitespace-nowrap pointer-events-none"
             style={{ left: mousePos.x, top: mousePos.y }}
          >
             X:{((mousePos.x / scale) - panOffset.x - (window.innerWidth / 2 / scale)).toFixed(0)} <span className="mx-1 opacity-30">|</span> Y:{((mousePos.y / scale) - panOffset.y).toFixed(0)}
          </div>
        </>
      )}
    </div>
  );
};

export default Canvas;