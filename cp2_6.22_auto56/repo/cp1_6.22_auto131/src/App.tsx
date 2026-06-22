import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EarthScene } from './earthScene';
import { ControlPanel } from './ControlPanel';
import { renderCompareChart, updateCompareChart, ChartState } from './chartPanel';
import { HoverInfo, ViewMode, GlobalStats } from './types';
import './styles/global.css';

const MONTH_NAMES = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const earthSceneRef = useRef<EarthScene | null>(null);
  const chart1Ref = useRef<ChartState>({ svg: null, xScale: null, yTempScale: null, yPrecipScale: null, cityName: '' });
  const chart2Ref = useRef<ChartState>({ svg: null, xScale: null, yTempScale: null, yPrecipScale: null, cityName: '' });

  const [viewMode, setViewMode] = useState<ViewMode>('auto-rotate');
  const [year, setYear] = useState<number>(2015);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>({
    cityId: '',
    cityName: '',
    month: 0,
    temperature: 0,
    precipitation: 0,
    screenX: 0,
    screenY: 0,
    visible: false,
  });
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    avgTemperature: 0,
    totalPrecipitation: 0,
  });
  const [tempAnimate, setTempAnimate] = useState<boolean>(false);
  const [precipAnimate, setPrecipAnimate] = useState<boolean>(false);
  const prevStatsRef = useRef<GlobalStats>({ avgTemperature: 0, totalPrecipitation: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new EarthScene(canvasRef.current);
    earthSceneRef.current = scene;

    scene.setOnHoverChange((info) => {
      setHoverInfo(info);
    });

    scene.setOnCityClick((cityId) => {
      setSelectedCities((prev) => {
        if (prev.includes(cityId)) {
          return prev.filter((id) => id !== cityId);
        }
        if (prev.length >= 2) {
          return [prev[1], cityId];
        }
        return [...prev, cityId];
      });
    });

    scene.start();

    const statsInterval = setInterval(() => {
      if (earthSceneRef.current) {
        const stats = earthSceneRef.current.getGlobalStats();
        const prev = prevStatsRef.current;
        if (Math.abs(stats.avgTemperature - prev.avgTemperature) > 0.01) {
          setTempAnimate(true);
          setTimeout(() => setTempAnimate(false), 400);
        }
        if (Math.abs(stats.totalPrecipitation - prev.totalPrecipitation) > 1) {
          setPrecipAnimate(true);
          setTimeout(() => setPrecipAnimate(false), 400);
        }
        prevStatsRef.current = stats;
        setGlobalStats(stats);
      }
    }, 500);

    return () => {
      clearInterval(statsInterval);
      scene.dispose();
    };
  }, []);

  useEffect(() => {
    if (earthSceneRef.current) {
      earthSceneRef.current.setViewMode(viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (earthSceneRef.current) {
      earthSceneRef.current.setYear(year);
    }
  }, [year]);

  useEffect(() => {
    if (earthSceneRef.current) {
      earthSceneRef.current.setCompareMode(compareMode);
    }
    if (!compareMode) {
      setSelectedCities([]);
    }
  }, [compareMode]);

  useEffect(() => {
    if (!earthSceneRef.current || selectedCities.length === 0) return;

    if (selectedCities.length >= 1) {
      const city1 = earthSceneRef.current.getCityById(selectedCities[0]);
      const data1 = earthSceneRef.current.getCityMonthlyData(selectedCities[0]);
      if (city1 && data1.length > 0) {
        setTimeout(() => {
          if (chart1Ref.current.svg && chart1Ref.current.cityName === city1.cityName) {
            chart1Ref.current = updateCompareChart(chart1Ref.current, data1, city1.cityName);
          } else {
            chart1Ref.current = renderCompareChart('compare-chart-1', data1, city1.cityName);
          }
        }, 50);
      }
    }

    if (selectedCities.length >= 2) {
      const city2 = earthSceneRef.current.getCityById(selectedCities[1]);
      const data2 = earthSceneRef.current.getCityMonthlyData(selectedCities[1]);
      if (city2 && data2.length > 0) {
        setTimeout(() => {
          if (chart2Ref.current.svg && chart2Ref.current.cityName === city2.cityName) {
            chart2Ref.current = updateCompareChart(chart2Ref.current, data2, city2.cityName);
          } else {
            chart2Ref.current = renderCompareChart('compare-chart-2', data2, city2.cityName);
          }
        }, 50);
      }
    }
  }, [selectedCities, year]);

  const getCityName = useCallback((cityId: string): string => {
    if (!earthSceneRef.current) return '';
    return earthSceneRef.current.getCityById(cityId)?.cityName || '';
  }, []);

  const handleCloseChart = (index: number) => {
    setSelectedCities((prev) => {
      const newCities = [...prev];
      newCities.splice(index, 1);
      return newCities;
    });
  };

  return (
    <div className="app-container">
      <canvas ref={canvasRef} id="three-canvas" />

      <ControlPanel
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        year={year}
        onYearChange={setYear}
        compareMode={compareMode}
        onCompareModeChange={setCompareMode}
      />

      <div className="stat-panels">
        <div className="stat-panel">
          <div className="stat-label">
            <span className="material-symbols-outlined">thermostat</span>
            全球平均气温
          </div>
          <div className="stat-value-wrapper">
            <div className={`stat-value ${tempAnimate ? 'animate-up' : ''}`} key={`temp-${globalStats.avgTemperature.toFixed(1)}`}>
              {globalStats.avgTemperature.toFixed(1)}
              <span className="unit">°C</span>
            </div>
          </div>
        </div>
        <div className="stat-panel">
          <div className="stat-label">
            <span className="material-symbols-outlined">water_drop</span>
            全球总降水量
          </div>
          <div className="stat-value-wrapper">
            <div className={`stat-value ${precipAnimate ? 'animate-up' : ''}`} key={`precip-${Math.round(globalStats.totalPrecipitation)}`}>
              {Math.round(globalStats.totalPrecipitation)}
              <span className="unit">mm</span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`info-card ${hoverInfo.visible ? 'visible' : ''}`}
        style={{
          left: `${Math.min(hoverInfo.screenX + 15, window.innerWidth - 220)}px`,
          top: `${Math.min(hoverInfo.screenY + 15, window.innerHeight - 180)}px`,
        }}
      >
        <div className="info-card-title">
          {hoverInfo.cityName} · {MONTH_NAMES[hoverInfo.month]}
        </div>
        <div className="info-card-row">
          <span className="label">平均气温</span>
          <span className="value">{hoverInfo.temperature.toFixed(1)}°C</span>
        </div>
        <div className="info-card-row">
          <span className="label">降水量</span>
          <span className="value">{Math.round(hoverInfo.precipitation)} mm</span>
        </div>
      </div>

      {selectedCities.length > 0 && (
        <div className="compare-panels">
          {selectedCities.slice(0, 2).map((cityId, idx) => (
            <div className="compare-panel" key={`${cityId}-${idx}`}>
              <div className="compare-panel-title">{getCityName(cityId)}</div>
              <button
                className="compare-panel-close"
                onClick={() => handleCloseChart(idx)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  close
                </span>
              </button>
              <div id={`compare-chart-${idx + 1}`} style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>
      )}

      <div className="hint-text">
        鼠标左键拖拽旋转 · 滚轮缩放 · 右键平移 · 悬停查看详情
      </div>

      <div className="legend">
        <span className="legend-label">温度：</span>
        <div>
          <div className="legend-gradient" />
          <div className="legend-ticks">
            <span>-10°C</span>
            <span>0°C</span>
            <span>40°C</span>
          </div>
        </div>
      </div>
    </div>
  );
};
