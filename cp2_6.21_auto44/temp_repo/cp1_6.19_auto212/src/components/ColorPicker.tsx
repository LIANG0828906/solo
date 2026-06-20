import { motion } from 'framer-motion';
import type { ColorKey } from '@/types';
import { COLOR_PALETTE, COLORS } from '@/types';

interface ColorPickerProps {
  selected: ColorKey[];
  onChange: (colors: ColorKey[]) => void;
}

export default function ColorPicker({ selected, onChange }: ColorPickerProps) {
  const toggleColor = (color: ColorKey) => {
    if (selected.includes(color)) {
      onChange(selected.filter((c) => c !== color));
    } else {
      onChange([...selected, color]);
    }
  };

  const getBorderColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#999999' : '#333333';
  };

  return (
    <div className="flex flex-wrap gap-3">
      {COLORS.map((colorKey) => {
        const isSelected = selected.includes(colorKey);
        const colorValue = COLOR_PALETTE[colorKey];
        const borderColor = isSelected ? getBorderColor(colorValue) : '#E0E0E0';

        return (
          <motion.button
            key={colorKey}
            type="button"
            onClick={() => toggleColor(colorKey)}
            whileTap={{ scale: 0.9 }}
            animate={{
              scale: isSelected ? 1.1 : 1,
              borderWidth: isSelected ? 2 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: colorValue,
              border: `${isSelected ? '2px' : '1px'} solid ${borderColor}`,
              cursor: 'pointer',
              padding: 0,
            }}
            aria-label={colorKey}
            aria-pressed={isSelected}
          />
        );
      })}
    </div>
  );
}
