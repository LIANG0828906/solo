import React, { useEffect, useRef } from 'react';
import { useParticleSystem } from '@/utils/animations';
import type { WeatherEvent } from '@/types';

interface ParticleSystemProps {
  weatherEvent: WeatherEvent;
  onExplosion?: { x: number; y: number; color: string } | null;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ weatherEvent, onExplosion }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { createExplosionParticles, createWeatherParticles, animate, stop, clearAll } = useParticleSystem(canvasRef);

  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const canvas = canvasRef.current;
    if (canvas) {
      animate(canvas.width, canvas.height);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      stop();
    };
  }, [animate, stop]);

  useEffect(() => {
    if (weatherEvent) {
      const canvas = canvasRef.current;
      if (canvas) {
        clearAll();
        createWeatherParticles(weatherEvent, canvas.width, canvas.height);
      }
    } else {
      clearAll();
    }
  }, [weatherEvent, createWeatherParticles, clearAll]);

  useEffect(() => {
    if (onExplosion) {
      createExplosionParticles(onExplosion.x, onExplosion.y, onExplosion.color, 50);
    }
  }, [onExplosion, createExplosionParticles]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
