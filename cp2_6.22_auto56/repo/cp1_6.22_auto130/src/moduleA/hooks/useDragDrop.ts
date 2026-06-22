import { useRef, useCallback, useEffect } from 'react';
import { useSandboxStore } from '../store/sandboxStore';
import { interactionLogger } from '../../moduleC/logger/InteractionLogger';

const DRAG_TRIGGER_DELAY = 300;

export function useDragDrop(componentId: string, index: number) {
  const { reorderComponents, setDraggingComponent } = useSandboxStore();
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startIndexRef = useRef(index);
  const currentIndexRef = useRef(index);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      startYRef.current = e.clientY;
      startIndexRef.current = index;
      currentIndexRef.current = index;

      dragTimerRef.current = setTimeout(() => {
        isDraggingRef.current = true;
        setDraggingComponent(componentId);
        document.body.style.cursor = 'grabbing';
        document.body.classList.add('user-select-none');
      }, DRAG_TRIGGER_DELAY);
    },
    [componentId, index, setDraggingComponent]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const container = containerRef.current?.parentElement;
      if (!container) return;

      const children = Array.from(container.children) as HTMLElement[];
      const currentEl = containerRef.current;
      if (!currentEl) return;

      const mouseY = e.clientY;
      const currentRect = currentEl.getBoundingClientRect();
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let newIndex = currentIndexRef.current;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child === currentEl) continue;
        const rect = child.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;

        if (mouseY < centerY && mouseY < currentCenterY && i < currentIndexRef.current) {
          newIndex = i;
          break;
        }
        if (mouseY > centerY && mouseY > currentCenterY && i > currentIndexRef.current) {
          newIndex = i;
        }
      }

      if (newIndex !== currentIndexRef.current) {
        const from = currentIndexRef.current;
        const to = newIndex;
        reorderComponents(from, to);
        currentIndexRef.current = to;
      }
    },
    [reorderComponents]
  );

  const handleMouseUp = useCallback(() => {
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
    }

    if (isDraggingRef.current) {
      interactionLogger.log('component_drag_end', {
        componentId,
        fromIndex: startIndexRef.current,
        toIndex: currentIndexRef.current,
      });
    }

    isDraggingRef.current = false;
    setDraggingComponent(null);
    document.body.style.cursor = '';
    document.body.classList.remove('user-select-none');
  }, [componentId, setDraggingComponent]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    currentIndexRef.current = index;
  }, [index]);

  const setRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
  }, []);

  return {
    handleMouseDown,
    setRef,
    isDragging: useSandboxStore.getState().draggingComponentId === componentId,
  };
}
