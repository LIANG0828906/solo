import React, { useRef } from 'react';
import type { CanvasComponent, CanvasText } from '../utils/componentRenderer';
import './AdjustPanel.css';

interface AdjustPanelProps {
  selectedComponent: CanvasComponent | null;
  canvasText: CanvasText | null;
  textMode: boolean;
  onUpdateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  onUpdateText: (updates: Partial<CanvasText>) => void;
  onDeleteComponent: (id: string) => void;
}

const presetColors = [
  '#FF80AB', '#FF5252', '#FFD700', '#81C784',
  '#64B5F6', '#BA68C8', '#4DD0E1', '#FFB74D',
  '#333333', '#757575', '#FFFFFF', '#C2185B'
];

const AdjustPanel: React.FC<AdjustPanelProps> = ({
  selectedComponent,
  canvasText,
  textMode,
  onUpdateComponent,
  onUpdateText,
  onDeleteComponent
}) => {
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const textColorPickerRef = useRef<HTMLInputElement>(null);
  const rotationRef = useRef<{ startAngle: number; startRotation: number } | null>(null);

  const handleRotationStart = (e: React.MouseEvent) => {
    if (!selectedComponent) return;
    e.preventDefault();
    const knob = e.currentTarget as HTMLElement;
    const rect = knob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    rotationRef.current = {
      startAngle: angle,
      startRotation: selectedComponent.rotation
    };

    const handleMove = (moveEvent: MouseEvent) => {
      if (!rotationRef.current || !selectedComponent) return;
      const newAngle =
        Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
      const delta = newAngle - rotationRef.current.startAngle;
      const newRotation = rotationRef.current.startRotation + delta;
      onUpdateComponent(selectedComponent.id, { rotation: newRotation });
    };

    const handleUp = () => {
      rotationRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const activeTarget = textMode ? 'text' : selectedComponent;

  return (
    <div className="adjust-panel">
      <h3 className="adjust-panel-title">调整面板</h3>

      {!activeTarget ? (
        <div className="adjust-empty">
          <p>请选择画布上的组件</p>
          <p className="adjust-hint">或在下方输入文字</p>
        </div>
      ) : (
        <div className="adjust-content">
          {selectedComponent && !textMode && (
            <>
              <div className="adjust-section">
                <label className="adjust-label">颜色</label>
                <div className="color-picker-wrap">
                  <div
                    className="color-dot"
                    style={{ background: selectedComponent.color }}
                    onClick={() => colorPickerRef.current?.click()}
                  />
                  <input
                    ref={colorPickerRef}
                    type="color"
                    value={selectedComponent.color}
                    onChange={(e) =>
                      onUpdateComponent(selectedComponent.id, { color: e.target.value })
                    }
                    className="color-picker-hidden"
                  />
                </div>
                <div className="color-presets">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      className={`color-preset ${selectedComponent.color === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => onUpdateComponent(selectedComponent.id, { color: c })}
                    />
                  ))}
                </div>
              </div>

              <div className="adjust-section">
                <label className="adjust-label">
                  大小：<span className="adjust-value">{selectedComponent.scale.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.1"
                  value={selectedComponent.scale}
                  onChange={(e) =>
                    onUpdateComponent(selectedComponent.id, {
                      scale: parseFloat(e.target.value)
                    })
                  }
                  className="adjust-slider"
                />
              </div>

              <div className="adjust-section">
                <label className="adjust-label">
                  旋转：<span className="adjust-value">{Math.round(selectedComponent.rotation)}°</span>
                </label>
                <div className="rotation-wrap">
                  <div
                    className="rotation-knob"
                    onMouseDown={handleRotationStart}
                    style={{ transform: `rotate(${selectedComponent.rotation}deg)` }}
                  >
                    <div className="knob-indicator" />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedComponent.rotation}
                    onChange={(e) =>
                      onUpdateComponent(selectedComponent.id, {
                        rotation: parseFloat(e.target.value)
                      })
                    }
                    className="adjust-slider"
                  />
                </div>
              </div>

              <button
                className="delete-component-btn ripple-btn"
                onClick={() => onDeleteComponent(selectedComponent.id)}
              >
                🗑️ 删除组件
              </button>
            </>
          )}

          {textMode && canvasText && (
            <>
              <div className="adjust-section">
                <label className="adjust-label">文字颜色</label>
                <div className="color-picker-wrap">
                  <div
                    className="color-dot"
                    style={{ background: canvasText.color }}
                    onClick={() => textColorPickerRef.current?.click()}
                  />
                  <input
                    ref={textColorPickerRef}
                    type="color"
                    value={canvasText.color}
                    onChange={(e) => onUpdateText({ color: e.target.value })}
                    className="color-picker-hidden"
                  />
                </div>
                <div className="color-presets">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      className={`color-preset ${canvasText.color === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => onUpdateText({ color: c })}
                    />
                  ))}
                </div>
              </div>

              <div className="adjust-section">
                <label className="adjust-label">
                  字体大小：<span className="adjust-value">{canvasText.fontSize}px</span>
                </label>
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={canvasText.fontSize}
                  onChange={(e) =>
                    onUpdateText({ fontSize: parseInt(e.target.value) })
                  }
                  className="adjust-slider"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdjustPanel;
