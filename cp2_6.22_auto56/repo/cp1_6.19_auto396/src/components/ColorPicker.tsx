import React from 'react';
import { usePaletteStore } from '../store/paletteStore';
import { PRESET_COLORS } from '../constants/presetColors';
import { PresetColor } from '../types';

const ColorPicker: React.FC = () => {
  const baseColor = usePaletteStore((state) => state.baseColor);
  const setBaseColor = usePaletteStore((state) => state.setBaseColor);
  const addColors = usePaletteStore((state) => state.addColors);
  const addAddColor = usePaletteStore((state) => state.addAddColor);

  const usedColors = new Set([baseColor.hex, ...addColors.map((ac) => ac.color.hex)]);
  const availableForAdd = PRESET_COLORS.filter((c) => !usedColors.has(c.hex));

  const handleAddColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const color = PRESET_COLORS.find((c) => c.hex === e.target.value);
    if (color) {
      addAddColor(color);
    }
    e.target.value = '';
  };

  return (
    <div>
      <div className="section-title">
        <span>基底色板</span>
        <select
          className="add-color-select"
          value=""
          onChange={handleAddColorChange}
          disabled={addColors.length >= 3 || availableForAdd.length === 0}
        >
          <option value="">+ 添加辅助色</option>
          {availableForAdd.map((c) => (
            <option key={c.hex} value={c.hex}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="color-picker-grid" style={{ paddingBottom: '20px' }}>
        {PRESET_COLORS.map((color: PresetColor) => (
          <div key={color.hex} style={{ position: 'relative', height: '60px' }}>
            <div
              className={`color-swatch ${baseColor.hex === color.hex ? 'selected' : ''}`}
              style={{ backgroundColor: color.hex }}
              onClick={() => setBaseColor(color)}
              title={color.name}
            />
            <span className="color-swatch-label">{color.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
