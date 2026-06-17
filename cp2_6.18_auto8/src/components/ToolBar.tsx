import { useState, useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { BlendMode } from '../types';

const blendModeOptions: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' }
];

export default function ToolBar() {
  const {
    brushSettings,
    setColor,
    setSize,
    setBlendMode,
    undo,
    redo,
    clearCanvas,
    toggleGallery,
    undoStack,
    redoStack,
    presetColors
  } = useCanvasStore();

  const [customColor, setCustomColor] = useState(brushSettings.color);
  const [showCustomColor, setShowCustomColor] = useState(false);
  const [cssInjected, setCssInjected] = useState(false);

  useEffect(() => {
    if (cssInjected) return;
    const css = `
      .fs-color-swatch {
        width: 24px; height: 24px; border-radius: 8px; cursor: pointer;
        border: 2px solid transparent; padding: 0;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      }
      .fs-color-swatch:hover {
        transform: scale(1.08);
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
      }
      .fs-color-swatch.active {
        border-color: #fff;
      }
      .fs-slider {
        width: 140px; height: 4px; border-radius: 8px;
        -webkit-appearance: none; appearance: none;
        background: rgba(255,255,255,0.2);
        outline: none; cursor: pointer;
        transition: transform 0.2s ease;
      }
      .fs-slider:hover { transform: scale(1.02); }
      .fs-slider::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 16px; height: 16px; border-radius: 50%;
        background: #4ECDC4; cursor: pointer;
        border: 2px solid #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        transition: transform 0.15s ease;
      }
      .fs-slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
      .fs-slider::-moz-range-thumb {
        width: 16px; height: 16px; border-radius: 50%;
        background: #4ECDC4; cursor: pointer; border: 2px solid #fff;
      }
      .fs-select {
        padding: 6px 12px; border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.08); color: #fff;
        font-size: 13px; outline: none; cursor: pointer;
        transition: transform 0.2s ease, border-color 0.2s ease;
      }
      .fs-select:hover {
        transform: scale(1.05);
        border-color: #4ECDC4;
      }
      .fs-action-btn {
        width: 36px; height: 36px; border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.06); color: #fff;
        cursor: pointer; display: flex;
        align-items: center; justify-content: center;
        transition: all 0.2s ease;
      }
      .fs-action-btn:hover:not(:disabled) {
        background: rgba(255,255,255,0.18);
        transform: scale(1.08);
        border-color: rgba(78, 205, 196, 0.5);
      }
      .fs-gallery-btn {
        padding: 8px 16px; border-radius: 8px; border: none;
        background: linear-gradient(135deg, #4ECDC4, #45B7D1);
        color: #fff; font-size: 13px; font-weight: 600;
        cursor: pointer; display: flex; align-items: center;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(78, 205, 196, 0.3);
      }
      .fs-gallery-btn:hover {
        transform: scale(1.06);
        box-shadow: 0 4px 16px rgba(78, 205, 196, 0.5);
      }
    `;
    const style = document.createElement('style');
    style.setAttribute('data-fs-toolbar', 'true');
    style.textContent = css;
    document.head.appendChild(style);
    setCssInjected(true);
  }, [cssInjected]);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomColor(val);
    setColor(val);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (hexRegex.test(val)) {
      setCustomColor(val);
      setColor(val);
    }
  };

  return (
    <div style={styles.toolbar}>
      <div style={styles.logoContainer}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ marginRight: 8 }}>
          <path d="M4 20 L12 8 L16 16 L24 4" stroke="#4ECDC4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="4" r="2.5" fill="#FF6B6B" />
        </svg>
        <span style={styles.logoText}>FlowScape</span>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <span style={styles.sectionLabel}>颜色</span>
        <div style={styles.presetColors}>
          {presetColors.map((color) => (
            <button
              key={color}
              className={`fs-color-swatch ${brushSettings.color === color ? 'active' : ''}`}
              style={{ background: color }}
              onClick={() => { setColor(color); setCustomColor(color); }}
              title={color}
            />
          ))}
          <button
            className={`fs-color-swatch ${showCustomColor ? 'active' : ''}`}
            style={{
              background: `linear-gradient(135deg, #FF6B6B 25%, #4ECDC4 25%, #4ECDC4 50%, #FF6B6B 50%, #FF6B6B 75%, #4ECDC4 75%)`,
              backgroundSize: '12px 12px'
            }}
            onClick={() => setShowCustomColor(!showCustomColor)}
            title="自定义颜色"
          />
        </div>
        {showCustomColor && (
          <div style={styles.customColorRow}>
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              style={styles.colorPicker}
            />
            <input
              type="text"
              value={customColor}
              onChange={handleHexInput}
              style={styles.hexInput}
              placeholder="#RRGGBB"
              maxLength={7}
            />
          </div>
        )}
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <span style={styles.sectionLabel}>粗细 {brushSettings.size}px</span>
        <div style={styles.sliderContainer}>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSettings.size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="fs-slider"
          />
          <div
            style={{
              width: Math.min(40, brushSettings.size * 1.2),
              height: Math.min(40, brushSettings.size * 1.2),
              borderRadius: '50%',
              background: brushSettings.color,
              marginLeft: 12,
              flexShrink: 0,
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}
          />
        </div>
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <span style={styles.sectionLabel}>混合</span>
        <select
          value={brushSettings.blendMode}
          onChange={(e) => setBlendMode(e.target.value as BlendMode)}
          className="fs-select"
        >
          {blendModeOptions.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: '#16213E' }}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div style={styles.divider} />

      <div style={styles.actionGroup}>
        <button
          className="fs-action-btn"
          onClick={undo}
          disabled={undoStack.length === 0}
          style={{ opacity: undoStack.length === 0 ? 0.4 : 1 }}
          title="撤销 (Ctrl+Z)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3L3 13" />
          </svg>
        </button>
        <button
          className="fs-action-btn"
          onClick={redo}
          disabled={redoStack.length === 0}
          style={{ opacity: redoStack.length === 0 ? 0.4 : 1 }}
          title="重做 (Ctrl+Y)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3L21 13" />
          </svg>
        </button>
        <button className="fs-action-btn" onClick={clearCanvas} title="清空画布 (Ctrl+K)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1 }} />

      <button className="fs-gallery-btn" onClick={toggleGallery} title="打开画廊 (Ctrl+G)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        画廊
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: 16,
    zIndex: 1000,
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    overflowX: 'auto'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.5,
    background: 'linear-gradient(135deg, #4ECDC4, #FF6B6B)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  divider: {
    width: 1,
    height: 32,
    background: 'rgba(255,255,255,0.12)',
    flexShrink: 0
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
    flexShrink: 0
  },
  sectionLabel: {
    fontSize: 10,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  presetColors: {
    display: 'flex',
    gap: 6
  },
  customColorRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginTop: 4
  },
  colorPicker: {
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    padding: 0,
    background: 'transparent'
  },
  hexInput: {
    width: 84,
    padding: '4px 8px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    outline: 'none'
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  actionGroup: {
    display: 'flex',
    gap: 6,
    flexShrink: 0
  }
};
