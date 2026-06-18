import React, { useState } from 'react';
import { usePaletteStore } from '../store';
import { isValidHex } from '../utils/colorUtils';

export const ColorPicker: React.FC = () => {
  const { baseColor, setBaseColor } = usePaletteStore();
  const [inputValue, setInputValue] = useState(baseColor);
  const [isValid, setIsValid] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.startsWith('#') && isValidHex(value)) {
      setIsValid(true);
      setBaseColor(value.toUpperCase());
    } else if (value.length > 0 && !value.startsWith('#')) {
      setIsValid(false);
    } else if (value.length === 0) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInputValue(value);
    setIsValid(true);
    setBaseColor(value);
  };

  const handleBlur = () => {
    if (!isValidHex(inputValue)) {
      setInputValue(baseColor);
      setIsValid(true);
    }
  };

  return (
    <div className="color-picker">
      <label className="color-picker-label">基础颜色</label>
      <div className="color-picker-container">
        <div
          className="color-picker-preview"
          style={{ backgroundColor: baseColor }}
        >
          <input
            type="color"
            value={baseColor}
            onChange={handleColorPickerChange}
            className="color-picker-input"
            aria-label="选择颜色"
          />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={`color-picker-text ${!isValid ? 'invalid' : ''}`}
          placeholder="#FF6B35"
          maxLength={7}
        />
      </div>
      <style>{`
        .color-picker {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .color-picker-label {
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }
        .color-picker-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .color-picker-preview {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2),
                      0 4px 8px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .color-picker-preview:hover {
          transform: scale(1.05);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.25),
                      0 6px 12px rgba(0, 0, 0, 0.2);
        }
        .color-picker-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          border: none;
          padding: 0;
        }
        .color-picker-text {
          width: 100px;
          height: 40px;
          padding: 0 12px;
          border-radius: 8px;
          border: 2px solid #334155;
          background-color: #0F172A;
          color: #FFFFFF;
          font-size: 14px;
          font-family: 'Monaco', 'Consolas', monospace;
          font-weight: 600;
          text-transform: uppercase;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .color-picker-text:focus {
          border-color: #FF6B35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.25);
        }
        .color-picker-text.invalid {
          border-color: #EF4444;
        }
      `}</style>
    </div>
  );
};
