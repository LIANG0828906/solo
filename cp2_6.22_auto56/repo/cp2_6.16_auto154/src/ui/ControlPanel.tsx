import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import {
  Thermometer,
  Droplets,
  Wind,
  RotateCcw,
  Play,
  Pause,
  Camera,
  Cloud,
  Sun,
  CloudRain,
} from 'lucide-react';

interface ControlPanelProps {
  onResetCamera: () => void;
  onExportScreenshot: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onResetCamera,
  onExportScreenshot,
}) => {
  const {
    temperatureLevel,
    humidityLevel,
    windLevel,
    simulationHour,
    isPlaying,
    temperatureUnit,
    setTemperatureLevel,
    setHumidityLevel,
    setWindLevel,
    togglePlaying,
    formatTemperature,
  } = useStore();

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
      second: '2-digit',
    });
  };

  const formatSimHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getWeatherIcon = () => {
    const hour = simulationHour;
    const isDay = hour >= 6 && hour < 18;
    
    if (humidityLevel > 80) {
      return <CloudRain className="w-10 h-10 text-blue-300" />;
    } else if (humidityLevel > 60) {
      return <Cloud className="w-10 h-10 text-gray-300" />;
    } else {
      return isDay ? (
        <Sun className="w-10 h-10 text-yellow-300" />
      ) : (
        <Cloud className="w-10 h-10 text-blue-200" />
      );
    }
  };

  const sliderBg = {
    background: 'linear-gradient(135deg, #2E86AB 0%, #1B7A7A 100%)',
  };

  const sliderTrack = (value: number, min: number, max: number) => {
    const percent = ((value - min) / (max - min)) * 100;
    return {
      background: `linear-gradient(to right, #2E86AB 0%, #1B7A7A ${percent}%, rgba(255,255,255,0.1) ${percent}%, rgba(255,255,255,0.1) 100%)`,
    };
  };

  return (
    <div className="control-panel">
      <div className="panel-header">
        <div className="time-section">
          <div className="current-time">{formatTime(currentTime)}</div>
          <div className="sim-time">模拟时间: {formatSimHour(simulationHour)}</div>
        </div>
        <div className="weather-icon">{getWeatherIcon()}</div>
      </div>

      <div className="panel-section">
        <div className="slider-section">
          <div className="slider-label">
            <Thermometer className="w-4 h-4" />
            <span>温度等级</span>
            <span className="slider-value">{formatTemperature(temperatureLevel)}</span>
          </div>
          <div className="slider-container" style={sliderTrack(temperatureLevel, -10, 40)}>
            <input
              type="range"
              min="-10"
              max="40"
              step="1"
              value={temperatureLevel}
              onChange={(e) => setTemperatureLevel(Number(e.target.value))}
              className="custom-slider"
            />
            <div className="slider-ticks">
              <span>-10°</span>
              <span>40°</span>
            </div>
          </div>
        </div>

        <div className="slider-section">
          <div className="slider-label">
            <Droplets className="w-4 h-4" />
            <span>湿度等级</span>
            <span className="slider-value">{humidityLevel}%</span>
          </div>
          <div className="slider-container" style={sliderTrack(humidityLevel, 0, 100)}>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={humidityLevel}
              onChange={(e) => setHumidityLevel(Number(e.target.value))}
              className="custom-slider"
            />
            <div className="slider-ticks">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <div className="slider-section">
          <div className="slider-label">
            <Wind className="w-4 h-4" />
            <span>风力等级</span>
            <span className="slider-value">{windLevel} 级</span>
          </div>
          <div className="slider-container" style={sliderTrack(windLevel, 0, 12)}>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={windLevel}
              onChange={(e) => setWindLevel(Number(e.target.value))}
              className="custom-slider"
            />
            <div className="slider-ticks">
              <span>0级</span>
              <span>12级</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-buttons">
        <button className="panel-btn" onClick={onResetCamera}>
          <RotateCcw className="w-4 h-4" />
          <span>重置视角</span>
        </button>
        <button className="panel-btn primary" onClick={togglePlaying}>
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isPlaying ? '暂停' : '播放'}</span>
        </button>
        <button className="panel-btn" onClick={onExportScreenshot}>
          <Camera className="w-4 h-4" />
          <span>导出截图</span>
        </button>
      </div>
    </div>
  );
};
