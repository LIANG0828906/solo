import React from 'react';

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#78716c',
  '#1f2937',
  '#ffffff'
];

interface ColorPaletteProps {
  selectedColor: string;
  usedColors: string[];
  onColorSelect: (color: string) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  usedColors,
  onColorSelect
}) => {
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onColorSelect(e.target.value);
  };

  const isSelected = (color: string) => {
    return color.toLowerCase() === selectedColor.toLowerCase();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">调色板</div>
        <div className="sidebar-subtitle">选择颜色开始上色</div>
      </div>

      <div className="palette-section">
        <div className="palette-grid">
          {PRESET_COLORS.map((color) => (
            <div
              key={color}
              className={`color-swatch ${isSelected(color) ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onColorSelect(color)}
              title={color}
            />
          ))}
        </div>

        <div className="custom-color-wrap">
          <label className="custom-color-label">自定义颜色</label>
          <input
            type="color"
            className="custom-color-input"
            value={selectedColor}
            onChange={handleCustomColorChange}
          />
        </div>

        {usedColors.length > 0 && (
          <div className="used-colors-section">
            <div className="used-colors-label">已用颜色</div>
            <div className="used-colors-grid">
              {usedColors.map((color) => (
                <div
                  key={color}
                  className="used-color-dot"
                  style={{ backgroundColor: color }}
                  onClick={() => onColorSelect(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ColorPalette;
