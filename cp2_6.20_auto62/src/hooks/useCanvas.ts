import { useRef, useEffect, useCallback } from 'react';

export function useCanvas(
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  deps: unknown[] = []
): React.RefObject<HTMLCanvasElement> {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const cssHeight = rect.height;

    if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    render(ctx, cssWidth, cssHeight);
  }, deps);

  const requestDraw = useCallback(() => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    rafRef.current = requestAnimationFrame(() => {
      pendingRef.current = false;
      draw();
    });
  }, [draw]);

  useEffect(() => {
    requestDraw();

    const handleResize = () => requestDraw();
    window.addEventListener('resize', handleResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [requestDraw]);

  return canvasRef;
}
