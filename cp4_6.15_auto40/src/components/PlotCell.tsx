import React from 'react'
import { PlotCell as PlotCellType } from '@/types'

interface PlotCellProps {
  plot: PlotCellType
  cellSize: number
  gap: number
  isSelected: boolean
  onClick: () => void
  showAnimation: boolean
  animationType: 'water' | 'fertilize' | 'pest' | null
}

export const PlotCell: React.FC<PlotCellProps> = ({
  plot,
  cellSize,
  gap,
  isSelected,
  onClick,
  showAnimation,
  animationType
}) => {
  const x = plot.col * (cellSize + gap)
  const y = plot.row * (cellSize + gap)

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer', transform: `translate(${x}px, ${y}px)` }}
      className="plot-cell-group"
    >
      <rect
        width={cellSize}
        height={cellSize}
        rx={8}
        ry={8}
        fill={plot.color}
        stroke={isSelected ? '#8B4513' : 'transparent'}
        strokeWidth={isSelected ? 3 : 0}
        style={{
          transition: 'fill 0.3s ease, stroke 0.2s ease, transform 0.2s ease',
        }}
        className="plot-rect"
      />
      
      {plot.hasPlantMarker && (
        <g
          className={`plant-marker ${plot.isAnimating && plot.animationType === 'claim' ? 'fly-in' : ''}`}
          style={{
            transform: `translate(${cellSize / 2}px, ${cellSize / 2}px)`,
            transformOrigin: 'center'
          }}
        >
          <circle cx={0} cy={0} r={18} fill="#FFFFFF" opacity={0.9} />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fontSize={18}
            fill="#558B2F"
            style={{ fontFamily: 'FontAwesome' }}
          >
            🌱
          </text>
        </g>
      )}

      {showAnimation && animationType === 'water' && (
        <g className="water-animation">
          {[...Array(5)].map((_, i) => (
            <circle
              key={i}
              cx={10 + i * 10}
              cy={-5}
              r={3}
              fill="#4FC3F7"
              style={{
                animation: `waterDrop 1s ease-in-out ${i * 0.1}s`
              }}
            />
          ))}
          <ellipse
            cx={cellSize / 2}
            cy={cellSize - 10}
            rx={15}
            ry={5}
            fill="#81D4FA"
            opacity={0.5}
            style={{ animation: 'splash 1s ease-out 0.5s forwards' }}
          />
        </g>
      )}

      {showAnimation && animationType === 'fertilize' && (
        <g className="fertilize-animation">
          {[...Array(8)].map((_, i) => (
            <circle
              key={i}
              cx={cellSize / 2 + Math.cos(i * 0.8) * 20}
              cy={cellSize / 2 + Math.sin(i * 0.8) * 20}
              r={4}
              fill="#8D6E63"
              style={{
                animation: `fertilizeFall 0.8s ease-out ${i * 0.05}s forwards`,
                opacity: 0
              }}
            />
          ))}
        </g>
      )}

      {showAnimation && animationType === 'pest' && (
        <g className="pest-animation">
          <text
            x={cellSize / 2}
            y={cellSize / 2}
            textAnchor="middle"
            fontSize={24}
            style={{
              animation: 'pestBounce 0.5s ease-in-out',
              transformOrigin: 'center'
            }}
          >
            🐛
          </text>
          <text
            x={cellSize / 2 + 15}
            y={cellSize / 2 - 15}
            textAnchor="middle"
            fontSize={16}
            style={{
              animation: 'pestFlee 0.6s ease-out forwards',
              transformOrigin: 'center'
            }}
          >
            💨
          </text>
        </g>
      )}
    </g>
  )
}
