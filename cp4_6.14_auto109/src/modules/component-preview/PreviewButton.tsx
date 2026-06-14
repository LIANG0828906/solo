import React, { useMemo } from 'react'
import type { DesignTokens } from '../../context/DesignTokensContext'

interface PreviewButtonProps {
  tokens: DesignTokens
}

const PreviewButton: React.FC<PreviewButtonProps> = ({ tokens }) => {
  const { colors, spacing, fonts, shadows } = tokens

  const buttonStyle = useMemo<React.CSSProperties>(
    () => ({
      padding: `${spacing.s}px ${spacing.m}px`,
      backgroundColor: colors.accent,
      color: colors.text,
      fontFamily: fonts.body,
      boxShadow: `0 ${shadows.md}px ${shadows.md * 2}px rgba(0,0,0,0.15)`,
      transition: 'all 0.2s ease',
    }),
    [colors, spacing, fonts, shadows]
  )

  const hoverStyle = useMemo<React.CSSProperties>(
    () => ({
      transform: 'translateY(-2px)',
      boxShadow: `0 ${shadows.md + 4}px ${(shadows.md + 4) * 2}px rgba(0,0,0,0.25)`,
    }),
    [shadows.md]
  )

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    Object.assign(e.currentTarget.style, hoverStyle)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = ''
    e.currentTarget.style.boxShadow = buttonStyle.boxShadow as string
  }

  return (
    <button
      className="preview-button"
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      点击测试
    </button>
  )
}

export default React.memo(PreviewButton)
