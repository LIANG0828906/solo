import React from 'react'

export const PALETTE_COLORS = [
  '#FF0000',
  '#FF8C00',
  '#FFD700',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#800080',
  '#FFC0CB',
  '#8B4513',
  '#808080',
  '#000000',
  '#FFFFFF',
]

interface PaletteProps {
  selectedColor: string
  onColorSelect: (color: string) => void
}

const Palette: React.FC<PaletteProps> = ({ selectedColor, onColorSelect }) => {
  return (
    <div
      className="palette-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
      }}
    >
      {PALETTE_COLORS.map((color) => {
        const isSelected = selectedColor === color
        return (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: color,
              border: `2px solid ${color === '#FFFFFF' ? '#ddd' : 'rgba(255,255,255,0.3)'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: isSelected
                ? `inset 0 0 0 4px #FFD700, 0 0 10px rgba(255,215,0,0.5)`
                : 'none',
              transition: 'all 0.2s ease-out',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }
            }}
          />
        )
      })}
    </div>
  )
}

export default Palette
