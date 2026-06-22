import React, { useState } from 'react'
import type { SpacingToken } from '../modules/tokenExtractor'

interface SpacingRulerProps {
  spacings: SpacingToken[]
  accentColor: string
  vertical?: boolean
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return `rgba(102, 126, 234, ${alpha})`
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const SpacingRuler: React.FC<SpacingRulerProps> = ({
  spacings,
  accentColor,
  vertical = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const maxValue = Math.max(...spacings.map((s) => s.value), 1)

  return (
    <div className="spacing-ruler-container">
      <div className="section-title">间距标尺 · Spacing Scale</div>
      {spacings.length === 0 ? (
        <div className="empty-state">上传图片后将自动提取间距...</div>
      ) : (
        <div className={`spacing-bars ${vertical ? 'vertical' : 'horizontal'}`}>
          {spacings.map((spacing, index) => {
            const ratio = spacing.value / maxValue
            const opacity = 0.25 + ratio * 0.55
            const tooltipVisible = hoveredIndex === index

            return (
              <div
                key={spacing.label}
                className={`spacing-bar-wrapper ${vertical ? 'v' : 'h'}`}
                style={{
                  animationDelay: `${index * 0.06}s`,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {tooltipVisible && (
                  <div className={`spacing-tooltip ${vertical ? 'v' : 'h'}`}>
                    间距: {spacing.value}px
                    <div className="tooltip-arrow" />
                  </div>
                )}
                <div
                  className={`spacing-bar ${vertical ? 'v' : 'h'}`}
                  style={
                    vertical
                      ? {
                          height: `${Math.max(ratio * 100, 8)}%`,
                          background: `linear-gradient(180deg, ${hexToRgba(accentColor, 0.1)} 0%, ${hexToRgba(accentColor, opacity)} 100%)`,
                          boxShadow: `0 -2px 12px ${hexToRgba(accentColor, opacity * 0.4)}`,
                        }
                      : {
                          width: `${Math.max(ratio * 100, 6)}%`,
                          background: `linear-gradient(90deg, ${hexToRgba(accentColor, 0.1)} 0%, ${hexToRgba(accentColor, opacity)} 100%)`,
                          boxShadow: `4px 0 16px ${hexToRgba(accentColor, opacity * 0.4)}`,
                        }
                  }
                >
                  <span className="spacing-bar-label">
                    {spacing.value}px
                  </span>
                </div>
                <span className="spacing-tag">{spacing.label}</span>
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        .spacing-ruler-container {
          padding: 20px;
          background: rgba(22, 33, 62, 0.5);
          border-radius: 16px;
          border: 1px solid rgba(102, 126, 234, 0.1);
          box-shadow: 0 0 15px rgba(102, 126, 234, 0.1);
        }

        .spacing-bars {
          display: flex;
          gap: 14px;
          position: relative;
        }

        .spacing-bars.horizontal {
          flex-direction: column;
          min-height: 240px;
        }

        .spacing-bars.vertical {
          flex-direction: row;
          justify-content: space-around;
          min-height: 260px;
          align-items: flex-end;
        }

        .spacing-bar-wrapper {
          position: relative;
          animation: fadeInScale 0.45s ease-out backwards;
          cursor: pointer;
        }

        .spacing-bar-wrapper.h {
          display: flex;
          align-items: center;
          gap: 14px;
          height: 36px;
        }

        .spacing-bar-wrapper.v {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          height: 100%;
          min-height: 200px;
          flex: 1;
        }

        .spacing-bar {
          border-radius: 8px;
          transition: all 0.3s ease-out;
          position: relative;
          overflow: visible;
        }

        .spacing-bar.h {
          height: 100%;
          min-width: 40px;
          display: flex;
          align-items: center;
          padding-left: 14px;
        }

        .spacing-bar.v {
          width: 44px;
          min-height: 20px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 10px;
        }

        .spacing-bar-wrapper:hover .spacing-bar {
          filter: brightness(1.15) saturate(1.2);
          transform: scale(1.03);
        }

        .spacing-bar-wrapper.h:hover .spacing-bar {
          transform: translateX(4px) scaleY(1.08);
        }

        .spacing-bar-wrapper.v:hover .spacing-bar {
          transform: translateY(-4px) scaleX(1.08);
        }

        .spacing-bar-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .spacing-tag {
          font-size: 11px;
          color: var(--text-secondary);
          font-family: 'JetBrains Mono', monospace;
          padding: 3px 8px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 4px;
          letter-spacing: 0.3px;
          white-space: nowrap;
          transition: all 0.3s ease-out;
        }

        .spacing-bar-wrapper:hover .spacing-tag {
          background: rgba(102, 126, 234, 0.25);
          color: var(--text-primary);
        }

        .spacing-tooltip {
          position: absolute;
          padding: 6px 14px;
          background: rgba(10, 10, 30, 0.88);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #ffffff;
          white-space: nowrap;
          z-index: 50;
          pointer-events: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          animation: fadeInScale 0.2s ease-out;
        }

        .spacing-tooltip.h {
          top: -38px;
          left: 50%;
          transform: translateX(-50%);
        }

        .spacing-tooltip.v {
          bottom: calc(100% + 14px);
          left: 50%;
          transform: translateX(-50%);
        }

        .spacing-tooltip .tooltip-arrow {
          position: absolute;
          width: 0;
          height: 0;
          border: 6px solid transparent;
        }

        .spacing-tooltip.h .tooltip-arrow {
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-top-color: rgba(10, 10, 30, 0.88);
        }

        .spacing-tooltip.v .tooltip-arrow {
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-top-color: rgba(10, 10, 30, 0.88);
        }

        @media (max-width: 768px) {
          .spacing-bars.horizontal {
            flex-direction: row;
            justify-content: space-around;
            align-items: flex-end;
            min-height: 260px;
          }
          .spacing-bars.vertical {
            min-height: 260px;
          }
          .spacing-bar-wrapper.h {
            flex-direction: column;
            height: auto;
            min-height: 200px;
            flex: 1;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
          }
          .spacing-bar.h {
            width: 44px;
            height: auto;
            min-height: 20px;
            min-width: 0;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            padding-left: 0;
            padding-bottom: 10px;
            background: linear-gradient(180deg, transparent 0%, currentColor 100%) !important;
          }
          .spacing-bar-wrapper.h:hover .spacing-bar {
            transform: translateY(-4px) scaleX(1.08);
          }
          .spacing-tooltip.h {
            bottom: calc(100% + 14px);
            top: auto;
          }
        }
      `}</style>
    </div>
  )
}

export default SpacingRuler
