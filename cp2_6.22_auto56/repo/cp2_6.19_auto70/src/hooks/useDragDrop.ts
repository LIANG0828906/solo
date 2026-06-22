import { useCallback, useRef, useState, useEffect } from 'react';
import useBoardStore from '@/store/boardStore';

interface DragState {
  isDragging: boolean;
  dragItemId: string | null;
  dragStartIndex: number;
  dragOverIndex: number;
  ghostOffsetX: number;
  ghostOffsetY: number;
  ghostWidth: number;
  ghostHeight: number;
}

interface Position {
  x: number;
  y: number;
}

function getScrollingAncestors(element: HTMLElement | null): HTMLElement[] {
  const scrollers: HTMLElement[] = [];
  let el: HTMLElement | null = element;
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    if (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') {
      scrollers.push(el);
    }
    el = el.parentElement;
  }
  scrollers.push(document.scrollingElement as HTMLElement);
  return scrollers;
}

export function useDragDrop(
  containerRef: React.RefObject<HTMLDivElement | null>,
  items: { id: string }[],
  onReorder: (startIndex: number, endIndex: number) => void
) {
  const setStoreDragState = useBoardStore((state) => state.setDragState);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragItemId: null,
    dragStartIndex: -1,
    dragOverIndex: -1,
    ghostOffsetX: 0,
    ghostOffsetY: 0,
    ghostWidth: 0,
    ghostHeight: 0,
  });

  const [ghostPosition, setGhostPosition] = useState<Position>({ x: 0, y: 0 });

  const rafRef = useRef<number>(0);
  const scrollersRef = useRef<HTMLElement[]>([]);
  const scrollHandlerRef = useRef<(() => void) | null>(null);
  const mousePosRef = useRef<Position>({ x: 0, y: 0 });

  const updateDragOverIndex = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return -1;

    const cardElements = containerRef.current.querySelectorAll('[data-card-id]');
    let closestIndex = -1;
    let closestDist = Infinity;

    cardElements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - centerX, clientY - centerY);

      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = idx;
      }
    });

    return closestIndex;
  }, [containerRef]);

  const startDrag = useCallback((
    e: React.MouseEvent,
    itemId: string,
    element: HTMLElement
  ) => {
    const index = items.findIndex(item => item.id === itemId);
    const rect = element.getBoundingClientRect();

    const scrollers = getScrollingAncestors(containerRef.current);
    scrollersRef.current = scrollers;

    const newDragState = {
      isDragging: true,
      dragItemId: itemId,
      dragStartIndex: index,
      dragOverIndex: index,
      ghostOffsetX: e.clientX - rect.left,
      ghostOffsetY: e.clientY - rect.top,
      ghostWidth: rect.width,
      ghostHeight: rect.height,
    };

    setDragState(newDragState);
    setStoreDragState({
      isDragging: true,
      draggedCardId: itemId,
      dragStartIndex: index,
      dragOverIndex: index,
    });

    setGhostPosition({ x: e.clientX, y: e.clientY });
  }, [items, containerRef, setStoreDragState]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    mousePosRef.current = { x: e.clientX, y: e.clientY };

    rafRef.current = requestAnimationFrame(() => {
      setGhostPosition({ x: e.clientX, y: e.clientY });

      const closestIndex = updateDragOverIndex(e.clientX, e.clientY);

      if (closestIndex !== -1) {
        setDragState(prev => {
          if (prev.dragOverIndex !== closestIndex) {
            setStoreDragState({ dragOverIndex: closestIndex });
            return { ...prev, dragOverIndex: closestIndex };
          }
          return prev;
        });
      }
    });
  }, [updateDragOverIndex, setStoreDragState]);

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const { x, y } = mousePosRef.current;
      const closestIndex = updateDragOverIndex(x, y);
      if (closestIndex !== -1) {
        setDragState(prev => {
          if (prev.dragOverIndex !== closestIndex) {
            setStoreDragState({ dragOverIndex: closestIndex });
            return { ...prev, dragOverIndex: closestIndex };
          }
          return prev;
        });
      }
    });
  }, [updateDragOverIndex, setStoreDragState]);

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    scrollersRef.current.forEach(scroller => {
      if (scrollHandlerRef.current) {
        scroller.removeEventListener('scroll', scrollHandlerRef.current);
      }
    });
    scrollersRef.current = [];
    scrollHandlerRef.current = null;

    setDragState(prev => {
      if (prev.isDragging && prev.dragStartIndex !== prev.dragOverIndex && prev.dragOverIndex !== -1) {
        setTimeout(() => {
          onReorder(prev.dragStartIndex, prev.dragOverIndex);
        }, 300);
      }
      setStoreDragState({
        isDragging: false,
        draggedCardId: null,
        dragStartIndex: -1,
        dragOverIndex: -1,
      });
      return {
        isDragging: false,
        dragItemId: null,
        dragStartIndex: -1,
        dragOverIndex: -1,
        ghostOffsetX: 0,
        ghostOffsetY: 0,
        ghostWidth: 0,
        ghostHeight: 0,
      };
    });
  }, [onReorder, setStoreDragState]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';

      scrollHandlerRef.current = handleScroll;
      scrollersRef.current.forEach(scroller => {
        scroller.addEventListener('scroll', handleScroll, { passive: true });
      });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      if (scrollHandlerRef.current) {
        scrollersRef.current.forEach(scroller => {
          scroller.removeEventListener('scroll', scrollHandlerRef.current!);
        });
      }
    };
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, handleScroll]);

  return {
    dragState,
    ghostPosition,
    startDrag,
  };
}
