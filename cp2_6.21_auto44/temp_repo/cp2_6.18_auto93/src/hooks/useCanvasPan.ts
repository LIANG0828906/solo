import { useState, useCallback, useRef } from 'react';

interface PanState {
  isPanning: boolean;
  startX: number;
  startY: number;
  offsetStartX: number;
  offsetStartY: number;
}

export const useCanvasPan = () => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const panStateRef = useRef<PanState>({
    isPanning: false,
    startX: 0,
    startY: 0,
    offsetStartX: 0,
    offsetStartY: 0,
  });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.min(Math.max(prev * delta, 0.25), 2));
  }, []);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 1 && !e.ctrlKey) return;
    e.preventDefault();
    panStateRef.current = {
      isPanning: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetStartX: offset.x,
      offsetStartY: offset.y,
    };
  }, [offset]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!panStateRef.current.isPanning) return;
    const deltaX = e.clientX - panStateRef.current.startX;
    const deltaY = e.clientY - panStateRef.current.startY;
    setOffset({
      x: panStateRef.current.offsetStartX + deltaX,
      y: panStateRef.current.offsetStartY + deltaY,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    panStateRef.current.isPanning = false;
  }, []);

  const resetView = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  }, []);

  return {
    offset,
    scale,
    setOffset,
    setScale,
    handleWheel,
    handlePanStart,
    handleMouseMove,
    handleMouseUp,
    resetView,
  };
};
