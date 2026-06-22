import { useRef, useEffect } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { LEATHER_BOUNDS, CuttingPieceData } from '@/types';
import { getShapeOutlinePoints } from '@/modules/leather/LeatherViewer';

export function Viewport2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pieces = useLayoutStore((s) => s.pieces);
  const showCuttingPath = useLayoutStore((s) => s.showCuttingPath);
  const defects = useLayoutStore((s) => s.defects);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    const scaleX = w / LEATHER_BOUNDS.width;
    const scaleY = h / LEATHER_BOUNDS.height;
    const halfW = LEATHER_BOUNDS.width / 2;
    const halfH = LEATHER_BOUNDS.height / 2;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);

    const gridSize = 20;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      (halfW - LEATHER_BOUNDS.width / 2) * scaleX,
      (halfH - LEATHER_BOUNDS.height / 2) * scaleY,
      LEATHER_BOUNDS.width * scaleX,
      LEATHER_BOUNDS.height * scaleY
    );

    defects.forEach((d) => {
      ctx.beginPath();
      ctx.arc(
        (d.position.x + halfW) * scaleX,
        (d.position.y + halfH) * scaleY,
        d.radius * Math.min(scaleX, scaleY),
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 68, 68, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 68, 68, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    if (showCuttingPath) {
      pieces.forEach((piece) => {
        drawPiecePath(ctx, piece, scaleX, scaleY, halfW, halfH);
      });
    } else {
      pieces.forEach((piece) => {
        drawPieceFill(ctx, piece, scaleX, scaleY, halfW, halfH);
      });
    }
  }, [pieces, showCuttingPath, defects]);

  return (
    <div className="absolute bottom-24 left-4 z-10 glass-panel rounded-xl overflow-hidden"
      style={{ width: 200, height: 130 }}
    >
      <div className="absolute top-1.5 left-2 text-[8px] text-white/40 uppercase tracking-wider">
        2D 展开图
      </div>
      <canvas
        ref={canvasRef}
        width={200}
        height={130}
        className="w-full h-full"
      />
    </div>
  );
}

function drawPieceFill(
  ctx: CanvasRenderingContext2D,
  piece: CuttingPieceData,
  scaleX: number,
  scaleY: number,
  halfW: number,
  halfH: number
) {
  const points = getShapeOutlinePoints(piece.shape, piece.width * piece.scale, piece.height * piece.scale);
  const cos = Math.cos(piece.rotation);
  const sin = Math.sin(piece.rotation);

  ctx.beginPath();
  points.forEach(([px, py], i) => {
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;
    const cx = (piece.position.x + rx + halfW) * scaleX;
    const cy = (piece.position.y + ry + halfH) * scaleY;
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.closePath();

  const alpha = piece.isColliding ? 0.3 : 0.15;
  ctx.fillStyle = piece.isColliding ? `rgba(255,68,68,${alpha})` : `rgba(0,255,136,${alpha})`;
  ctx.fill();

  ctx.strokeStyle = piece.isColliding ? 'rgba(255,68,68,0.6)' : 'rgba(0,255,136,0.4)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawPiecePath(
  ctx: CanvasRenderingContext2D,
  piece: CuttingPieceData,
  scaleX: number,
  scaleY: number,
  halfW: number,
  halfH: number
) {
  const points = getShapeOutlinePoints(piece.shape, piece.width * piece.scale, piece.height * piece.scale);
  const cos = Math.cos(piece.rotation);
  const sin = Math.sin(piece.rotation);

  ctx.beginPath();
  points.forEach(([px, py], i) => {
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;
    const cx = (piece.position.x + rx + halfW) * scaleX;
    const cy = (piece.position.y + ry + halfH) * scaleY;
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.closePath();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(0,255,136,0.08)';
  ctx.fill();
}
