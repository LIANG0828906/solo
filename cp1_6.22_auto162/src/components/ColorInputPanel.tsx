import React, { useCallback } from 'react';

export interface ColorItem {
  id: string;
  hex: string;
}

interface ColorInputPanelProps {
  foregroundColors: ColorItem[];
  backgroundColors: ColorItem[];
  onForegroundChange: (colors: ColorItem[]) => void;
  onBackgroundChange: (colors: ColorItem[]) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

const ColorInputPanel: React.FC<ColorInputPanelProps> = ({
  foregroundColors,
  backgroundColors,
  onForegroundChange,
  onBackgroundChange,
}) => {
  const addColor = useCallback(
    (type: 'fg' | 'bg') => {
      const newColor: ColorItem = { id: generateId(), hex: '#000000' };
      if (type === 'fg') {
        onForegroundChange([...foregroundColors, newColor]);
      } else {
        onBackgroundChange([...backgroundColors, newColor]);
      }
    },
    [foregroundColors, backgroundColors, onForegroundChange, onBackgroundChange]
  );

  const removeColor = useCallback(
    (type: 'fg' | 'bg', id: string) => {
      if (type === 'fg') {
        onForegroundChange(foregroundColors.filter((c) => c.id !== id));
      } else {
        onBackgroundChange(backgroundColors.filter((c) => c.id !== id));
      }
    },
    [foregroundColors, backgroundColors, onForegroundChange, onBackgroundChange]
  );

  const updateColor = useCallback(
    (type: 'fg' | 'bg', id: string, hex: string) => {
      if (type === 'fg') {
        onForegroundChange(foregroundColors.map((c) => (c.id === id ? { ...c, hex } : c)));
      } else {
        onBackgroundChange(backgroundColors.map((c) => (c.id === id ? { ...c, hex } : c)));
      }
    },
    [foregroundColors, backgroundColors, onForegroundChange, onBackgroundChange]
  );

  const renderColorList = (
    label: string,
    colors: ColorItem[],
    type: 'fg' | 'bg'
  ) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#E0E0F0' }}>{label}</h3>
        <button
          onClick={() => addColor(type)}
          style={{
            background: '#6366F1',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#7C3AED')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
        >
          + 添加
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {colors.map((c, idx) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#1E1E2E',
              borderRadius: 8,
              padding: '6px 10px',
            }}
          >
            <input
              type="color"
              value={c.hex}
              onChange={(e) => updateColor(type, c.id, e.target.value)}
              style={{
                width: 32,
                height: 32,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                background: 'none',
                padding: 0,
              }}
            />
            <input
              type="text"
              value={c.hex}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                  updateColor(type, c.id, v);
                }
              }}
              onBlur={(e) => {
                const v = e.target.value;
                if (!isValidHex(v)) {
                  updateColor(type, c.id, c.hex);
                }
              }}
              style={{
                flex: 1,
                background: '#2A2A3E',
                border: '1px solid #3B3B55',
                borderRadius: 6,
                color: '#E0E0F0',
                fontSize: 13,
                padding: '4px 8px',
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#6366F1')}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#3B3B55')}
            />
            <span style={{ fontSize: 11, color: '#8888A0', minWidth: 20 }}>{idx + 1}</span>
            {colors.length > 1 && (
              <button
                onClick={() => removeColor(type, c.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                  padding: '0 4px',
                  transition: 'opacity 0.2s',
                  opacity: 0.6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        padding: 16,
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {renderColorList('前景色', foregroundColors, 'fg')}
      {renderColorList('背景色', backgroundColors, 'bg')}
    </div>
  );
};

export default ColorInputPanel;
