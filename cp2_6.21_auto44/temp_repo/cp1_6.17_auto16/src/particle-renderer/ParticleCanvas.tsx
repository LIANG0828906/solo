import { useRef, useEffect, useCallback } from 'react';
import { useWeatherStore } from '../weather-control/weatherStore';
import { WeatherType } from '../weather-control/weatherTypes';
import {
  createRainParticles,
  updateRainParticle,
  drawRainParticle,
  createSnowParticles,
  updateSnowParticle,
  drawSnowParticle,
  createSandParticles,
  updateSandParticle,
  drawSandParticle,
  drawLightning,
  drawSun,
} from './particleUtils';

interface RainParticle {
  x: number;
  y: number;
  speed: number;
}

interface SnowParticle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
  driftOffset: number;
}

interface SandParticle {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const weather = useWeatherStore((s) => s.weather);
  const weatherRef = useRef(weather);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const rainRef = useRef<RainParticle[]>([]);
  const snowRef = useRef<SnowParticle[]>([]);
  const sandRef = useRef<SandParticle[]>([]);
  const lightningTimerRef = useRef<number>(0);
  const lightningFlashRef = useRef<boolean>(false);
  const lightningDurationRef = useRef<number>(0);

  const initParticles = useCallback((w: WeatherType, width: number, height: number) => {
    rainRef.current = [];
    snowRef.current = [];
    sandRef.current = [];

    if (w === WeatherType.Rainy) {
      rainRef.current = createRainParticles(width, height, 500, 600) as RainParticle[];
    } else if (w === WeatherType.Snowy) {
      snowRef.current = createSnowParticles(width, height, 500) as SnowParticle[];
    } else if (w === WeatherType.Stormy) {
      rainRef.current = createRainParticles(width, height, 350, 900) as RainParticle[];
      sandRef.current = createSandParticles(width, height, 150) as SandParticle[];
    }
  }, []);

  useEffect(() => {
    weatherRef.current = weather;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect();
    const w = rect?.width || window.innerWidth;
    const h = rect?.height || window.innerHeight;
    initParticles(weather, w, h);
    lightningTimerRef.current = 0;
    lightningFlashRef.current = false;
  }, [weather, initParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect?.width || window.innerWidth;
      canvas.height = rect?.height || window.innerHeight;
      initParticles(weatherRef.current, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (timestamp: number) => {
      if (!ctx) return;
      const dt = lastTimeRef.current ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05) : 0.016;
      lastTimeRef.current = timestamp;

      const cw = canvas.width;
      const ch = canvas.height;
      const currentWeather = weatherRef.current;
      const timeInSeconds = timestamp / 1000;

      ctx.clearRect(0, 0, cw, ch);

      if (currentWeather === WeatherType.Sunny) {
        drawSun(ctx, timeInSeconds);
      }

      if (currentWeather === WeatherType.Rainy || currentWeather === WeatherType.Stormy) {
        const angle = 80;
        for (const p of rainRef.current) {
          updateRainParticle(p, dt, cw, ch, angle);
          drawRainParticle(ctx, p);
        }
      }

      if (currentWeather === WeatherType.Snowy) {
        for (const p of snowRef.current) {
          updateSnowParticle(p, dt, cw, ch, timeInSeconds);
          drawSnowParticle(ctx, p);
        }
      }

      if (currentWeather === WeatherType.Stormy) {
        for (const p of sandRef.current) {
          updateSandParticle(p, dt, cw, ch);
          drawSandParticle(ctx, p);
        }

        lightningTimerRef.current -= dt;
        if (lightningTimerRef.current <= 0 && !lightningFlashRef.current) {
          lightningFlashRef.current = true;
          lightningDurationRef.current = 0.1;
          lightningTimerRef.current = 0.5 + Math.random() * 1.5;
        }

        if (lightningFlashRef.current) {
          drawLightning(ctx, cw, ch);
          lightningDurationRef.current -= dt;
          if (lightningDurationRef.current <= 0) {
            lightningFlashRef.current = false;
          }
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
      }}
    />
  );
}
