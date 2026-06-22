import { useRef, useCallback } from 'react';
import { useBoardStore } from '@/store/boardStore';

export function useDrag(elementId: string) {
  const zoom = useBoardStore((s) => s.zoom);
  const moveElement = useBoardStore((s) => s.moveElement);
  const elements = useBoardStore((s) => s.elements);
  const startMouse = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const el = elements.find((el) => el.id === elementId);
      if (!el) return;

      startMouse.current = { x: e.clientX, y: e.clientY };
      startPos.current = { x: el.x, y: el.y };

      const onMouseMove = (ev: MouseEvent) => {
        const dx = (ev.clientX - startMouse.current.x) / zoom;
        const dy = (ev.clientY - startMouse.current.y) / zoom;
        moveElement(elementId, startPos.current.x + dx, startPos.current.y + dy);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [elementId, zoom, moveElement, elements]
  );

  return { onMouseDown };
}
