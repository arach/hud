import React, { useEffect, useState, useRef, useCallback } from 'react';

interface CanvasProps {
  panOffset: { x: number; y: number };
  scale: number;
  onPan: (delta: { x: number; y: number }) => void;
  onPanStart?: () => void;
  onPanEnd?: () => void;
  isPanLocked?: boolean;
  onDebug?: (state: CanvasDebugState) => void;
  onClick?: (e: React.MouseEvent) => void; // Click handler (only fires if not panning)
}

export interface CanvasDebugState {
  timestamp: string;
  isPanning: boolean;
  isPanLocked: boolean;
  pendingPan: boolean;
  pendingStart: { x: number; y: number } | null;
  lastPan: { x: number; y: number };
  mouse: { x: number; y: number };
  buttons: number;
  isSpaceDown: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ panOffset, scale, onPan, onPanStart, onPanEnd, isPanLocked = false, onDebug, onClick }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGuides, setShowGuides] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const pendingPanRef = useRef({ active: false, startX: 0, startY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isSpaceDownRef = useRef(false);
  const panThreshold = 4;
  const debugRafRef = useRef<number | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const buttonsRef = useRef(0);
  const spaceTimeoutRef = useRef<number | null>(null);
  const lastSpaceAtRef = useRef(0);
  const spaceStaleMs = 2500;
  const didPanRef = useRef(false); // Track if we panned during this interaction

  const isEditableTarget = useCallback((target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    if (!element) return false;
    const tag = element.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || element.isContentEditable;
  }, []);

  const isInteractiveTarget = useCallback((target: EventTarget | null) => {
    const element = target as HTMLElement | null;
    if (!element) return false;
    return Boolean(element.closest('button, [role="button"], a, input, textarea, select, [data-hud-interactive="true"]'));
  }, []);

  const setPanning = useCallback((value: boolean) => {
    isPanningRef.current = value;
    setIsPanning(value);
  }, []);

  const emitDebug = useCallback(() => {
    if (!onDebug) return;
    if (debugRafRef.current) return;
    debugRafRef.current = window.requestAnimationFrame(() => {
      debugRafRef.current = null;
      onDebug({
        timestamp: new Date().toISOString(),
        isPanning: isPanningRef.current,
        isPanLocked,
        pendingPan: pendingPanRef.current.active,
        pendingStart: pendingPanRef.current.active
          ? { x: pendingPanRef.current.startX, y: pendingPanRef.current.startY }
          : null,
        lastPan: { ...lastPanRef.current },
        mouse: { ...mousePosRef.current },
        buttons: buttonsRef.current,
        isSpaceDown: isSpaceDownRef.current
      });
    });
  }, [onDebug, isPanLocked]);

  useEffect(() => {
    const scheduleSpaceRelease = () => {
      if (spaceTimeoutRef.current) {
        window.clearTimeout(spaceTimeoutRef.current);
      }
      spaceTimeoutRef.current = window.setTimeout(() => {
        const idleFor = Date.now() - lastSpaceAtRef.current;
        if (idleFor < spaceStaleMs) return;
        if (isPanningRef.current) {
          setPanning(false);
          pendingPanRef.current.active = false;
          onPanEnd?.();
        }
        isSpaceDownRef.current = false;
        document.body.style.cursor = 'default';
        emitDebug();
      }, spaceStaleMs + 50);
    };

    const handleMouseMove = (e: MouseEvent) => {
      buttonsRef.current = e.buttons;
      if (pendingPanRef.current.active && (e.buttons & 1) !== 1) {
        pendingPanRef.current.active = false;
        emitDebug();
      }
      if (isPanningRef.current && (e.buttons & 1) !== 1) {
        setPanning(false);
        pendingPanRef.current.active = false;
        onPanEnd?.();
        document.body.style.cursor = isSpaceDownRef.current ? 'grab' : 'default';
        emitDebug();
        return;
      }
      if (isPanningRef.current && !isSpaceDownRef.current) {
        setPanning(false);
        pendingPanRef.current.active = false;
        onPanEnd?.();
        document.body.style.cursor = 'default';
        emitDebug();
        return;
      }
      if (isPanLocked && isPanningRef.current) {
        setPanning(false);
        pendingPanRef.current.active = false;
        onPanEnd?.();
        document.body.style.cursor = isSpaceDownRef.current ? 'grab' : 'default';
        emitDebug();
        return;
      }
      const rect = containerRef.current?.getBoundingClientRect();
      const x = rect ? e.clientX - rect.left : e.clientX;
      const y = rect ? e.clientY - rect.top : e.clientY;
      setMousePos({ x, y });
      mousePosRef.current = { x, y };

      if (pendingPanRef.current.active && !isPanningRef.current) {
        const dx = e.clientX - pendingPanRef.current.startX;
        const dy = e.clientY - pendingPanRef.current.startY;
        if (Math.hypot(dx, dy) >= panThreshold) {
          pendingPanRef.current.active = false;
          setPanning(true);
          didPanRef.current = true; // Mark that we panned
          onPanStart?.();
          lastPanRef.current = { x: e.clientX, y: e.clientY };
          document.body.style.cursor = 'grabbing';
        }
      }
      
      if (isPanningRef.current) {
        const deltaX = (e.clientX - lastPanRef.current.x) / scale;
        const deltaY = (e.clientY - lastPanRef.current.y) / scale;
        onPan({ x: deltaX, y: deltaY });
        lastPanRef.current = { x: e.clientX, y: e.clientY };
      }
      emitDebug();
    };

    const handleMouseUp = (e: MouseEvent) => {
      buttonsRef.current = e.buttons;
      pendingPanRef.current.active = false;
      if (!isPanningRef.current) return;
      setPanning(false);
      onPanEnd?.();
      document.body.style.cursor = isSpaceDownRef.current ? 'grab' : 'default';
      emitDebug();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setShowGuides(prev => !prev);
      }
      if (e.code === 'Space' && !isEditableTarget(e.target)) {
        e.preventDefault();
        if (!isSpaceDownRef.current) {
          isSpaceDownRef.current = true;
          if (!isPanningRef.current) {
            document.body.style.cursor = 'grab';
          }
        }
        lastSpaceAtRef.current = Date.now();
        scheduleSpaceRelease();
        emitDebug();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDownRef.current = false;
        if (spaceTimeoutRef.current) {
          window.clearTimeout(spaceTimeoutRef.current);
          spaceTimeoutRef.current = null;
        }
        if (!isPanningRef.current) {
          document.body.style.cursor = 'default';
        }
        emitDebug();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const handleBlur = () => {
      isSpaceDownRef.current = false;
      pendingPanRef.current.active = false;
      if (spaceTimeoutRef.current) {
        window.clearTimeout(spaceTimeoutRef.current);
        spaceTimeoutRef.current = null;
      }
      handleMouseUp(new MouseEvent('mouseup'));
      emitDebug();
    };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleBlur);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleBlur);
      if (spaceTimeoutRef.current) {
        window.clearTimeout(spaceTimeoutRef.current);
        spaceTimeoutRef.current = null;
      }
    };
  }, [onPan, onPanEnd, onPanStart, scale, isEditableTarget, isInteractiveTarget, isPanLocked, setPanning, emitDebug]);

  useEffect(() => {
    if (!isPanLocked) return;
    if (!isPanningRef.current) return;
    setPanning(false);
    onPanEnd?.();
    document.body.style.cursor = isSpaceDownRef.current ? 'grab' : 'default';
    emitDebug();
  }, [isPanLocked, onPanEnd, setPanning, emitDebug]);

  const handleMouseDown = (e: React.MouseEvent) => {
    didPanRef.current = false; // Reset pan tracking on new interaction
    if (isPanLocked) return;
    if (e.button !== 0) return;
    if (!isSpaceDownRef.current) return;
    if (isEditableTarget(e.target) || isInteractiveTarget(e.target)) return;
    buttonsRef.current = e.buttons;
    pendingPanRef.current = { active: true, startX: e.clientX, startY: e.clientY };
    document.body.style.cursor = 'grab';
    e.preventDefault();
    emitDebug();
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only fire onClick if we didn't pan during this interaction
    if (!didPanRef.current && onClick) {
      onClick(e);
    }
    didPanRef.current = false;
  };

  // Adjust grid density based on scale to prevent it from disappearing or becoming too dense
  const clampedScale = Math.max(0.4, Math.min(2, scale));
  const majorGridSize = 100 * clampedScale;
  const minorGridSize = 20 * clampedScale;
  
  // Calculate background position modulo the grid size to keep numbers small and prevent 'running out' artifacts
  // though CSS handles large numbers, this ensures visual consistency
  const bgPosX = (panOffset.x * scale) % majorGridSize;
  const bgPosY = (panOffset.y * scale) % majorGridSize;

  // Determine cursor class for canvas - grab (hand) on grid, grabbing when panning
  const canvasCursor = isPanning ? 'cursor-grabbing' : 'cursor-grab';

  return (
    <div
        ref={containerRef}
        className={`absolute inset-0 z-0 overflow-hidden bg-black ${canvasCursor}`}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
    >
      {/* Subtle dot pattern - gives sense of navigable space */}
      {/* Extended beyond viewport to prevent edge artifacts at various zoom levels */}
      <div
        className="absolute opacity-[0.4] pointer-events-none"
        style={{
            inset: '-100px',
            backgroundImage: `radial-gradient(circle, #333 1px, transparent 1px)`,
            backgroundSize: `${minorGridSize}px ${minorGridSize}px`,
            backgroundPosition: `${bgPosX + 100}px ${bgPosY + 100}px`,
            backgroundRepeat: 'repeat'
        }}
      />

      {/* Larger dot pattern for depth */}
      <div
        className="absolute opacity-[0.15] pointer-events-none"
        style={{
            inset: '-100px',
            backgroundImage: `radial-gradient(circle, #444 1.5px, transparent 1.5px)`,
            backgroundSize: `${majorGridSize}px ${majorGridSize}px`,
            backgroundPosition: `${bgPosX + 100}px ${bgPosY + 100}px`,
            backgroundRepeat: 'repeat'
        }}
      />

      {/* Origin Marker (World 0,0) */}
      <div 
         className="absolute w-2 h-2 bg-emerald-500 rounded-full opacity-50 pointer-events-none"
         style={{ 
             left: `calc(50% + ${panOffset.x * scale}px - 4px)`, 
             top: `calc(50% + ${panOffset.y * scale}px - 4px)` 
         }}
      />

      {/* Cursor Guides */}
      {showGuides && (
        <>
          <div 
            className="absolute top-0 bottom-0 w-px pointer-events-none bg-emerald-500/10"
            style={{ 
                left: mousePos.x,
            }}
          />
          <div 
            className="absolute left-0 right-0 h-px pointer-events-none bg-emerald-500/10"
            style={{ 
                top: mousePos.y,
            }}
          />
          
          <div 
             className="absolute text-[9px] font-mono text-emerald-500/50 pl-2 pt-2 whitespace-nowrap pointer-events-none"
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
