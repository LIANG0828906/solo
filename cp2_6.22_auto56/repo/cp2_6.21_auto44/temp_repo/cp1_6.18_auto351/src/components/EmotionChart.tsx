import { useEffect, useRef } from 'react';
import type { EmotionCoords } from '../types';

interface EmotionChartProps {
  emotionCoords: EmotionCoords;
  emotionKeyword: string;
  width?: number;
  height?: number;
}

export default function EmotionChart({
  emotionCoords,
  emotionKeyword,
  width = 300,
  height = 300,
}: EmotionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowPhaseRef = useRef(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 40;
    const chartSize = width - padding * 2;

    const draw = () => {
      glowPhaseRef.current += 0.05;
      const glowIntensity = (Math.sin(glowPhaseRef.current) + 1) / 2;

      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        width / 2
      );
      gradient.addColorStop(0, '#1A1A2E');
      gradient.addColorStop(1, '#0D0D1A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(padding, height / 2);
      ctx.lineTo(width - padding, height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width / 2, padding);
      ctx.lineTo(width / 2, height - padding);
      ctx.stroke();

      ctx.fillStyle = '#888';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';

      ctx.fillText('低沉', padding + 20, height / 2 + 20);
      ctx.fillText('兴奋', width - padding - 20, height / 2 + 20);
      ctx.fillText('愉悦', width / 2, padding - 10);
      ctx.fillText('低落', width / 2, height - padding + 20);

      const pointX = padding + (emotionCoords.arousal / 100) * chartSize;
      const pointY = height - padding - (emotionCoords.valence / 100) * chartSize;

      const glowRadius = 20 + glowIntensity * 15;
      const glowGradient = ctx.createRadialGradient(pointX, pointY, 0, pointX, pointY, glowRadius);
      glowGradient.addColorStop(0, `rgba(255, 255, 255, ${0.4 + glowIntensity * 0.3})`);
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(pointX, pointY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pointX, pointY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = '#ffffff';
      const textY = pointY < height / 2 ? pointY - 18 : pointY + 28;
      ctx.fillText(emotionKeyword, pointX, textY);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#00E5FF';
      ctx.fillText(`激活: ${emotionCoords.arousal.toFixed(0)} | 愉悦: ${emotionCoords.valence.toFixed(0)}`, width / 2, height - 10);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [emotionCoords, emotionKeyword, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        borderRadius: '12px',
      }}
    />
  );
}
