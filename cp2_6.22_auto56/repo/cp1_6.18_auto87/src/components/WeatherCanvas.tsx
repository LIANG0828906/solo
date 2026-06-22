import { useMemo, useEffect, useState, useCallback } from 'react';
import { useMoodStore } from '../store';
import { generateWeatherConfig } from '../weather';
import type { WeatherElement, DecorationElement } from '../weather';

function WeatherCanvas() {
  const currentWeek = useMoodStore((state) => state.currentWeek);
  const weekEntries = useMoodStore((state) => state.weekEntries);
  const avgMoodScore = useMoodStore((state) => state.avgMoodScore);
  const selectedElement = useMoodStore((state) => state.selectedElement);
  const setSelectedElement = useMoodStore((state) => state.setSelectedElement);
  const flashMood = useMoodStore((state) => state.flashMood);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayKey, setDisplayKey] = useState(0);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayKey((prev) => prev + 1);
      setIsTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentWeek]);

  const weatherConfig = useMemo(() => {
    return generateWeatherConfig(weekEntries, avgMoodScore);
  }, [weekEntries, avgMoodScore, displayKey]);

  const handleElementClick = useCallback(
    (element: WeatherElement) => {
      if (selectedElement?.id === element.id) {
        setSelectedElement(null);
      } else {
        setSelectedElement(element);
      }
    },
    [selectedElement, setSelectedElement]
  );

  const flashColor = useMemo(() => {
    if (!flashMood) return 'transparent';
    const colors: Record<string, string> = {
      happy: 'rgba(255, 215, 0, 0.4)',
      calm: 'rgba(135, 206, 235, 0.4)',
      irritated: 'rgba(255, 99, 71, 0.4)',
      sad: 'rgba(74, 144, 217, 0.4)',
      anxious: 'rgba(147, 112, 219, 0.4)',
      tired: 'rgba(112, 128, 144, 0.4)',
    };
    return colors[flashMood] || 'transparent';
  }, [flashMood]);

  return (
    <div
      className="weather-canvas"
      style={{
        background: `linear-gradient(180deg, ${weatherConfig.gradientStart} 0%, ${weatherConfig.gradientEnd} 100%)`,
        opacity: isTransitioning ? 0.4 : 1,
        transition: 'opacity 0.3s ease, background 0.6s ease',
      }}
    >
      {flashMood && <div className="flash-overlay" style={{ background: flashColor }} />}

      {weatherConfig.decorations.map((dec) => (
        <DecorationItem key={dec.id} decoration={dec} />
      ))}

      {weatherConfig.elements.map((el) => (
        <WeatherElementItem key={el.id} element={el} onClick={() => handleElementClick(el)} />
      ))}
    </div>
  );
}

function DecorationItem({ decoration }: { decoration: DecorationElement }) {
  const style: React.CSSProperties = {
    left: `${decoration.x}%`,
    top: `${decoration.y}%`,
    width: decoration.size,
    height: decoration.size * 0.6,
    opacity: decoration.opacity,
    animationDelay: `${decoration.delay}s`,
    animationDuration: `${decoration.duration}s`,
  };

  if (decoration.type === 'star') {
    style.height = decoration.size;
    style.width = decoration.size;
  }

  return <div className={`decoration decoration--${decoration.type}`} style={style} />;
}

function WeatherElementItem({
  element,
  onClick,
}: {
  element: WeatherElement;
  onClick: () => void;
}) {
  const style: React.CSSProperties = {
    left: `${element.x}%`,
    top: `${element.y}%`,
    width: element.size,
    height: element.size,
    opacity: element.opacity,
    transform: 'translate(-50%, -50%)',
    zIndex: 10 + element.zIndex,
  };

  const renderContent = () => {
    switch (element.type) {
      case 'sun':
        return <div className="weather-element__content weather-element--sun" />;
      case 'moon':
        return <div className="weather-element__content weather-element--moon" />;
      case 'cloud':
        return <div className="weather-element__content weather-element--cloud" />;
      case 'rain':
        return (
          <div className="weather-element--rain">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="raindrop"
                style={{
                  left: `${30 + i * 20}%`,
                  top: `${i * 10}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        );
      case 'snow':
        return (
          <div className="weather-element--snow">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className="snowflake"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${i * 15}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s',
                  fontSize: element.size * 0.3,
                }}
              >
                ❄
              </span>
            ))}
          </div>
        );
      case 'thunder':
        return (
          <div className="weather-element--thunder">
            <div className="thunder-cloud" />
            <span className="thunder-bolt">⚡</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="weather-element" style={style} onClick={onClick}>
      {renderContent()}
    </div>
  );
}

export default WeatherCanvas;
