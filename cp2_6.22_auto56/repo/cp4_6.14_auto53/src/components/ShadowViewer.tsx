import React, { useEffect, useRef, useState } from 'react';
import { SunParams } from '../App';

interface ShadowViewerProps {
  sunParams: SunParams;
  shadowCanvas: HTMLCanvasElement | null;
}

const ShadowViewer: React.FC<ShadowViewerProps> = ({ sunParams, shadowCanvas }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasRealShadow, setHasRealShadow] = useState(false);
  const checkTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!shadowCanvas) return;
    const check = () => {
      if (shadowCanvas.width > 0 && shadowCanvas.height > 0) {
        const ctx = shadowCanvas.getContext('2d');
        if (ctx) {
          try {
            const data = ctx.getImageData(0, 0, 1, 1).data;
            const hasPixels = data[3] > 0 || (data[0] !== 0 || data[1] !== 0 || data[2] !== 0);
            const fullData = ctx.getImageData(0, 0, Math.min(shadowCanvas.width, 32), Math.min(shadowCanvas.height, 32));
            let variance = 0;
            for (let i = 3; i < fullData.data.length; i += 400) {
              variance += Math.abs(fullData.data[i] - 128);
            }
            if (hasPixels || variance > 5) setHasRealShadow(true);
          } catch (_) {}
        }
      }
    };
    check();
    checkTimer.current = window.setInterval(check, 500);
    return () => {
      if (checkTimer.current) window.clearInterval(checkTimer.current);
    };
  }, [shadowCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const colorRgb = hexToRgb(sunParams.shadowColor);

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      ctx.clearRect(0, 0, width, height);
      const shadowAlpha = Math.max(0.2, Math.min(1, sunParams.shadowIntensity));

      if (hasRealShadow && shadowCanvas && shadowCanvas.width > 0 && shadowCanvas.height > 0) {
        ctx.save();
        ctx.globalAlpha = shadowAlpha * 0.95;
        ctx.fillStyle = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 1)`;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(shadowCanvas, 0, 0, width, height);
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = shadowAlpha;
        ctx.restore();

        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = shadowAlpha * 0.9;
        const off = document.createElement('canvas');
        off.width = shadowCanvas.width;
        off.height = shadowCanvas.height;
        const octx = off.getContext('2d');
        if (octx) {
          octx.drawImage(shadowCanvas, 0, 0);
          const img = octx.getImageData(0, 0, off.width, off.height);
          const d = img.data;
          for (let i = 0; i < d.length; i += 4) {
            const a = d[i + 3] / 255;
            d[i] = Math.floor(colorRgb.r * a);
            d[i + 1] = Math.floor(colorRgb.g * a);
            d[i + 2] = Math.floor(colorRgb.b * a);
            d[i + 3] = Math.floor(a * shadowAlpha * 230);
          }
          octx.putImageData(img, 0, 0);
          ctx.drawImage(off, 0, 0, width, height);
        }
        ctx.restore();
      } else {
        const azimuthRad = (sunParams.azimuth * Math.PI) / 180;
        const altitudeRad = (sunParams.altitude * Math.PI) / 180;
        const shadowLengthFactor = altitudeRad > 0.01 ? 1 / Math.tan(altitudeRad) : 20;
        const shadowDirX = -Math.sin(azimuthRad);
        const shadowDirZ = -Math.cos(azimuthRad);
        const buildings = [
          { x: -6, z: -4, w: 4, d: 5, h: 8, cx: 0.38, cy: 0.45 },
          { x: 2, z: 2, w: 5, d: 4, h: 12, cx: 0.50, cy: 0.55 },
          { x: 5, z: -6, w: 3, d: 6, h: 6, cx: 0.62, cy: 0.40 }
        ];
        ctx.save();
        ctx.globalAlpha = shadowAlpha;
        ctx.fillStyle = `rgb(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b})`;
        buildings.forEach(b => {
          const shadowOffsetX = shadowDirX * b.h * shadowLengthFactor * 0.008;
          const shadowOffsetY = shadowDirZ * b.h * shadowLengthFactor * 0.008;
          const bw = b.w * width / 60;
          const bd = b.d * height / 60;
          const bx = b.cx * width;
          const by = b.cy * height;
          const sx = bx + shadowOffsetX * width;
          const sy = by + shadowOffsetY * height;
          ctx.beginPath();
          ctx.moveTo(bx - bw / 2, by - bd / 2);
          ctx.lineTo(bx + bw / 2, by - bd / 2);
          ctx.lineTo(sx + bw / 2, sy - bd / 2);
          ctx.lineTo(sx + bw / 2, sy + bd / 2);
          ctx.lineTo(sx - bw / 2, sy + bd / 2);
          ctx.lineTo(bx - bw / 2, by + bd / 2);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [sunParams, shadowCanvas, hasRealShadow]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2,
        mixBlendMode: 'multiply'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: 12,
          padding: '4px 10px',
          fontSize: 11,
          color: hasRealShadow ? '#22c55e' : '#94a3b8',
          background: 'rgba(30,41,59,0.6)',
          borderRadius: 6,
          backdropFilter: 'blur(4px)',
          border: hasRealShadow ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(148,163,184,0.2)'
        }}
      >
        {hasRealShadow ? '● 真实阴影贴图' : '○ 阴影初始化中...'}
      </div>
    </div>
  );
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 26, g: 26, b: 46 };
}

export default ShadowViewer;
