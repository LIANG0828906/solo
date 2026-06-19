import { useCallback, useRef, useState, useEffect } from 'react';

interface DragState {
  isDragging: boolean;
  dragItemId: string | null;
  dragStartIndex: number;
  dragOverIndex: number;
  ghostOffsetX: number;
  ghostOffsetY: number;
}

interface Position {
  x: number;
  y: number;
}

export function useDragDrop(
  containerRef: React.RefObject<HTMLDivElement | null>,
  items: { id: string }[],
  onReorder: (startIndex: number, endIndex: number) => void
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragItemId: null,
    dragStartIndex: -1,
    dragOverIndex: -1,
    ghostOffsetX: 0,
    ghostOffsetY: 0,
  });

  const [ghostPosition, setGhostPosition] = useState<Position>({ x: 0, y: 0 });

  const dragStartRef = useRef<{ mouseX: number; mouseY: number }>({ mouseX: 0, mouseY: 0 });
  const rafRef = useRef<number>(0);

  const startDrag = useCallback((
    e: React.MouseEvent,
    itemId: string,
    element: HTMLElement
  ) => {
    const index = items.findIndex(item => item.id === itemId);
    const rect = element.getBoundingClientRect();

    setDragState({
      isDragging: true,
      dragItemId: itemId,
      dragStartIndex: index,
      dragOverIndex: index,
      ghostOffsetX: e.clientX - rect.left,
      ghostOffsetY: e.clientY - rect.top,
    });

    setGhostPosition({ x: e.clientX, y: e.clientY });
    dragStartRef.current = { mouseX: e.clientX, mouseY: e.clientY };
  }, [items]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      setGhostPosition({ x: e.clientX, y: e.clientY });

      if (!containerRef.current) return;

      const cardElements = containerRef.current.querySelectorAll('[data-card-id]');
      let closestIndex = -1;
      let closestDist = Infinity;

      cardElements.forEach((el, idx) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = idx;
        }
      });

      if (closestIndex !== -1) {
        setDragState(prev => {
          if (prev.dragOverIndex !== closestIndex) {
            return { ...prev, dragOverIndex: closestIndex };
          }
          return prev;
        });
      }
    });
  }, [containerRef]);

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setDragState(prev => {
      if (prev.isDragging && prev.dragStartIndex !== prev.dragOverIndex && prev.dragOverIndex !== -1) {
        setTimeout(() => {
          onReorder(prev.dragStartIndex, prev.dragOverIndex);
        }, 300);
      }
      return {
        isDragging: false,
        dragItemId: null,
        dragStartIndex: -1,
        dragOverIndex: -1,
        ghostOffsetX: 0,
        ghostOffsetY: 0,
      };
    });
  }, [onReorder]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return {
    dragState,
    ghostPosition,
    startDrag,
  };
}
