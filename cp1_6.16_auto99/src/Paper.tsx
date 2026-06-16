import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, Particle, VERTEX_COLORS } from './types';

interface PaperProps {
  initialVertices?: Point[];
  referenceVertices?: Point[];
  onComplete?: (vertices: Point[], foldLine: Point[]) => void;
  isEditing?: boolean;
}

const CANVAS_SIZE = 300;
const VERTEX_RADIUS = 8;
const CENTER_BUTTON_RADIUS = 12;
const FOLD_COLOR = '#555';
const FOLD_LINE_WIDTH = 2;

const defaultVertices: Point[] = [
  { x: 50, y: 50 },
  { x: 250, y: 50 },
  { x: 250, y: 250 },
  { x: 50, y: 250 },
];

const Paper: React.FC<PaperProps> = ({
  initialVertices,
  referenceVertices,
  onComplete,
  isEditing = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const verticesRef = useRef<Point[]>(
    initialVertices ? [...initialVertices] : [...defaultVertices]
  );
  const particlesRef = useRef<Particle[]>([]);
  const draggingRef = useRef<number | null>(null);
  const foldingRef = useRef<boolean>(false);
  const foldProgressRef = useRef<number>(0);
  const foldDirectionRef = useRef<number>(1);
  const foldStartTimeRef = useRef<number>(0);
  const isCompletedRef = useRef<boolean>(false);
  const rotationRef = useRef<number>(0);
  const centerPulseRef = useRef<number>(0);

  const [, forceUpdate] = useState({});

  const getFoldLine = useCallback((verts: Point[]): Point[] => {
    const dx = verts[2].x - verts[0].x;
    const dy = verts[2].y - verts[0].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;

    const midX = (verts[1].x + verts[3].x) / 2;
    const midY = (verts[1].y + verts[3].y) / 2;

    const deformation = Math.abs(
      (verts[1].x - defaultVertices[1].x) + (verts[1].y - defaultVertices[1].y) +
      (verts[3].x - defaultVertices[3].x) + (verts[3].y - defaultVertices[3].y)
    ) / 4;

    const foldLength = Math.min(80 + deformation * 0.5, 180);
    const halfLen = foldLength / 2;

    return [
      { x: midX - nx * halfLen, y: midY - ny * halfLen },
      { x: midX + nx * halfLen, y: midY + ny * halfLen },
    ];
  }, []);

  const createParticles = useCallback((x: number, y: number) => {
    const colors = [...VERTEX_COLORS, '#ffd700', '#ff69b4', '#00ced1'];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.0;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        life: 1,
      });
    }
  }, []);

  const updateParticles = useCallback(() => {
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.opacity = Math.max(0, p.life);
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }, []);

  const drawVertex = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      isDragging: boolean
    ) => {
      const radius = isDragging ? VERTEX_RADIUS * 1.3 : VERTEX_RADIUS;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.5);
      gradient.addColorStop(0, color + '80');
      gradient.addColorStop(0.5, color + '40');
      gradient.addColorStop(1, color + '00');

      ctx.beginPath();
      ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color + 'cc';
      ctx.fill();
      ctx.strokeStyle = '#ffffff80';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    []
  );

  const drawPaperShape = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      verts: Point[],
      fillColor: string,
      strokeColor: string,
      globalAlpha: number = 1
    ) => {
      ctx.save();
      ctx.globalAlpha = globalAlpha;
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; i++) {
        ctx.lineTo(verts[i].x, verts[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  const drawFoldLine = useCallback(
    (ctx: CanvasRenderingContext2D, foldLine: Point[]) => {
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = FOLD_COLOR;
      ctx.lineWidth = FOLD_LINE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(foldLine[0].x, foldLine[0].y);
      ctx.lineTo(foldLine[1].x, foldLine[1].y);
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  const drawCenterButton = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
      const pulse = Math.sin(time * 0.003) * 0.1 + 1;
      centerPulseRef.current = pulse;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotationRef.current);

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dotX = Math.cos(angle) * (CENTER_BUTTON_RADIUS + 6) * pulse;
        const dotY = Math.sin(angle) * (CENTER_BUTTON_RADIUS + 6) * pulse;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700' + Math.floor((0.5 + Math.sin(time * 0.005 + i) * 0.5) * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }

      ctx.restore();

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, CENTER_BUTTON_RADIUS * 1.5);
      gradient.addColorStop(0, '#ffd700');
      gradient.addColorStop(0.7, '#daa520');
      gradient.addColorStop(1, '#b8860b00');

      ctx.beginPath();
      ctx.arc(x, y, CENTER_BUTTON_RADIUS * pulse, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = '#fff8dc';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x - 3, y - 3, CENTER_BUTTON_RADIUS * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff60';
      ctx.fill();
    },
    []
  );

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const p of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
  }, []);

  const drawReferenceVertices = useCallback(
    (ctx: CanvasRenderingContext2D, refVerts: Point[]) => {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#88888860';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(refVerts[0].x, refVerts[0].y);
      for (let i = 1; i < refVerts.length; i++) {
        ctx.lineTo(refVerts[i].x, refVerts[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < refVerts.length; i++) {
        ctx.beginPath();
        ctx.arc(refVerts[i].x, refVerts[i].y, 4, 0, Math.PI * 2);
        ctx.fillStyle = VERTEX_COLORS[i] + '40';
        ctx.fill();
      }
    },
    []
  );

  const mirrorPoint = useCallback(
    (point: Point, foldLine: Point[]): Point => {
      const [p1, p2] = foldLine;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;

      const t =
        ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lenSq;

      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;

      return {
        x: 2 * projX - point.x,
        y: 2 * projY - point.y,
      };
    },
    []
  );

  const getFoldedVertices = useCallback(
    (verts: Point[], foldLine: Point[], progress: number): Point[] => {
      const mirrored = verts.map((v) => mirrorPoint(v, foldLine));
      return verts.map((v, i) => ({
        x: v.x + (mirrored[i].x - v.x) * progress,
        y: v.y + (mirrored[i].y - v.y) * progress,
      }));
    },
    [mirrorPoint]
  );

  const drawShadowModel = useCallback(
    (ctx: CanvasRenderingContext2D, verts: Point[]) => {
      ctx.save();

      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < verts.length; i++) {
        ctx.lineTo(verts[i].x, verts[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = '#2a2a3e';
      ctx.fill();
      ctx.strokeStyle = '#4a4a6e';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    },
    []
  );

  const render = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const verts = verticesRef.current;
      const foldLine = getFoldLine(verts);

      rotationRef.current += 0.02;

      if (referenceVertices && isEditing) {
        drawReferenceVertices(ctx, referenceVertices);
      }

      if (isCompletedRef.current) {
        drawShadowModel(ctx, verts);
        drawFoldLine(ctx, foldLine);
        return;
      }

      if (foldingRef.current) {
        const elapsed = time - foldStartTimeRef.current;
        const duration = 1000;
        let progress = Math.min(elapsed / duration, 1);

        if (progress >= 1) {
          foldingRef.current = false;
          foldProgressRef.current = 0;
          isCompletedRef.current = true;
          if (onComplete) {
            onComplete(
              verts.map((v) => ({ ...v })),
              foldLine.map((p) => ({ ...p }))
            );
          }
          forceUpdate({});
        } else {
          const eased =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          foldProgressRef.current = eased;
        }

        const foldedVerts = getFoldedVertices(
          verts,
          foldLine,
          foldProgressRef.current
        );

        drawPaperShape(ctx, verts, '#f5f5dc', '#d4c896', 1);

        const mirroredVerts = getFoldedVertices(
          verts,
          foldLine,
          foldProgressRef.current
        );
        drawPaperShape(
          ctx,
          [mirroredVerts[0], mirroredVerts[1], foldedVerts[1], foldedVerts[0]],
          '#e8e8d0',
          '#c4b886',
          0.3 + foldProgressRef.current * 0
        );

        drawFoldLine(ctx, foldLine);
      } else {
        drawPaperShape(ctx, verts, '#f5f5dc', '#d4c896');
        drawFoldLine(ctx, foldLine);
      }

      const centerX = (verts[0].x + verts[2].x) / 2;
      const centerY = (verts[0].y + verts[2].y) / 2;

      if (isEditing && !isCompletedRef.current) {
        drawCenterButton(ctx, centerX, centerY, time);
      }

      if (isEditing) {
        for (let i = 0; i < 4; i++) {
          drawVertex(
            ctx,
            verts[i].x,
            verts[i].y,
            VERTEX_COLORS[i],
            draggingRef.current === i
          );
        }
      }

      updateParticles();
      drawParticles(ctx);

      animationRef.current = requestAnimationFrame(render);
    },
    [
      getFoldLine,
      drawPaperShape,
      drawFoldLine,
      drawVertex,
      drawCenterButton,
      drawParticles,
      updateParticles,
      drawReferenceVertices,
      drawShadowModel,
      referenceVertices,
      isEditing,
      getFoldedVertices,
      onComplete,
    ]
  );

  const getMousePos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const isPointInVertex = useCallback(
    (point: Point, vertex: Point): boolean => {
      const dx = point.x - vertex.x;
      const dy = point.y - vertex.y;
      return Math.sqrt(dx * dx + dy * dy) <= VERTEX_RADIUS * 2;
    },
    []
  );

  const isPointInCenterButton = useCallback(
    (point: Point): boolean => {
      const verts = verticesRef.current;
      const centerX = (verts[0].x + verts[2].x) / 2;
      const centerY = (verts[0].y + verts[2].y) / 2;
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      return Math.sqrt(dx * dx + dy * dy) <= CENTER_BUTTON_RADIUS * 1.5;
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isEditing || isCompletedRef.current || foldingRef.current) return;

      const pos = getMousePos(e);

      if (isPointInCenterButton(pos)) {
        foldingRef.current = true;
        foldStartTimeRef.current = performance.now();
        foldDirectionRef.current = 1;
        return;
      }

      const verts = verticesRef.current;
      for (let i = 0; i < 4; i++) {
        if (isPointInVertex(pos, verts[i])) {
          draggingRef.current = i;
          createParticles(verts[i].x, verts[i].y);
          break;
        }
      }
    },
    [isEditing, getMousePos, isPointInVertex, isPointInCenterButton, createParticles]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggingRef.current === null) return;

      const pos = getMousePos(e);
      const index = draggingRef.current;
      const verts = verticesRef.current;

      const clampedX = Math.max(10, Math.min(CANVAS_SIZE - 10, pos.x));
      const clampedY = Math.max(10, Math.min(CANVAS_SIZE - 10, pos.y));

      if (Math.random() < 0.3) {
        createParticles(verts[index].x, verts[index].y);
      }

      verts[index].x = clampedX;
      verts[index].y = clampedY;
    },
    [getMousePos, createParticles]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingRef.current !== null) {
      const verts = verticesRef.current;
      const idx = draggingRef.current;
      createParticles(verts[idx].x, verts[idx].y);
    }
    draggingRef.current = null;
  }, [createParticles]);

  const handleMouseLeave = useCallback(() => {
    draggingRef.current = null;
  }, []);

  const resetPaper = useCallback(() => {
    verticesRef.current = initialVertices
      ? [...initialVertices]
      : [...defaultVertices];
    isCompletedRef.current = false;
    foldingRef.current = false;
    foldProgressRef.current = 0;
    forceUpdate({});
  }, [initialVertices]);

  useEffect(() => {
    if (initialVertices) {
      verticesRef.current = [...initialVertices];
      isCompletedRef.current = false;
      forceUpdate({});
    }
  }, [initialVertices]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: isEditing && !isCompletedRef.current ? 'grab' : 'default',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          background: 'linear-gradient(135deg, #faf8f5 0%, #f0ebe3 100%)',
        }}
      />
      {isCompletedRef.current && (
        <button
          onClick={resetPaper}
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            padding: '6px 12px',
            fontSize: '12px',
            background: 'linear-gradient(135deg, #ffd700, #daa520)',
            color: '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          重折
        </button>
      )}
    </div>
  );
};

export default Paper;
