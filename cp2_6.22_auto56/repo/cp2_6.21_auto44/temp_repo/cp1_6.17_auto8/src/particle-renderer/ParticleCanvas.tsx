import { useEffect, useRef } from 'react';
import { useWeatherStore, WeatherType } from '../weather-control/weatherStore';
import {
  Particle,
  createRainParticles,
  createSnowParticles,
  createSandParticles,
  updateRain,
  updateSnow,
  updateSand,
  drawRain,
  drawSnow,
  drawSand,
  drawLightning,
} from './particleUtils';

interface LightningState {
  active: boolean;
  intensity: number;
  nextTrigger: number;
  duration: number;
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const sandParticlesRef = useRef<Particle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lightningStateRef = useRef<LightningState>({
    active: false,
    intensity: 0,
    nextTrigger: 0,
    duration: 0,
  });

  const currentWeather = useWeatherStore((state) => state.currentWeather);
  const setLightningActive = useWeatherStore((state) => state.setLightningActive);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctxRef.current = ctx;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas;

    particlesRef.current = [];
    sandParticlesRef.current = [];
    lightningStateRef.current = {
      active: false,
      intensity: 0,
      nextTrigger: 0,
      duration: 0,
    };

    switch (currentWeather) {
      case WeatherType.RAINY:
        particlesRef.current = createRainParticles(500, width, height);
        break;
      case WeatherType.SNOWY:
        particlesRef.current = createSnowParticles(500, width, height);
        break;
      case WeatherType.STORMY:
        particlesRef.current = createRainParticles(500, width, height, 900);
        sandParticlesRef.current = createSandParticles(300, width, height);
        break;
      case WeatherType.SUNNY:
      default:
        break;
    }
  }, [currentWeather]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentWeather !== WeatherType.SUNNY) {
        switch (currentWeather) {
          case WeatherType.RAINY:
            updateRain(particlesRef.current, dt, canvas.width, canvas.height);
            drawRain(ctx, particlesRef.current);
            break;
          case WeatherType.SNOWY:
            updateSnow(particlesRef.current, dt, canvas.width, canvas.height);
            drawSnow(ctx, particlesRef.current);
            break;
          case WeatherType.STORMY:
            updateRain(particlesRef.current, dt, canvas.width, canvas.height, 900);
            updateSand(sandParticlesRef.current, dt, canvas.width, canvas.height);
            drawRain(ctx, particlesRef.current);
            drawSand(ctx, sandParticlesRef.current);

            const lightning = lightningStateRef.current;
            if (lightning.active) {
              lightning.duration -= dt;
              if (lightning.duration <= 0) {
                lightning.active = false;
                lightning.intensity = 0;
                lightning.nextTrigger = time + 500 + Math.random() * 1500;
                setLightningActive(false);
              } else {
                drawLightning(ctx, canvas.width, canvas.height, lightning.intensity);
              }
            } else if (time >= lightning.nextTrigger) {
              lightning.active = true;
              lightning.intensity = 0.5 + Math.random() * 0.5;
              lightning.duration = 0.1;
              setLightningActive(true);
            }
            break;
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [currentWeather]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}
