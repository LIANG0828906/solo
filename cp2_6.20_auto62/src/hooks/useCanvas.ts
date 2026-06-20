import { useRef, useEffect, useCallback } from 'react';

export function useCanvas(
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
): [React.RefObject<HTMLCanvasElement>, () => void] {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const renderRef = useRef(render);
  const lastSizeRef = useRef({ width: -1, height: -1, dpr: -1 });

  renderRef.current = render;

  const draw = useCallback(() => {
    rafRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.floor(rect.width));
    const cssHeight = Math.max(1, Math.floor(rect.height));

    const targetWidth = cssWidth * dpr;
    const targetHeight = cssHeight * dpr;

    if (
      lastSizeRef.current.width !== cssWidth ||
      lastSizeRef.current.height !== cssHeight ||
      lastSizeRef.current.dpr !== dpr
    ) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      lastSizeRef.current = { width: cssWidth, height: cssHeight, dpr };
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    renderRef.current(ctx, cssWidth, cssHeight);
  }, []);

  const requestDraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      requestDraw();
    });
    resizeObserver.observe(canvas);

    const handleResize = () => requestDraw();
    window.addEventListener('resize', handleResize);

    requestDraw();
    const timers = [
      setTimeout(requestDraw, 0),
      setTimeout(requestDraw, 30),
      setTimeout(requestDraw, 100),
      setTimeout(requestDraw, 300),
    ];

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      timers.forEach(clearTimeout);
    };
  }, [requestDraw]);

  return [canvasRef, requestDraw];
}
