import React from 'react';
import { PRESET_COLORS } from './utils';

interface ColorPaletteProps {
  currentColor: string;
  onColorSelect: (color: string) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ currentColor, onColorSelect }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#3a3a3a',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      minWidth: '200px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: currentColor,
          border: currentColor === '#ffffff' ? '2px solid #555' : '2px solid transparent',
          boxShadow: `0 0 12px ${currentColor}`,
          transition: 'all 0.2s ease'
        }} />
        <div style={{
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ccc',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {currentColor}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: '8px'
      }}>
        {PRESET_COLORS.map((color) => {
          const isSelected = color.toLowerCase() === currentColor.toLowerCase();
          return (
            <button
              key={color}
              onClick={() => onColorSelect(color)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: color,
                border: isSelected ? '2px solid #ff6b6b' : color === '#ffffff' ? '2px solid #555' : '2px solid transparent',
                boxShadow: isSelected ? `0 0 10px ${color}, 0 0 20px rgba(255,107,107,0.5)` : '0 1px 3px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: 0
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            />
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #4a4a4a'
      }}>
        <span style={{ fontSize: '12px', color: '#999' }}>自定义:</span>
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onColorSelect(e.target.value)}
          style={{
            width: '36px',
            height: '28px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            padding: 0
          }}
        />
      </div>
    </div>
  );
};

export default ColorPalette;
