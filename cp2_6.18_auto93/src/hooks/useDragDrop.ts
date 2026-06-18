import { useState, useCallback, useRef } from 'react';
import { snapToGrid } from '../utils/helpers';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  componentStartX: number;
  componentStartY: number;
}

interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

export const useDragDrop = (
  onUpdate: (id: string, updates: Record<string, number>) => void
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    componentStartX: 0,
    componentStartY: 0,
  });

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  });

  const componentIdRef = useRef<string | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent, componentId: string, x: number, y: number) => {
      e.preventDefault();
      e.stopPropagation();
      componentIdRef.current = componentId;
      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        componentStartX: x,
        componentStartY: y,
      });
    },
    []
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, componentId: string, width: number, height: number) => {
      e.preventDefault();
      e.stopPropagation();
      componentIdRef.current = componentId;
      setResizeState({
        isResizing: true,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: width,
        startHeight: height,
      });
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent, panOffset: { x: number; y: number }) => {
      if (dragState.isDragging && componentIdRef.current) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;
        const newX = snapToGrid(dragState.componentStartX + deltaX);
        const newY = snapToGrid(dragState.componentStartY + deltaY);
        onUpdate(componentIdRef.current, { x: newX, y: newY });
      }

      if (resizeState.isResizing && componentIdRef.current) {
        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;
        const newWidth = snapToGrid(Math.max(20, resizeState.startWidth + deltaX));
        const newHeight = snapToGrid(Math.max(20, resizeState.startHeight + deltaY));
        onUpdate(componentIdRef.current, { width: newWidth, height: newHeight });
      }
    },
    [dragState, resizeState, onUpdate]
  );

  const handleMouseUp = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
    setResizeState((prev) => ({ ...prev, isResizing: false }));
    componentIdRef.current = null;
  }, []);

  return {
    isDragging: dragState.isDragging,
    isResizing: resizeState.isResizing,
    draggingComponentId: dragState.isDragging ? componentIdRef.current : null,
    resizingComponentId: resizeState.isResizing ? componentIdRef.current : null,
    handleDragStart,
    handleResizeStart,
    handleMouseMove,
    handleMouseUp,
  };
};
