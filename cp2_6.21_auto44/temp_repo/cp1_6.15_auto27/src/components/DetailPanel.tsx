import React, { useState, useEffect } from 'react';
import { TrendChart } from './TrendChart';
import type { Station, HistoryData, TimeRange, PollutantType, Theme } from '../types';
import { AQI_LEVELS, POLLUTANT_UNITS, POLLUTANT_COLORS } from '../types';
import { getHistoryData } from '../utils/api';

interface DetailPanelProps {
  station: Station | null;
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
}

export function DetailPanel({ station, isOpen, onClose, theme }: DetailPanelProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (station && isOpen) {
      setLoading(true);
      getHistoryData(station.id, timeRange)
        .then((data) => {
          setHistoryData(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [station?.id, timeRange, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMaxValue = (pollutant: PollutantType) => {
    const values: Record<PollutantType, number> = {
      'PM2.5': 150,
      'PM10': 200,
      'O3': 200,
      'NO2': 100,
      'CO': 3,
      'SO2': 100,
    };
    return values[pollutant];
  };

  const getPollutantColorVar = (pollutant: PollutantType) => {
    const colorVars: Record<PollutantType, string> = {
      'PM2.5': 'var(--pollutant-pm25)',
      'PM10': 'var(--pollutant-pm10)',
      'O3': 'var(--pollutant-o3)',
      'NO2': 'var(--pollutant-no2)',
      'CO': 'var(--pollutant-co)',
      'SO2': 'var(--pollutant-so2)',
    };
    return colorVars[pollutant];
  };

  if (!station) return null;

  const levelInfo = AQI_LEVELS[station.level];
  const pollutants = Object.entries(station.pollutants) as [PollutantType, number][];

  return (
    <>
      <div className={`detail-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`detail-panel ${isOpen ? 'open' : ''}`}>
        <button className="detail-close" onClick={onClose} aria-label="关闭">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="detail-header">
          <h2>{station.name}</h2>
          <p>{station.city}</p>
        </div>

        <div
          className="detail-aqi"
          style={{
            backgroundColor: `${levelInfo.color}15`,
          }}
        >
          <span className="detail-aqi-value" style={{ color: levelInfo.color }}>
            {station.aqi}
          </span>
          <div className="detail-aqi-info">
            <span className="detail-aqi-level" style={{ color: levelInfo.color }}>
              {levelInfo.label}
            </span>
            <span className="detail-aqi-update">
              更新于 {formatTime(station.updateTime)}
            </span>
          </div>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">实时污染物浓度</h3>
          <div className="pollutant-bars">
            {pollutants.map(([name, value]) => {
              const max = getMaxValue(name);
              const percentage = Math.min(100, (value / max) * 100);
              return (
                <div key={name} className="pollutant-bar-item">
                  <span className="pollutant-bar-name">{name}</span>
                  <div className="pollutant-bar-track">
                    <div
                      className="pollutant-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getPollutantColorVar(name),
                      }}
                    />
                  </div>
                  <span className="pollutant-bar-value">
                    {value} {POLLUTANT_UNITS[name]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">历史趋势</h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              加载中...
            </div>
          ) : historyData ? (
            <TrendChart
              data={historyData}
              timeRange={timeRange}
              theme={theme}
              onTimeRangeChange={setTimeRange}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
