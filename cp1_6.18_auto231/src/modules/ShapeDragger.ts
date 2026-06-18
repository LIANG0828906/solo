import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { checkSnap, findNearestSlotOfType } from '@/modules/SnapEngine';
import type { Position } from '@/store/gameStore';

export function useShapeDragger(boardRef: React.RefObject<HTMLDivElement | null>) {
  const rafRef = useRef<number>(0);
  const shapeElRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const libraryPosRef = useRef<Map<string, Position>>(new Map());

  const startDrag = useGameStore.getState().startDrag;
  const moveDrag = useGameStore.getState().moveDrag;
  const endDrag = useGameStore.getState().endDrag;
  const snapShape = useGameStore.getState().snapShape;
  const returnShape = useGameStore.getState().returnShape;
  const triggerSlotFlash = useGameStore.getState().triggerSlotFlash;
  const triggerSlotError = useGameStore.getState().triggerSlotError;

  const handleMouseDown = useCallback(
    (shapeId: string, e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const state = useGameStore.getState();
      const shape = state.shapes.find(s => s.id === shapeId);
      if (!shape || shape.isSnapped) return;

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const el = shapeElRef.current.get(shapeId);
      if (el) {
        const rect = el.getBoundingClientRect();
        libraryPosRef.current.set(shapeId, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }

      const offset = {
        x: clientX - (libraryPosRef.current.get(shapeId)?.x ?? clientX),
        y: clientY - (libraryPosRef.current.get(shapeId)?.y ?? clientY),
      };

      startDrag(shapeId, { x: clientX, y: clientY }, offset);
    },
    [startDrag]
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const state = useGameStore.getState();
      if (!state.draggingId) return;

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        moveDrag({ x: clientX, y: clientY });
      });
    };

    const handleUp = (e: MouseEvent | TouchEvent) => {
      const state = useGameStore.getState();
      if (!state.draggingId) return;

      let clientX: number, clientY: number;
      if ('changedTouches' in e) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const shape = state.shapes.find(s => s.id === state.draggingId);
      if (!shape) { endDrag(); return; }

      const boardEl = boardRef.current;
      if (!boardEl) { endDrag(); return; }

      const boardRect = boardEl.getBoundingClientRect();
      const shapeCenterOnBoard: Position = {
        x: clientX - boardRect.left,
        y: clientY - boardRect.top,
      };

      const snapResult = checkSnap(shapeCenterOnBoard, shape.type, state.slots, 25);

      if (snapResult.snapped && snapResult.slotId) {
        snapShape(shape.id, snapResult.slotId);
        triggerSlotFlash(snapResult.slotId, 3);
      } else {
        const nearestSlot = findNearestSlotOfType(shapeCenterOnBoard, shape.type, state.slots);
        if (nearestSlot && nearestSlot.dist < 60) {
          triggerSlotError(nearestSlot.slotId);
        }
        const libPos = libraryPosRef.current.get(shape.id);
        returnShape(shape.id, { x: clientX, y: clientY });
        if (libPos) {
          setTimeout(() => {
            useGameStore.getState().clearReturn(shape.id);
          }, 1000);
        } else {
          useGameStore.getState().clearReturn(shape.id);
        }
      }
    };

    document.addEventListener('mousemove', handleMove, { passive: false });
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [boardRef, endDrag, moveDrag, snapShape, returnShape, triggerSlotFlash, triggerSlotError]);

  return {
    handleMouseDown,
    shapeElRef,
    libraryPosRef,
  };
}
