import { useEffect, useRef, useCallback } from 'react';
import { renderTextOnCanvas } from '@/utils/canvasRenderer';

interface UseCanvasPreviewOptions {
  text: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  backgroundColor: string;
}

export function useCanvasPreview(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseCanvasPreviewOptions
) {
  const rafRef = useRef<number>(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const o = optionsRef.current;
    renderTextOnCanvas(canvas, o.text, o.fontFamily, o.fontSize, o.lineHeight, o.color, o.backgroundColor);
  }, [canvasRef]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, options.text, options.fontFamily, options.fontSize, options.lineHeight, options.color, options.backgroundColor]);
}
