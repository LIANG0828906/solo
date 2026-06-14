import React, { useEffect, useRef } from 'react';
import { SunParams } from '../App';

interface ShadowViewerProps {
  sunParams: SunParams;
  shadowCanvas: HTMLCanvasElement | null;
}

const ShadowViewer: React.FC<ShadowViewerProps> = ({ sunParams, shadowCanvas }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;

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

      if (shadowCanvas && shadowCanvas.width > 0) {
        ctx.save();
        ctx.globalAlpha = sunParams.shadowIntensity * 0.85;
        ctx.globalCompositeOperation = 'multiply';
        const c = hexToRgb(sunParams.shadowColor);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${sunParams.shadowIntensity * 0.6})`;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(shadowCanvas, 0, 0, width, height);
        ctx.restore();
      } else {
        const azimuthRad = (sunParams.azimuth * Math.PI) / 180;
        const altitudeRad = (sunParams.altitude * Math.PI) / 180;
        const shadowLengthFactor = altitudeRad > 0.01 ? 1 / Math.tan(altitudeRad) : 20;
        const shadowDirX = -Math.sin(azimuthRad);
        const shadowDirZ = -Math.cos(azimuthRad);

        const sampleBuildings = [
          { x: -6, z: -4, w: 4, d: 5, h: 8, cx: 0.35, cy: 0.45 },
          { x: 2, z: 2, w: 5, d: 4, h: 12, cx: 0.5, cy: 0.55 },
          { x: 5, z: -6, w: 3, d: 6, h: 6, cx: 0.62, cy: 0.4 }
        ];

        ctx.save();
        ctx.globalAlpha = sunParams.shadowIntensity * 0.6;
        ctx.fillStyle = sunParams.shadowColor;

        sampleBuildings.forEach(b => {
          const shadowOffsetX = shadowDirX * b.h * shadowLengthFactor * 0.008;
          const shadowOffsetY = shadowDirZ * b.h * shadowLengthFactor * 0.008;
          const bw = b.w * width / 70;
          const bd = b.d * height / 70;
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
  }, [sunParams, shadowCanvas]);

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
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
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
