import React, { useRef, useEffect, useState } from 'react';
import { useWeatherStore, WeatherType } from '../weather-control/weatherStore';
import {
  RainParticle,
  SnowParticle,
  SandParticle,
  createRainParticles,
  updateRainParticles,
  drawRainParticles,
  createSnowParticles,
  updateSnowParticles,
  drawSnowParticles,
  createSandParticles,
  updateSandParticles,
  drawSandParticles,
  createLightningState,
  updateLightning,
  drawLightning
} from './particleUtils';

interface LightningState {
  active: boolean;
  opacity: number;
  nextFlash: number;
}

const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentWeather } = useWeatherStore();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const rainParticlesRef = useRef<RainParticle[]>([]);
  const snowParticlesRef = useRef<SnowParticle[]>([]);
  const sandParticlesRef = useRef<SandParticle[]>([]);
  const lightningRef = useRef<LightningState>(createLightningState());
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const particleCount = 600;

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const { width, height } = dimensions;

    rainParticlesRef.current = createRainParticles(particleCount, width, height);
    snowParticlesRef.current = createSnowParticles(particleCount, width, height);
    sandParticlesRef.current = createSandParticles(particleCount, width, height);
  }, [dimensions]);

  useEffect(() => {
    const targetSpeed = currentWeather === WeatherType.STORMY ? 900 : 600;
    rainParticlesRef.current = rainParticlesRef.current.map((p) => ({
      ...p,
      speed: targetSpeed * (0.8 + Math.random() * 0.4)
    }));
  }, [currentWeather]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;
      timeRef.current += deltaTime * 1000;

      ctx.clearRect(0, 0, width, height);

      switch (currentWeather) {
        case WeatherType.RAINY:
        case WeatherType.STORMY:
          rainParticlesRef.current = updateRainParticles(
            rainParticlesRef.current,
            width,
            height,
            deltaTime
          );
          drawRainParticles(ctx, rainParticlesRef.current);

          if (currentWeather === WeatherType.STORMY) {
            sandParticlesRef.current = updateSandParticles(
              sandParticlesRef.current,
              width,
              height,
              deltaTime
            );
            drawSandParticles(ctx, sandParticlesRef.current);

            lightningRef.current = updateLightning(
              lightningRef.current,
              deltaTime
            );
            drawLightning(ctx, width, height, lightningRef.current.opacity);
          }
          break;

        case WeatherType.SNOWY:
          snowParticlesRef.current = updateSnowParticles(
            snowParticlesRef.current,
            width,
            height,
            deltaTime,
            timeRef.current
          );
          drawSnowParticles(ctx, snowParticlesRef.current);
          break;

        case WeatherType.SUNNY:
        default:
          break;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentWeather, dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};

export default ParticleCanvas;
