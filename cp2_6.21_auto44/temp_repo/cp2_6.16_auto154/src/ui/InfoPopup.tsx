import React, { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { getGridLatLon, getHourlyForecast } from '@/data/weatherGenerator';
import { X, MapPin, Thermometer, Droplets, Wind } from 'lucide-react';

interface InfoPopupProps {
  gridX: number;
  gridY: number;
  onClose: () => void;
}

export const InfoPopup: React.FC<InfoPopupProps> = ({ gridX, gridY, onClose }) => {
  const {
    dataSource,
    simulationHour,
    temperatureLevel,
    humidityLevel,
    windLevel,
    formatTemperature,
  } = useStore();

  const latLon = useMemo(
    () => getGridLatLon(dataSource, gridX, gridY),
    [dataSource, gridX, gridY]
  );

  const forecast = useMemo(
    () => getHourlyForecast(dataSource, gridX, gridY, simulationHour, temperatureLevel, humidityLevel, windLevel),
    [dataSource, gridX, gridY, simulationHour, temperatureLevel, humidityLevel, windLevel]
  );

  const currentData = forecast[0];

  const chartWidth = 240;
  const chartHeight = 80;
  const padding = 20;

  const tempValues = forecast.map((f) => f.temperature);
  const humidValues = forecast.map((f) => f.humidity);
  const windValues = forecast.map((f) => f.windSpeed);

  const minTemp = Math.min(...tempValues) - 2;
  const maxTemp = Math.max(...tempValues) + 2;
  const minHumid = Math.min(...humidValues) - 5;
  const maxHumid = Math.max(...humidValues) + 5;

  const createPath = (values: number[], min: number, max: number) => {
    const stepX = (chartWidth - padding * 2) / (values.length - 1);
    return values
      .map((v, i) => {
        const x = padding + i * stepX;
        const y = chartHeight - padding - ((v - min) / (max - min)) * (chartHeight - padding * 2);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const tempPath = createPath(tempValues, minTemp, maxTemp);
  const humidPath = createPath(humidValues, minHumid, maxHumid);

  return (
    <div className="info-popup">
      <div className="popup-header">
        <div className="popup-title">
          <MapPin className="w-4 h-4 text-cyan-300" />
          <span>网格详情</span>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="popup-location">
        <span>经度: {latLon.lon.toFixed(4)}°</span>
        <span>纬度: {latLon.lat.toFixed(4)}°</span>
      </div>

      <div className="popup-stats">
        <div className="stat-item">
          <Thermometer className="w-5 h-5 text-orange-400" />
          <div className="stat-info">
            <span className="stat-label">温度</span>
            <span className="stat-value">{formatTemperature(currentData.temperature)}</span>
          </div>
        </div>
        <div className="stat-item">
          <Droplets className="w-5 h-5 text-blue-400" />
          <div className="stat-info">
            <span className="stat-label">湿度</span>
            <span className="stat-value">{currentData.humidity}%</span>
          </div>
        </div>
        <div className="stat-item">
          <Wind className="w-5 h-5 text-teal-400" />
          <div className="stat-info">
            <span className="stat-label">风速</span>
            <span className="stat-value">{currentData.windSpeed.toFixed(1)} m/s</span>
          </div>
        </div>
      </div>

      <div className="popup-forecast">
        <div className="forecast-title">未来2小时预报</div>
        <div className="forecast-charts">
          <div className="chart-container">
            <div className="chart-label">温度</div>
            <svg width={chartWidth} height={chartHeight} className="chart-svg">
              <defs>
                <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${tempPath} L ${chartWidth - padding} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
                fill="url(#tempGradient)"
              />
              <path d={tempPath} fill="none" stroke="#f97316" strokeWidth="2" />
            </svg>
          </div>
          <div className="chart-container">
            <div className="chart-label">湿度</div>
            <svg width={chartWidth} height={chartHeight} className="chart-svg">
              <defs>
                <linearGradient id="humidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${humidPath} L ${chartWidth - padding} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
                fill="url(#humidGradient)"
              />
              <path d={humidPath} fill="none" stroke="#3b82f6" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
