import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { WIND_LEVELS, WindLevel } from '@/types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  opacity: number;
}

const RainParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const backBufferRef = useRef<HTMLCanvasElement | null>(null);
  const backCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const windLevel = useStore((state) => state.windLevel);
  const windDirection = useStore((state) => state.windDirection);
  const isStormActive = useStore((state) => state.isStormActive);
  const screenBrightness = useStore((state) => state.screenBrightness);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const backBuffer = document.createElement('canvas');
    backBufferRef.current = backBuffer;
    const backCtx = backBuffer.getContext('2d');
    backCtxRef.current = backCtx;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      backBuffer.width = window.innerWidth;
      backBuffer.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const initParticles = () => {
      const windConfig = WIND_LEVELS[windLevel as WindLevel] || WIND_LEVELS[0];
      const count = windConfig.rainCount;
      particlesRef.current = [];
      
      for (let i = 0; i < 800; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0,
          vy: 0,
          size: 2 + Math.random() * 4,
          life: Math.random() * 2,
          maxLife: 3 + Math.random() * 2,
          opacity: 0.25 + Math.random() * 0.15,
        });
      }
    };

    initParticles();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const backBuffer = backBufferRef.current;
    const backCtx = backCtxRef.current;
    
    if (!canvas || !ctx || !backBuffer || !backCtx) return;

    const windConfig = WIND_LEVELS[windLevel as WindLevel] || WIND_LEVELS[0];
    const maxParticles = windConfig.rainCount;

    const windRad = ((windDirection - 90) * Math.PI) / 180;
    const windSpeed = windLevel * 2;

    const animate = () => {
      if (!isStormActive || windLevel < 2) {
        backCtx.clearRect(0, 0, backBuffer.width, backBuffer.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      backCtx.clearRect(0, 0, backBuffer.width, backBuffer.height);

      const activeCount = Math.min(particlesRef.current.length, maxParticles);
      
      for (let i = 0; i < activeCount; i++) {
        const p = particlesRef.current[i];
        
        p.vx = Math.cos(windRad) * (8 + windSpeed * 2);
        p.vy = Math.sin(windRad) * (8 + windSpeed * 2) + 12;
        
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1 / 60;

        if (p.x < -50 || p.x > canvas.width + 50 || 
            p.y > canvas.height + 50 || p.life > p.maxLife) {
          p.x = Math.random() * canvas.width;
          p.y = -20;
          p.life = 0;
          p.maxLife = 3 + Math.random() * 2;
        }

        const gradient = backCtx.createLinearGradient(
          p.x, p.y,
          p.x - p.vx * 0.3, p.y - p.vy * 0.3
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, `rgba(255, 255, 255, ${p.opacity * screenBrightness})`);

        backCtx.strokeStyle = gradient;
        backCtx.lineWidth = p.size * 0.5;
        backCtx.beginPath();
        backCtx.moveTo(p.x, p.y);
        backCtx.lineTo(p.x - p.vx * 0.3, p.y - p.vy * 0.3);
        backCtx.stroke();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(backBuffer, 0, 0);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [windLevel, windDirection, isStormActive, screenBrightness]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
      }}
    />
  );
};

export default RainParticles;
