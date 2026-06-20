import { useState, useCallback, useRef, useEffect } from 'react';

interface UseDragOptions {
  initialPosition: { x: number; y: number };
  onDragStart?: (position: { x: number; y: number }) => void;
  onDragMove?: (position: { x: number; y: number }) => void;
  onDragEnd?: (position: { x: number; y: number }) => void;
  constraints?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
}

interface UseDragResult {
  position: { x: number; y: number };
  isDragging: boolean;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
  };
}

export function useDrag(options: UseDragOptions): UseDragResult {
  const { initialPosition, onDragStart, onDragMove, onDragEnd, constraints } = options;

  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);

  const startPosRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const applyConstraints = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      let newX = x;
      let newY = y;

      if (constraints) {
        if (constraints.minX !== undefined) newX = Math.max(constraints.minX, newX);
        if (constraints.maxX !== undefined) newX = Math.min(constraints.maxX, newX);
        if (constraints.minY !== undefined) newY = Math.max(constraints.minY, newY);
        if (constraints.maxY !== undefined) newY = Math.min(constraints.maxY, newY);
      }

      return { x: newX, y: newY };
    },
    [constraints]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        const newX = startPosRef.current.x + e.clientX - offsetRef.current.x;
        const newY = startPosRef.current.y + e.clientY - offsetRef.current.y;
        const constrained = applyConstraints(newX, newY);

        setPosition(constrained);
        onDragMove?.(constrained);
        rafRef.current = null;
      });
    },
    [applyConstraints, onDragMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    onDragEnd?.(position);

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [handleMouseMove, onDragEnd, position]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      startPosRef.current = { x: position.x, y: position.y };
      offsetRef.current = { x: e.clientX, y: e.clientY };

      setIsDragging(true);
      onDragStart?.(position);

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [position, onDragStart, handleMouseMove, handleMouseUp]
  );

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition.x, initialPosition.y]);

  return {
    position,
    isDragging,
    handlers: {
      onMouseDown: handleMouseDown,
    },
  };
}
