import React, { useEffect, useRef, memo } from 'react';
import type { RadarScores } from '../types';

interface RadarChartProps {
  scores: RadarScores;
}

const dimensions = [
  { key: 'contentDepth', label: '内容深度' },
  { key: 'funFactor', label: '趣味性' },
  { key: 'teacherQuality', label: '师资力量' },
  { key: 'valueForMoney', label: '性价比' },
  { key: 'afterClassService', label: '课后服务' },
] as const;

const RadarChart: React.FC<RadarChartProps> = memo(({ scores }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const targetScoresRef = useRef<RadarScores>(scores);
  const currentScoresRef = useRef<RadarScores>({
    contentDepth: 0,
    funFactor: 0,
    teacherQuality: 0,
    valueForMoney: 0,
    afterClassService: 0,
  });

  useEffect(() => {
    targetScoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const count = dimensions.length;
    const angleStep = (Math.PI * 2) / count;

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let level = 1; level <= 5; level++) {
        ctx.beginPath();
        const levelRadius = (radius / 5) * level;
        for (let i = 0; i <= count; i++) {
          const angle = i * angleStep - Math.PI / 2;
          const x = centerX + levelRadius * Math.cos(angle);
          const y = centerY + levelRadius * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = '#e1e8ed';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < count; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#e1e8ed';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      for (let i = 0; i <= count; i++) {
        const idx = i % count;
        const key = dimensions[idx].key;
        const score = currentScoresRef.current[key];
        const scoreRatio = score / 10;
        const pointRadius = radius * scoreRatio;
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + pointRadius * Math.cos(angle);
        const y = centerY + pointRadius * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let i = 0; i < count; i++) {
        const key = dimensions[i].key;
        const score = currentScoresRef.current[key];
        const scoreRatio = score / 10;
        const pointRadius = radius * scoreRatio;
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + pointRadius * Math.cos(angle);
        const y = centerY + pointRadius * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#3498db';
        ctx.fill();
      }

      for (let i = 0; i < count; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = radius + 12;
        const x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);
        ctx.font = '10px "Noto Sans SC", sans-serif';
        ctx.fillStyle = '#7f8c8d';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dimensions[i].label, x, y);
      }
    };

    let startTime: number | null = null;
    const animationDuration = 800;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = easeOutCubic(progress);

      for (const dim of dimensions) {
        const startValue = 0;
        const targetValue = targetScoresRef.current[dim.key];
        currentScoresRef.current[dim.key] =
          startValue + (targetValue - startValue) * easedProgress;
      }

      draw();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startTime = null;
      for (const dim of dimensions) {
        currentScoresRef.current[dim.key] = 0;
      }
      const newRect = canvas.getBoundingClientRect();
      canvas.width = newRect.width * dpr;
      canvas.height = newRect.height * dpr;
      ctx.scale(dpr, dpr);
      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="radar-section">
      <div className="radar-container">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
      <div className="radar-legend">
        {dimensions.map((dim) => (
          <span key={dim.key} className="legend-item">
            {dim.label}: {scores[dim.key].toFixed(1)}
          </span>
        ))}
      </div>
    </div>
  );
});

RadarChart.displayName = 'RadarChart';

export default RadarChart;
