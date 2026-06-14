import React, { useEffect, useRef } from 'react';
import { useStarData } from '../hooks/useStarData';
import type { Star } from '../types';
import { useStarContext } from '../context/StarContext';

interface RadarMapProps {
  allStars?: Star[];
}

const RadarMap: React.FC<RadarMapProps> = ({ allStars: propStars }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const { stars: hookStars } = useStarData();
  const { selectedBody } = useStarContext();
  const dataRef = useRef<Star[]>([]);

  const stars = propStars ?? hookStars;

  useEffect(() => {
    dataRef.current = stars;
  }, [stars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 176;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 8;

    let startTime = performance.now();

    const draw = () => {
      const now = performance.now();
      const t = (now - startTime) / 1000;

      ctx.clearRect(0, 0, size, size);

      ctx.save();
      const pulse1 = 0.5 + Math.sin(t * 1.8) * 0.5;
      ctx.shadowColor = `rgba(0, 212, 255, ${0.35 + pulse1 * 0.35})`;
      ctx.shadowBlur = 18 + pulse1 * 8;
      ctx.strokeStyle = `rgba(0, 212, 255, ${0.25 + pulse1 * 0.1})`;
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (maxR * i) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();
      ctx.restore();

      const nav = (window as any).__starNavData;
      let camX = 0,
        camY = 0,
        camZ = 0,
        dirX = 0,
        dirZ = -1;
      if (nav) {
        camX = nav.cameraPosRef.current?.x ?? 0;
        camY = nav.cameraPosRef.current?.y ?? 0;
        camZ = nav.cameraPosRef.current?.z ?? 0;
        dirX = nav.cameraDirRef.current?.x ?? 0;
        dirZ = nav.cameraDirRef.current?.z ?? -1;
      }

      const selectedId = selectedBody
        ? selectedBody.type === 'star'
          ? selectedBody.data.id
          : (selectedBody.type === 'planet' ? selectedBody.parentStar.id : null)
        : null;

      const starList = dataRef.current;
      if (starList.length > 0) {
        const coords = starList.map((s) => ({
          x: s.coordinates.x,
          y: s.coordinates.y,
          z: s.coordinates.z,
        }));
        const xs = coords.map((c) => Math.abs(c.x - camX));
        const zs = coords.map((c) => Math.abs(c.z - camZ));
        const maxAxis = Math.max(20, ...xs, ...zs) * 1.15;

        starList.forEach((star) => {
          const dx = star.coordinates.x - camX;
          const dz = star.coordinates.z - camZ;
          const rx = (dx / maxAxis) * maxR;
          const ry = (dz / maxAxis) * maxR;
          const px = cx + rx;
          const py = cy + ry;
          const isSelected = star.id === selectedId;

          const dist = Math.sqrt(dx * dx + dz * dz);
          const inView = dist <= maxAxis;

          if (inView) {
            const dotSize = isSelected ? 5 : 3.5;

            if (isSelected) {
              const selPulse = 0.5 + Math.sin(t * 3.5) * 0.5;
              ctx.save();
              ctx.shadowColor = 'rgba(168, 85, 247, 0.9)';
              ctx.shadowBlur = 14 + selPulse * 10;
              ctx.fillStyle = `rgba(168, 85, 247, ${0.2 + selPulse * 0.3})`;
              ctx.beginPath();
              ctx.arc(px, py, dotSize + 4 + selPulse * 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }

            ctx.save();
            ctx.shadowColor = star.color;
            ctx.shadowBlur = isSelected ? 16 : 8;
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(px, py, dotSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else {
            const mag = Math.atan2(dz, dx);
            const edgeX = cx + Math.cos(mag) * (maxR - 4);
            const edgeY = cy + Math.sin(mag) * (maxR - 4);
            ctx.save();
            ctx.translate(edgeX, edgeY);
            ctx.rotate(mag);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-4, -3.5);
            ctx.lineTo(-4, 3.5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        });
      }

      ctx.save();
      const angle = Math.atan2(dirZ, dirX);
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.shadowColor = 'rgba(168, 85, 247, 0.9)';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.85)';
      ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const halfFov = Math.PI / 5;
      ctx.arc(0, 0, maxR * 0.75, -halfFov, halfFov);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      const sweepAngle = (t * 1.2) % (Math.PI * 2);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, 'rgba(0, 212, 255, 0)');
      grad.addColorStop(0.7, 'rgba(0, 212, 255, 0.12)');
      grad.addColorStop(1, 'rgba(0, 212, 255, 0)');
      const sweepGrad = ctx.createConicGradient
        ? (() => {
            const g = (ctx as any).createConicGradient(sweepAngle, cx, cy);
            g.addColorStop(0, 'rgba(0, 212, 255, 0.45)');
            g.addColorStop(0.12, 'rgba(0, 212, 255, 0)');
            g.addColorStop(1, 'rgba(0, 212, 255, 0)');
            return g;
          })()
        : null;
      ctx.fillStyle = sweepGrad ?? 'rgba(0, 212, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, sweepAngle - 0.6, sweepAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedBody, propStars]);

  return (
    <div className="radar-container">
      <div className="radar-title">▸ 导航雷达</div>
      <canvas ref={canvasRef} className="radar-canvas" />
    </div>
  );
};

export default RadarMap;
