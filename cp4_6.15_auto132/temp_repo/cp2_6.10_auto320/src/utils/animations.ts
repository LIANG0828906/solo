import { useEffect, useRef, useState, useCallback } from 'react';
import type { Particle, Season, WeatherEvent } from '@/types';

export const useShake = (intensity: number = 5, duration: number = 500) => {
  const [isShaking, setIsShaking] = useState(false);

  const shake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), duration);
  }, [duration]);

  const style = isShaking
    ? {
        animation: `shake ${duration}ms ease-in-out`,
      }
    : {};

  return { shake, style, isShaking };
};

export const useParticleSystem = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const particleIdRef = useRef(0);

  const createExplosionParticles = useCallback((x: number, y: number, color: string, count: number = 30) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 6;
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 5,
        life: 1,
        maxLife: 1,
        type: 'explosion',
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  const createWeatherParticles = useCallback((weather: WeatherEvent, width: number, height: number) => {
    if (!weather) return;

    const count = weather === 'winter_snow' ? 100 : weather === 'spring_rain' ? 80 : 50;
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const baseParticle: Particle = {
        id: particleIdRef.current++,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        color: '#ffffff',
        size: 2,
        life: 1,
        maxLife: 1,
        type: 'sparkle',
      };

      switch (weather) {
        case 'spring_rain':
          newParticles.push({
            ...baseParticle,
            vy: 8 + Math.random() * 4,
            vx: -1 + Math.random() * 2,
            color: `rgba(147, 197, 253, ${0.4 + Math.random() * 0.4})`,
            size: 2,
            type: 'rain',
          });
          break;
        case 'summer_thunder':
          if (Math.random() > 0.7) {
            newParticles.push({
              ...baseParticle,
              vy: -2 + Math.random() * 4,
              vx: -2 + Math.random() * 4,
              color: '#fef08a',
              size: 4 + Math.random() * 6,
              type: 'sparkle',
            });
          }
          break;
        case 'autumn_wind':
          newParticles.push({
            ...baseParticle,
            vx: 3 + Math.random() * 3,
            vy: 0.5 + Math.random() * 1.5,
            color: ['#fbbf24', '#f97316', '#dc2626', '#92400e'][Math.floor(Math.random() * 4)],
            size: 6 + Math.random() * 8,
            type: 'leaf',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
          });
          break;
        case 'winter_snow':
          newParticles.push({
            ...baseParticle,
            vx: -0.5 + Math.random(),
            vy: 1 + Math.random() * 2,
            color: '#ffffff',
            size: 3 + Math.random() * 4,
            type: 'snow',
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
          });
          break;
      }
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  const animate = useCallback((width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'explosion') {
        p.life -= 0.02;
        p.vy += 0.1;
        p.size *= 0.98;
      } else if (p.type === 'rain') {
        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
      } else if (p.type === 'snow' || p.type === 'leaf') {
        if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
          p.rotation += p.rotationSpeed;
        }
        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x > width + 50) {
          p.x = -50;
        }
      } else if (p.type === 'sparkle') {
        p.life -= 0.03;
      }

      if (p.life <= 0 && p.type === 'explosion' || p.type === 'sparkle') {
        return false;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.rotation !== undefined) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.translate(-p.x, -p.y);
      }

      if (p.type === 'leaf') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'rain') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 0.5, p.y + p.size * 4);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return true;
    });

    animationRef.current = requestAnimationFrame(() => animate(width, height));
  }, [canvasRef]);

  const stop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const clear = useCallback(() => {
    particlesRef.current = particlesRef.current.filter(
      (p) => p.type === 'rain' || p.type === 'snow' || p.type === 'leaf'
    );
  }, []);

  const clearAll = useCallback(() => {
    particlesRef.current = [];
  }, []);

  return {
    createExplosionParticles,
    createWeatherParticles,
    animate,
    stop,
    clear,
    clearAll,
  };
};

export const useGrowthAnimation = (
  currentStage: string,
  growthTime: number,
  onStageComplete: () => void
) => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number>();

  useEffect(() => {
    setProgress(0);

    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / growthTime) * 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        onStageComplete();
      } else {
        intervalRef.current = requestAnimationFrame(updateProgress);
      }
    };

    intervalRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (intervalRef.current) {
        cancelAnimationFrame(intervalRef.current);
      }
    };
  }, [currentStage, growthTime, onStageComplete]);

  return progress;
};

export const playSound = (type: 'click' | 'bloom' | 'rain' | 'thunder' | 'success') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'click':
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'bloom':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.3);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      case 'success':
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        break;
      case 'rain':
        oscillator.type = 'noise';
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'thunder':
        oscillator.frequency.value = 80;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        break;
    }
  } catch (e) {
    // Audio not supported, silently fail
  }
};
