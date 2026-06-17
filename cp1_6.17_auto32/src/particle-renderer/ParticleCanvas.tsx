import { useEffect, useRef } from 'react';
import { useWeatherStore, Weather } from '../weather-control/weatherStore';
import {
  Particle,
  createRainParticles,
  createSnowParticles,
  createSandParticles,
  updateRainParticles,
  updateSnowParticles,
  updateSandParticles,
  drawRainParticles,
  drawSnowParticles,
  drawSandParticles
} from './particleUtils';

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const weather = useWeatherStore((s) => s.weather);
  const weatherRef = useRef<Weather>(weather);
  const rafRef = useRef<number | null>(null);
  const rainParticlesRef = useRef<Particle[]>([]);
  const snowParticlesRef = useRef<Particle[]>([]);
  const sandParticlesRef = useRef<Particle[]>([]);
  const lightningRef = useRef<{ active: boolean; timer: number; next: number }>({
    active: false,
    timer: 0,
    next: 0.5 + Math.random() * 1.5
  });

  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(window.innerWidth, window.innerHeight);
    };

    const initParticles = (w: number, h: number) => {
      rainParticlesRef.current = createRainParticles(500, w, h, 600);
      snowParticlesRef.current = createSnowParticles(500, w, h);
      sandParticlesRef.current = createSandParticles(300, w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const currentWeather = weatherRef.current;

      ctx.clearRect(0, 0, w, h);

      if (currentWeather === Weather.Rainy) {
        updateRainParticles(rainParticlesRef.current, dt, w, h);
        drawRainParticles(ctx, rainParticlesRef.current);
      } else if (currentWeather === Weather.Snowy) {
        updateSnowParticles(snowParticlesRef.current, dt, w, h);
        drawSnowParticles(ctx, snowParticlesRef.current);
      } else if (currentWeather === Weather.Stormy) {
        const stormRain = createRainParticles(500, w, h, 900);
        updateRainParticles(stormRain, dt, w, h);
        drawRainParticles(ctx, stormRain);
        updateSandParticles(sandParticlesRef.current, dt, w, h);
        drawSandParticles(ctx, sandParticlesRef.current);

        lightningRef.current.timer += dt;
        if (lightningRef.current.timer >= lightningRef.current.next) {
          lightningRef.current.active = true;
          lightningRef.current.timer = 0;
          lightningRef.current.next = 0.5 + Math.random() * 1.5;
          setTimeout(() => {
            lightningRef.current.active = false;
          }, 100);
        }
        if (lightningRef.current.active) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

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
        zIndex: 2
      }}
    />
  );
}
