import { useRef } from 'react';
import type { ColorPart, CharacterColors } from '@/types/character';
import { COLOR_PART_LABELS, PRESET_COLORS } from '@/types/character';
import { areColorsEqual } from '@/utils/colorUtils';

interface ColorPaletteProps {
  colors: CharacterColors;
  activePart: ColorPart;
  onPartChange: (part: ColorPart) => void;
  onColorChange: (part: ColorPart, color: string) => void;
  disabled?: boolean;
}

const PARTS: ColorPart[] = ['skin', 'clothes', 'hair', 'weapon', 'accessory'];

export default function ColorPalette({
  colors,
  activePart,
  onPartChange,
  onColorChange,
  disabled = false,
}: ColorPaletteProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  const handleCustomPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    if (color) {
      onColorChange(activePart, color);
    }
  };

  const currentColor = colors[activePart];

  return (
    <div className="control-card">
      <div className="control-title">颜色主题</div>

      <div className="part-tabs">
        {PARTS.map((part) => {
          const isActive = part === activePart;
          return (
            <button
              key={part}
              type="button"
              disabled={disabled}
              className={`part-tab ${isActive ? 'active' : ''}`}
              onClick={() => onPartChange(part)}
              title={COLOR_PART_LABELS[part]}
            >
              <span
                className="part-color-dot"
                style={{ backgroundColor: colors[part] }}
              />
              <span className="part-label">{COLOR_PART_LABELS[part]}</span>
            </button>
          );
        })}
      </div>

      <div className="palette-section">
        <div className="palette-current-row">
          <span className="palette-label">当前配色</span>
          <div
            className="palette-current-swatch"
            style={{ backgroundColor: currentColor }}
          >
            <span className="palette-hex">{currentColor.toUpperCase()}</span>
          </div>
        </div>

        <div className="palette-grid">
          {PRESET_COLORS.map((color) => {
            const isActive = areColorsEqual(color, currentColor);
            return (
              <button
                key={color}
                type="button"
                disabled={disabled}
                className={`palette-swatch ${isActive ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(activePart, color)}
                title={color.toUpperCase()}
              />
            );
          })}
          <button
            type="button"
            disabled={disabled}
            className="palette-swatch palette-custom"
            onClick={() => pickerRef.current?.click()}
            title="自定义颜色"
          >
            <span className="custom-plus">+</span>
          </button>
          <input
            ref={pickerRef}
            type="color"
            className="hidden-picker"
            value={currentColor}
            onChange={handleCustomPick}
          />
        </div>
      </div>
    </div>
  );
}
