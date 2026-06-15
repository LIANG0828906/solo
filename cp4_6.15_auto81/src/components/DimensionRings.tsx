import React, { useRef, useEffect } from 'react';
import type { DimensionScores } from '../types';

interface DimensionRingsProps {
  scores: DimensionScores;
  entropy: number;
}

interface RingConfig {
  key: keyof DimensionScores;
  label: string;
  color: string;
}

const RING_CONFIGS: RingConfig[] = [
  { key: 'uppercase', label: '大写字母', color: '#00d4ff' },
  { key: 'lowercase', label: '小写字母', color: '#ff6b6b' },
  { key: 'numbers', label: '数字', color: '#ffd93d' },
  { key: 'specialChars', label: '特殊字符', color: '#6bcb77' },
  { key: 'length', label: '密码长度', color: '#a855f7' }
];

const CANVAS_SIZE = 110;
const RING_WIDTH = 10;

export const DimensionRings: React.FC<DimensionRingsProps> = ({ scores, entropy }) => {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const animationRef = useRef<number>(0);
  const rotationAngles = useRef<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    const baseSpeed = 0.02;
    const speedFactor = entropy > 0 ? Math.max(0.1, 1 / (entropy / 20)) : 1;
    const actualSpeed = baseSpeed * speedFactor;

    const animate = () => {
      rotationAngles.current = rotationAngles.current.map(
        (angle, index) => (angle + actualSpeed * (1 + index * 0.1)) % (Math.PI * 2)
      );

      canvasRefs.current.forEach((canvas, index) => {
        if (!canvas) return;
        const config = RING_CONFIGS[index];
        const score = scores[config.key];
        drawRing(canvas, score, config.color, rotationAngles.current[index]);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scores, entropy]);

  const drawRing = (canvas: HTMLCanvasElement, score: number, color: string, rotationAngle: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;
    ctx.scale(dpr, dpr);

    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const radius = CANVAS_SIZE / 2 - RING_WIDTH - 5;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = RING_WIDTH;
    ctx.stroke();

    if (score > 0) {
      const progress = score / 100;
      const endAngle = -Math.PI / 2 + progress * Math.PI * 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = RING_WIDTH;
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const dotAngle = -Math.PI / 2 + rotationAngle;
      const dotX = centerX + Math.cos(dotAngle) * radius;
      const dotY = centerY + Math.sin(dotAngle) * radius;

      ctx.beginPath();
      ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${score}%`, centerX, centerY);
  };

  return (
    <div className="dimension-rings">
      {RING_CONFIGS.map((config, index) => (
        <div key={config.key} className="ring-item">
          <canvas
            ref={(el) => {
              canvasRefs.current[index] = el;
            }}
          />
          <span className="ring-label" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
      ))}
    </div>
  );
};
