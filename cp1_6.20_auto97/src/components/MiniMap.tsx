import React, { useRef, useEffect } from 'react';
import { Shape } from '../types';
import rough from 'roughjs';

interface MiniMapProps {
  shapes: Shape[];
  zoom: number;
  offsetX: number;
  offsetY: number;
  canvasWidth: number;
  canvasHeight: number;
}

const MiniMap: React.FC<MiniMapProps> = ({ shapes, zoom, offsetX, offsetY, canvasWidth, canvasHeight }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#F5F0E8';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (shapes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const shape of shapes) {
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    }

    const padding = 50;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const scale = Math.min(rect.width / contentWidth, rect.height / contentHeight, 1);

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-minX + padding, -minY + padding);

    const rc = rough.canvas(canvas);

    for (const shape of shapes) {
      const options = {
        stroke: shape.strokeColor,
        fill: shape.fillColor,
        strokeWidth: Math.max(1, shape.strokeWidth * 0.5),
        roughness: 0.5,
        seed: shape.roughSeed
      };

      switch (shape.type) {
        case 'rectangle':
          rc.rectangle(shape.x, shape.y, shape.width, shape.height, options);
          break;
        case 'diamond': {
          const cx = shape.x + shape.width / 2;
          const cy = shape.y + shape.height / 2;
          const points = [
            [cx, shape.y],
            [shape.x + shape.width, cy],
            [cx, shape.y + shape.height],
            [shape.x, cy]
          ] as [number, number][];
          rc.polygon(points, options);
          break;
        }
        case 'arrow': {
          rc.line(
            (shape as any).startX,
            (shape as any).startY,
            (shape as any).endX,
            (shape as any).endY,
            options
          );
          break;
        }
        case 'text':
          ctx.fillStyle = shape.strokeColor;
          ctx.font = `${shape.fontSize || 16}px 'Kalam', cursive`;
          ctx.fillText(shape.text || '', shape.x, shape.y);
          break;
        case 'pen':
          if (shape.points && shape.points.length > 1) {
            const points = shape.points.map(p => [p.x, p.y] as [number, number]);
            rc.curve(points, options);
          }
          break;
      }
    }

    ctx.restore();

    const viewportX = (-offsetX / zoom - minX + padding) * scale;
    const viewportY = (-offsetY / zoom - minY + padding) * scale;
    const viewportWidth = (canvasWidth / zoom) * scale;
    const viewportHeight = (canvasHeight / zoom) * scale;

    ctx.strokeStyle = '#E67E22';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(230, 126, 34, 0.1)';
    ctx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
    ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);

  }, [shapes, zoom, offsetX, offsetY, canvasWidth, canvasHeight]);

  return (
    <div ref={containerRef} className="minimap">
      <canvas ref={canvasRef} className="minimap-canvas" />
    </div>
  );
};

export default MiniMap;
