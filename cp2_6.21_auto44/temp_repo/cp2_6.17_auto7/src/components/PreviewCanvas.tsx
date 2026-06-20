import { useRef, useEffect } from 'react';
import { useCanvasPreview } from '@/hooks/useCanvasPreview';

interface PreviewCanvasProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  backgroundColor: string;
  className?: string;
}

export default function PreviewCanvas({
  text,
  fontFamily,
  fontSize,
  lineHeight,
  color,
  backgroundColor,
  className = '',
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCanvasPreview(canvasRef, {
    text,
    fontFamily,
    fontSize,
    lineHeight,
    color,
    backgroundColor,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const o = { text, fontFamily, fontSize, lineHeight, color, backgroundColor };
      import('@/utils/canvasRenderer').then(({ renderTextOnCanvas }) => {
        renderTextOnCanvas(canvas, o.text, o.fontFamily, o.fontSize, o.lineHeight, o.color, o.backgroundColor);
      });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [text, fontFamily, fontSize, lineHeight, color, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`preview-canvas ${className}`}
    />
  );
}
