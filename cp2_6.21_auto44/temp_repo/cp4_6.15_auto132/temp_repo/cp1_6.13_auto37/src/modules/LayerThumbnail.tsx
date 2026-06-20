import { useEffect, useRef } from 'react';
import type { Layer } from './DataModel';

interface LayerThumbnailProps {
  layer: Layer;
  size?: number;
}

export function LayerThumbnail({ layer, size = 16 }: LayerThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    const { bounds, pathString } = layer.path;
    const { tx, ty, scaleX, scaleY, rotation } = layer.transform;

    const pathW = bounds.width * Math.abs(scaleX);
    const pathH = bounds.height * Math.abs(scaleY);

    if (pathW <= 0 || pathH <= 0 || !pathString) return;

    const padding = 2;
    const availW = size - padding * 2;
    const availH = size - padding * 2;
    const fitScale = Math.min(availW / pathW, availH / pathH);

    const centerX = bounds.centerX + tx;
    const centerY = bounds.centerY + ty;

    const scaledCenterX = size / 2;
    const scaledCenterY = size / 2;

    ctx.save();
    ctx.translate(scaledCenterX, scaledCenterY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(fitScale * scaleX, fitScale * scaleY);
    ctx.translate(-centerX, -centerY);

    ctx.strokeStyle = layer.path.color;
    ctx.lineWidth = Math.max(0.5, layer.path.strokeWidth / 4);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const path = new Path2D(pathString);
    ctx.stroke(path);

    ctx.restore();
  }, [layer, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        borderRadius: 3,
        flexShrink: 0,
        imageRendering: 'pixelated'
      }}
    />
  );
}
