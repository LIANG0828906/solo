import React, { memo, useRef, useEffect, useCallback } from 'react';
import { StarDust, InspirationTask } from '@/types';
import { ParticleSystem } from '@/utils/particleSystem';

const COLOR_HEX: Record<string, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  gold: '#f1c40f',
  purple: '#9b59b6',
  green: '#2ecc71',
};

const CONSTELLATIONS = [
  { id: 'aries', name: '白羊座', position: { x: 0.2, y: 0.3 } },
  { id: 'taurus', name: '金牛座', position: { x: 0.5, y: 0.2 } },
  { id: 'gemini', name: '双子座', position: { x: 0.8, y: 0.3 } },
  { id: 'cancer', name: '巨蟹座', position: { x: 0.15, y: 0.5 } },
  { id: 'leo', name: '狮子座', position: { x: 0.35, y: 0.6 } },
  { id: 'virgo', name: '处女座', position: { x: 0.65, y: 0.6 } },
  { id: 'libra', name: '天秤座', position: { x: 0.85, y: 0.5 } },
  { id: 'scorpio', name: '天蝎座', position: { x: 0.25, y: 0.75 } },
  { id: 'sagittarius', name: '射手座', position: { x: 0.5, y: 0.85 } },
  { id: 'capricorn', name: '摩羯座', position: { x: 0.75, y: 0.75 } },
  { id: 'aquarius', name: '水瓶座', position: { x: 0.3, y: 0.15 } },
  { id: 'pisces', name: '双鱼座', position: { x: 0.7, y: 0.15 } },
];

interface StarMapProps {
  placedStardust: StarDust[];
  isDragging: boolean;
  draggedStardust: StarDust | null;
  dragPosition: { x: number; y: number };
  completedConstellations: string[];
  onPlaceStardust: (stardust: StarDust) => void;
  triggerSuccess: () => void;
  triggerFailure: () => void;
  currentTask: InspirationTask | null;
}

const StarMap: React.FC<StarMapProps> = ({
  placedStardust,
  isDragging,
  draggedStardust,
  dragPosition,
  completedConstellations,
  onPlaceStardust,
  triggerSuccess,
  triggerFailure,
  currentTask,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const platformPositionRef = useRef<{ x: number; y: number; radius: number }>({
    x: 0,
    y: 0,
    radius: 80,
  });
  const rotationRef = useRef(0);
  const successFlashRef = useRef(0);
  const shakeRef = useRef(0);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particleCanvasRef.current = canvas;
    canvasRef.current?.parentElement?.appendChild(canvas);
    particleSystemRef.current = new ParticleSystem(canvas);

    return () => {
      canvas.remove();
    };
  }, []);

  const drawStarDust = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      size: number = 20,
      rotation: number = 0
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color + '80');
      gradient.addColorStop(1, color + '00');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.arc(-size * 0.15, -size * 0.15, size * 0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    []
  );

  const render = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = timestamp;

    const width = canvas.width;
    const height = canvas.height;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0b0b2e');
    bgGradient.addColorStop(1, '#1a1a4e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 200; i++) {
      const x = (i * 137.508) % width;
      const y = (i * 73.254) % height;
      const size = (i % 3) * 0.5 + 0.5;
      const alpha = 0.3 + (i % 10) * 0.05;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    CONSTELLATIONS.forEach((constellation) => {
      const x = constellation.position.x * width;
      const y = constellation.position.y * height;
      const isCompleted = completedConstellations.includes(constellation.id);

      if (isCompleted) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f1c40f';
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 15 + Math.sin(Date.now() * 0.003) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const centerX = width / 2;
    const centerY = height / 2;
    platformPositionRef.current = { x: centerX, y: centerY, radius: 80 };

    rotationRef.current += 0.005;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRef.current);

    for (let i = 0; i < 3; i++) {
      const ringRadius = 70 + i * 15;
      ctx.strokeStyle = `rgba(155, 89, 182, ${0.3 - i * 0.1})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#9b59b6';
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    const pulseSize = 50 + Math.sin(Date.now() * 0.002) * 5;
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
    centerGradient.addColorStop(0, 'rgba(155, 89, 182, 0.5)');
    centerGradient.addColorStop(0.5, 'rgba(155, 89, 182, 0.2)');
    centerGradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    placedStardust.forEach((stardust, index) => {
      const angle = (index / placedStardust.length) * Math.PI * 2 + rotationRef.current;
      const orbitRadius = 60;
      const x = centerX + Math.cos(angle) * orbitRadius;
      const y = centerY + Math.sin(angle) * orbitRadius;
      drawStarDust(ctx, x, y, COLOR_HEX[stardust.color], 18, rotationRef.current * 2);
    });

    if (isDragging && draggedStardust) {
      const shake = shakeRef.current > 0 ? (Math.random() - 0.5) * 4 : 0;
      const dragX = dragPosition.x + shake;
      const dragY = dragPosition.y + shake;

      if (particleSystemRef.current && Math.random() > 0.5) {
        particleSystemRef.current.addTrail(
          dragX,
          dragY,
          COLOR_HEX[draggedStardust.color]
        );
      }

      drawStarDust(
        ctx,
        dragX,
        dragY,
        COLOR_HEX[draggedStardust.color],
        24,
        Date.now() * 0.005
      );
    }

    if (particleSystemRef.current) {
      particleSystemRef.current.update(dt);
      particleSystemRef.current.render();
    }

    if (successFlashRef.current > 0) {
      ctx.save();
      ctx.globalAlpha = successFlashRef.current;
      const flashGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(width, height)
      );
      flashGradient.addColorStop(0, 'rgba(241, 196, 15, 0.8)');
      flashGradient.addColorStop(0.5, 'rgba(241, 196, 15, 0.3)');
      flashGradient.addColorStop(1, 'rgba(241, 196, 15, 0)');
      ctx.fillStyle = flashGradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      successFlashRef.current -= 0.02;
    }

    if (shakeRef.current > 0) {
      shakeRef.current -= 0.02;
    }

    animationFrameRef.current = requestAnimationFrame(render);
  }, [
    placedStardust,
    isDragging,
    draggedStardust,
    dragPosition,
    completedConstellations,
    drawStarDust,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (particleCanvasRef.current && particleSystemRef.current) {
        particleCanvasRef.current.width = window.innerWidth;
        particleCanvasRef.current.height = window.innerHeight;
        particleSystemRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging || !draggedStardust) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const platform = platformPositionRef.current;

      const distance = Math.sqrt(
        Math.pow(x - platform.x, 2) + Math.pow(y - platform.y, 2)
      );

      if (distance <= platform.radius) {
        const currentColors = placedStardust.map((s) => s.color);
        const newColors = [...currentColors, draggedStardust.color];

        if (currentTask) {
          const required = [...currentTask.requiredColors].sort();
          const submitted = [...newColors].sort();
          const isMatch =
            required.length === submitted.length &&
            required.every((color, i) => color === submitted[i]);

          if (isMatch) {
            successFlashRef.current = 1;
            if (particleSystemRef.current) {
              particleSystemRef.current.addExplosion(
                platform.x,
                platform.y,
                ['#f1c40f', '#ffffff', '#ffd700'],
                300
              );
            }
            triggerSuccess();
          } else if (newColors.length >= currentTask.requiredColors.length) {
            shakeRef.current = 1;
            if (particleSystemRef.current) {
              particleSystemRef.current.addDissipate(
                platform.x,
                platform.y,
                100
              );
            }
            triggerFailure();
            return;
          }
        }

        onPlaceStardust(draggedStardust);
      }
    },
    [isDragging, draggedStardust, placedStardust, currentTask, onPlaceStardust, triggerSuccess, triggerFailure]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging || !particleSystemRef.current) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (draggedStardust && Math.random() > 0.7) {
        particleSystemRef.current.addTrail(
          x,
          y,
          COLOR_HEX[draggedStardust.color]
        );
      }
    },
    [isDragging, draggedStardust]
  );

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      style={{ touchAction: 'none' }}
    />
  );
};

export default memo(StarMap);
