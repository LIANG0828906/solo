import React, { useRef, useEffect, useCallback } from 'react';
import { ElementType } from '../types';
import { elementColors } from '../data/eggs';
import './HatchCanvas.css';

interface HatchCanvasProps {
  element: ElementType;
  progress: number;
  isHatching: boolean;
  isComplete: boolean;
  success: boolean;
  petName?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Crack {
  x: number;
  y: number;
  segments: { x: number; y: number }[];
}

const HatchCanvas: React.FC<HatchCanvasProps> = ({
  element,
  progress,
  isHatching,
  isComplete,
  success,
  petName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const cracksRef = useRef<Crack[]>([]);
  const timeRef = useRef(0);
  const shakeRef = useRef({ x: 0, y: 0 });

  const canvasWidth = 400;
  const canvasHeight = 450;
  const eggCenterX = canvasWidth / 2;
  const eggCenterY = canvasHeight / 2 - 20;
  const eggRadiusX = 80;
  const eggRadiusY = 110;

  const generateCracks = useCallback((progressVal: number) => {
    const crackCount = Math.floor(progressVal / 15);
    const currentCracks = cracksRef.current;

    while (currentCracks.length < crackCount) {
      const startX = eggCenterX + (Math.random() - 0.5) * eggRadiusX * 0.8;
      const startY = eggCenterY + eggRadiusY * 0.6;
      const segments: { x: number; y: number }[] = [];

      let currX = startX;
      let currY = startY;
      const segmentsCount = 3 + Math.floor(Math.random() * 4);

      for (let i = 0; i < segmentsCount; i++) {
        currX += (Math.random() - 0.5) * 30;
        currY -= 15 + Math.random() * 20;
        segments.push({ x: currX, y: currY });
      }

      currentCracks.push({ x: startX, y: startY, segments });
    }
  }, [eggCenterX, eggCenterY, eggRadiusX, eggRadiusY]);

  const createCelebrationParticles = useCallback(() => {
    const colors = elementColors[element];
    const particleColors = [colors.from, colors.to, '#ffd700', '#fff', '#ffa500'];

    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;

      particlesRef.current.push({
        x: eggCenterX,
        y: eggCenterY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 5,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
      });
    }
  }, [element, eggCenterX, eggCenterY]);

  const drawEgg = useCallback(
    (ctx: CanvasRenderingContext2D, shakeX: number, shakeY: number) => {
      const colors = elementColors[element];
      const cx = eggCenterX + shakeX;
      const cy = eggCenterY + shakeY;

      ctx.save();
      const gradient = ctx.createLinearGradient(cx - eggRadiusX, cy - eggRadiusY, cx + eggRadiusX, cy + eggRadiusY);
      gradient.addColorStop(0, colors.from);
      gradient.addColorStop(1, colors.to);

      ctx.beginPath();
      ctx.ellipse(cx, cy, eggRadiusX, eggRadiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(cx - 15, cy - 30, 25, 35, -0.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(cx, cy, eggRadiusX, eggRadiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    },
    [element, eggCenterX, eggCenterY, eggRadiusX, eggRadiusY]
  );

  const drawCracks = useCallback(
    (ctx: CanvasRenderingContext2D, shakeX: number, shakeY: number) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      cracksRef.current.forEach((crack) => {
        ctx.beginPath();
        ctx.moveTo(crack.x + shakeX, crack.y + shakeY);
        crack.segments.forEach((seg) => {
          ctx.lineTo(seg.x + shakeX, seg.y + shakeY);
        });
        ctx.stroke();
      });

      ctx.restore();
    },
    []
  );

  const drawPet = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      if (!petName) return;

      const colors = elementColors[element];
      const bounceY = Math.sin(time * 0.005) * 10;
      const cy = eggCenterY + bounceY;

      ctx.save();

      const glowSize = 100 + Math.sin(time * 0.003) * 10;
      const glowGradient = ctx.createRadialGradient(eggCenterX, cy, 0, eggCenterX, cy, glowSize);
      glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
      glowGradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.3)');
      glowGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(eggCenterX - glowSize, cy - glowSize, glowSize * 2, glowSize * 2);

      const bodyGradient = ctx.createRadialGradient(eggCenterX - 10, cy - 10, 5, eggCenterX, cy, 50);
      bodyGradient.addColorStop(0, colors.to);
      bodyGradient.addColorStop(1, colors.from);

      ctx.beginPath();
      ctx.ellipse(eggCenterX, cy, 45, 50, 0, 0, Math.PI * 2);
      ctx.fillStyle = bodyGradient;
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(eggCenterX - 10, cy - 15, 8, 10, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(eggCenterX - 15, cy - 5, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(eggCenterX + 15, cy - 5, 10, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(eggCenterX - 13, cy - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eggCenterX + 17, cy - 3, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(eggCenterX - 11, cy - 5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eggCenterX + 19, cy - 5, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(eggCenterX, cy + 15, 12, 0.2, Math.PI - 0.2);
      ctx.stroke();

      ctx.fillStyle = '#ff6b6b';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.ellipse(eggCenterX - 25, cy + 10, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(eggCenterX + 25, cy + 10, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    [element, petName, eggCenterX, eggCenterY]
  );

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      const points = 5;
      const outerRadius = p.size;
      const innerRadius = p.size / 2;

      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = p.x + Math.cos(angle) * radius;
        const y = p.y + Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }, []);

  const updateParticles = useCallback(() => {
    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= 0.01;
      return p.life > 0;
    });
  }, []);

  const drawEggShells = useCallback(
    (ctx: CanvasRenderingContext2D, time: number) => {
      const colors = elementColors[element];
      const fallOffset = Math.min(time * 0.2, 200);
      const rotation = (time * 0.002) % (Math.PI * 2);

      ctx.save();
      const gradient = ctx.createLinearGradient(
        eggCenterX - eggRadiusX,
        eggCenterY - eggRadiusY,
        eggCenterX + eggRadiusX,
        eggCenterY + eggRadiusY
      );
      gradient.addColorStop(0, colors.from);
      gradient.addColorStop(1, colors.to);
      ctx.fillStyle = gradient;

      ctx.save();
      ctx.translate(eggCenterX - 60, eggCenterY - 80 + fallOffset);
      ctx.rotate(-rotation);
      ctx.beginPath();
      ctx.ellipse(0, 0, 50, 70, -0.3, 0, Math.PI, true);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(eggCenterX + 60, eggCenterY - 70 + fallOffset * 0.8);
      ctx.rotate(rotation * 1.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 40, 60, 0.4, 0, Math.PI, true);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    },
    [element, eggCenterX, eggCenterY]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (currentTime: number) => {
      timeRef.current = currentTime;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      if (isHatching && progress < 100) {
        const shakeIntensity = 5 + progress * 0.1;
        shakeRef.current.x = (Math.random() - 0.5) * shakeIntensity;
        shakeRef.current.y = (Math.random() - 0.5) * shakeIntensity * 0.5;
        generateCracks(progress);
      } else if (!isHatching) {
        shakeRef.current.x = 0;
        shakeRef.current.y = 0;
      }

      if (!isComplete) {
        drawEgg(ctx, shakeRef.current.x, shakeRef.current.y);
        if (progress > 10) {
          drawCracks(ctx, shakeRef.current.x, shakeRef.current.y);
        }
      } else {
        if (success) {
          drawEggShells(ctx, timeRef.current);
          drawPet(ctx, timeRef.current);
          updateParticles();
          drawParticles(ctx);
        } else {
          ctx.save();
          ctx.globalAlpha = 0.5;
          drawEgg(ctx, 0, 0);
          drawCracks(ctx, 0, 0);
          ctx.restore();

          ctx.fillStyle = '#ff6b6b';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('孵化失败...', eggCenterX, eggCenterY + 150);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isHatching, isComplete, success, progress, drawEgg, drawCracks, drawPet, drawParticles, updateParticles, drawEggShells, generateCracks]);

  useEffect(() => {
    if (isComplete && success && particlesRef.current.length === 0) {
      createCelebrationParticles();
    }
  }, [isComplete, success, createCelebrationParticles]);

  useEffect(() => {
    if (!isHatching && progress === 0) {
      cracksRef.current = [];
      particlesRef.current = [];
    }
  }, [isHatching, progress]);

  return (
    <div className="hatch-canvas-container">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="hatch-canvas"
      />
    </div>
  );
};

export default HatchCanvas;
