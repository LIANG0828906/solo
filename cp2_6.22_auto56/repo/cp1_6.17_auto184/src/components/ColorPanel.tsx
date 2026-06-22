import React, { useState, useRef, useEffect } from 'react';
import { useArtworkStore } from '@/store/artworkStore';
import { PRESET_COLORS } from '@/types';
import './ColorPanel.css';

const ColorPanel: React.FC = () => {
  const selectedColor = useArtworkStore((state) => state.selectedColor);
  const setSelectedColor = useArtworkStore((state) => state.setSelectedColor);
  const selectedShapeId = useArtworkStore((state) => state.selectedShapeId);
  const deleteShape = useArtworkStore((state) => state.deleteShape);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const [showPicker, setShowPicker] = useState(false);

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
  };

  const handleCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(e.target.value);
  };

  const handleDeleteShape = () => {
    if (selectedShapeId) {
      deleteShape(selectedShapeId);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showPicker && colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  return (
    <div className="color-panel">
      <h3 className="panel-title">调色板</h3>
      
      <div className="preset-colors">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorClick(color)}
            title={color}
          />
        ))}
      </div>

      <div className="custom-color-section" ref={colorPickerRef}>
        <button
          className={`custom-color-btn ${showPicker ? 'active' : ''}`}
          onClick={() => setShowPicker(!showPicker)}
        >
          <div className="color-preview" style={{ backgroundColor: selectedColor }} />
          <span>自定义颜色</span>
        </button>
        
        {showPicker && (
          <div className="color-picker-popup">
            <input
              type="color"
              value={selectedColor}
              onChange={handleCustomColor}
              className="color-input"
            />
            <div className="color-value">{selectedColor.toUpperCase()}</div>
          </div>
        )}
      </div>

      {selectedShapeId && (
        <div className="shape-actions">
          <div className="current-color-info">
            <span className="label">当前形状颜色</span>
            <div className="color-display" style={{ backgroundColor: selectedColor }}>
              {selectedColor.toUpperCase()}
            </div>
          </div>
          <button className="delete-shape-btn" onClick={handleDeleteShape}>
            删除选中形状
          </button>
        </div>
      )}

      {!selectedShapeId && (
        <div className="hint-text">
          选中形状后可更改颜色
        </div>
      )}
    </div>
  );
};

export default ColorPanel;
