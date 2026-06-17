import React, { useState, useRef, useEffect } from 'react';
import { useCanvasStore, ToolType } from '../store/useCanvasStore';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#000000',
  '#FFFFFF', '#7F8C8D', '#E74C3C', '#2ECC71',
];

interface ToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onUndo, onRedo, onExport }) => {
  const { tool, color, lineWidth, setTool, setColor, setLineWidth, canUndo, canRedo } = useCanvasStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSliderTooltip, setShowSliderTooltip] = useState(false);
  const [undoScale, setUndoScale] = useState(false);
  const [redoScale, setRedoScale] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLineWidth(Number(e.target.value));
    setShowSliderTooltip(true);
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowSliderTooltip(false);
    }, 1500);
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
            {COLORS.map((c) => (
              <button
                key={c}
                className="color-option"
                style={{ backgroundColor: c }}
                onClick={() => {
                  setColor(c);
                  setShowColorPicker(false);
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
        {showSliderTooltip && (
          <div className="slider-tooltip">{lineWidth}px</div>
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
          width: 160px;
          height: 160px;
          background: #2D2D3F;
          border-radius: 8px;
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          animation: fadeIn 0.1s ease;
          z-index: 100;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .color-option {
          width: 30px;
          height: 30px;
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
          animation: tooltipFade 1.5s ease forwards;
          pointer-events: none;
        }

        @keyframes tooltipFade {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
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
