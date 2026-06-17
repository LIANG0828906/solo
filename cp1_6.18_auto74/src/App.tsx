import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from './store';
import { DataParser } from './data/DataParser';
import { SceneRenderer } from './renderer/SceneRenderer';
import { getAllMetas } from './data/datasets';
import type { VisualizationMode, HoverInfo, DatasetMeta } from './shared/types';

const DATASETS: DatasetMeta[] = getAllMetas();

const MODE_CONFIG: { key: VisualizationMode; iconClass: string; label: string }[] = [
  { key: 'vector', iconClass: 'mode-icon-vector', label: '矢量场' },
  { key: 'heatmap', iconClass: 'mode-icon-heatmap', label: '热力图' },
  { key: 'pressure', iconClass: 'mode-icon-pressure', label: '等压面' },
];

const App: React.FC = () => {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SceneRenderer | null>(null);

  const selectedDataset = useAppStore((s) => s.selectedDataset);
  const visualizationMode = useAppStore((s) => s.visualizationMode);
  const altitudeLevel = useAppStore((s) => s.altitudeLevel);
  const isLoading = useAppStore((s) => s.isLoading);
  const hoverInfo = useAppStore((s) => s.hoverInfo);
  const datasetResult = useAppStore((s) => s.datasetResult);

  const setSelectedDataset = useAppStore((s) => s.setSelectedDataset);
  const setVisualizationMode = useAppStore((s) => s.setVisualizationMode);
  const setAltitudeLevel = useAppStore((s) => s.setAltitudeLevel);
  const setLoading = useAppStore((s) => s.setLoading);
  const setHoverInfo = useAppStore((s) => s.setHoverInfo);
  const setDatasetResult = useAppStore((s) => s.setDatasetResult);

  const handleHover = useCallback((info: HoverInfo) => {
    setHoverInfo(info);
  }, [setHoverInfo]);

  useEffect(() => {
    if (!sceneContainerRef.current) return;
    const renderer = new SceneRenderer({
      container: sceneContainerRef.current,
      onHover: handleHover,
    });
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [handleHover]);

  useEffect(() => {
    if (!rendererRef.current || !datasetResult) return;
    rendererRef.current.setData(datasetResult.windPoints, datasetResult.pressureLayers, {
      maxWindSpeed: datasetResult.meta.maxWindSpeed,
      altitudeRange: datasetResult.meta.altitudeRange,
    });
  }, [datasetResult]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setMode(visualizationMode);
  }, [visualizationMode]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.setAltitudeLevel(altitudeLevel);
  }, [altitudeLevel]);

  const handleDatasetSelect = useCallback(async (key: string) => {
    if (isLoading) return;
    setSelectedDataset(key);
    setLoading(true);
    try {
      const result = await DataParser.parse(key);
      setDatasetResult(result);
    } catch (err) {
      console.error('Failed to load dataset:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoading, setSelectedDataset, setLoading, setDatasetResult]);

  const altitudeMeters = useMemo(() => {
    if (!datasetResult) return 0;
    const [min, max] = datasetResult.meta.altitudeRange;
    return Math.round(min + altitudeLevel * (max - min));
  }, [datasetResult, altitudeLevel]);

  return (
    <div className="app-layout">
      <div className="left-panel">
        <div className="left-panel-title">数据集选择</div>
        {DATASETS.map((ds) => (
          <div key={ds.key}>
            <button
              className={`dataset-btn ${selectedDataset === ds.key ? 'selected' : ''}`}
              onClick={() => handleDatasetSelect(ds.key)}
              disabled={isLoading}
            >
              {isLoading && selectedDataset === ds.key && <span className="loading-spinner" />}
              {ds.label}
            </button>
            {selectedDataset === ds.key && (
              <div className="dataset-desc">{ds.description}</div>
            )}
          </div>
        ))}
      </div>

      <div className="scene-container" ref={sceneContainerRef}>
        <div className="mode-panel">
          {MODE_CONFIG.map((m) => (
            <button
              key={m.key}
              className={`mode-btn ${visualizationMode === m.key ? 'active' : ''}`}
              onClick={() => setVisualizationMode(m.key)}
              title={m.label}
            >
              <span className={m.iconClass} />
            </button>
          ))}
        </div>
      </div>

      <div className="right-panel">
        <div className="altitude-label">高度</div>
        <input
          type="range"
          className="altitude-slider"
          min={0}
          max={1}
          step={0.01}
          value={altitudeLevel}
          onChange={(e) => setAltitudeLevel(parseFloat(e.target.value))}
        />
        <div className="altitude-value">{altitudeMeters}m</div>
      </div>

      <div
        className={`hover-tooltip ${hoverInfo.visible ? '' : 'hidden'}`}
        style={{
          left: hoverInfo.screenX + 10,
          top: hoverInfo.screenY + 10,
        }}
      >
        <div className="tooltip-row">
          <span className="tooltip-label">风速</span>
          <span className="tooltip-value">{hoverInfo.speed} m/s</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">风向</span>
          <span className="tooltip-value">{hoverInfo.direction}°</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">气压</span>
          <span className="tooltip-value">{hoverInfo.pressure} hPa</span>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">高度</span>
          <span className="tooltip-value">{hoverInfo.altitude} m</span>
        </div>
      </div>
    </div>
  );
};

export default App;
