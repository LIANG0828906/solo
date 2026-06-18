import React, { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from './store';
import { Task } from './types';
import {
  getPriorityColors,
  getStartOfDay,
  HOUR,
  timeToPixel
} from './utils';

const PIXELS_PER_HOUR = 120;
const PARTICLE_SPEED = 50;
const PARTICLES_PER_TASK = 15;

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  progress: number;
  opacity: number;
  taskId: string;
  color: string;
}

export const TimeStream: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const tasks = useAppStore((state) => state.tasks);
  const zoom = useAppStore((state) => state.zoom);
  const panOffset = useAppStore((state) => state.panOffset);

  const baseTime = getStartOfDay(Date.now());

  const createParticle = useCallback((task: Task): Particle => {
    const colors = getPriorityColors(task.priority);
    const size = 2 + Math.random() * 2;
    const speed = PARTICLE_SPEED * (0.8 + Math.random() * 0.4);
    const progress = Math.random();

    return {
      x: 0,
      y: 0,
      size,
      speed,
      progress,
      opacity: 0.2 + Math.random() * 0.4,
      taskId: task.id,
      color: colors.particle
    };
  }, []);

  const initializeParticles = useCallback(() => {
    const particles: Particle[] = [];
    tasks.forEach((task) => {
      for (let i = 0; i < PARTICLES_PER_TASK; i++) {
        particles.push(createParticle(task));
      }
    });
    particlesRef.current = particles;
  }, [tasks, createParticle]);

  useEffect(() => {
    initializeParticles();
  }, [tasks.length, initializeParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const effectivePixelsPerHour = PIXELS_PER_HOUR * zoom;
    const boardWidth = canvas.offsetWidth;
    const timelineLeft = boardWidth * 0.1;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particlesRef.current.forEach((particle) => {
        const task = tasks.find((t) => t.id === particle.taskId);
        if (!task) return;

        const taskWidth = ((task.endTime - task.startTime) / HOUR) * effectivePixelsPerHour;
        const taskStartX = timelineLeft + timeToPixel(task.startTime, baseTime, effectivePixelsPerHour) - panOffset;

        particle.progress += (deltaTime * particle.speed) / taskWidth;

        if (particle.progress > 1) {
          particle.progress = 0;
          particle.opacity = 0.2 + Math.random() * 0.4;
        }

        particle.x = taskStartX + particle.progress * taskWidth;
        particle.y = 180 + Math.sin(particle.progress * Math.PI * 2) * 8 + Math.random() * 4;

        const progressOpacity = 0.6 * Math.sin(particle.progress * Math.PI);
        const finalOpacity = particle.opacity * progressOpacity;

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 3
        );
        gradient.addColorStop(0, particle.color + Math.round(finalOpacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, particle.color + Math.round(finalOpacity * 128).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, particle.color + '00');

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.round(finalOpacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      tasks.forEach((task) => {
        const colors = getPriorityColors(task.priority);
        const taskWidth = ((task.endTime - task.startTime) / HOUR) * effectivePixelsPerHour;
        const taskStartX = timelineLeft + timeToPixel(task.startTime, baseTime, effectivePixelsPerHour) - panOffset;
        const lineY = 180;

        const lineGradient = ctx.createLinearGradient(taskStartX, lineY, taskStartX + taskWidth, lineY);
        lineGradient.addColorStop(0, colors.particle + '00');
        lineGradient.addColorStop(0.2, colors.particle + '66');
        lineGradient.addColorStop(0.5, colors.particle + '88');
        lineGradient.addColorStop(0.8, colors.particle + '66');
        lineGradient.addColorStop(1, colors.particle + '00');

        ctx.beginPath();
        ctx.moveTo(taskStartX, lineY);
        ctx.bezierCurveTo(
          taskStartX + taskWidth * 0.25,
          lineY - 10,
          taskStartX + taskWidth * 0.75,
          lineY + 10,
          taskStartX + taskWidth,
          lineY
        );
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [tasks, zoom, panOffset, baseTime]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5
      }}
    />
  );
};
