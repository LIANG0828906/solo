import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkle: boolean;
  twinkleSpeed: number;
  twinkleOffset: number;
}

const STAR_COUNT = 300;
const TWINKLE_RATIO = 0.2;
const MIN_SIZE = 1;
const MAX_SIZE = 2;
const MIN_ALPHA = 0.3;
const MAX_ALPHA = 0.6;
const MIN_PERIOD = 3;
const MAX_PERIOD = 5;

function createStars(width: number, height: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const twinkle = Math.random() < TWINKLE_RATIO;
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE),
      baseAlpha: MIN_ALPHA + Math.random() * (MAX_ALPHA - MIN_ALPHA),
      twinkle,
      twinkleSpeed: (2 * Math.PI) / (MIN_PERIOD + Math.random() * (MAX_PERIOD - MIN_PERIOD)),
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let stars: Star[] = [];

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.scale(dpr, dpr);
      stars = createStars(innerWidth, innerHeight);
    };

    const render = (time: number) => {
      const { innerWidth, innerHeight } = window;
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      for (const star of stars) {
        let alpha = star.baseAlpha;
        if (star.twinkle) {
          const variation = Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
          alpha = star.baseAlpha * (0.5 + variation * 0.5);
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    resize();
    animationId = requestAnimationFrame(render);
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
      }}
    />
  );
}
