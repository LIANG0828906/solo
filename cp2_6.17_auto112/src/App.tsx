import React, { useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import {
  WeatherData,
  generateMockWeather,
  dispatchWeatherUpdate,
  dispatchSettingsChange,
  WEATHER_BG_COLORS,
  WeatherType
} from './weatherEngine';
import { ParticleRenderer } from './particleRenderer';
import SearchBar from './components/SearchBar';
import InfoCard from './components/InfoCard';

interface AppState {
  weather: WeatherData | null;
  isLoading: boolean;
  useCelsius: boolean;
  particleDensity: 'low' | 'medium' | 'high';
  showInfoCard: boolean;
  setWeather: (w: WeatherData) => void;
  setLoading: (v: boolean) => void;
  toggleTemperatureUnit: () => void;
  setParticleDensity: (d: 'low' | 'medium' | 'high') => void;
  toggleInfoCard: () => void;
  searchCity: (name: string) => void;
}

const useAppStore = create<AppState>((set, get) => ({
  weather: null,
  isLoading: false,
  useCelsius: true,
  particleDensity: 'medium',
  showInfoCard: true,

  setWeather: (w: WeatherData) => {
    set({ weather: w, isLoading: false });
    dispatchWeatherUpdate(w);
  },

  setLoading: (v: boolean) => set({ isLoading: v }),

  toggleTemperatureUnit: () => set(state => ({ useCelsius: !state.useCelsius })),

  setParticleDensity: (d: 'low' | 'medium' | 'high') => {
    set({ particleDensity: d });
    dispatchSettingsChange({ particleDensity: d });
  },

  toggleInfoCard: () => set(state => ({ showInfoCard: !state.showInfoCard })),

  searchCity: (name: string) => {
    if (!name.trim()) return;
    set({ isLoading: true });
    setTimeout(() => {
      const data = generateMockWeather(name);
      get().setWeather(data);
    }, 120);
  }
}));

const DEFAULT_CITY = '北京';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ParticleRenderer | null>(null);
  const bgTransitionRef = useRef<number | null>(null);
  const currentBgRef = useRef<string>(WEATHER_BG_COLORS.sunny);

  const weather = useAppStore(s => s.weather);
  const useCelsius = useAppStore(s => s.useCelsius);
  const particleDensity = useAppStore(s => s.particleDensity);
  const showInfoCard = useAppStore(s => s.showInfoCard);
  const searchCity = useAppStore(s => s.searchCity);
  const toggleTemperatureUnit = useAppStore(s => s.toggleTemperatureUnit);
  const setParticleDensity = useAppStore(s => s.setParticleDensity);
  const toggleInfoCard = useAppStore(s => s.toggleInfoCard);
  const setWeather = useAppStore(s => s.setWeather);

  const applyBackground = useCallback((type: WeatherType) => {
    const targetColor = WEATHER_BG_COLORS[type];
    if (bgTransitionRef.current !== null) {
      cancelAnimationFrame(bgTransitionRef.current);
    }
    const from = hexToRgb(currentBgRef.current);
    const to = hexToRgb(targetColor);
    const duration = 1500;
    const start = performance.now();

    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const r = from.r + (to.r - from.r) * eased;
      const g = from.g + (to.g - from.g) * eased;
      const b = from.b + (to.b - from.b) * eased;
      const color = rgbToHex(r, g, b);
      document.body.style.backgroundColor = color;
      if (t < 1) {
        bgTransitionRef.current = requestAnimationFrame(animate);
      } else {
        currentBgRef.current = targetColor;
        bgTransitionRef.current = null;
      }
    };
    bgTransitionRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const data = generateMockWeather(DEFAULT_CITY);
    setWeather(data);
    dispatchSettingsChange({ particleDensity: useAppStore.getState().particleDensity });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new ParticleRenderer(canvasRef.current);
    rendererRef.current = renderer;
    renderer.start();

    if (weather) {
      renderer.setWeather(weather.type);
      applyBackground(weather.type);
    }

    const handleResize = () => {
      renderer.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.destroy();
      rendererRef.current = null;
      if (bgTransitionRef.current !== null) {
        cancelAnimationFrame(bgTransitionRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (weather && rendererRef.current) {
      rendererRef.current.setWeather(weather.type);
      applyBackground(weather.type);
    }
  }, [weather, applyBackground]);

  return (
    <div className="app-container">
      <canvas ref={canvasRef} className="app-canvas" aria-hidden="true" />

      <SearchBar
        onSearch={searchCity}
        useCelsius={useCelsius}
        onToggleUnit={toggleTemperatureUnit}
        particleDensity={particleDensity}
        onChangeDensity={setParticleDensity}
        showInfoCard={showInfoCard}
        onToggleInfoCard={toggleInfoCard}
      />

      <InfoCard
        weather={weather}
        useCelsius={useCelsius}
        visible={showInfoCard}
      />
    </div>
  );
};

export default App;
