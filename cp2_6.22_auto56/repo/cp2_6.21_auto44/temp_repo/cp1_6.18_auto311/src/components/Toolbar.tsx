import React, { useEffect, useRef } from 'react';
import { useLayerStore } from '../store/layerStore';
import type { ShapeType } from '../types';
import { getShapeColor, getShapeIcon } from '../canvas/VectorTools';

const SHAPES: { type: ShapeType; label: string }[] = [
  { type: 'rect', label: '矩形' },
  { type: 'circle', label: '圆形' },
  { type: 'triangle', label: '三角形' },
  { type: 'star', label: '星形' }
];

export const Toolbar: React.FC = () => {
  const rafId = useRef<number | null>(null);
  const pendingUpdate = useRef<{ id: string; transform: { opacity?: number; rotation?: number; blur?: number } } | null>(null);

  const {
    currentTool,
    currentColor,
    selectedLayerId,
    layers,
    setTool,
    setColor,
    updateLayerTransform,
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    exportToSVG
  } = useLayerStore();

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const scheduleTransformUpdate = (transform: { opacity?: number; rotation?: number; blur?: number }) => {
    if (!selectedLayerId) return;
    
    pendingUpdate.current = {
      id: selectedLayerId,
      transform: {
        ...pendingUpdate.current?.transform,
        ...transform
      }
    };

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        if (pendingUpdate.current) {
          updateLayerTransform(pendingUpdate.current.id, pendingUpdate.current.transform);
          pendingUpdate.current = null;
        }
        rafId.current = null;
      });
    }
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    scheduleTransformUpdate({ opacity: value });
  };

  const handleOpacityCommit = () => {
    saveToHistory();
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const clamped = Math.max(-180, Math.min(180, value));
    scheduleTransformUpdate({ rotation: clamped });
  };

  const handleRotationCommit = () => {
    saveToHistory();
  };

  const handleBlurChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const clamped = Math.max(0, Math.min(20, value));
    scheduleTransformUpdate({ blur: clamped });
  };

  const handleBlurCommit = () => {
    saveToHistory();
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setColor(color);
    if (selectedLayerId) {
      useLayerStore.getState().updateLayer(selectedLayerId, { color }, false);
      saveToHistory();
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <div className="shape-buttons">
          {SHAPES.map(({ type, label }) => (
            <button
              key={type}
              className={`shape-btn ${currentTool === type ? 'active' : ''}`}
              onClick={() => setTool(type)}
              title={label}
              style={{ backgroundColor: getShapeColor(type) }}
            >
              <span className="material-icons">{getShapeIcon(type)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="color-picker-wrapper">
          <label className="toolbar-label">颜色</label>
          <input
            type="color"
            className="color-picker"
            value={currentColor}
            onChange={handleColorChange}
            title="选择颜色"
          />
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="opacity-control">
          <label className="toolbar-label">透明度</label>
          <input
            type="range"
            className="opacity-slider"
            min="0.1"
            max="1.0"
            step="0.1"
            value={selectedLayer?.transform.opacity ?? 1.0}
            onChange={handleOpacityChange}
            onMouseUp={handleOpacityCommit}
            onTouchEnd={handleOpacityCommit}
            disabled={!selectedLayer}
          />
          <span className="opacity-value">
            {Math.round((selectedLayer?.transform.opacity ?? 1.0) * 100)}%
          </span>
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <div className="number-input-group">
          <label className="toolbar-label">旋转</label>
          <input
            type="number"
            className="number-input"
            min="-180"
            max="180"
            step="1"
            value={selectedLayer?.transform.rotation ?? 0}
            onChange={handleRotationChange}
            onBlur={handleRotationCommit}
            disabled={!selectedLayer}
          />
          <span className="input-unit">°</span>
        </div>

        <div className="number-input-group">
          <label className="toolbar-label">模糊</label>
          <input
            type="number"
            className="number-input"
            min="0"
            max="20"
            step="1"
            value={selectedLayer?.transform.blur ?? 0}
            onChange={handleBlurChange}
            onBlur={handleBlurCommit}
            disabled={!selectedLayer}
          />
          <span className="input-unit">px</span>
        </div>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={undo}
          disabled={!canUndo()}
          title="撤销 (Ctrl+Z)"
        >
          <span className="material-icons">undo</span>
        </button>
        <button
          className="toolbar-btn"
          onClick={redo}
          disabled={!canRedo()}
          title="重做 (Ctrl+Y)"
        >
          <span className="material-icons">redo</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          className="toolbar-btn export-btn"
          onClick={exportToSVG}
          title="导出SVG"
        >
          <span className="material-icons">download</span>
          <span>导出SVG</span>
        </button>
      </div>
    </div>
  );
};
