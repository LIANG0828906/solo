import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../stores/appStore';
import { fetchWeatherData, CITIES, type WeatherType } from '../data/weatherService';
import { generateNarrative } from '../engine/narrativeEngine';
import { calculateVisualConfig, getDominantWeatherType, generateParticles } from '../renderer/storyRenderer';
import html2canvas from 'html2canvas';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  opacity: number;
}

const weatherIcons: Record<WeatherType, { icon: string; color: string }> = {
  sunny: { icon: '☀️', color: '#FFD700' },
  cloudy: { icon: '☁️', color: '#B0B0B0' },
  rainy: { icon: '💧', color: '#4FC3F7' },
  snowy: { icon: '❄️', color: '#FFFFFF' }
};

const DEFAULT_PARTICLE_COLORS = ['#6C63FF', '#FF6584', '#A8E6CF', '#FFD700'];
const DEFAULT_BACKGROUND = '#0D1117';

function App() {
  const {
    city,
    timeRange,
    isLoading,
    weatherData,
    narrative,
    visualConfig,
    setCity,
    setTimeRange,
    setIsLoading,
    setWeatherData,
    setNarrative,
    setVisualConfig,
    setDominantWeather
  } = useAppStore();

  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const particleRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const exportCardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  useEffect(() => {
    mousePosRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    const initialParticles = generateParticles(80, DEFAULT_PARTICLE_COLORS, 1) as Particle[];
    setParticles(initialParticles);
  }, []);

  useEffect(() => {
    loadWeatherData();
  }, [city, timeRange]);

  useEffect(() => {
    if (weatherData && weatherData.days.length > 0) {
      const weatherTypes = weatherData.days.map(d => d.weatherType);
      const dominant = getDominantWeatherType(weatherTypes);
      setDominantWeather(dominant);
    }
  }, [weatherData, setDominantWeather]);

  useEffect(() => {
    if (visualConfig) {
      const newParticles = generateParticles(80, visualConfig.particleColors, visualConfig.particleSpeed) as Particle[];
      setParticles(newParticles);
    }
  }, [visualConfig]);

  useEffect(() => {
    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      const currentParticles = particlesRef.current;
      const currentMousePos = mousePosRef.current;

      const updatedParticles = currentParticles.map(p => {
        let newX = p.x + p.speedX * deltaTime;
        let newY = p.y + p.speedY * deltaTime;

        if (currentMousePos) {
          const dx = currentMousePos.x - p.x;
          const dy = currentMousePos.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 30 && distance > 0) {
            const attractionStrength = 3;
            newX += (dx / distance) * attractionStrength * deltaTime;
            newY += (dy / distance) * attractionStrength * deltaTime;
          }
        }

        if (newX < -2) newX = 102;
        if (newX > 102) newX = -2;
        if (newY < -2) newY = 102;
        if (newY > 102) newY = -2;

        return { ...p, x: newX, y: newY };
      });

      particlesRef.current = updatedParticles;
      setParticles(updatedParticles);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const loadWeatherData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchWeatherData(city, timeRange);
      setWeatherData(data);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [city, timeRange, setIsLoading, setWeatherData]);

  const handleGenerateStory = useCallback(() => {
    if (!weatherData || weatherData.days.length === 0) return;

    const narrativeResult = generateNarrative(weatherData.days);
    setNarrative(narrativeResult);

    const weatherTypes = weatherData.days.map(d => d.weatherType);
    const dominant = getDominantWeatherType(weatherTypes);
    const config = calculateVisualConfig(dominant, narrativeResult.sentiment);
    setVisualConfig(config);
  }, [weatherData, setNarrative, setVisualConfig]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!particleRef.current) return;
    const rect = particleRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
  }, []);

  const handleExport = useCallback(async () => {
    if (!exportCardRef.current || !narrative || !weatherData) return;

    try {
      const canvas = await html2canvas(exportCardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false
      });

      const link = document.createElement('a');
      link.download = `天气叙事-${city}-${new Date().toLocaleDateString()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [narrative, weatherData, city]);

  const particleLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    const maxDistance = 12;
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          lines.push({
            x1: particles[i].x,
            y1: particles[i].y,
            x2: particles[j].x,
            y2: particles[j].y,
            color: particles[i].color
          });
        }
      }
    }
    
    return lines.slice(0, 60);
  }, [particles]);

  const appStyle: React.CSSProperties = {
    background: visualConfig?.backgroundGradient || DEFAULT_BACKGROUND,
    transition: 'background 1s ease-in-out'
  };

  const storyStyle: React.CSSProperties = {
    color: visualConfig?.textColor || '#E0E0E0',
    fontFamily: visualConfig?.fontFamily || 'inherit',
    wordSpacing: `${visualConfig?.wordSpacing || 1.5}px`,
    transition: 'color 0.5s ease-in-out, font-family 0.5s ease-in-out, word-spacing 0.5s ease-in-out'
  };

  return (
    <div 
      className="app-container" 
      style={appStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="particles-container" ref={particleRef}>
        <svg className="particles-svg" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
          {particleLines.map((line, index) => (
            <line
              key={`line-${index}`}
              x1={`${line.x1}%`}
              y1={`${line.y1}%`}
              x2={`${line.x2}%`}
              y2={`${line.y2}%`}
              stroke={line.color}
              strokeWidth="1"
              opacity="0.1"
            />
          ))}
        </svg>
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              boxShadow: `0 0 ${particle.size}px ${particle.color}`
            }}
          />
        ))}
      </div>

      <div className="content-wrapper">
        <div className="left-panel">
          <div className="control-section">
            <div className="section-title">选择城市</div>
            <div className="city-selector">
              {CITIES.map(c => (
                <button
                  key={c}
                  className={`city-btn ${city === c ? 'active' : ''}`}
                  onClick={() => setCity(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <div className="section-title">时间范围：过去 {timeRange} 天</div>
            <div className="time-range-container">
              <div className="time-slider-track" />
              <input
                type="range"
                min="1"
                max="7"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="time-slider"
              />
            </div>
            <div className="time-labels">
              <span>1天</span>
              <span>4天</span>
              <span>7天</span>
            </div>
          </div>

          <div className="weather-section">
            <div className="section-title">天气概览</div>
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
              </div>
            ) : weatherData ? (
              <div className="weather-cards-container">
                {weatherData.days.map((day, index) => (
                  <div key={index} className="weather-card">
                    <div className="weather-card-date">{day.date}</div>
                    <div 
                      className="weather-card-icon"
                      style={{ color: weatherIcons[day.weatherType].color }}
                    >
                      {weatherIcons[day.weatherType].icon}
                    </div>
                    <div className="weather-card-temp">{day.temperature}°C</div>
                    <div className="weather-card-humidity">湿度 {day.humidity}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🌤️</div>
                <p>加载中...</p>
              </div>
            )}
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerateStory}
            disabled={isLoading || !weatherData}
          >
            生成故事
          </button>
        </div>

        <div className="divider" />

        <div className="right-panel">
          <div className="story-panel">
            <div className="story-title">故事叙事</div>
            {narrative ? (
              <div className="story-content" style={storyStyle}>
                {narrative.paragraphs.map((para, index) => (
                  <p key={index}>{para}</p>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📖</div>
                <p>点击"生成故事"按钮<br />开始你的天气叙事之旅</p>
              </div>
            )}
          </div>

          <button
            className="export-btn"
            onClick={handleExport}
            disabled={!narrative || !weatherData}
          >
            导出故事卡片
          </button>
        </div>
      </div>

      <div className="export-card-container">
        {narrative && weatherData && visualConfig && (
          <div 
            ref={exportCardRef}
            className="export-card"
            style={{ background: visualConfig.backgroundGradient }}
          >
            <div className="export-card-watermark">
              {new Date().toLocaleDateString('zh-CN')} · {city}
            </div>
            <div 
              className="export-card-story"
              style={{
                color: visualConfig.textColor,
                fontFamily: visualConfig.fontFamily
              }}
            >
              {narrative.paragraphs.map((para, index) => (
                <p key={index}>{para}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
