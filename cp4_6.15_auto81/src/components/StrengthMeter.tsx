import React, { useRef, useEffect, useState } from 'react';
import type { StrengthLevel } from '../types';

interface StrengthMeterProps {
  entropy: number;
  strengthLevel: StrengthLevel;
  strengthText: string;
}

const MAX_ENTROPY = 128;
const CANVAS_SIZE = 280;
const ARC_WIDTH = 24;

export const StrengthMeter: React.FC<StrengthMeterProps> = ({ entropy, strengthLevel, strengthText }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [displayEntropy, setDisplayEntropy] = useState(0);

  useEffect(() => {
    const startValue = displayEntropy;
    const endValue = Math.min(entropy, MAX_ENTROPY);
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;
      setDisplayEntropy(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [entropy]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    const radius = CANVAS_SIZE / 2 - ARC_WIDTH - 10;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = ARC_WIDTH;
    ctx.lineCap = 'round';
    ctx.stroke();

    const progress = displayEntropy / MAX_ENTROPY;
    const currentEndAngle = startAngle + (endAngle - startAngle) * progress;

    if (progress > 0) {
      const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      gradient.addColorStop(0, '#ff6b6b');
      gradient.addColorStop(0.33, '#ffd93d');
      gradient.addColorStop(0.66, '#6bcb77');
      gradient.addColorStop(1, '#00d4ff');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, currentEndAngle);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = ARC_WIDTH;
      ctx.lineCap = 'round';
      ctx.shadowColor = getStrengthColor(strengthLevel);
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(strengthText, centerX, centerY - 10);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${displayEntropy.toFixed(1)} bits`, centerX, centerY + 25);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('熵值', centerX, centerY + 50);
  }, [displayEntropy, strengthLevel, strengthText]);

  return (
    <div className="strength-meter">
      <canvas ref={canvasRef} />
    </div>
  );
};

function getStrengthColor(level: StrengthLevel): string {
  const colors: Record<StrengthLevel, string> = {
    'weak': '#ff6b6b',
    'medium': '#ffd93d',
    'strong': '#6bcb77',
    'very-strong': '#00d4ff'
  };
  return colors[level];
}
