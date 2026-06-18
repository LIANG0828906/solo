import { useState } from 'react';

interface ColorPickerProps {
  colors: string[];
  selectedColor?: string;
  onSelect: (color: string) => void;
  label?: string;
  size?: number;
}

export function ColorPicker({
  colors,
  selectedColor,
  onSelect,
  label,
  size = 30
}: ColorPickerProps) {
  const [glowingColor, setGlowingColor] = useState<string | null>(null);

  const handleSelect = (color: string) => {
    setGlowingColor(color);
    onSelect(color);
    setTimeout(() => setGlowingColor(null), 100);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = selectedColor === color;
          const isGlowing = glowingColor === color;

          return (
            <button
              key={color}
              type="button"
              onClick={() => handleSelect(color)}
              className="relative transition-transform duration-100 hover:scale-110 focus:outline-none"
              style={{
                width: size,
                height: size
              }}
              title={color}
            >
              <div
                className={`absolute inset-0 rounded-full transition-all duration-100 ${
                  isGlowing ? 'scale-125 opacity-60' : 'scale-100 opacity-0'
                }`}
                style={{
                  backgroundColor: color,
                  filter: 'blur(4px)'
                }}
              />

              <div
                className={`absolute inset-0 rounded-full transition-all duration-200 ${
                  isSelected ? 'ring-4 ring-white' : ''
                }`}
                style={{
                  backgroundColor: color,
                  boxShadow: isSelected
                    ? `0 0 0 2px ${color}, 0 0 10px ${color}60`
                    : '0 2px 4px rgba(0,0,0,0.1)',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)'
                }}
              />

              {isSelected && (
                <div
                  className="absolute inset-0 rounded-full border-2 border-white pointer-events-none"
                  style={{ borderWidth: '3px' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
