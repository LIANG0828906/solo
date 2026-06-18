import { useEffect, useRef, useMemo } from 'react';
import { useGradientStore } from '../store/gradientStore';
import type { GradientLayer, BlendMode } from '../store/gradientStore';

const hexToRgba = (hex: string, alpha: number = 1): string => {
  const h = hex.replace('#', '');
  const bigint = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const renderLayerToCanvas = (
  ctx: CanvasRenderingContext2D,
  layer: GradientLayer,
  width: number,
  height: number
) => {
  if (!layer.visible) return;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDim = Math.max(width, height);
  const scale = layer.scale;

  let gradient: CanvasGradient;

  switch (layer.type) {
    case 'linear': {
      const angleRad = (layer.angle * Math.PI) / 180;
      const diag = Math.sqrt(width * width + height * height) * scale;
      const halfDiag = diag / 2;
      const x1 = centerX - Math.cos(angleRad) * halfDiag;
      const y1 = centerY - Math.sin(angleRad) * halfDiag;
      const x2 = centerX + Math.cos(angleRad) * halfDiag;
      const y2 = centerY + Math.sin(angleRad) * halfDiag;
      gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      break;
    }
    case 'radial': {
      const radiusX = (width / 2) * scale;
      const radiusY = (height / 2) * scale;
      const radius = Math.max(radiusX, radiusY);
      gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );
      break;
    }
    case 'conic': {
      const startAngle = (layer.angle * Math.PI) / 180 - Math.PI / 2;
      const steps = 360;
      gradient = ctx.createConicGradient
        ? ctx.createConicGradient(startAngle, centerX, centerY)
        : ctx.createRadialGradient(
            centerX,
            centerY,
            0,
            centerX,
            centerY,
            maxDim * scale
          );
      if (!ctx.createConicGradient) {
        const cx = centerX;
        const cy = centerY;
        const r = maxDim * scale;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const angle = startAngle + t * Math.PI * 2;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          const color =
            t < 0.5
              ? hexToRgba(layer.colorStart, 1 - t * 2)
              : hexToRgba(layer.colorEnd, (t - 0.5) * 2);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          const angleEnd = startAngle + (i + 1) / steps * Math.PI * 2;
          ctx.arc(cx, cy, r, angle, angleEnd);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
          ctx.restore();
        }
        return;
      }
      break;
    }
    default:
      return;
  }

  gradient.addColorStop(0, layer.colorStart);
  gradient.addColorStop(1, layer.colorEnd);
  if (layer.type === 'conic') {
    gradient.addColorStop(1, layer.colorStart);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

const compositeMap: Record<BlendMode, GlobalCompositeOperation> = {
  normal: 'source-over',
  multiply: 'multiply',
  screen: 'screen',
};

const PreviewCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const layers = useGradientStore((s) => s.layers);
  const blendMode = useGradientStore((s) => s.blendMode);
  const dragOverIndex = useGradientStore((s) => s.dragOverIndex);

  const gridCanvasDataUrl = useMemo(() => {
    const off = document.createElement('canvas');
    off.width = 32;
    off.height = 32;
    const ctx = off.getContext('2d')!;
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#333348';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillRect(16, 16, 16, 16);
    return off.toDataURL();
  }, []);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      const pattern = bgCtx.createPattern(img, 'repeat');
      if (pattern) {
        bgCtx.fillStyle = pattern;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      }
    };
    img.src = gridCanvasDataUrl;
  }, [gridCanvasDataUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const cssW = 600;
    const cssH = 400;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    ctx.scale(dpr, dpr);

    const bgC = bgCanvasRef.current!;
    const bgCtx = bgC.getContext('2d')!;
    bgC.width = cssW * dpr;
    bgC.height = cssH * dpr;
    bgC.style.width = `${cssW}px`;
    bgC.style.height = `${cssH}px`;
    bgCtx.scale(dpr, dpr);
    const img = new Image();
    img.onload = () => {
      const pattern = bgCtx.createPattern(img, 'repeat');
      if (pattern) {
        bgCtx.fillStyle = '#1a1a2e';
        bgCtx.fillRect(0, 0, cssW, cssH);
        bgCtx.fillStyle = pattern;
        bgCtx.globalAlpha = 0.5;
        bgCtx.fillRect(0, 0, cssW, cssH);
        bgCtx.globalAlpha = 1;
      }
    };
    img.src = gridCanvasDataUrl;

    const render = () => {
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, cssW, cssH);

      const composite = compositeMap[blendMode];
      const reversedLayers = [...layers].reverse();
      reversedLayers.forEach((layer, idx) => {
        if (!layer.visible) return;
        if (idx > 0) {
          ctx.globalCompositeOperation = composite;
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }
        renderLayerToCanvas(ctx, layer, cssW, cssH);
      });
      ctx.globalCompositeOperation = 'source-over';

      if (dragOverIndex !== null) {
        const y = dragOverIndex * (400 / Math.max(layers.length, 1));
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cssW, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [layers, blendMode, dragOverIndex, gridCanvasDataUrl]);

  return (
    <div style={styles.container}>
      <div style={styles.label}>
        <span style={styles.labelText}>实时预览</span>
        <span style={styles.labelHint}>600 × 400 px</span>
      </div>
      <div style={styles.canvasWrapper}>
        <canvas ref={bgCanvasRef} style={styles.bgCanvas} />
        <canvas ref={canvasRef} style={styles.mainCanvas} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelText: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  labelHint: {
    fontSize: '12px',
    color: '#64748b',
  },
  canvasWrapper: {
    position: 'relative',
    width: 600,
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    background: '#1a1a2e',
  },
  bgCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 600,
    height: 400,
  },
  mainCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 600,
    height: 400,
  },
};

export default PreviewCanvas;
