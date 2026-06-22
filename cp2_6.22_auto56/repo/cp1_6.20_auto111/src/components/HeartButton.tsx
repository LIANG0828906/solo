import React, { useRef } from 'react'
import { animateHeart } from '@/core/animationEngine'

interface HeartButtonProps {
  count: number
  onClick: () => void
}

const HeartButton: React.FC<HeartButtonProps> = ({ count, onClick }) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const handleClick = () => {
    onClick()
    if (buttonRef.current) {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      buttonRef.current.dataset.animationId = Math.random().toString(36)
      cleanupRef.current = animateHeart(buttonRef.current, 1)
    }
  }

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      style={buttonStyle}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#E74C3C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={heartStyle}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span style={countStyle}>{count}</span>
    </button>
  )
}

const buttonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  borderRadius: 12,
  backgroundColor: 'rgba(231, 76, 60, 0.1)',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const heartStyle: React.CSSProperties = {
  fill: '#E74C3C',
  transition: 'transform 0.2s ease',
}

const countStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#E74C3C',
  minWidth: 20,
  textAlign: 'center',
}

export default HeartButton
