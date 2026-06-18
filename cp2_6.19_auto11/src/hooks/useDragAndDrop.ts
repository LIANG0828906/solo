import { useState, useCallback, useRef } from 'react';
import type { Material, TransitionType } from '../types';

interface DragState {
  isDragging: boolean;
  type: 'material' | 'transition' | null;
  data: Material | TransitionType | null;
}

export const useDragAndDrop = () => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    type: null,
    data: null,
  });

  const dragStartTime = useRef<number>(0);

  const startMaterialDrag = useCallback((material: Material, e: React.DragEvent) => {
    dragStartTime.current = performance.now();
    setDragState({
      isDragging: true,
      type: 'material',
      data: material,
    });
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'material',
      materialId: material.id,
    }));
  }, []);

  const startTransitionDrag = useCallback((type: TransitionType, e: React.DragEvent) => {
    dragStartTime.current = performance.now();
    setDragState({
      isDragging: true,
      type: 'transition',
      data: type,
    });
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'transition',
      transitionType: type,
    }));
  }, []);

  const endDrag = useCallback(() => {
    const duration = performance.now() - dragStartTime.current;
    if (duration > 100) {
      console.warn(`Drag operation took ${duration.toFixed(0)}ms, target is <100ms`);
    }
    setDragState({
      isDragging: false,
      type: null,
      data: null,
    });
  }, []);

  const parseDropData = useCallback((e: React.DragEvent) => {
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      return data;
    } catch {
      return null;
    }
  }, []);

  return {
    dragState,
    startMaterialDrag,
    startTransitionDrag,
    endDrag,
    parseDropData,
  };
};
