import { useState, useEffect } from 'react';
import type { WeatherData } from '../utils/weatherTypes';

interface InfoOverlayProps {
  weatherData: WeatherData | null;
}

export default function InfoOverlay({ weatherData }: InfoOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!weatherData) {
    return (
      <div style={overlayStyle}>
        <div style={loadingStyle}>加载天气数据中...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div
        style={{
          ...overlayStyle,
          cursor: 'pointer',
          transition: 'transform 0.4s ease-out, opacity 0.4s ease-out',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={mainContentStyle}>
          <div style={timeStyle}>{formatTime(currentTime)}</div>
          <div style={weatherRowStyle}>
            <span style={iconStyle}>{weatherData.icon}</span>
            <span style={tempStyle}>{weatherData.temperature}°C</span>
          </div>
          <div style={cityStyle}>{weatherData.city}</div>
        </div>
      </div>

      <div
        style={{
          ...forecastStyle,
          transform: isExpanded ? 'translateY(0)' : 'translateY(100%)',
          opacity: isExpanded ? 1 : 0,
          maxHeight: isExpanded ? '200px' : '0',
          transition: 'transform 0.4s ease-out, opacity 0.4s ease-out, max-height 0.4s ease-out',
        }}
      >
        <div style={forecastTitleStyle}>未来三小时</div>
        <div style={forecastListStyle}>
          {weatherData.hourlyForecast.map((forecast, index) => (
            <div key={index} style={forecastItemStyle}>
              <div style={forecastTimeStyle}>{forecast.time}</div>
              <div style={forecastIconStyle}>{forecast.icon}</div>
              <div style={forecastTempStyle}>{forecast.temperature}°C</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  right: '24px',
  bottom: '24px',
  zIndex: 10,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
};

const overlayStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(8px)',
  borderRadius: '16px',
  padding: '20px 28px',
  minWidth: '180px',
};

const loadingStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '14px',
};

const mainContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
};

const timeStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '16px',
};

const weatherRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const iconStyle: React.CSSProperties = {
  fontSize: '1.5em',
};

const tempStyle: React.CSSProperties = {
  fontSize: '44px',
  color: '#FFFFFF',
  textShadow: '0 0 4px rgba(0, 0, 0, 0.5)',
  fontWeight: '300',
};

const cityStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '14px',
};

const forecastStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(8px)',
  borderRadius: '16px',
  padding: '16px 20px',
  marginTop: '12px',
  overflow: 'hidden',
};

const forecastTitleStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '13px',
  marginBottom: '12px',
  textAlign: 'center',
};

const forecastListStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
};

const forecastItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  minWidth: '60px',
};

const forecastTimeStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '12px',
};

const forecastIconStyle: React.CSSProperties = {
  fontSize: '20px',
};

const forecastTempStyle: React.CSSProperties = {
  color: '#FFFFFF',
  fontSize: '14px',
};
