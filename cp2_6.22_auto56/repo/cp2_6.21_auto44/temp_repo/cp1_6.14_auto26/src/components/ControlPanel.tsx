import { useCallback } from 'react';
import type { DisplayMode } from '@/types';
import { useRipple } from '@/hooks/useRipple';

interface ControlPanelProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onClearHighlights: () => void;
  autoRotate: boolean;
  onAutoRotateChange: (value: boolean) => void;
  rotationSpeed: number;
  onRotationSpeedChange: (value: number) => void;
  highlightedCount: number;
}

export default function ControlPanel({
  displayMode,
  onDisplayModeChange,
  onClearHighlights,
  autoRotate,
  onAutoRotateChange,
  rotationSpeed,
  onRotationSpeedChange,
  highlightedCount,
}: ControlPanelProps) {
  const createRipple = useRipple();

  const handleResetView = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    window.dispatchEvent(new CustomEvent('reset-camera'));
  }, [createRipple]);

  const handleClearClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e);
      onClearHighlights();
    },
    [createRipple, onClearHighlights]
  );

  const handleModeClick = useCallback(
    (mode: DisplayMode) => (e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e);
      onDisplayModeChange(mode);
    },
    [createRipple, onDisplayModeChange]
  );

  return (
    <div className="control-panel">
      <div className="control-section">
        <div className="control-label">显示模式</div>
        <div className="mode-toggle">
          <button
            className={`mode-btn ripple-btn ${displayMode === 'ball-stick' ? 'active' : ''}`}
            onClick={handleModeClick('ball-stick')}
          >
            <span style={{ fontSize: 16 }}>⚛️</span>
            球棍模型
          </button>
          <button
            className={`mode-btn ripple-btn ${displayMode === 'space-filling' ? 'active' : ''}`}
            onClick={handleModeClick('space-filling')}
          >
            <span style={{ fontSize: 16 }}>🔮</span>
            空间填充
          </button>
        </div>
      </div>

      <div className="control-section">
        <div className="control-label">自动旋转</div>
        <div className="toggle-container">
          <span className="toggle-label">开启旋转</span>
          <div
            className={`toggle-switch ${autoRotate ? 'active' : ''}`}
            onClick={() => onAutoRotateChange(!autoRotate)}
          >
            <div className="toggle-thumb" />
          </div>
        </div>
        {autoRotate && (
          <div className="slider-container">
            <div className="slider-label">
              <span>旋转速度</span>
              <span className="slider-value">{rotationSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              className="slider-input"
              min="0.1"
              max="5"
              step="0.1"
              value={rotationSpeed}
              onChange={(e) => onRotationSpeedChange(parseFloat(e.target.value))}
            />
          </div>
        )}
      </div>

      <div className="control-section">
        <div className="control-label">操作</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="action-btn ripple-btn"
            onClick={handleResetView}
          >
            <span style={{ fontSize: 16 }}>🎯</span>
            重置视角
          </button>
          <button
            className={`action-btn ripple-btn ${highlightedCount > 0 ? 'danger' : ''}`}
            onClick={handleClearClick}
            disabled={highlightedCount === 0}
            style={{
              opacity: highlightedCount === 0 ? 0.5 : 1,
              cursor: highlightedCount === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={{ fontSize: 16 }}>✨</span>
            清除高亮 {highlightedCount > 0 ? `(${highlightedCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
