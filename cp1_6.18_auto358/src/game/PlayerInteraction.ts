import { useState, useCallback } from 'react';
import { useGameStore } from './GameMaster';
import type { Point } from './types';

interface DragState {
  isDragging: boolean;
  lensId: string | null;
  previewPosition: Point | null;
  previewOpacity: number;
}

export function usePlayerInteraction() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    lensId: null,
    previewPosition: null,
    previewOpacity: 0.6,
  });

  const placeLens = useGameStore(state => state.placeLens);
  const rotateLens = useGameStore(state => state.rotateLens);
  const selectLens = useGameStore(state => state.selectLens);
  const selectedLensId = useGameStore(state => state.selectedLensId);
  const placedLenses = useGameStore(state => state.placedLenses);
  const availableLenses = useGameStore(state => state.availableLenses);

  const handleDragStart = useCallback((lensId: string) => {
    const available = availableLenses.find(l => l.id === lensId);
    const placed = placedLenses.find(l => l.id === lensId);
    if (!available && !placed) return;

    setDragState({
      isDragging: true,
      lensId,
      previewPosition: null,
      previewOpacity: 0.6,
    });
    selectLens(lensId);
  }, [availableLenses, placedLenses, selectLens]);

  const handleDragMove = useCallback((position: Point) => {
    if (!dragState.isDragging) return;
    setDragState(prev => ({
      ...prev,
      previewPosition: position,
    }));
  }, [dragState.isDragging]);

  const handleDragEnd = useCallback((position: Point, canvasWidth: number, canvasHeight: number) => {
    if (!dragState.isDragging || !dragState.lensId) {
      setDragState({ isDragging: false, lensId: null, previewPosition: null, previewOpacity: 0.6 });
      return;
    }

    const lensId = dragState.lensId;
    const clampedX = Math.max(20, Math.min(canvasWidth - 20, position.x));
    const clampedY = Math.max(20, Math.min(canvasHeight - 20, position.y));
    const clampedPos = { x: clampedX, y: clampedY };

    const available = availableLenses.find(l => l.id === lensId);
    if (available) {
      placeLens(lensId, clampedPos);
    } else {
      const placed = placedLenses.find(l => l.id === lensId);
      if (placed) {
        placeLens(lensId, clampedPos);
      }
    }

    setDragState({ isDragging: false, lensId: null, previewPosition: null, previewOpacity: 0.6 });
  }, [dragState, availableLenses, placedLenses, placeLens]);

  const handleWheelRotate = useCallback((lensId: string, deltaY: number) => {
    const placed = placedLenses.find(l => l.id === lensId);
    if (!placed) return;
    const angleDelta = deltaY > 0 ? 5 : -5;
    rotateLens(lensId, angleDelta);
  }, [placedLenses, rotateLens]);

  const handleCanvasClick = useCallback((position: Point) => {
    if (dragState.isDragging) return;

    const clickedLens = placedLenses.find(lens => {
      const dist = Math.hypot(lens.position.x - position.x, lens.position.y - position.y);
      return dist <= lens.radius + 5;
    });

    if (clickedLens) {
      selectLens(selectedLensId === clickedLens.id ? null : clickedLens.id);
    } else {
      selectLens(null);
    }
  }, [dragState.isDragging, placedLenses, selectedLensId, selectLens]);

  return {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleWheelRotate,
    handleCanvasClick,
  };
}
