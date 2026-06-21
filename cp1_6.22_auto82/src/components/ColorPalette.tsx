import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { ColorToken } from '../modules/tokenExtractor'
import { hslToHex, hexToRgb } from '../modules/tokenExtractor'

interface ColorPaletteProps {
  primaryColors: ColorToken[]
  secondaryColors: ColorToken[]
  selectedIndex: number | null
  onColorSelect: (index: number) => void
  onColorAdjust: (index: number, newHex: string) => void
}

function getTextColor(hex: string): string {
  const rgb = hexToRgb(hex)
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255
  return luminance > 0.5 ? '#1a1a2e' : '#ffffff'
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  primaryColors,
  secondaryColors,
  selectedIndex,
  onColorSelect,
  onColorAdjust,
}) => {
  const [bounceIndex, setBounceIndex] = useState<number | null>(null)
  const hueRingRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const rafRef = useRef<number | null>(null)

  const handleCardClick = useCallback(
    (index: number) => {
      onColorSelect(index)
      setBounceIndex(index)
      setTimeout(() => setBounceIndex(null), 300)
    },
    [onColorSelect],
  )

  const selectedColor =
    selectedIndex !== null && selectedIndex < primaryColors.length
      ? primaryColors[selectedIndex]
      : null

  useEffect(() => {
    if (!isDragging || selectedIndex === null || !hueRingRef.current || !selectedColor) return

    const ring = hueRingRef.current
    const rect = ring.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      rafRef.current = requestAnimationFrame(() => {
        let clientX: number, clientY: number
        if ('touches' in e) {
          clientX = e.touches[0].clientX
          clientY = e.touches[0].clientY
        } else {
          clientX = e.clientX
          clientY = e.clientY
        }

        const dx = clientX - cx
        const dy = clientY - cy
        const angle = Math.atan2(dy, dx)
        let hue = (angle * 180) / Math.PI + 90
        if (hue < 0) hue += 360
        hue = Math.round(hue)

        const baseHsl = { ...selectedColor.hsl, h: hue }
        const newHex = hslToHex(baseHsl)
        onColorAdjust(selectedIndex, newHex)
      })
    }

    const onUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isDragging, selectedIndex, selectedColor, onColorAdjust])

  const getSliderPosition = (hue: number) => {
    const angle = ((hue - 90) * Math.PI) / 180
    const radius = 90
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  }

  const sliderPos = selectedColor ? getSliderPosition(selectedColor.hsl.h) : null

  return (
    <div className="color-palette">
      <div className="palette-section">
        <div className="section-title">主色调 · Primary Colors</div>
        <div className="color-grid primary-grid">
          {primaryColors.length === 0 && (
            <div className="empty-state">上传图片后将自动提取主色...</div>
          )}
          {primaryColors.map((color, index) => (
            <div
              key={`primary-${index}-${color.hex}`}
              className={`color-card primary-card ${
                selectedIndex === index ? 'selected' : ''
              } ${bounceIndex === index ? 'bounce' : ''}`}
              style={{
                backgroundColor: color.hex,
                boxShadow: `0 4px 20px ${color.hex}33, 0 0 0 1px ${color.hex}22`,
                animationDelay: `${index * 0.08}s`,
              }}
              onClick={() => handleCardClick(index)}
            >
              <span
                className="color-hex"
                style={{ color: getTextColor(color.hex) }}
              >
                {color.hex}
              </span>
              {selectedIndex === index && (
                <div className="selected-border" />
              )}
            </div>
          ))}
        </div>
      </div>

      {secondaryColors.length > 0 && (
        <div className="palette-section" style={{ marginTop: 28 }}>
          <div className="section-title">辅助色 · Secondary Colors</div>
          <div className="color-grid secondary-grid">
            {secondaryColors.map((color, index) => (
              <div
                key={`secondary-${index}-${color.hex}`}
                className="color-card secondary-card"
                style={{
                  backgroundColor: color.hex,
                  boxShadow: `0 2px 12px ${color.hex}22, 0 0 0 1px ${color.hex}18`,
                  animationDelay: `${index * 0.08 + 0.1}s`,
                }}
              >
                <span
                  className="color-hex secondary-hex"
                  style={{ color: getTextColor(color.hex) }}
                >
                  {color.hex}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedColor && sliderPos && (
        <div className="hue-ring-section">
          <div className="section-title">色相微调 · Hue Adjustment</div>
          <div className="hue-ring-wrapper">
            <div
              className="hue-ring"
              ref={hueRingRef}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              <div className="hue-ring-gradient" />
              <div className="hue-ring-center" style={{
                background: `radial-gradient(circle, ${selectedColor.hex} 0%, ${selectedColor.hex}dd 60%, transparent 100%)`,
                boxShadow: `inset 0 0 40px ${selectedColor.hex}55`,
              }}>
                <span className="hue-center-hex" style={{ color: getTextColor(selectedColor.hex) }}>
                  {selectedColor.hex}
                </span>
              </div>
              <div
                className={`hue-slider ${isDragging ? 'dragging' : ''}`}
                style={{
                  transform: `translate(calc(-50% + ${sliderPos.x}px), calc(-50% + ${sliderPos.y}px))`,
                }}
              >
                <div
                  className="hue-slider-inner"
                  style={{ borderColor: selectedColor.hex }}
                />
              </div>
            </div>
            <div className="hue-info">
              <div className="hue-info-row">
                <span className="hue-label">Hue</span>
                <span className="hue-value">{selectedColor.hsl.h}°</span>
              </div>
              <div className="hue-info-row">
                <span className="hue-label">Sat</span>
                <span className="hue-value">{selectedColor.hsl.s}%</span>
              </div>
              <div className="hue-info-row">
                <span className="hue-label">Light</span>
                <span className="hue-value">{selectedColor.hsl.l}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .color-palette {
          padding: 20px;
          background: rgba(22, 33, 62, 0.5);
          border-radius: 16px;
          border: 1px solid rgba(102, 126, 234, 0.1);
          box-shadow: 0 0 15px rgba(102, 126, 234, 0.1);
        }

        .palette-section {
          position: relative;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 16px;
          padding-left: 12px;
          border-left: 3px solid var(--accent-default);
        }

        .color-grid {
          display: grid;
          gap: 14px;
        }

        .primary-grid {
          grid-template-columns: repeat(6, 1fr);
        }

        .secondary-grid {
          grid-template-columns: repeat(8, 1fr);
        }

        .color-card {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
          animation: fadeInScale 0.5s ease-out backwards;
          user-select: none;
          min-width: 0;
        }

        .color-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .primary-card:hover {
          transform: translateY(-4px) scale(1.02);
          z-index: 2;
        }

        .primary-card.selected {
          transform: scale(1.06);
          z-index: 3;
        }

        .primary-card.bounce {
          animation: bounceScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .secondary-card {
          width: 60%;
          aspect-ratio: 1 / 1;
        }

        .color-hex {
          position: absolute;
          top: 10px;
          left: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.3px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          z-index: 2;
        }

        .secondary-hex {
          font-size: 9px;
          top: 6px;
          left: 6px;
        }

        .selected-border {
          position: absolute;
          inset: 2px;
          border-radius: 12px;
          border: 2px solid var(--gold);
          pointer-events: none;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.1);
        }

        .hue-ring-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(102, 126, 234, 0.15);
        }

        .hue-ring-wrapper {
          display: flex;
          align-items: center;
          gap: 40px;
          justify-content: center;
        }

        .hue-ring {
          position: relative;
          width: 220px;
          height: 220px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .hue-ring-gradient {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(
            hsl(0, 100%, 50%),
            hsl(60, 100%, 50%),
            hsl(120, 100%, 50%),
            hsl(180, 100%, 50%),
            hsl(240, 100%, 50%),
            hsl(300, 100%, 50%),
            hsl(360, 100%, 50%)
          );
          filter: saturate(1.2);
          mask: radial-gradient(circle, transparent 58%, black 60%);
          -webkit-mask: radial-gradient(circle, transparent 58%, black 60%);
        }

        .hue-ring-center {
          position: absolute;
          width: 110px;
          height: 110px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.1s ease-out;
        }

        .hue-center-hex {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .hue-slider {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 28px;
          height: 28px;
          pointer-events: none;
          transition: transform 0.08s ease-out;
          z-index: 10;
        }

        .hue-slider-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 3px solid #fff;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
          transition: border-color 0.1s ease-out;
        }

        .hue-slider.dragging .hue-slider-inner {
          transform: scale(1.15);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }

        .hue-info {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 120px;
        }

        .hue-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: rgba(15, 52, 96, 0.6);
          border-radius: 8px;
          border: 1px solid rgba(102, 126, 234, 0.08);
        }

        .hue-label {
          font-size: 12px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 500;
        }

        .hue-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .primary-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .secondary-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .secondary-card {
            width: 100%;
          }
          .hue-ring-wrapper {
            flex-direction: column;
            gap: 24px;
          }
          .hue-info {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default ColorPalette
