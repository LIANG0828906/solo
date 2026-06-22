import { useState, useEffect, useCallback } from 'react';
import WeatherBackground from './components/WeatherBackground';
import InfoOverlay from './components/InfoOverlay';
import PoemDisplay from './components/PoemDisplay';
import SettingsPanel from './components/SettingsPanel';
import type { WeatherData, ThemeSettings } from './utils/weatherTypes';

export default function App() {
  const [city, setCity] = useState<string>('北京');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGearRotating, setIsGearRotating] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    style: 'realistic',
    particleDensity: 60,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (cityName: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError('获取天气数据失败，请稍后重试');
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather(city);
  }, [city, fetchWeather]);

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
  };

  const handleThemeChange = (settings: Partial<ThemeSettings>) => {
    setThemeSettings(prev => ({ ...prev, ...settings }));
  };

  const handleSettingsClick = () => {
    setIsGearRotating(true);
    setTimeout(() => setIsGearRotating(false), 300);
    setIsSettingsOpen(true);
  };

  return (
    <div style={appStyle}>
      <WeatherBackground
        weatherData={weatherData}
        themeSettings={themeSettings}
      />

      <button
        onClick={handleSettingsClick}
        style={{
          ...settingsBtnStyle,
          transform: isGearRotating ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
        }}
        aria-label="设置"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <InfoOverlay weatherData={weatherData} />

      <PoemDisplay />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentCity={city}
        themeSettings={themeSettings}
        onCityChange={handleCityChange}
        onThemeChange={handleThemeChange}
      />

      {loading && !weatherData && (
        <div style={loadingOverlayStyle}>
          <div style={loadingSpinnerStyle}></div>
          <div style={loadingTextStyle}>正在加载天气数据...</div>
        </div>
      )}

      {error && (
        <div style={errorStyle}>{error}</div>
      )}
    </div>
  );
}

const appStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  position: 'relative',
  margin: 0,
  padding: 0,
  fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
};

const settingsBtnStyle: React.CSSProperties = {
  position: 'fixed',
  top: '24px',
  left: '24px',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(8px)',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.9)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  transition: 'background 0.3s ease',
};

const loadingOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.7)',
  zIndex: 1000,
};

const loadingSpinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid rgba(255, 255, 255, 0.1)',
  borderTopColor: 'rgba(255, 255, 255, 0.8)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const loadingTextStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '14px',
  marginTop: '16px',
};

const errorStyle: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'rgba(220, 53, 69, 0.9)',
  color: 'white',
  padding: '16px 24px',
  borderRadius: '8px',
  zIndex: 1000,
};
