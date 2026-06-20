import type { ColorItem } from '../color/ColorItem'
import type { FeedbackState } from '../game/GameEngine'

export interface ColorGridProps {
  candidates: ColorItem[]
  onSelect: (id: string) => void
  feedback: FeedbackState | null
  disabled: boolean
}

interface RippleState {
  id: number
  x: number
  y: number
  blockId: string
}

import React, { memo, useCallback, useRef, useState, useEffect } from 'react'

const ColorBlock = memo(function ColorBlock({
  color,
  onClick,
  isSelected,
  showCorrect,
  showWrong,
  animKey,
  disabled,
}: {
  color: ColorItem
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  isSelected: boolean
  showCorrect: boolean
  showWrong: boolean
  animKey: number
  disabled: boolean
}) {
  const [bouncing, setBouncing] = useState(false)
  const prevAnimKey = useRef(0)

  useEffect(() => {
    if (animKey !== prevAnimKey.current && animKey > 0) {
      prevAnimKey.current = animKey
      setBouncing(true)
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setBouncing(false)
        })
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [animKey])

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled && !isSelected}
      className="color-block"
      style={{ '--block-bg': color.hex } as React.CSSProperties}
      aria-label={`颜色 ${color.hex}`}
    >
      <div
        className={`color-block-inner${bouncing ? ' animate-bounce-scale' : ''}`}
      >
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
  const [ripples, setRipples] = useState<RippleState[]>([])
  const rippleCounter = useRef(0)
  const pendingRippleRemovals = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    return () => {
      pendingRippleRemovals.current.forEach((id) => cancelAnimationFrame(id))
      pendingRippleRemovals.current.clear()
    }
  }, [])

  const handleClick = useCallback(
    (id: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const rid = ++rippleCounter.current
      setRipples((prev) => [...prev, { id: rid, x, y, blockId: id }])

      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          pendingRippleRemovals.current.delete(rid)
          setRipples((prev) => prev.filter((r) => r.id !== rid))
        })
      })
      pendingRippleRemovals.current.set(rid, rafId)
      onSelect(id)
    },
    [disabled, onSelect],
  )

  const feedbackAnimKey = feedback ? 1 : 0

  return (
    <div
      className="color-grid-wrapper animate-fade-in-up"
      style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
    >
      {candidates.map((color) => {
        const isSelected = feedback?.selectedId === color.id
        return (
          <div key={color.id} className="color-block-container">
            <ColorBlock
              color={color}
              onClick={handleClick(color.id)}
              isSelected={isSelected}
              showCorrect={isSelected && feedback?.isCorrect === true}
              showWrong={isSelected && feedback?.isCorrect === false}
              animKey={isSelected ? feedbackAnimKey : 0}
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
        )
      })}

      <style>{`
        .color-grid-wrapper {
          display: grid;
          gap: 16px;
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
          padding: 8px;
        }
        .color-block-container {
          position: relative;
          width: 100%;
          overflow: visible;
        }
        .color-block-container::after {
          content: '';
          display: block;
          padding-bottom: 100%;
        }
        .color-block {
          position: absolute;
          inset: 0;
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
          transform: scale(1.06);
          box-shadow: 0 10px 28px rgba(44, 62, 80, 0.22);
          z-index: 2;
        }
        .color-block:focus-visible {
          box-shadow: 0 0 0 3px rgba(26, 188, 156, 0.5), 0 4px 14px rgba(44, 62, 80, 0.15);
        }
        .color-block:disabled:not(:focus) {
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
          width: 56%;
          height: 56%;
          pointer-events: none;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
          animation: fade-in-up 120ms ease-out both;
        }
        .feedback-icon.correct { stroke: #FFFFFF; }
        .feedback-icon.wrong  { stroke: #FFFFFF; }
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
          z-index: 5;
        }
        @media (max-width: 768px) {
          .color-grid-wrapper {
            gap: 10px;
            max-width: 360px;
            padding: 4px;
          }
          .color-block {
            border-radius: var(--radius-sm);
          }
        }
        @media (min-width: 769px) and (max-width: 1023px) {
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
