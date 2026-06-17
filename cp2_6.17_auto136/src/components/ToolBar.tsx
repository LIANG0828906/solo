import { useState, useRef } from 'react';
import { Undo2, Redo2, Palette, GalleryVerticalEnd, FilePlus, Save } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { PRESET_COLORS, BLEND_MODES } from '@/types';
import type { BlendMode } from '@/types';

interface ToolBarProps {
  onRequestSave: () => void;
}

export default function ToolBar({ onRequestSave }: ToolBarProps) {
  const {
    brush,
    setBrushColor,
    setBrushSize,
    setBlendMode,
    undo,
    redo,
    undoStack,
    redoStack,
    toggleGallery,
    newDoodle,
    isSaving,
    strokes,
  } = useCanvasStore();

  const [showCustomColor, setShowCustomColor] = useState(false);
  const customColorRef = useRef<HTMLInputElement>(null);

  const handleCustomColorClick = () => {
    if (!showCustomColor) {
      setShowCustomColor(true);
      setTimeout(() => customColorRef.current?.focus(), 0);
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      setBrushColor(v);
    }
  };

  const handleHexInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const v = (e.target as HTMLInputElement).value.trim();
      if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
        setBrushColor(v);
        setShowCustomColor(false);
      }
    }
  };

  return (
    <header className="toolbar">
      <div className="toolbar-inner">
        <div className="toolbar-logo">
          <Palette size={22} />
          <span>FlowScape</span>
        </div>

        <div className="toolbar-section">
          <div className="section-label">颜色</div>
          <div className="color-palette">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`color-swatch ${brush.color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setBrushColor(c)}
                title={c}
              />
            ))}
            <div className="color-custom-wrap" onClick={handleCustomColorClick}>
              <div
                className={`color-swatch custom ${showCustomColor ? 'active' : ''}`}
                style={{
                  background: /^#[0-9A-Fa-f]{6}$/.test(brush.color) && !PRESET_COLORS.includes(brush.color)
                    ? brush.color
                    : 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                }}
              />
              {showCustomColor && (
                <input
                  ref={customColorRef}
                  type="text"
                  className="hex-input"
                  maxLength={7}
                  placeholder="#RRGGBB"
                  defaultValue={PRESET_COLORS.includes(brush.color) ? '' : brush.color}
                  onChange={handleCustomColorChange}
                  onKeyDown={handleHexInput}
                  onBlur={() => setTimeout(() => setShowCustomColor(false), 150)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="toolbar-section">
          <div className="section-label">粗细 {brush.size}px</div>
          <input
            type="range"
            min={1}
            max={50}
            value={brush.size}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="size-slider"
          />
        </div>

        <div className="toolbar-section">
          <div className="section-label">混合</div>
          <select
            className="blend-select"
            value={brush.blendMode}
            onChange={(e) => setBlendMode(e.target.value as BlendMode)}
          >
            {BLEND_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-divider" />

        <div className="toolbar-actions">
          <button
            className="tool-btn"
            onClick={undo}
            disabled={undoStack.length === 0}
            title="撤销"
          >
            <Undo2 size={18} />
          </button>
          <button
            className="tool-btn"
            onClick={redo}
            disabled={redoStack.length === 0}
            title="重做"
          >
            <Redo2 size={18} />
          </button>
          <button
            className="tool-btn"
            onClick={newDoodle}
            title="新建"
          >
            <FilePlus size={18} />
          </button>
          <button
            className="tool-btn primary"
            onClick={onRequestSave}
            disabled={isSaving || strokes.length === 0}
            title="保存"
          >
            <Save size={18} />
            {isSaving && <span className="save-text">保存中</span>}
          </button>
          <button className="tool-btn" onClick={toggleGallery} title="画廊">
            <GalleryVerticalEnd size={18} />
          </button>
        </div>
      </div>

      <style>{`
        .toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          z-index: 100;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          animation: toolbarSlide 0.4s ease;
        }
        @keyframes toolbarSlide {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .toolbar-inner {
          height: 100%;
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 0 20px;
          overflow-x: auto;
        }
        .toolbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 17px;
          letter-spacing: 0.3px;
          white-space: nowrap;
          background: linear-gradient(135deg, #5eead4, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }
        .section-label {
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
        }
        .color-palette {
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
        }
        .color-swatch {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          padding: 0;
          flex-shrink: 0;
        }
        .color-swatch:hover {
          transform: scale(1.05);
          border-color: rgba(255, 255, 255, 0.35);
        }
        .color-swatch.active {
          border-color: #fff;
          box-shadow: 0 0 0 2px rgba(94, 234, 212, 0.4), 0 0 12px rgba(94, 234, 212, 0.3);
        }
        .color-swatch.custom {
          background-size: contain;
        }
        .color-custom-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .hex-input {
          position: absolute;
          left: 0;
          top: calc(100% + 8px);
          width: 110px;
          padding: 7px 10px;
          font-size: 12px;
          font-family: 'Outfit', monospace;
          background: rgba(20, 20, 35, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: #fff;
          outline: none;
          z-index: 10;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .hex-input:focus {
          border-color: #5eead4;
        }
        .size-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 120px;
          height: 6px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.15);
          outline: none;
          transition: transform 0.2s ease;
          cursor: pointer;
        }
        .size-slider:hover {
          transform: scale(1.05);
        }
        .size-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5eead4, #818cf8);
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(94, 234, 212, 0.4);
          cursor: pointer;
        }
        .size-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5eead4, #818cf8);
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(94, 234, 212, 0.4);
          cursor: pointer;
        }
        .blend-select {
          padding: 7px 12px;
          font-size: 12px;
          font-family: 'Outfit', sans-serif;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          color: #fff;
          outline: none;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .blend-select:hover {
          transform: scale(1.05);
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.12);
        }
        .blend-select option {
          background: #1a1a2e;
          color: #fff;
        }
        .toolbar-divider {
          width: 1px;
          height: 28px;
          background: rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }
        .toolbar-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }
        .tool-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 12px;
          font-size: 13px;
          font-family: 'Outfit', sans-serif;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
          white-space: nowrap;
        }
        .tool-btn:hover:not(:disabled) {
          transform: scale(1.05);
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .tool-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .tool-btn.primary {
          background: linear-gradient(135deg, rgba(94, 234, 212, 0.2), rgba(129, 140, 248, 0.2));
          border-color: rgba(94, 234, 212, 0.35);
        }
        .tool-btn.primary:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(94, 234, 212, 0.32), rgba(129, 140, 248, 0.32));
        }
        .save-text {
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>
    </header>
  );
}
