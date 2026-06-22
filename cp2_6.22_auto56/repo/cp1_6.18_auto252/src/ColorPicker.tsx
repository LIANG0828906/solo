import React, { useState, useCallback } from 'react';
import { useTapestryStore, COLORS, ColorItem } from './store';

interface RippleState {
  colorIndex: number | null;
  key: number;
}

const ColorPicker: React.FC = () => {
  const { selectedColor, setSelectedColor } = useTapestryStore();
  const [ripple, setRipple] = useState<RippleState>({ colorIndex: null, key: 0 });

  const handleColorClick = useCallback((color: ColorItem, index: number) => {
    setSelectedColor(color.value);
    setRipple({ colorIndex: index, key: Date.now() });
    setTimeout(() => {
      setRipple((prev) => (prev.colorIndex === index ? { ...prev, colorIndex: null } : prev));
    }, 300);
  }, [setSelectedColor]);

  return (
    <div
      style={{
        width: 80,
        backgroundColor: 'rgba(22, 33, 62, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: 12,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#DFE6E9',
          textAlign: 'center',
          marginBottom: 4,
          fontWeight: 500,
        }}
      >
        情绪色板
      </div>
      {COLORS.map((color, index) => {
        const isSelected = selectedColor === color.value;
        const showRipple = ripple.colorIndex === index;

        return (
          <div
            key={color.value}
            onClick={() => handleColorClick(color, index)}
            title={`${color.name} (${color.value})`}
            style={{
              width: 56,
              height: 56,
              backgroundColor: color.value,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s ease-out, transform 0.2s ease-out',
              position: 'relative',
              overflow: 'hidden',
              border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
              boxSizing: 'border-box',
              animation: isSelected ? 'pulse 0.2s ease-out' : undefined,
              boxShadow: isSelected ? '0 0 12px rgba(255,255,255,0.4)' : 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 8px rgba(255,255,255,0.4)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = isSelected ? '0 0 12px rgba(255,255,255,0.4)' : 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {showRipple && (
              <span
                key={ripple.key}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 20,
                  height: 20,
                  marginLeft: -10,
                  marginTop: -10,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                  animation: 'ripple 0.3s ease-out forwards',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ColorPicker;
