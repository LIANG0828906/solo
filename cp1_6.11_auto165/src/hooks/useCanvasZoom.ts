import { useEffect, useCallback, useRef } from 'react';
import { useBoardStore } from '@/store/boardStore';

export function useCanvasZoom(canvasRef: React.RefObject<HTMLDivElement | null>) {
  const zoom = useBoardStore((s) => s.zoom);
  const panX = useBoardStore((s) => s.panX);
  const panY = useBoardStore((s) => s.panY);
  const setZoom = useBoardStore((s) => s.setZoom);
  const setPan = useBoardStore((s) => s.setPan);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(3, Math.max(0.3, zoom + delta));
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scale = newZoom / zoom;
        const newPanX = mouseX - scale * (mouseX - panX);
        const newPanY = mouseY - scale * (mouseY - panY);

        if (canvasRef.current) {
          canvasRef.current.style.transition = 'transform 0.2s ease-out';
          setTimeout(() => {
            if (canvasRef.current) {
              canvasRef.current.style.transition = '';
            }
          }, 200);
        }

        setZoom(newZoom);
        setPan(newPanX, newPanY);
      } else {
        setPan(panX - e.deltaX, panY - e.deltaY);
      }
    },
    [zoom, panX, panY, setZoom, setPan, canvasRef]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        isPanning.current = true;
        panStart.current = { x: e.clientX, y: e.clientY, panX, panY };
      }
    },
    [panX, panY]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan(panStart.current.panX + dx, panStart.current.panY + dy);
    },
    [setPan]
  );

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canvasRef, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  return { zoom, panX, panY, setZoom, setPan };
}
