import React from 'react';
import { useStore } from '../store';
import { getSceneManager } from '../modules/scene';
import { calculateSunPosition, getDayName } from '../modules/solar';
import CustomSlider from './CustomSlider';

const ControlBar: React.FC = () => {
  const { sunPosition, setSunPosition } = useStore();

  const handleDayChange = (day: number) => {
    const { altitude, azimuth } = calculateSunPosition(day, sunPosition.hour);
    setSunPosition({
      ...sunPosition,
      dayOfYear: day,
      altitude,
      azimuth
    });
    
    const sceneManager = getSceneManager();
    if (sceneManager) {
      sceneManager.updateSunPosition({
        ...sunPosition,
        dayOfYear: day,
        altitude,
        azimuth
      });
    }
  };

  const handleHourChange = (hour: number) => {
    const { altitude, azimuth } = calculateSunPosition(sunPosition.dayOfYear, hour);
    setSunPosition({
      ...sunPosition,
      hour,
      altitude,
      azimuth
    });
    
    const sceneManager = getSceneManager();
    if (sceneManager) {
      sceneManager.updateSunPosition({
        ...sunPosition,
        hour,
        altitude,
        azimuth
      });
    }
  };

  const formatHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="control-bar">
      <div className="slider-container">
        <div className="slider-label">
          <span>📅 日期</span>
          <span className="slider-value">{getDayName(sunPosition.dayOfYear)}</span>
        </div>
        <CustomSlider
          value={sunPosition.dayOfYear}
          min={1}
          max={365}
          step={1}
          onChange={handleDayChange}
          onChangeComplete={handleDayChange}
        />
      </div>
      
      <div className="slider-container">
        <div className="slider-label">
          <span>🕐 时刻</span>
          <span className="slider-value">{formatHour(sunPosition.hour)}</span>
        </div>
        <CustomSlider
          value={sunPosition.hour}
          min={6}
          max={20}
          step={0.25}
          onChange={handleHourChange}
          onChangeComplete={handleHourChange}
        />
      </div>
    </div>
  );
};

export default ControlBar;
