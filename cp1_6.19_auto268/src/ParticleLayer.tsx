import { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WeatherType, Particle } from './types';

interface ParticleLayerProps {
  weatherType: WeatherType;
  width: number;
  height: number;
  isTransitioning: boolean;
}

const generateParticles = (
  weatherType: WeatherType,
  count: number,
  width: number,
  height: number
): Particle[] => {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const base: Particle = {
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1,
      speed: 1,
      opacity: 1,
    };

    switch (weatherType) {
      case 'rainy':
        particles.push({
          ...base,
          size: 8,
          speed: 3 + Math.random() * 3,
          angle: (45 + (Math.random() - 0.5) * 20) * (Math.PI / 180),
          opacity: 0.7 + Math.random() * 0.3,
        });
        break;
      case 'snowy':
        particles.push({
          ...base,
          size: 3,
          speed: 0.8 + Math.random() * 0.4,
          swayPhase: Math.random() * Math.PI * 2,
          swayAmplitude: 20,
          opacity: 0.8 + Math.random() * 0.2,
        });
        break;
      case 'foggy':
        particles.push({
          ...base,
          size: 8 + Math.random() * 12,
          speed: 0,
          rotation: Math.random() * 360,
          pulsePhase: Math.random() * Math.PI * 2,
          opacity: 0.2 + Math.random() * 0.4,
        });
        break;
      case 'sunny':
        particles.push({
          ...base,
          size: 2 + Math.random() * 1,
          speed: 0,
          pulsePhase: Math.random() * Math.PI * 2,
          opacity: Math.random(),
        });
        break;
    }
  }

  return particles;
};

const ParticleCanvas = ({
  weatherType,
  width,
  height,
  isTransitioning,
}: ParticleLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const weatherTypeRef = useRef(weatherType);
  const widthRef = useRef(width);
  const heightRef = useRef(height);

  const count = useMemo(() => {
    switch (weatherType) {
      case 'sunny': return 50;
      case 'rainy': return 150;
      case 'snowy': return 120;
      case 'foggy': return 180;
      default: return 100;
    }
  }, [weatherType]);

  useEffect(() => {
    weatherTypeRef.current = weatherType;
    widthRef.current = width;
    heightRef.current = height;
  }, [weatherType, width, height]);

  useEffect(() => {
    if (isTransitioning) {
      particlesRef.current = [];
    } else {
      const particles = generateParticles(weatherType, count, width, height);
      particlesRef.current = particles;
    }
  }, [weatherType, count, width, height, isTransitioning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const w = widthRef.current;
      const h = heightRef.current;
      const wt = weatherTypeRef.current;

      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.016;

      const particles = particlesRef.current;

      for (const p of particles) {
        ctx.save();

        switch (wt) {
          case 'rainy': {
            const angle = p.angle || Math.PI / 4;
            p.y += p.speed * 3;
            p.x += Math.sin(angle) * p.speed * 3;

            if (p.y > h) {
              p.y = -10;
              p.x = Math.random() * w;
            }
            if (p.x > w) p.x = 0;
            if (p.x < 0) p.x = w;

            ctx.strokeStyle = `rgba(44, 62, 80, ${p.opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + Math.sin(angle) * 8, p.y + Math.cos(angle) * 8);
            ctx.stroke();
            break;
          }
          case 'snowy': {
            p.y += p.speed * 1.5;
            const sway = Math.sin(timeRef.current * 2 + (p.swayPhase || 0)) * (p.swayAmplitude || 20) * 0.02;
            p.x += sway;

            if (p.y > h + 10) {
              p.y = -10;
              p.x = Math.random() * w;
            }

            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            drawSnowflake(ctx, p.x, p.y, p.size);
            break;
          }
          case 'foggy': {
            p.rotation = (p.rotation || 0) + 0.1;
            const pulse = 0.2 + Math.sin(timeRef.current + (p.pulsePhase || 0)) * 0.2;
            const currentOpacity = Math.min(0.6, Math.max(0.2, pulse));

            ctx.fillStyle = `rgba(204, 204, 204, ${currentOpacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'sunny': {
            const pulse = (Math.sin(timeRef.current * 2 + (p.pulsePhase || 0)) + 1) / 2;
            const currentOpacity = pulse * 0.8 + 0.2;

            ctx.fillStyle = `rgba(255, 215, 0, ${currentOpacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
        }

        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
};

export const ParticleLayer = ({ weatherType, width, height, isTransitioning }: ParticleLayerProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={weatherType + (isTransitioning ? '-empty' : '')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: isTransitioning ? 0.3 : 0.5 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {!isTransitioning && (
          <ParticleCanvas
            weatherType={weatherType}
            width={width}
            height={height}
            isTransitioning={isTransitioning}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

const drawSnowflake = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  ctx.save();
  ctx.translate(x, y);

  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, radius);
    ctx.lineWidth = 1;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, radius * 0.5);
    ctx.lineTo(radius * 0.3, radius * 0.7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, radius * 0.5);
    ctx.lineTo(-radius * 0.3, radius * 0.7);
    ctx.stroke();
  }

  ctx.restore();
};
