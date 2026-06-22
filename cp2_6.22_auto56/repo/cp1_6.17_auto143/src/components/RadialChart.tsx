import { useEffect, useRef, useState } from 'react';
import type { TagFrequency } from '../types';
import './RadialChart.css';

interface RadialChartProps {
  data: TagFrequency[];
  size?: number;
}

export function RadialChart({ data, size = 180 }: RadialChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const animationRef = useRef<number>(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const progressRef = useRef(0);

  const center = size / 2;
  const radius = size / 2 - 10;

  useEffect(() => {
    progressRef.current = 0;
    setIsAnimating(true);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      if (data.length === 0) {
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('情绪分布', center, center);
        return;
      }

      const total = data.reduce((sum, item) => sum + item.count, 0);
      const progress = isAnimating ? progressRef.current : 1;
      let currentAngle = -Math.PI / 2;

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const sliceAngle = (item.count / total) * Math.PI * 2 * progress;
        const isHovered = hoveredIndex === i;
        const scale = isHovered ? 1.05 : 1;
        const r = radius * scale;

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, r, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();

        ctx.fillStyle = item.color;
        ctx.fill();

        currentAngle += sliceAngle;
      }

      ctx.beginPath();
      ctx.arc(center, center, radius * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#fffdf7';
      ctx.fill();

      if (hoveredIndex !== null && data[hoveredIndex]) {
        const item = data[hoveredIndex];
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.tag, center, center - 8);
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '11px sans-serif';
        ctx.fillText(`${item.count} 次`, center, center + 10);
      } else if (!isAnimating) {
        ctx.fillStyle = '#2c3e50';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('情绪分布', center, center);
      }

      if (isAnimating) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    const animate = () => {
      if (progressRef.current < 1) {
        progressRef.current = Math.min(progressRef.current + 0.03, 1);
        if (progressRef.current >= 1) {
          setIsAnimating(false);
        }
      }
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    draw();
    if (isAnimating) {
      animate();
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [data, hoveredIndex, size, center, radius, isAnimating]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    const dist = Math.sqrt(x * x + y * y);

    if (dist > radius * 0.55 && dist < radius) {
      const total = data.reduce((sum, item) => sum + item.count, 0);
      let angle = Math.atan2(y, x);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;

      let currentAngle = -Math.PI / 2;
      for (let i = 0; i < data.length; i++) {
        const sliceAngle = (data[i].count / total) * Math.PI * 2;
        if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
          setHoveredIndex(i);
          return;
        }
        currentAngle += sliceAngle;
      }
    }
    setHoveredIndex(null);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="radial-chart">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
