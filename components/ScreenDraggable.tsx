import React, { useState, useEffect, useRef } from 'react';
import { GripHorizontal } from 'lucide-react';

interface ScreenDraggableProps {
  initialLeft?: number;
  initialBottom?: number;
  initialTop?: number;
  initialRight?: number;
  className?: string;
  children: React.ReactNode;
}

export const ScreenDraggable: React.FC<ScreenDraggableProps> = ({ 
  initialLeft, initialBottom, initialTop, initialRight,
  className = '', 
  children 
}) => {
  const [position, setPosition] = useState<{x: number, y: number} | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Initialize position on mount so we can drag from a known state
    if (!position && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setPosition({ x: rect.left, y: rect.top });
    }
  }, []);

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (!isDragging) return;
          const deltaX = e.clientX - dragStartRef.current.x;
          const deltaY = e.clientY - dragStartRef.current.y;
          
          setPosition({
              x: startPosRef.current.x + deltaX,
              y: startPosRef.current.y + deltaY
          });
      };

      const handleMouseUp = () => {
          setIsDragging(false);
      };

      if (isDragging) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      
      // If we haven't initialized position yet (first drag), capture it now
      if (!position && ref.current) {
          const rect = ref.current.getBoundingClientRect();
          startPosRef.current = { x: rect.left, y: rect.top };
      } else if (position) {
          startPosRef.current = { x: position.x, y: position.y };
      }

      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setIsDragging(true);
      e.preventDefault();
  };

  // If we haven't touched it yet, rely on props for CSS positioning
  const style: React.CSSProperties = position ? {
      left: position.x,
      top: position.y,
      position: 'fixed'
  } : {
      position: 'fixed',
      left: initialLeft,
      top: initialTop,
      right: initialRight,
      bottom: initialBottom
  };

  return (
      <div 
        ref={ref}
        style={style}
        className={`pointer-events-auto z-50 flex flex-col shadow-2xl ${className}`}
      >
        {/* Drag Handle */}
        <div 
            className={`h-3 w-full bg-neutral-900 border-x border-t border-neutral-800 rounded-t flex items-center justify-center transition-colors ${isDragging ? 'cursor-grabbing bg-neutral-800' : 'cursor-grab hover:bg-neutral-800'}`}
            onMouseDown={handleMouseDown}
        >
             <div className="w-8 h-1 bg-neutral-700 rounded-full"></div>
        </div>
        
        {/* Content Wrapper */}
        <div className="relative">
            {children}
        </div>
      </div>
  )
};