import React, { memo, useCallback, useRef, useState } from 'react'
import type { ColorItem } from '../color/ColorItem'
import type { FeedbackState } from '../game/GameEngine'

export interface ColorGridProps {
  candidates: ColorItem[]
  onSelect: (id: string) => void
  feedback: FeedbackState | null
  disabled: boolean
}

interface Ripple {
  id: number
  x: number
  y: number
  blockId: string
}

const ColorBlock = memo(function ColorBlock({
  color,
  onClick,
  feedback,
  disabled,
}: {
  color: ColorItem
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  feedback: FeedbackState | null
  disabled: boolean
}) {
  const isSelected = feedback?.selectedId === color.id
  const showCorrect = isSelected && feedback?.isCorrect === true
  const showWrong = isSelected && feedback?.isCorrect === false

  const cssVars = {
    '--block-bg': color.hex,
  } as React.CSSProperties

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !isSelected}
      className="color-block"
      style={cssVars}
      aria-label={`颜色 ${color.hex}`}
    >
      <div className={`color-block-inner ${isSelected ? 'animate-bounce-scale' : ''}`}>
        {showCorrect && (
          <svg className="feedback-icon correct" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {showWrong && (
          <svg className="feedback-icon wrong" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>
    </button>
  )
})

const ColorGrid: React.FC<ColorGridProps> = ({ candidates, onSelect, feedback, disabled }) => {
  const count = candidates.length
  const gridCols = count <= 4 ? 2 : count <= 6 ? 3 : 4
  const [ripples, setRipples] = useState<Ripple[]>([])
  const rippleCounter = useRef(0)

  const handleClick = useCallback(
    (id: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      const button = e.currentTarget
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const rid = ++rippleCounter.current
      setRipples((prev) => [...prev, { id: rid, x, y, blockId: id }])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rid))
      }, 600)
      onSelect(id)
    },
    [disabled, onSelect],
  )

  return (
    <div
      className="color-grid-wrapper animate-fade-in-up"
      style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
    >
      {candidates.map((color) => (
        <div key={color.id} className="color-block-container">
          <ColorBlock
            color={color}
            onClick={handleClick(color.id)}
            feedback={feedback}
            disabled={disabled}
          />
          {ripples
            .filter((r) => r.blockId === color.id)
            .map((r) => (
              <span
                key={r.id}
                className="ripple animate-ripple"
                style={{ left: r.x, top: r.y }}
              />
            ))}
        </div>
      ))}

      <style>{`
        .color-grid-wrapper {
          display: grid;
          gap: 20px;
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
          padding: 8px;
        }
        .color-block-container {
          position: relative;
          aspect-ratio: 1 / 1;
          width: 100%;
          overflow: visible;
        }
        .color-block {
          position: relative;
          width: 100%;
          height: 100%;
          padding: 0;
          border: none;
          border-radius: var(--radius-md);
          background: var(--block-bg);
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(44, 62, 80, 0.15);
          transition: transform 150ms ease, box-shadow 150ms ease;
          outline: none;
        }
        .color-block:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 10px 28px rgba(44, 62, 80, 0.22);
          z-index: 2;
        }
        .color-block:focus-visible {
          box-shadow: 0 0 0 3px rgba(26, 188, 156, 0.5), 0 4px 14px rgba(44, 62, 80, 0.15);
        }
        .color-block:disabled {
          cursor: default;
        }
        .color-block-inner {
          position: absolute;
          inset: 0;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          background: inherit;
        }
        .feedback-icon {
          width: 60%;
          height: 60%;
          pointer-events: none;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
          animation: fade-in-up 120ms ease-out both;
        }
        .feedback-icon.correct {
          stroke: #FFFFFF;
        }
        .feedback-icon.wrong {
          stroke: #FFFFFF;
        }
        .ripple {
          position: absolute;
          width: 20px;
          height: 20px;
          margin-left: -10px;
          margin-top: -10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          pointer-events: none;
          will-change: transform, opacity;
        }
        @media (max-width: 1023px) {
          .color-grid-wrapper {
            gap: 14px;
            max-width: 440px;
          }
        }
      `}</style>
    </div>
  )
}

export default memo(ColorGrid)
