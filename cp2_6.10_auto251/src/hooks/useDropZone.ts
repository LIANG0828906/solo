import { useState, useCallback, useRef } from 'react';
import type { DragEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { Point } from 'framer-motion';

interface UseDropZoneOptions {
  onDrop?: (herbId: string) => void;
  herbId?: string;
}

interface DropHandlers {
  onDragEnter: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onPointerEnter?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerLeave?: (e: ReactPointerEvent<HTMLDivElement>) => void;
}

interface UseDropZoneReturn {
  isOver: boolean;
  dropHandlers: DropHandlers;
}

export function useDropZone(options: UseDropZoneOptions = {}): UseDropZoneReturn {
  const { onDrop, herbId } = options;
  const [isOver, setIsOver] = useState(false);
  const dropZoneRef = useRef<Point | null>(null);
  const isDraggingOver = useRef(false);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver.current) {
      isDraggingOver.current = true;
      setIsOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      isDraggingOver.current = false;
      setIsOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    dropZoneRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingOver.current = false;
    setIsOver(false);
    dropZoneRef.current = null;
    
    if (onDrop) {
      const droppedHerbId = e.dataTransfer.getData('herbId') || herbId;
      if (droppedHerbId) {
        onDrop(droppedHerbId);
      }
    }
  }, [onDrop, herbId]);

  const handlePointerEnter = useCallback(() => {
    const gameStore = (window as unknown as { __isDragging?: boolean }).__isDragging;
    if (gameStore) {
      setIsOver(true);
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  return {
    isOver,
    dropHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
    },
  };
}
