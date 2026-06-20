import { useRef, useEffect, useCallback } from 'react';

export function useCanvas(
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
): [React.RefObject<HTMLCanvasElement>, () => void] {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef(false);
  const renderRef = useRef(render);
  const sizeRef = useRef({ width: 0, height: 0 });

  renderRef.current = render;

  const draw = useCallback(() => {
    pendingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const cssHeight = rect.height;

    if (cssWidth === 0 || cssHeight === 0) return;

    const targetWidth = Math.floor(cssWidth * dpr);
    const targetHeight = Math.floor(cssHeight * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      sizeRef.current = { width: cssWidth, height: cssHeight };
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    renderRef.current(ctx, cssWidth, cssHeight);
  }, []);

  const requestDraw = useCallback(() => {
    if (pendingRef.current) return;
    pendingRef.current = true;
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
    const t1 = setTimeout(requestDraw, 0);
    const t2 = setTimeout(requestDraw, 50);
    const t3 = setTimeout(requestDraw, 200);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [requestDraw]);

  return [canvasRef, requestDraw];
}
