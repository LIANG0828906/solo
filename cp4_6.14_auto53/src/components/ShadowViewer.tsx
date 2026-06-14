import React, { useEffect, useRef } from 'react';
import { SunParams } from '../App';

interface ShadowViewerProps {
  sunParams: SunParams;
}

const ShadowViewer: React.FC<ShadowViewerProps> = ({ sunParams }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    ctx.globalAlpha = sunParams.shadowIntensity * 0.15;
    ctx.fillStyle = sunParams.shadowColor;

    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) / 100;

    const azimuthRad = (sunParams.azimuth * Math.PI) / 180;
    const altitudeRad = (sunParams.altitude * Math.PI) / 180;
    const shadowLengthFactor = altitudeRad > 0.01 ? 1 / Math.tan(altitudeRad) : 20;
    const shadowDirX = -Math.sin(azimuthRad);
    const shadowDirZ = -Math.cos(azimuthRad);

    const buildings = [
      { x: -18, z: -12, w: 12, d: 15, h: 24 },
      { x: 6, z: 6, w: 15, d: 12, h: 36 },
      { x: 15, z: -18, w: 9, d: 18, h: 18 }
    ];

    buildings.forEach(b => {
      const shadowOffsetX = shadowDirX * b.h * shadowLengthFactor * 0.3;
      const shadowOffsetZ = shadowDirZ * b.h * shadowLengthFactor * 0.3;

      const baseX = cx + b.x * scale;
      const baseY = cy + b.z * scale;
      const shadowX = baseX + shadowOffsetX * scale;
      const shadowY = baseY + shadowOffsetZ * scale;

      const halfW = (b.w / 2) * scale;
      const halfD = (b.d / 2) * scale;

      ctx.beginPath();
      ctx.moveTo(baseX - halfW, baseY - halfD);
      ctx.lineTo(baseX + halfW, baseY - halfD);
      ctx.lineTo(shadowX + halfW, shadowY - halfD);
      ctx.lineTo(shadowX + halfW, shadowY + halfD);
      ctx.lineTo(shadowX - halfW, shadowY + halfD);
      ctx.lineTo(baseX - halfW, baseY + halfD);
      ctx.closePath();
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }, [sunParams]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2
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

export default ShadowViewer;
