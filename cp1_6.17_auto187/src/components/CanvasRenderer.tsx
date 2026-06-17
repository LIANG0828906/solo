import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CanvasRendererParams {
  hue: number;
  rotation: number;
  shapeCount: number;
}

interface CanvasRendererProps {
  params: CanvasRendererParams;
  onSave: (imageData: string) => void;
}

type ShapeType = 'circle' | 'triangle' | 'star';

interface ShapeConfig {
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  opacity: number;
  hueOffset: number;
  saturation: number;
  lightness: number;
  phase: number;
  jitterAmplitude: number;
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashParams(params: CanvasRendererParams): number {
  const h = ((params.hue * 374761393 + params.rotation * 668265263 + params.shapeCount * 2147483647) | 0);
  return h >>> 0;
}

function generateShapes(params: CanvasRendererParams): ShapeConfig[] {
  const seed = hashParams(params);
  const rng = mulberry32(seed);
  const shapes: ShapeConfig[] = [];
  const types: ShapeType[] = ['circle', 'triangle', 'star'];

  for (let i = 0; i < params.shapeCount; i++) {
    const type = types[Math.floor(rng() * types.length)];
    const x = 300 + (rng() * 300 - 150);
    const y = 300 + (rng() * 300 - 150);
    const size = 20 + rng() * 60;
    const opacity = 0.4 + rng() * 0.5;
    const hueOffset = rng() * 60 - 30;
    const saturation = 60 + rng() * 20;
    const lightness = 45 + rng() * 20;
    const phase = rng() * Math.PI * 2;
    const jitterAmplitude = 2 + rng() * 4;

    shapes.push({
      type,
      x,
      y,
      size,
      opacity,
      hueOffset,
      saturation,
      lightness,
      phase,
      jitterAmplitude,
    });
  }

  return shapes;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerRadius: number,
) {
  const innerRadius = outerRadius * 0.4;
  const spikes = 5;
  const step = Math.PI / spikes;
  let rot = -Math.PI / 2;

  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const px = cx + Math.cos(rot) * r;
    const py = cy + Math.sin(rot) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
    rot += step;
  }
  ctx.closePath();
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
}

const CanvasRenderer: React.FC<CanvasRendererProps> = ({ params, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const shapesRef = useRef<ShapeConfig[]>(generateShapes(params));
  const prevParamsRef = useRef<CanvasRendererParams>(params);
  const [showConfirm, setShowConfirm] = useState(false);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    if (
      prevParamsRef.current.hue !== params.hue ||
      prevParamsRef.current.rotation !== params.rotation ||
      prevParamsRef.current.shapeCount !== params.shapeCount
    ) {
      shapesRef.current = generateShapes(params);
      prevParamsRef.current = params;
    }
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      timeRef.current += 1;
      const t = timeRef.current;

      ctx.clearRect(0, 0, 600, 600);

      ctx.save();
      ctx.translate(300, 300);
      const baseAngle = (params.rotation * Math.PI) / 180;
      const continuousRotation = params.rotation * 0.001 * t;
      ctx.rotate(baseAngle + continuousRotation);
      ctx.translate(-300, -300);

      const shapes = shapesRef.current;

      for (const shape of shapes) {
        const jitterX = Math.sin(t * 0.03 + shape.phase) * shape.jitterAmplitude;
        const jitterY = Math.cos(t * 0.025 + shape.phase) * shape.jitterAmplitude;

        const sx = shape.x + jitterX;
        const sy = shape.y + jitterY;

        const hue = ((params.hue + shape.hueOffset) % 360 + 360) % 360;
        const color = `hsla(${hue}, ${shape.saturation}%, ${shape.lightness}%, ${shape.opacity})`;

        ctx.save();
        ctx.fillStyle = color;

        switch (shape.type) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(sx, sy, shape.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'triangle':
            drawTriangle(ctx, sx, sy, shape.size);
            ctx.fill();
            break;
          case 'star':
            drawStar(ctx, sx, sy, shape.size);
            ctx.fill();
            break;
        }

        ctx.restore();
      }

      ctx.restore();

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [params]);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageData = canvas.toDataURL('image/png');
    onSave(imageData);
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 1500);
  }, [onSave]);

  return (
    <div
      style={{
        background: '#1E1E2E',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flex: 1,
      }}
    >
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          style={{ display: 'block' }}
        />
        {showConfirm && (
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 48,
              color: '#4CAF50',
              pointerEvents: 'none',
              animation: 'confirmFade 1.5s ease-in-out forwards',
            }}
          >
            ✓
          </span>
        )}
      </div>
      <style>{`
        @keyframes confirmFade {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <button
        onClick={handleSave}
        style={{
          marginTop: 16,
          padding: '12px 32px',
          background: '#8B7D6B',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#6B5E4D';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#8B7D6B';
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        Save
      </button>
    </div>
  );
};

export default CanvasRenderer;
