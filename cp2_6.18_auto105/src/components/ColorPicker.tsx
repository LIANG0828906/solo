import React, { useState, useCallback } from 'react';
import { usePaletteStore } from '../store';
import { isValidHex } from '../utils/colorUtils';

type ErrorType = 'empty' | 'invalid' | 'format' | null;

export const ColorPicker: React.FC = () => {
  const { baseColor, setBaseColor } = usePaletteStore();
  const [inputValue, setInputValue] = useState(baseColor);
  const [error, setError] = useState<ErrorType>(null);
  const [showError, setShowError] = useState(false);

  const normalizeHex = useCallback((hex: string): string | null => {
    if (!hex || hex.trim() === '') {
      return null;
    }

    let normalized = hex.trim().toUpperCase();

    if (!normalized.startsWith('#')) {
      normalized = '#' + normalized;
    }

    if (!isValidHex(normalized)) {
      return null;
    }

    if (normalized.length === 4) {
      normalized =
        '#' +
        normalized[1] +
        normalized[1] +
        normalized[2] +
        normalized[2] +
        normalized[3] +
        normalized[3];
    }

    return normalized;
  }, []);

  const validateInput = useCallback((value: string): ErrorType => {
    if (!value || value.trim() === '') {
      return 'empty';
    }

    const trimmed = value.trim();

    if (!trimmed.startsWith('#') && !/^[A-Fa-f0-9]{3,6}$/.test(trimmed)) {
      return 'format';
    }

    if (trimmed.startsWith('#') && trimmed.length === 1) {
      return 'format';
    }

    const normalized = normalizeHex(value);
    if (!normalized) {
      return 'invalid';
    }

    return null;
  }, [normalizeHex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value === '' || value === '#') {
      setError('empty');
      setShowError(false);
      return;
    }

    const validationError = validateInput(value);
    setError(validationError);

    if (validationError === null) {
      const normalized = normalizeHex(value);
      if (normalized) {
        setBaseColor(normalized);
        setShowError(false);
      }
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInputValue(value);
    setError(null);
    setShowError(false);
    setBaseColor(value);
  };

  const handleBlur = () => {
    const validationError = validateInput(inputValue);
    setError(validationError);

    if (validationError !== null) {
      setShowError(true);
      setTimeout(() => {
        setInputValue(baseColor);
        setError(null);
        setShowError(false);
      }, 1500);
    } else {
      const normalized = normalizeHex(inputValue);
      if (normalized) {
        setInputValue(normalized);
        setBaseColor(normalized);
      }
    }
  };

  const handleFocus = () => {
    setShowError(false);
  };

  const getErrorMessage = (err: ErrorType): string => {
    switch (err) {
      case 'empty':
        return '请输入颜色值';
      case 'invalid':
        return '无效的十六进制颜色';
      case 'format':
        return '格式错误，应为#RRGGBB';
      default:
        return '';
    }
  };

  const hasError = error !== null && showError;

  return (
    <div className="color-picker">
      <label className="color-picker-label">基础颜色</label>
      <div className="color-picker-wrapper">
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
          <div className="input-wrapper">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              className={`color-picker-text ${hasError ? 'invalid' : error !== null && !showError ? 'warning' : ''}`}
              placeholder="#FF6B35"
              maxLength={7}
            />
            {hasError && (
              <div className="error-tooltip">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {getErrorMessage(error)}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .color-picker {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .color-picker-wrapper {
          position: relative;
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
          flex-shrink: 0;
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
        .input-wrapper {
          position: relative;
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
        .color-picker-text::placeholder {
          color: #64748B;
          text-transform: none;
        }
        .color-picker-text:focus {
          border-color: #FF6B35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.25);
        }
        .color-picker-text.warning {
          border-color: #F59E0B;
        }
        .color-picker-text.invalid {
          border-color: #EF4444;
          animation: shake 0.3s ease;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .error-tooltip {
          position: absolute;
          top: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background-color: #EF4444;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 500;
          border-radius: 6px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          animation: fadeIn 0.2s ease;
          z-index: 1000;
        }
        .error-tooltip::before {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-bottom-color: #EF4444;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
