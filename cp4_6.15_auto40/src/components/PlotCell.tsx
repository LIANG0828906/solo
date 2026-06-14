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
  const centerX = cellSize / 2
  const centerY = cellSize / 2

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      className="plot-cell-group"
    >
      <g transform={`translate(${x}, ${y})`}>
        <rect
          width={cellSize}
          height={cellSize}
          rx={8}
          ry={8}
          fill={plot.color}
          stroke={isSelected ? '#8B4513' : 'transparent'}
          strokeWidth={isSelected ? 3 : 0}
          className="plot-rect"
        >
          <animate
            attributeName="fill"
            values={plot.color}
            dur="0.3s"
            fill="freeze"
          />
        </rect>

        {plot.hasPlantMarker && (
          <g
            className={`plant-marker ${plot.isAnimating && plot.animationType === 'claim' ? 'fly-in' : ''}`}
            transform={`translate(${centerX}, ${centerY})`}
          >
            {plot.isAnimating && plot.animationType === 'claim' && (
              <>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={`${-150}, ${-80}; ${10}, ${-5}; ${0}, ${0}`}
                  keyTimes="0; 0.6; 1"
                  dur="0.8s"
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.34 1.56 0.64 1; 0.34 1.56 0.64 1"
                />
                <animate
                  attributeName="opacity"
                  values="0; 1; 1"
                  keyTimes="0; 0.6; 1"
                  dur="0.8s"
                  fill="freeze"
                />
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  values="0; 1.1; 1"
                  keyTimes="0; 0.6; 1"
                  dur="0.8s"
                  fill="freeze"
                  additive="sum"
                />
              </>
            )}
            <circle cx={0} cy={0} r={18} fill="#FFFFFF" opacity={0.9}>
              {plot.isAnimating && plot.animationType === 'claim' && (
                <animate
                  attributeName="opacity"
                  values="0; 0.9"
                  dur="0.8s"
                  fill="freeze"
                />
              )}
            </circle>
            <text
              x={0}
              y={5}
              textAnchor="middle"
              fontSize={18}
              fill="#558B2F"
            >
              🌱
            </text>
          </g>
        )}

        {showAnimation && animationType === 'water' && (
          <g className="water-animation">
            <g transform={`translate(${centerX - 20}, 0)`}>
              {[0, 1, 2, 3, 4].map((i) => (
                <circle
                  key={i}
                  cx={i * 10}
                  cy={-5}
                  r={3}
                  fill="#4FC3F7"
                >
                  <animate
                    attributeName="cy"
                    values={`-5; ${cellSize - 15}; ${cellSize - 10}`}
                    keyTimes="0; 0.7; 1"
                    dur="1s"
                    begin={`${i * 0.1}s`}
                    fill="freeze"
                  />
                  <animate
                    attributeName="opacity"
                    values="1; 1; 0"
                    keyTimes="0; 0.7; 1"
                    dur="1s"
                    begin={`${i * 0.1}s`}
                    fill="freeze"
                  />
                </circle>
              ))}
            </g>
            
            <ellipse
              cx={centerX}
              cy={cellSize - 10}
              rx={0}
              ry={0}
              fill="#81D4FA"
              opacity={0}
            >
              <animate
                attributeName="rx"
                values="0; 15"
                dur="0.5s"
                begin="0.5s"
                fill="freeze"
              />
              <animate
                attributeName="ry"
                values="0; 5"
                dur="0.5s"
                begin="0.5s"
                fill="freeze"
              />
              <animate
                attributeName="opacity"
                values="0; 0.5; 0"
                keyTimes="0; 0.5; 1"
                dur="0.5s"
                begin="0.5s"
                fill="freeze"
              />
            </ellipse>

            <g transform={`translate(${centerX}, -15)`}>
              <text x={0} y={0} fontSize={20} textAnchor="middle">🚿</text>
              <animate
                attributeName="opacity"
                values="1; 1; 0"
                keyTimes="0; 0.8; 1"
                dur="1.2s"
                fill="freeze"
              />
            </g>
          </g>
        )}

        {showAnimation && animationType === 'fertilize' && (
          <g className="fertilize-animation">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const angle = (i * 45) * Math.PI / 180
              const endX = centerX + Math.cos(angle) * 20
              const endY = centerY + Math.sin(angle) * 20
              return (
                <circle
                  key={i}
                  cx={centerX}
                  cy={centerY - 30}
                  r={4}
                  fill="#8D6E63"
                  opacity={0}
                >
                  <animate
                    attributeName="cx"
                    values={`${centerX}; ${endX}`}
                    dur="0.8s"
                    begin={`${i * 0.05}s`}
                    fill="freeze"
                  />
                  <animate
                    attributeName="cy"
                    values={`${centerY - 30}; ${endY}`}
                    dur="0.8s"
                    begin={`${i * 0.05}s`}
                    fill="freeze"
                  />
                  <animate
                    attributeName="opacity"
                    values="0; 1; 1"
                    keyTimes="0; 0.2; 1"
                    dur="0.8s"
                    begin={`${i * 0.05}s`}
                    fill="freeze"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="scale"
                    values="0; 1"
                    dur="0.3s"
                    begin={`${i * 0.05}s`}
                    fill="freeze"
                    additive="sum"
                  />
                </circle>
              )
            })}
          </g>
        )}

        {showAnimation && animationType === 'pest' && (
          <g className="pest-animation">
            <text
              x={centerX}
              y={centerY + 5}
              textAnchor="middle"
              fontSize={24}
            >
              🐛
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 0,-10; 0,5; 0,-5; 50,-30"
                keyTimes="0; 0.25; 0.5; 0.75; 1"
                dur="0.8s"
                fill="freeze"
              />
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0; -10; 10; -5; 15"
                keyTimes="0; 0.25; 0.5; 0.75; 1"
                dur="0.8s"
                fill="freeze"
                additive="sum"
              />
              <animate
                attributeName="opacity"
                values="1; 1; 1; 1; 0"
                keyTimes="0; 0.7; 0.85; 0.95; 1"
                dur="0.8s"
                fill="freeze"
              />
            </text>
            <text
              x={centerX + 15}
              y={centerY - 10}
              textAnchor="middle"
              fontSize={16}
            >
              💨
              <animate
                attributeName="opacity"
                values="0; 1; 0"
                keyTimes="0; 0.3; 1"
                dur="0.6s"
                begin="0.1s"
                fill="freeze"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0; 30,-20"
                dur="0.6s"
                begin="0.1s"
                fill="freeze"
              />
            </text>
          </g>
        )}
      </g>
    </g>
  )
}
