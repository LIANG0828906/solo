import { useEffect, useRef } from 'react';
import { ParticleSystem } from '../utils/ParticleSystem';
import type { WeatherData, ThemeSettings } from '../utils/weatherTypes';

interface WeatherBackgroundProps {
  weatherData: WeatherData | null;
  themeSettings: ThemeSettings;
}

export default function WeatherBackground({ weatherData, themeSettings }: WeatherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const particleSystem = new ParticleSystem(canvasRef.current);
    particleSystemRef.current = particleSystem;
    particleSystem.start();

    return () => {
      particleSystem.destroy();
    };
  }, []);

  useEffect(() => {
    if (!particleSystemRef.current) return;
    particleSystemRef.current.setTheme(themeSettings.style);
    particleSystemRef.current.setDensity(themeSettings.particleDensity / 100);
  }, [themeSettings]);

  useEffect(() => {
    if (!particleSystemRef.current || !weatherData) return;
    particleSystemRef.current.setWeather(weatherData.condition, weatherData.precipitation);
  }, [weatherData]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    />
  );
}
