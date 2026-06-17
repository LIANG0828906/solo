import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCanvasStore, ToolType } from '../store/useCanvasStore';

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

const DEFAULT_COLOR_SCHEME: ColorScheme = {
  primary: '#6C63FF',
  secondary: '#FF6B6B',
  accent: '#4ECDC4',
  background: '#1E1E2E',
  text: '#FFFFFF',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.min(255, Math.max(0, Math.round(x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function generateAnalogousColors(baseColor: string, count: number): string[] {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return Array(count).fill(baseColor);
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i - (count - 1) / 2) * 0.15;
    colors.push(
      rgbToHex(
        rgb.r + t * 255,
        rgb.g + t * 255,
        rgb.b + t * 255
      )
    );
  }
  return colors;
}

function generateSaturationVariants(baseColor: string, count: number): string[] {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return Array(count).fill(baseColor);
  const gray = (rgb.r + rgb.g + rgb.b) / 3;
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    colors.push(
      rgbToHex(
        gray + (rgb.r - gray) * t,
        gray + (rgb.g - gray) * t,
        gray + (rgb.b - gray) * t
      )
    );
  }
  return colors;
}

function generateColorPalette(scheme: ColorScheme): string[] {
  const palette: string[] = [];

  palette.push(...generateAnalogousColors(scheme.primary, 8));
  palette.push(...generateAnalogousColors(scheme.secondary, 8));
  palette.push(...generateAnalogousColors(scheme.accent, 8));
  palette.push(...generateAnalogousColors(scheme.primary, 8).reverse());

  palette.push(...generateSaturationVariants('#FF0000', 8));
  palette.push(...generateSaturationVariants('#00FF00', 8));
  palette.push(...generateSaturationVariants('#0000FF', 8));
  palette.push(...generateSaturationVariants('#FFFF00', 8));

  for (let i = 0; i < 8; i++) {
    const v = Math.round((i / 7) * 255);
    palette.push(rgbToHex(v, v, v));
  }

  return palette.slice(0, 64);
}

export { DEFAULT_COLOR_SCHEME, generateColorPalette };

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onUndo, onRedo, onExport }) => {
  const { tool, color, lineWidth, setTool, setColor, setLineWidth, canUndo, canRedo } = useCanvasStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [sliderTooltipVisible, setSliderTooltipVisible] = useState(false);
  const [sliderTooltipOpacity, setSliderTooltipOpacity] = useState(0);
  const [undoScale, setUndoScale] = useState(false);
  const [redoScale, setRedoScale] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colorPalette = useMemo(() => {
    return generateColorPalette(DEFAULT_COLOR_SCHEME);
  }, []);

  const closeColorPicker = useCallback(() => {
    setShowColorPicker(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        closeColorPicker();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeColorPicker]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLineWidth(Number(e.target.value));
    setSliderTooltipVisible(true);
    setSliderTooltipOpacity(1);

    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    tooltipTimeoutRef.current = setTimeout(() => {
      setSliderTooltipOpacity(0);
    }, 1500);
  };

  const handleTooltipTransitionEnd = () => {
    if (sliderTooltipOpacity === 0) {
      setSliderTooltipVisible(false);
    }
  };

  const handleUndoClick = () => {
    setUndoScale(true);
    setTimeout(() => setUndoScale(false), 100);
    onUndo();
  };

  const handleRedoClick = () => {
    setRedoScale(true);
    setTimeout(() => setRedoScale(false), 100);
    onRedo();
  };

  const tools: { type: ToolType; label: string; icon: string }[] = [
    { type: 'brush', label: '画笔', icon: '✏️' },
    { type: 'airbrush', label: '喷枪', icon: '🎨' },
    { type: 'eraser', label: '橡皮擦', icon: '🧹' },
  ];

  return (
    <div className="toolbar">
      <button
        className="nav-btn undo-btn"
        onClick={handleUndoClick}
        disabled={!canUndo()}
        style={{ transform: undoScale ? 'scale(0.9)' : 'scale(1)' }}
      >
        ←
      </button>

      <div className="tool-buttons">
        {tools.map((t) => (
          <button
            key={t.type}
            className={`tool-btn ${tool === t.type ? 'active' : ''}`}
            onClick={() => setTool(t.type)}
            title={t.label}
          >
            <span className="tool-icon">{t.icon}</span>
          </button>
        ))}
      </div>

      <div className="color-picker-wrapper" ref={colorPickerRef}>
        <button
          className="color-swatch"
          style={{ backgroundColor: color }}
          onClick={() => setShowColorPicker(!showColorPicker)}
        />
        {showColorPicker && (
          <div className="color-picker-panel">
            {colorPalette.map((c, idx) => (
              <button
                key={`${c}-${idx}`}
                className="color-option"
                style={{ backgroundColor: c }}
                onClick={() => {
                  setColor(c);
                  closeColorPicker();
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="slider-wrapper">
        <input
          type="range"
          className="line-width-slider"
          min="1"
          max="30"
          value={lineWidth}
          onChange={handleSliderChange}
        />
        {sliderTooltipVisible && (
          <div
            className="slider-tooltip"
            style={{ opacity: sliderTooltipOpacity }}
            onTransitionEnd={handleTooltipTransitionEnd}
          >
            {lineWidth}px
          </div>
        )}
      </div>

      <button
        className="nav-btn redo-btn"
        onClick={handleRedoClick}
        disabled={!canRedo()}
        style={{ transform: redoScale ? 'scale(0.9)' : 'scale(1)' }}
      >
        →
      </button>

      <button className="export-btn" onClick={onExport}>
        导出PNG
      </button>

      <style>{`
        .toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #2D2D3F;
          height: 56px;
          padding: 0 16px;
          border-radius: 8px;
          box-shadow: 0 2px 10px #00000033;
          flex-wrap: wrap;
          max-width: 800px;
          margin: 0 auto;
        }

        .nav-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: #3D3D52;
          color: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease, background-color 0.2s ease, filter 0.2s ease;
        }

        .nav-btn:hover:not(:disabled) {
          background: #4D4D62;
          filter: brightness(1.1);
        }

        .nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .tool-buttons {
          display: flex;
          gap: 4px;
        }

        .tool-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          color: #888;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tool-btn:hover {
          background: #3D3D52;
          transform: translateY(-1px);
        }

        .tool-btn.active {
          background: #6C63FF;
          color: #fff;
        }

        .tool-icon {
          font-size: 18px;
        }

        .color-picker-wrapper {
          position: relative;
        }

        .color-swatch {
          width: 32px;
          height: 32px;
          border: 2px solid #4A4A6E;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s ease, filter 0.2s ease;
        }

        .color-swatch:hover {
          transform: scale(1.1);
          filter: brightness(1.1);
        }

        .color-picker-panel {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          width: 280px;
          height: 280px;
          background: #2D2D3F;
          border-radius: 8px;
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          animation: fadeIn 0.1s ease;
          z-index: 100;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .color-option {
          width: 26px;
          height: 26px;
          border: 2px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .color-option:hover {
          transform: scale(1.15);
          border-color: #fff;
        }

        .slider-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .line-width-slider {
          width: 100px;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: #4A4A6E;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }

        .line-width-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #6C63FF;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .line-width-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .line-width-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #6C63FF;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }

        .slider-tooltip {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: #1A1A2E;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .export-btn {
          margin-left: auto;
          padding: 8px 16px;
          background: #6C63FF;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .export-btn:hover {
          background: #7B73FF;
          filter: brightness(1.15);
          transform: translateY(-1px);
        }

        @media (max-width: 900px) {
          .toolbar {
            max-width: 100%;
            justify-content: center;
          }
          .export-btn {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
};
