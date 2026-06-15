import { useEffect, useRef } from 'react';
import { useNebulaStore, colorPalettes, ColorPalette } from '../store/useNebulaStore';
import './ControlPanel.css';

export function ControlPanel() {
  const isPanelOpen = useNebulaStore((state) => state.isPanelOpen);
  const togglePanel = useNebulaStore((state) => state.togglePanel);
  const setIsPanelOpen = useNebulaStore((state) => state.setIsPanelOpen);
  const particleCount = useNebulaStore((state) => state.particleCount);
  const setParticleCount = useNebulaStore((state) => state.setParticleCount);
  const colorPalette = useNebulaStore((state) => state.colorPalette);
  const setColorPalette = useNebulaStore((state) => state.setColorPalette);
  const rotationSpeed = useNebulaStore((state) => state.rotationSpeed);
  const setRotationSpeed = useNebulaStore((state) => state.setRotationSpeed);
  const spreadRadius = useNebulaStore((state) => state.spreadRadius);
  const setSpreadRadius = useNebulaStore((state) => state.setSpreadRadius);
  const particleSize = useNebulaStore((state) => state.particleSize);
  const setParticleSize = useNebulaStore((state) => state.setParticleSize);
  const trailLength = useNebulaStore((state) => state.trailLength);
  const setTrailLength = useNebulaStore((state) => state.setTrailLength);
  const setShowExportDialog = useNebulaStore((state) => state.setShowExportDialog);
  const isPlaying = useNebulaStore((state) => state.isPlaying);
  const togglePlaying = useNebulaStore((state) => state.togglePlaying);

  const autoCloseTimerRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const startAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = window.setTimeout(() => {
      setIsPanelOpen(false);
    }, 8000);
  };

  useEffect(() => {
    if (isPanelOpen) {
      startAutoCloseTimer();
    }
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [isPanelOpen]);

  const handlePanelInteraction = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    startAutoCloseTimer();
  };

  const palettes = Object.entries(colorPalettes) as [ColorPalette, typeof colorPalettes.nebula][];

  return (
    <div
      ref={panelRef}
      className={`control-panel ${isPanelOpen ? 'open' : 'closed'}`}
      onMouseEnter={() => {
        if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      }}
      onMouseLeave={() => {
        if (isPanelOpen) startAutoCloseTimer();
      }}
    >
      <button
        className="panel-toggle"
        onClick={togglePanel}
        title={isPanelOpen ? '收起面板 (E)' : '展开面板 (E)'}
      >
        <span className="toggle-icon">{isPanelOpen ? '›' : '‹'}</span>
      </button>

      <div className={`panel-body ${isPanelOpen ? 'panel-body-open' : 'panel-body-closed'}`}>
        <div className="panel-content" onScroll={handlePanelInteraction}>
          <h2 className="panel-title">星云控制台</h2>
          <p className="panel-subtitle">调节参数实时预览效果</p>

          <div className="control-section">
            <label className="control-label">
              <span className="label-text">粒子数量</span>
              <span className="label-value">{particleCount}</span>
            </label>
            <input
              type="range"
              min={500}
              max={3000}
              step={100}
              value={particleCount}
              onChange={(e) => setParticleCount(Number(e.target.value))}
              className="control-slider"
            />
            <div className="slider-labels">
              <span>500</span>
              <span>3000</span>
            </div>
          </div>

          <div className="control-section">
            <label className="control-label">
              <span className="label-text">颜色方案</span>
            </label>
            <div className="palette-grid">
              {palettes.map(([key, palette]) => (
                <button
                  key={key}
                  className={`palette-btn ${colorPalette === key ? 'active' : ''}`}
                  onClick={() => setColorPalette(key)}
                  title={palette.name}
                >
                  <div className="palette-preview">
                    {palette.colors.map((color, i) => (
                      <div
                        key={i}
                        className="palette-color"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="palette-name">{palette.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <label className="control-label">
              <span className="label-text">旋转速度</span>
              <span className="label-value">{rotationSpeed.toFixed(1)} deg/s</span>
            </label>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(Number(e.target.value))}
              className="control-slider"
            />
            <div className="slider-labels">
              <span>0</span>
              <span>5</span>
            </div>
          </div>

          <div className="control-section">
            <label className="control-label">
              <span className="label-text">扩散半径</span>
              <span className="label-value">{spreadRadius.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={spreadRadius}
              onChange={(e) => setSpreadRadius(Number(e.target.value))}
              className="control-slider"
            />
            <div className="slider-labels">
              <span>0.5</span>
              <span>3.0</span>
            </div>
          </div>

          <div className="control-section">
            <label className="control-label">
              <span className="label-text">粒子大小</span>
              <span className="label-value">{particleSize.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0.02}
              max={0.1}
              step={0.01}
              value={particleSize}
              onChange={(e) => setParticleSize(Number(e.target.value))}
              className="control-slider"
            />
            <div className="slider-labels">
              <span>0.02</span>
              <span>0.1</span>
            </div>
          </div>

          <div className="control-section">
            <label className="control-label">
              <span className="label-text">拖尾长度</span>
              <span className="label-value">{trailLength.toFixed(1)}s</span>
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={trailLength}
              onChange={(e) => setTrailLength(Number(e.target.value))}
              className="control-slider"
            />
            <div className="slider-labels">
              <span>0</span>
              <span>2s</span>
            </div>
          </div>

          <div className="control-section">
            <button
              className={`play-btn ${isPlaying ? 'playing' : 'paused'}`}
              onClick={togglePlaying}
            >
              {isPlaying ? '⏸ 暂停动画' : '▶ 播放动画'}
            </button>
          </div>

          <div className="control-section export-section">
            <button
              className="export-btn"
              onClick={() => setShowExportDialog(true)}
            >
              <span className="export-icon">⬇</span>
              导出视频 / GIF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
