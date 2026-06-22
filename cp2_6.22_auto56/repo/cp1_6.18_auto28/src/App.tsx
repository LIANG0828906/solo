import { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from './SceneManager';
import { useAppStore } from './store';
import ControlPanel from './UI';
import type { MarkerData } from './types';
import './styles.css';

function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const {
    terrainData,
    selectedMarker,
    isLoading,
    error,
    cameraResetTrigger,
    setSelectedMarker,
    setError,
  } = useAppStore();

  const [hoveredMarkerData, setHoveredMarkerData] = useState<MarkerData | null>(null);

  const handleMarkerClick = useCallback(
    (marker: MarkerData) => {
      setSelectedMarker(marker);
    },
    [setSelectedMarker]
  );

  const handleMarkerHover = useCallback((marker: MarkerData | null) => {
    setHoveredMarkerData(marker);
  }, []);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const sceneManager = new SceneManager({
      container: canvasContainerRef.current,
      onMarkerClick: handleMarkerClick,
      onMarkerHover: handleMarkerHover,
    });

    sceneManagerRef.current = sceneManager;

    return () => {
      sceneManager.dispose();
    };
  }, [handleMarkerClick, handleMarkerHover]);

  useEffect(() => {
    if (sceneManagerRef.current && terrainData) {
      sceneManagerRef.current.updateTerrain(terrainData);
    }
  }, [terrainData]);

  useEffect(() => {
    if (sceneManagerRef.current && cameraResetTrigger > 0) {
      sceneManagerRef.current.resetCamera();
    }
  }, [cameraResetTrigger]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const closeInfoPanel = () => {
    setSelectedMarker(null);
  };

  const rgbToHex = (rgb: [number, number, number]): string => {
    return (
      '#' +
      rgb
        .map((c) => {
          const hex = Math.round(c * 255).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  };

  return (
    <div className="app-container">
      <ControlPanel />

      <div className="canvas-container" ref={canvasContainerRef}>
        {!terrainData && !isLoading && (
          <div className="welcome-overlay">
            <h1 className="welcome-title">数据地貌</h1>
            <p className="welcome-subtitle">
              上传CSV文件或选择预设数据集，在三维空间中探索数据的起伏变化
            </p>
            <p className="welcome-hint">点击左侧控制面板开始</p>
          </div>
        )}

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}

        {error && <div className="error-toast">{error}</div>}

        {terrainData && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">顶点数</span>
              <span className="stat-value">{terrainData.vertices.length.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">数据点</span>
              <span className="stat-value">{terrainData.markers.length.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">最小值</span>
              <span className="stat-value">{terrainData.bounds.minValue.toFixed(2)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">最大值</span>
              <span className="stat-value">{terrainData.bounds.maxValue.toFixed(2)}</span>
            </div>
          </div>
        )}

        {hoveredMarkerData && (
          <div className="hover-tooltip">
            坐标: ({hoveredMarkerData.x}, {hoveredMarkerData.y})
            <span className="hover-tooltip-value">
              {hoveredMarkerData.value.toFixed(4)}
            </span>
          </div>
        )}

        {selectedMarker && (
          <div className="info-panel">
            <div className="info-panel-header">
              <h3 className="info-panel-title">数据点详情</h3>
              <button className="info-panel-close" onClick={closeInfoPanel}>
                ×
              </button>
            </div>
            <div className="info-panel-content">
              <div className="info-row">
                <span className="info-label">X 坐标</span>
                <span className="info-value">{selectedMarker.x}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Y 坐标</span>
                <span className="info-value">{selectedMarker.y}</span>
              </div>
              <div className="info-row">
                <span className="info-label">数值</span>
                <span className="info-value">{selectedMarker.value.toFixed(6)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">映射高度</span>
                <span className="info-value">{selectedMarker.height.toFixed(4)} 单位</span>
              </div>
              <div className="info-row">
                <span className="info-label">颜色</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    className="color-preview"
                    style={{ backgroundColor: rgbToHex(selectedMarker.color) }}
                  ></div>
                  <span className="info-value" style={{ fontSize: 13 }}>
                    {rgbToHex(selectedMarker.color).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
