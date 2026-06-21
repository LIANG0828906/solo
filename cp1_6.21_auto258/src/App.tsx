import React, { useState, useCallback } from 'react';
import TerrainScene from './scene/TerrainScene';
import ControlPanel from './scene/ControlPanel';
import { TerrainParams, TerrainStats, ViewMode, DEFAULT_PARAMS } from './types';

const App: React.FC = () => {
  const [params, setParams] = useState<TerrainParams>(DEFAULT_PARAMS);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.OVERVIEW);
  const [regenerateTrigger, setRegenerateTrigger] = useState(0);
  const [stats, setStats] = useState<TerrainStats>({
    maxHeight: 0,
    minHeight: 0,
    avgHeight: 0,
    vertexCount: 0
  });

  const handleParamsChange = useCallback((newParams: Partial<TerrainParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleRegenerate = useCallback(() => {
    setParams(prev => ({ ...prev, seed: Math.random() * 1000 }));
    setRegenerateTrigger(prev => prev + 1);
  }, []);

  const handleStatsUpdate = useCallback((newStats: TerrainStats) => {
    setStats(newStats);
  }, []);

  return (
    <div className="app-container">
      <div className="scene-container">
        <TerrainScene
          params={params}
          viewMode={viewMode}
          regenerateTrigger={regenerateTrigger}
          onStatsUpdate={handleStatsUpdate}
        />
      </div>

      <ControlPanel
        params={params}
        viewMode={viewMode}
        onParamsChange={handleParamsChange}
        onViewModeChange={handleViewModeChange}
        onRegenerate={handleRegenerate}
      />

      <div className="stats-bar">
        <div className="stats-item">
          <span className="stats-label">最大高度</span>
          <span className="stats-value">{stats.maxHeight.toFixed(3)}</span>
        </div>
        <div className="stats-item">
          <span className="stats-label">最小高度</span>
          <span className="stats-value">{stats.minHeight.toFixed(3)}</span>
        </div>
        <div className="stats-item">
          <span className="stats-label">平均高度</span>
          <span className="stats-value">{stats.avgHeight.toFixed(3)}</span>
        </div>
        <div className="stats-item">
          <span className="stats-label">顶点数量</span>
          <span className="stats-value">{stats.vertexCount.toLocaleString()}</span>
        </div>
      </div>

      <style>{`
        .app-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          background-color: #0F172A;
        }

        .scene-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .stats-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          background-color: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 48px;
          z-index: 200;
          border-top: 1px solid rgba(148, 163, 184, 0.1);
        }

        .stats-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stats-label {
          color: #64748B;
          font-size: 12px;
          font-weight: 500;
        }

        .stats-value {
          font-family: 'Courier New', 'Consolas', monospace;
          color: #94A3B8;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .stats-bar {
            gap: 16px;
            padding: 0 12px;
          }

          .stats-item {
            flex-direction: column;
            gap: 2px;
            align-items: flex-start;
          }

          .stats-label {
            font-size: 10px;
          }

          .stats-value {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
