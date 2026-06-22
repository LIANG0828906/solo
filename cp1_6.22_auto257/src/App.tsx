import { useEffect, useRef, useState, useCallback } from 'react';
import { CityStateManager } from './CityStateManager';
import { LightPollutionEngine } from './LightPollutionEngine';
import { ChartRenderer } from './ChartRenderer';
import { SceneInitializer } from './SceneInitializer';
import { ZONE_INFO } from './types';
import './App.css';

export default function App() {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  
  const cityStateRef = useRef<CityStateManager | null>(null);
  const pollutionEngineRef = useRef<LightPollutionEngine | null>(null);
  const chartRendererRef = useRef<ChartRenderer | null>(null);
  const sceneInitializerRef = useRef<SceneInitializer | null>(null);
  
  const [currentHour, setCurrentHour] = useState(20);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedBuildingInfo, setSelectedBuildingInfo] = useState<{
    zoneName: string;
    pollution: number;
    level: string;
  } | null>(null);

  const formatTime = useCallback((hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!sceneContainerRef.current) return;

    const cityState = new CityStateManager();
    const pollutionEngine = new LightPollutionEngine();
    const chartRenderer = new ChartRenderer();
    const sceneInitializer = new SceneInitializer(sceneContainerRef.current);

    cityStateRef.current = cityState;
    pollutionEngineRef.current = pollutionEngine;
    chartRendererRef.current = chartRenderer;
    sceneInitializerRef.current = sceneInitializer;

    sceneInitializer.init(cityState.getBuildings());

    const handleMouseMove = (event: MouseEvent) => {
      const buildingId = sceneInitializer.getIntersectedBuilding(event);
      sceneInitializer.updateCursor(buildingId);
    };

    const handleClick = (event: MouseEvent) => {
      const buildingId = sceneInitializer.getIntersectedBuilding(event);
      
      if (buildingId) {
        setSelectedBuildingId(buildingId);
        cityState.selectBuilding(buildingId);
        sceneInitializer.highlightBuilding(buildingId);

        const building = cityState.getBuildingById(buildingId);
        if (building) {
          const zoneInfo = ZONE_INFO[building.zoneType];
          const level = pollutionEngine.getPollutionLevelText(building.currentPollution);
          setSelectedBuildingInfo({
            zoneName: zoneInfo.name,
            pollution: building.currentPollution,
            level
          });
        }
      } else {
        setSelectedBuildingId(null);
        setSelectedBuildingInfo(null);
        cityState.selectBuilding(null);
        sceneInitializer.highlightBuilding(null);
        chartRenderer.clearCharts();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'h') {
        setShowHeatmap(prev => {
          const newValue = !prev;
          if (newValue) {
            const heatmapData = pollutionEngine.generateHeatmapData(
              cityState.getBuildings(),
              cityState.getGridSize(),
              cityState.getCellSize()
            );
            sceneInitializer.createHeatmap(heatmapData);
          } else {
            sceneInitializer.hideHeatmap();
          }
          return newValue;
        });
      }
    };

    const canvas = sceneInitializer['sceneObjects']?.renderer.domElement;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('click', handleClick);
    }
    
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('click', handleClick);
      }
      window.removeEventListener('keydown', handleKeyDown);
      sceneInitializer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!selectedBuildingId || !chartRendererRef.current || !cityStateRef.current) return;

    const renderCharts = () => {
      if (!pieChartRef.current || !lineChartRef.current || !chartRendererRef.current || !cityStateRef.current) return;
      
      const building = cityStateRef.current.getSelectedBuilding();
      if (building) {
        chartRendererRef.current.setPieContainer(pieChartRef.current);
        chartRendererRef.current.setLineContainer(lineChartRef.current);
        chartRendererRef.current.renderPieChart(building.lightSources);
        chartRendererRef.current.renderLineChart(building.hourlyData, currentHour);
      }
    };

    const timeoutId = setTimeout(renderCharts, 0);
    return () => clearTimeout(timeoutId);
  }, [selectedBuildingId, currentHour]);

  const handleTimeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const hour = parseFloat(event.target.value);
    setCurrentHour(hour);
    
    if (cityStateRef.current && sceneInitializerRef.current && pollutionEngineRef.current) {
      cityStateRef.current.setCurrentHour(hour);
      sceneInitializerRef.current.updatePollutionBars(cityStateRef.current.getBuildings());
      
      if (selectedBuildingId) {
        const building = cityStateRef.current.getSelectedBuilding();
        if (building && lineChartRef.current && chartRendererRef.current) {
          chartRendererRef.current.setLineContainer(lineChartRef.current);
          chartRendererRef.current.renderLineChart(building.hourlyData, hour);
          
          const level = pollutionEngineRef.current.getPollutionLevelText(building.currentPollution);
          setSelectedBuildingInfo(prev => prev ? { ...prev, pollution: building.currentPollution, level } : null);
        }
      }

      if (showHeatmap) {
        const heatmapData = pollutionEngineRef.current.generateHeatmapData(
          cityStateRef.current.getBuildings(),
          cityStateRef.current.getGridSize(),
          cityStateRef.current.getCellSize()
        );
        sceneInitializerRef.current.createHeatmap(heatmapData);
      }
    }
  }, [selectedBuildingId, showHeatmap]);

  const closePanel = useCallback(() => {
    setSelectedBuildingId(null);
    setSelectedBuildingInfo(null);
    if (cityStateRef.current) {
      cityStateRef.current.selectBuilding(null);
    }
    if (sceneInitializerRef.current) {
      sceneInitializerRef.current.highlightBuilding(null);
    }
    if (chartRendererRef.current) {
      chartRendererRef.current.clearCharts();
    }
  }, []);

  return (
    <div className="app-container">
      <div className="scene-container" ref={sceneContainerRef}></div>
      
      <div className="info-panel">
        <div className="panel-header">
          <h1 className="app-title">城市光污染地图</h1>
          <div className="time-display">
            <span className="time-label">当前时间</span>
            <span className="time-value">{formatTime(currentHour)}</span>
          </div>
        </div>

        <div className="panel-content">
          {selectedBuildingInfo ? (
            <div className="building-info animate-in">
              <div className="info-header">
                <h2 className="zone-name">{selectedBuildingInfo.zoneName}</h2>
                <button className="close-btn" onClick={closePanel}>×</button>
              </div>
              
              <div className="pollution-overview">
                <div className="pollution-value">
                  <span className="value-number">{selectedBuildingInfo.pollution.toFixed(1)}</span>
                  <span className="value-unit">/ 100</span>
                </div>
                <div className="pollution-level">
                  污染等级: <span className="level-tag">{selectedBuildingInfo.level}</span>
                </div>
              </div>

              <div className="chart-section">
                <h3 className="section-title">光源成分</h3>
                <div className="pie-chart-container" ref={pieChartRef}></div>
              </div>

              <div className="chart-section">
                <h3 className="section-title">24小时光照变化</h3>
                <div className="line-chart-container" ref={lineChartRef}></div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <div className="hint-icon">📍</div>
              <p className="hint-text">点击任意建筑查看详细信息</p>
              <p className="hint-subtext">按 H 键切换热力图模式</p>
            </div>
          )}
        </div>

        <div className="panel-footer">
          <div className="time-slider-container">
            <div className="slider-labels">
              <span>00:00</span>
              <span>12:00</span>
              <span>23:59</span>
            </div>
            <input
              type="range"
              min="0"
              max="23.99"
              step="0.01"
              value={currentHour}
              onChange={handleTimeChange}
              className="time-slider"
            />
          </div>
          
          <div className="legend-section">
            <h4 className="legend-title">区域图例</h4>
            <div className="legend-items">
              {Object.entries(ZONE_INFO).map(([key, info]) => (
                <div key={key} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: info.color }}></div>
                  <span className="legend-label">{info.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="heatmap-toggle">
            <span className="toggle-label">热力图模式 (H)</span>
            <div className={`toggle-switch ${showHeatmap ? 'active' : ''}`}
                 onClick={() => {
                   setShowHeatmap(prev => {
                     const newValue = !prev;
                     if (newValue && pollutionEngineRef.current && cityStateRef.current && sceneInitializerRef.current) {
                       const heatmapData = pollutionEngineRef.current.generateHeatmapData(
                         cityStateRef.current.getBuildings(),
                         cityStateRef.current.getGridSize(),
                         cityStateRef.current.getCellSize()
                       );
                       sceneInitializerRef.current.createHeatmap(heatmapData);
                     } else if (!newValue && sceneInitializerRef.current) {
                       sceneInitializerRef.current.hideHeatmap();
                     }
                     return newValue;
                   });
                 }}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
