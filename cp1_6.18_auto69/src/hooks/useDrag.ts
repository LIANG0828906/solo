import { useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '../state/gameStore';

interface UseDragOptions {
  fragmentId: string;
  onDragStart?: () => void;
  onDragEnd?: (droppedOnGrid: boolean) => void;
}

export const useDrag = ({ fragmentId, onDragStart, onDragEnd }: UseDragOptions) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const animationFrame = useRef<number | null>(null);
  const lastPosition = useRef({ x: 0, y: 0 });

  const updateFragmentPosition = useGameStore((state) => state.updateFragmentPosition);
  const fragment = useGameStore((state) =>
    state.availableFragments.find((f) => f.id === fragmentId)
  );

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!elementRef.current || !isDragging.current) return;

    const canvas = elementRef.current.closest('.poem-canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    let newX = clientX - canvasRect.left - offset.current.x;
    let newY = clientY - canvasRect.top - offset.current.y;

    newX = Math.max(0, Math.min(newX, canvasRect.width - 80));
    newY = Math.max(0, Math.min(newY, canvasRect.height - 40));

    if (
      Math.abs(newX - lastPosition.current.x) > 1 ||
      Math.abs(newY - lastPosition.current.y) > 1
    ) {
      lastPosition.current = { x: newX, y: newY };
      updateFragmentPosition(fragmentId, newX, newY);
    }
  }, [fragmentId, updateFragmentPosition]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      offset.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };

      isDragging.current = true;
      lastPosition.current = { x: fragment?.x || 0, y: fragment?.y || 0 };
      elementRef.current.style.zIndex = '1000';
      elementRef.current.style.cursor = 'grabbing';

      onDragStart?.();
    },
    [fragment?.x, fragment?.y, onDragStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;

      e.preventDefault();

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }

      animationFrame.current = requestAnimationFrame(() => {
        updatePosition(clientX, clientY);
      });
    },
    [updatePosition]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !elementRef.current) return;

      isDragging.current = false;
      elementRef.current.style.zIndex = '';
      elementRef.current.style.cursor = 'grab';

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }

      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

      const elements = document.elementsFromPoint(clientX, clientY);
      const gridCell = elements.find((el) => el.classList.contains('grid-cell'));

      let droppedOnGrid = false;
      if (gridCell) {
        const index = parseInt(gridCell.getAttribute('data-index') || '-1', 10);
        if (index >= 0) {
          droppedOnGrid = true;
        }
      }

      onDragEnd?.(droppedOnGrid);
    },
    [onDragEnd]
  );

  useEffect(() => {
    const handleMove = (e: Event) => handleMouseMove(e as MouseEvent | TouchEvent);
    const handleUp = (e: Event) => handleMouseUp(e as MouseEvent | TouchEvent);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    elementRef,
    handleMouseDown,
  };
};
