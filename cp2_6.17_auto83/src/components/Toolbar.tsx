import React, { useRef, useState, useEffect } from 'react';
import { usePixelStore } from '../pixelBoard/store';
import { isValidHexColor } from '../pixelBoard/types';

interface ToolbarProps {
  onUndo: () => void;
  onSave: () => void;
  onLoad: (file: File) => void;
  isLoading: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onUndo, onSave, onLoad, isLoading }) => {
  const { currentColor, setCurrentColor, presetColors, onlineUsers, redoStack } = usePixelStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customColor, setCustomColor] = useState(currentColor);
  const [colorError, setColorError] = useState(false);
  const lastValidColor = useRef(currentColor);

  useEffect(() => {
    setCustomColor(currentColor);
    lastValidColor.current = currentColor;
    setColorError(false);
  }, [currentColor]);

  const handleColorClick = (color: string) => {
    setCurrentColor(color);
    setColorError(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomColor(value);

    if (value === '') {
      setColorError(false);
      return;
    }

    if (isValidHexColor(value)) {
      setColorError(false);
      lastValidColor.current = value;
      setCurrentColor(value);
    } else if (value.length >= 7) {
      setColorError(true);
    } else {
      setColorError(false);
    }
  };

  const handleCustomColorBlur = () => {
    if (customColor === '' || !isValidHexColor(customColor)) {
      setCustomColor(lastValidColor.current);
      setColorError(false);
    }
  };

  const handleCustomColorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isValidHexColor(customColor)) {
        lastValidColor.current = customColor;
        setCurrentColor(customColor);
        setColorError(false);
      } else {
        setColorError(true);
        setTimeout(() => {
          setCustomColor(lastValidColor.current);
          setColorError(false);
        }, 1000);
      }
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleNativeColorPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setCurrentColor(color);
    lastValidColor.current = color;
    setColorError(false);
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoad(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-title">PixelPalette</div>
      
      <div className="toolbar-section">
        <div className="color-palette">
          {presetColors.map((color, index) => (
            <button
              key={index}
              className={`color-swatch ${currentColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorClick(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-section toolbar-custom-color">
        <div className="custom-color-label">自定义</div>
        <div className="custom-color-input-wrapper">
          <input
            type="text"
            className={`custom-color-input ${colorError ? 'error' : ''}`}
            value={customColor}
            onChange={handleCustomColorChange}
            onBlur={handleCustomColorBlur}
            onKeyDown={handleCustomColorKeyDown}
            placeholder="#FFFFFF"
            maxLength={7}
          />
          <input
            type="color"
            className="custom-color-picker"
            value={currentColor}
            onChange={handleNativeColorPick}
          />
        </div>
        {colorError && <div className="color-error-msg">无效颜色</div>}
      </div>

      <div className="toolbar-section">
        <button
          className="toolbar-btn undo-btn"
          onClick={onUndo}
          disabled={redoStack.length === 0}
          title="撤回"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
          </svg>
        </button>
      </div>

      <div className="toolbar-section">
        <button className="toolbar-btn save-btn" onClick={onSave} title="保存为PNG">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
        <button
          className="toolbar-btn load-btn"
          onClick={handleLoadClick}
          title="加载PNG"
          disabled={isLoading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <div className="toolbar-user-count">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>{onlineUsers}</span>
      </div>

      <div className="toolbar-current-color">
        <div
          className="current-color-swatch"
          style={{ backgroundColor: currentColor }}
        />
        <span className="current-color-label">{currentColor}</span>
      </div>

      {isLoading && (
        <div className="loading-progress">
          <div className="loading-progress-bar" />
        </div>
      )}
    </div>
  );
};
