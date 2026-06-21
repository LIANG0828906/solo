import React, { useCallback, useState } from 'react';
import { TerrainParams, ViewMode } from '../types';

interface ControlPanelProps {
  params: TerrainParams;
  viewMode: ViewMode;
  onParamsChange: (params: Partial<TerrainParams>) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onRegenerate: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  viewMode,
  onParamsChange,
  onViewModeChange,
  onRegenerate
}) => {
  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ heightAmplitude: parseFloat(e.target.value) });
  }, [onParamsChange]);

  const handleSmoothnessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ smoothness: parseFloat(e.target.value) });
  }, [onParamsChange]);

  const handleToneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ textureTone: parseFloat(e.target.value) });
  }, [onParamsChange]);

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#334155',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none'
  };

  const sliderThumbStyle = `
    .control-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #3B82F6;
      cursor: pointer;
      transition: transform 0.15s ease;
    }
    .control-slider::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }
    .control-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #3B82F6;
      cursor: pointer;
      border: none;
      transition: transform 0.15s ease;
    }
    .control-slider::-moz-range-thumb:hover {
      transform: scale(1.2);
    }
  `;

  return (
    <>
      <style>{sliderThumbStyle}</style>
      
      <div className="control-panel-desktop">
        <div className="view-buttons">
          <button
            className={`view-btn ${viewMode === ViewMode.OVERVIEW ? 'active' : ''}`}
            onClick={() => onViewModeChange(ViewMode.OVERVIEW)}
          >
            俯瞰视角
          </button>
          <button
            className={`view-btn ${viewMode === ViewMode.FREE_ROAM ? 'active' : ''}`}
            onClick={() => onViewModeChange(ViewMode.FREE_ROAM)}
          >
            自由漫游
          </button>
        </div>

        <div className="control-group">
          <label className="control-label">
            高度幅度
            <span className="control-value">{params.heightAmplitude.toFixed(2)}</span>
          </label>
          <input
            type="range"
            className="control-slider"
            min="0.2"
            max="2.0"
            step="0.01"
            value={params.heightAmplitude}
            onChange={handleHeightChange}
            style={sliderStyle}
          />
        </div>

        <div className="control-group">
          <label className="control-label">
            平滑度
            <span className="control-value">{params.smoothness.toFixed(2)}</span>
          </label>
          <input
            type="range"
            className="control-slider"
            min="0.1"
            max="1.0"
            step="0.01"
            value={params.smoothness}
            onChange={handleSmoothnessChange}
            style={sliderStyle}
          />
        </div>

        <div className="control-group">
          <label className="control-label">
            纹理色调
            <span className="control-value">{params.textureTone.toFixed(2)}</span>
          </label>
          <input
            type="range"
            className="control-slider"
            min="0"
            max="1"
            step="0.01"
            value={params.textureTone}
            onChange={handleToneChange}
            style={sliderStyle}
          />
        </div>

        <button className="regenerate-btn" onClick={onRegenerate}>
          重新生成地形
        </button>

        {viewMode === ViewMode.FREE_ROAM && (
          <div className="controls-hint">
            <p>WASD - 移动</p>
            <p>鼠标拖拽 - 旋转视角</p>
            <p>右键拖拽 - 平移</p>
          </div>
        )}
      </div>

      <div className="control-panel-mobile">
        <button 
          className="drawer-toggle"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          {drawerOpen ? '收起面板 ▼' : '展开面板 ▲'}
        </button>
        
        {drawerOpen && (
          <div className="mobile-drawer">
            <div className="view-buttons">
              <button
                className={`view-btn ${viewMode === ViewMode.OVERVIEW ? 'active' : ''}`}
                onClick={() => onViewModeChange(ViewMode.OVERVIEW)}
              >
                俯瞰视角
              </button>
              <button
                className={`view-btn ${viewMode === ViewMode.FREE_ROAM ? 'active' : ''}`}
                onClick={() => onViewModeChange(ViewMode.FREE_ROAM)}
              >
                自由漫游
              </button>
            </div>

            <div className="control-group">
              <label className="control-label">
                高度幅度 <span>{params.heightAmplitude.toFixed(2)}</span>
              </label>
              <input
                type="range"
                className="control-slider"
                min="0.2"
                max="2.0"
                step="0.01"
                value={params.heightAmplitude}
                onChange={handleHeightChange}
                style={sliderStyle}
              />
            </div>

            <div className="control-group">
              <label className="control-label">
                平滑度 <span>{params.smoothness.toFixed(2)}</span>
              </label>
              <input
                type="range"
                className="control-slider"
                min="0.1"
                max="1.0"
                step="0.01"
                value={params.smoothness}
                onChange={handleSmoothnessChange}
                style={sliderStyle}
              />
            </div>

            <div className="control-group">
              <label className="control-label">
                纹理色调 <span>{params.textureTone.toFixed(2)}</span>
              </label>
              <input
                type="range"
                className="control-slider"
                min="0"
                max="1"
                step="0.01"
                value={params.textureTone}
                onChange={handleToneChange}
                style={sliderStyle}
              />
            </div>

            <button className="regenerate-btn" onClick={onRegenerate}>
              重新生成地形
            </button>
          </div>
        )}
      </div>

      <style>{`
        .control-panel-desktop {
          width: 300px;
          background: #1E293B;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          position: absolute;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 100;
        }

        .control-panel-mobile {
          display: none;
          position: fixed;
          bottom: 40px;
          left: 0;
          right: 0;
          z-index: 100;
        }

        @media (max-width: 768px) {
          .control-panel-desktop {
            display: none;
          }
          .control-panel-mobile {
            display: block;
          }
        }

        .drawer-toggle {
          width: 100%;
          padding: 12px;
          background: #1E293B;
          color: #E2E8F0;
          border: none;
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }

        .drawer-toggle:hover {
          background: #334155;
        }

        .mobile-drawer {
          height: 400px;
          background: #1E293B;
          padding: 16px;
          overflow-y: auto;
        }

        .view-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .view-btn {
          flex: 1;
          padding: 10px 12px;
          border: none;
          border-radius: 8px;
          background: #334155;
          color: #E2E8F0;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-btn:hover {
          background: #475569;
          transform: scale(0.98);
        }

        .view-btn:active {
          transform: scale(0.95);
        }

        .view-btn.active {
          background: #3B82F6;
        }

        .control-group {
          margin-bottom: 18px;
        }

        .control-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #E2E8F0;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .control-value {
          font-family: 'Courier New', monospace;
          color: #94A3B8;
          font-size: 12px;
        }

        .regenerate-btn {
          width: 100%;
          padding: 12px;
          margin-top: 8px;
          background: #3B82F6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .regenerate-btn:hover {
          background: #2563EB;
          transform: scale(0.98);
        }

        .regenerate-btn:active {
          transform: scale(0.95);
        }

        .controls-hint {
          margin-top: 16px;
          padding: 12px;
          background: #0F172A;
          border-radius: 8px;
        }

        .controls-hint p {
          color: #94A3B8;
          font-size: 12px;
          margin: 4px 0;
        }
      `}</style>
    </>
  );
};

export default ControlPanel;
