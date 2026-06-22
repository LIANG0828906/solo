import { useRef, useEffect, useState } from 'react';

interface StrengthMeterProps {
  entropy: number;
  strengthLevel: string;
  strengthText: string;
}

const MAX_ENTROPY = 128;
const CANVAS_SIZE = 280;
const ARC_WIDTH = 24;

const COLOR_STOPS = [
  { entropy: 0, r: 255, g: 107, b: 107 },
  { entropy: 32, r: 255, g: 180, b: 71 },
  { entropy: 64, r: 255, g: 217, b: 61 },
  { entropy: 96, r: 107, g: 203, b: 119 },
  { entropy: 128, r: 0, g: 212, b: 255 }
];

function interpolateColor(entropy: number): { r: number; g: number; b: number } {
  let clampedEntropy = Math.max(0, Math.min(MAX_ENTROPY, entropy));
  
  if (clampedEntropy <= COLOR_STOPS[0].entropy) {
    return {
      r: COLOR_STOPS[0].r,
      g: COLOR_STOPS[0].g,
      b: COLOR_STOPS[0].b
    };
  }
  
  if (clampedEntropy >= COLOR_STOPS[COLOR_STOPS.length - 1].entropy) {
    return {
      r: COLOR_STOPS[COLOR_STOPS.length - 1].r,
      g: COLOR_STOPS[COLOR_STOPS.length - 1].g,
      b: COLOR_STOPS[COLOR_STOPS.length - 1].b
    };
  }
  
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const start = COLOR_STOPS[i];
    const end = COLOR_STOPS[i + 1];
    
    if (clampedEntropy >= start.entropy && clampedEntropy <= end.entropy) {
      const range = end.entropy - start.entropy;
      const progress = range === 0 ? 0 : (clampedEntropy - start.entropy) / range;
      
      return {
        r: Math.round(start.r + (end.r - start.r) * progress),
        g: Math.round(start.g + (end.g - start.g) * progress),
        b: Math.round(start.b + (end.b - start.b) * progress)
      };
    }
  }
  
  return {
    r: COLOR_STOPS[COLOR_STOPS.length - 1].r,
    g: COLOR_STOPS[COLOR_STOPS.length - 1].g,
    b: COLOR_STOPS[COLOR_STOPS.length - 1].b
  };
}

export function StrengthMeter({ entropy, strengthText }: StrengthMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [displayEntropy, setDisplayEntropy] = useState(0);

  useEffect(function() {
    const startValue = displayEntropy;
    const endValue = Math.min(entropy, MAX_ENTROPY);
    const duration = 500;
    const startTime = performance.now();

    const animate = function(currentTime: number) {
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

    return function() {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [entropy]);

  useEffect(function() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    canvas.style.width = CANVAS_SIZE + 'px';
    canvas.style.height = CANVAS_SIZE + 'px';
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
      const color = interpolateColor(displayEntropy);
      const colorStr = 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, currentEndAngle);
      ctx.strokeStyle = colorStr;
      ctx.lineWidth = ARC_WIDTH;
      ctx.lineCap = 'round';
      ctx.shadowColor = colorStr;
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const glowX = centerX + Math.cos(currentEndAngle) * radius;
      const glowY = centerY + Math.sin(currentEndAngle) * radius;
      const glowGradient = ctx.createRadialGradient(
        glowX, glowY, 0,
        glowX, glowY, ARC_WIDTH
      );
      glowGradient.addColorStop(0, colorStr);
      glowGradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(glowX, glowY, ARC_WIDTH, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(strengthText, centerX, centerY - 10);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(displayEntropy.toFixed(1) + ' bits', centerX, centerY + 25);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('熵值', centerX, centerY + 50);
  }, [displayEntropy, strengthText]);

  return (
    <div className="strength-meter">
      <canvas ref={canvasRef} />
    </div>
  );
}
