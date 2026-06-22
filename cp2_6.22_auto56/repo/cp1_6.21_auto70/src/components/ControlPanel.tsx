import React, { useState, useCallback, useRef } from 'react';
import { GradientConfig, GradientType, ColorStop } from '../utils/gradientCalculator';

interface ControlPanelProps {
  config: GradientConfig;
  onChange: (config: GradientConfig) => void;
}

const generateId = (): string => Math.random().toString(36).substring(2, 9);

const ControlPanel: React.FC<ControlPanelProps> = ({ config, onChange }) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const updateConfig = useCallback((updates: Partial<GradientConfig>) => {
    onChange({ ...config, ...updates });
  }, [config, onChange]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as GradientType;
    const baseConfig: GradientConfig = { type, colors: config.colors };
    if (type === 'linear') {
      baseConfig.angle = config.angle ?? 135;
    } else if (type === 'radial') {
      baseConfig.shape = config.shape ?? 'circle';
      baseConfig.centerX = config.centerX ?? 50;
      baseConfig.centerY = config.centerY ?? 50;
    } else if (type === 'conic') {
      baseConfig.startAngle = config.startAngle ?? 0;
    }
    onChange(baseConfig);
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...config.colors];
    newColors[index] = { ...newColors[index], color };
    updateConfig({ colors: newColors });
  };

  const addColorStop = () => {
    if (config.colors.length >= 7) return;
    const positions = config.colors.map(c => c.position);
    const minPos = Math.min(...positions);
    const maxPos = Math.max(...positions);
    const newPosition = Math.round((minPos + maxPos) / 2);
    const newColors = [
      ...config.colors,
      { id: generateId(), color: '#ffffff', position: newPosition },
    ];
    updateConfig({ colors: newColors });
  };

  const removeColorStop = (id: string) => {
    if (config.colors.length <= 2) return;
    const newColors = config.colors.filter(c => c.id !== id);
    updateConfig({ colors: newColors });
  };

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingId || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    let position = ((clientX - rect.left) / rect.width) * 100;
    position = Math.max(0, Math.min(100, position));
    position = Math.round(position);

    const newColors = config.colors.map(c =>
      c.id === draggingId ? { ...c, position } : c
    );
    updateConfig({ colors: newColors });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const sortedColors = [...config.colors].sort((a, b) => a.position - b.position);

  return (
    <div className="control-panel">
      <div className="panel-section">
        <label className="panel-label">渐变类型</label>
        <select className="panel-select" value={config.type} onChange={handleTypeChange}>
          <option value="linear">线性渐变 (Linear)</option>
          <option value="radial">径向渐变 (Radial)</option>
          <option value="conic">圆锥渐变 (Conic)</option>
        </select>
      </div>

      <div className="panel-section">
        <label className="panel-label">主色调</label>
        <div className="color-pickers">
          {sortedColors.slice(0, 2).map((stop, index) => (
            <div key={stop.id} className="color-picker-wrapper">
              <span className="color-picker-label">{index === 0 ? '起始' : '结束'}</span>
              <input
                type="color"
                className="color-picker"
                value={stop.color}
                onChange={(e) => handleColorChange(config.colors.findIndex(c => c.id === stop.id), e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {config.type === 'linear' && (
        <div className="panel-section">
          <label className="panel-label">角度: {config.angle ?? 135}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={config.angle ?? 135}
            onChange={(e) => updateConfig({ angle: Number(e.target.value) })}
            className="panel-slider"
          />
        </div>
      )}

      {config.type === 'radial' && (
        <>
          <div className="panel-section">
            <label className="panel-label">形状</label>
            <div className="shape-toggle">
              <button
                className={`shape-btn ${config.shape === 'circle' ? 'active' : ''}`}
                onClick={() => updateConfig({ shape: 'circle' })}
              >
                圆形
              </button>
              <button
                className={`shape-btn ${config.shape === 'ellipse' ? 'active' : ''}`}
                onClick={() => updateConfig({ shape: 'ellipse' })}
              >
                椭圆
              </button>
            </div>
          </div>
          <div className="panel-section">
            <label className="panel-label">中心 X: {config.centerX ?? 50}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.centerX ?? 50}
              onChange={(e) => updateConfig({ centerX: Number(e.target.value) })}
              className="panel-slider"
            />
          </div>
          <div className="panel-section">
            <label className="panel-label">中心 Y: {config.centerY ?? 50}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.centerY ?? 50}
              onChange={(e) => updateConfig({ centerY: Number(e.target.value) })}
              className="panel-slider"
            />
          </div>
        </>
      )}

      {config.type === 'conic' && (
        <div className="panel-section">
          <label className="panel-label">起始角度: {config.startAngle ?? 0}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={config.startAngle ?? 0}
            onChange={(e) => updateConfig({ startAngle: Number(e.target.value) })}
            className="panel-slider"
          />
        </div>
      )}

      <div className="panel-section">
        <div className="stops-header">
          <label className="panel-label">颜色节点 ({config.colors.length}/7)</label>
          <button
            className="add-stop-btn"
            onClick={addColorStop}
            disabled={config.colors.length >= 7}
            aria-label="添加颜色节点"
          >
            +
          </button>
        </div>

        <div
          className="stops-slider"
          ref={sliderRef}
          onMouseMove={draggingId ? handleDrag : undefined}
          onMouseUp={draggingId ? handleDragEnd : undefined}
          onMouseLeave={draggingId ? handleDragEnd : undefined}
          onTouchMove={draggingId ? handleDrag : undefined}
          onTouchEnd={handleDragEnd}
        >
          <div className="stops-track" />
          {sortedColors.map((stop) => (
            <div
              key={stop.id}
              className={`color-stop-dot ${draggingId === stop.id ? 'dragging' : ''}`}
              style={{ left: `${stop.position}%`, backgroundColor: stop.color }}
              onMouseDown={() => handleDragStart(stop.id)}
              onTouchStart={() => handleDragStart(stop.id)}
              onDoubleClick={() => removeColorStop(stop.id)}
              title="拖拽调整位置，双击删除"
            >
              <input
                type="color"
                className="stop-color-input"
                value={stop.color}
                onChange={(e) => {
                  const idx = config.colors.findIndex(c => c.id === stop.id);
                  handleColorChange(idx, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
        <div className="stops-hint">点击圆点内方块改色，拖拽调整位置，双击删除</div>
      </div>
    </div>
  );
};

export default ControlPanel;
