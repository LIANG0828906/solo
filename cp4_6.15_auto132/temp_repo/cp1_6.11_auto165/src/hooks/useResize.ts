import { useRef, useCallback } from 'react';
import { useBoardStore } from '@/store/boardStore';

type Handle = 'nw' | 'ne' | 'sw' | 'se';

export function useResize(elementId: string) {
  const zoom = useBoardStore((s) => s.zoom);
  const resizeElement = useBoardStore((s) => s.resizeElement);
  const moveElement = useBoardStore((s) => s.moveElement);
  const elements = useBoardStore((s) => s.elements);
  const startMouse = useRef({ x: 0, y: 0 });
  const startBounds = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: Handle) => {
      e.preventDefault();
      e.stopPropagation();

      const el = elements.find((el) => el.id === elementId);
      if (!el) return;

      startMouse.current = { x: e.clientX, y: e.clientY };
      startBounds.current = { x: el.x, y: el.y, width: el.width, height: el.height };

      const onMouseMove = (ev: MouseEvent) => {
        const rawDx = (ev.clientX - startMouse.current.x) / zoom;
        const rawDy = (ev.clientY - startMouse.current.y) / zoom;
        const { x, y, width, height } = startBounds.current;
        const minSize = 30;

        let newX = x;
        let newY = y;
        let newW = width;
        let newH = height;

        switch (handle) {
          case 'se':
            newW = Math.max(minSize, width + rawDx);
            newH = Math.max(minSize, height + rawDy);
            break;
          case 'nw':
            newW = Math.max(minSize, width - rawDx);
            newH = Math.max(minSize, height - rawDy);
            newX = x + width - newW;
            newY = y + height - newH;
            break;
          case 'ne':
            newW = Math.max(minSize, width + rawDx);
            newH = Math.max(minSize, height - rawDy);
            newY = y + height - newH;
            break;
          case 'sw':
            newW = Math.max(minSize, width - rawDx);
            newH = Math.max(minSize, height + rawDy);
            newX = x + width - newW;
            break;
        }

        resizeElement(elementId, newW, newH);
        moveElement(elementId, newX, newY);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [elementId, zoom, resizeElement, moveElement, elements]
  );

  return { onResizeMouseDown };
}
