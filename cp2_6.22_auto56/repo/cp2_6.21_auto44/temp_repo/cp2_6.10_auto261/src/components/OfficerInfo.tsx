import React from 'react';
import { StarOfficer, Weather } from '../types';

interface OfficerInfoProps {
  starOfficer: StarOfficer;
  weather: Weather;
}

const OfficerInfo: React.FC<OfficerInfoProps> = ({ starOfficer, weather }) => {
  const getCultivationPercent = () => {
    const maxCultivation = 1000;
    return Math.min((starOfficer.cultivation / maxCultivation) * 100, 100);
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      '紫微星官': '#d4af37',
      '太白金官': '#c0c0c0',
      '青龙星官': '#7CB342',
      '玄武星官': '#29B6F6',
      '铜星官': '#cd7f32',
    };
    return colors[rank] || '#cd7f32';
  };

  const getWeatherColor = (type: string) => {
    const colors: Record<string, string> = {
      clear: '#FFD700',
      rain: '#4FC3F7',
      thunder: '#FF5722',
    };
    return colors[type] || '#FFD700';
  };

  return (
    <div className="right-panel">
      <h2 className="panel-title">星官信息</h2>

      <div className="info-card">
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <div style={{ fontSize: '28px', marginBottom: '5px' }}>⭐</div>
          <div style={{ fontSize: '20px', color: '#d4af37', fontWeight: 'bold' }}>
            {starOfficer.name}
          </div>
          <div 
            style={{ 
              fontSize: '16px', 
              color: getRankColor(starOfficer.rank),
              textShadow: `0 0 10px ${getRankColor(starOfficer.rank)}40`
            }}
          >
            {starOfficer.rank}
          </div>
        </div>

        <div className="info-row">
          <span className="info-label">修为值</span>
          <span className="info-value">{starOfficer.cultivation}</span>
        </div>

        <div style={{ marginTop: '10px' }}>
          <div className="cultivation-bar">
            <div 
              className="cultivation-fill" 
              style={{ width: `${getCultivationPercent()}%` }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#a0b4cc', textAlign: 'center', marginTop: '5px' }}>
            修为进度：{getCultivationPercent().toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="info-card">
        <h3 style={{ color: '#d4af37', fontSize: '16px', marginBottom: '10px' }}>
          功绩记录
        </h3>
        <div className="info-row">
          <span className="info-label">处理事件</span>
          <span className="info-value">{starOfficer.totalEvents} 件</span>
        </div>
        <div className="info-row">
          <span className="info-label">正确处理</span>
          <span className="info-value">{starOfficer.correctEvents} 件</span>
        </div>
        <div className="info-row">
          <span className="info-label">准确率</span>
          <span className="info-value" style={{ 
            color: starOfficer.accuracy >= 0.8 ? '#7CB342' : 
                   starOfficer.accuracy >= 0.6 ? '#d4af37' : '#c0392b' 
          }}>
            {(starOfficer.accuracy * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="info-card">
        <h3 style={{ color: '#d4af37', fontSize: '16px', marginBottom: '10px' }}>
          当前天气
        </h3>
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <span 
            className="weather-badge"
            style={{ 
              backgroundColor: `${getWeatherColor(weather.type)}20`,
              border: `1px solid ${getWeatherColor(weather.type)}50`
            }}
          >
            <span style={{ color: getWeatherColor(weather.type), fontSize: '20px' }}>
              {weather.icon}
            </span>
            <span style={{ color: getWeatherColor(weather.type) }}>{weather.name}</span>
          </span>
          <div style={{ fontSize: '12px', color: '#a0b4cc', marginTop: '10px' }}>
            {weather.type === 'clear' && '天朗气清，观星最佳时机'}
            {weather.type === 'rain' && '云雨朦胧，观星难度增加'}
            {weather.type === 'thunder' && '雷霆震怒，天象变化莫测'}
          </div>
          {weather.modifier > 0 && (
            <div style={{ fontSize: '12px', color: '#c0392b', marginTop: '5px' }}>
              事件难度 +{weather.modifier}
            </div>
          )}
        </div>
      </div>

      <div className="days-indicator">
        本旬第 {starOfficer.daysInCurrentXun} / 10 日
      </div>
    </div>
  );
};

export default OfficerInfo;
