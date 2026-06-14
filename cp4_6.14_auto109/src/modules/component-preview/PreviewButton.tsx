import React from 'react'
import type { DesignTokens } from '../../context/DesignTokensContext'

interface PreviewButtonProps {
  tokens: DesignTokens
}

const PreviewButton: React.FC<PreviewButtonProps> = ({ tokens }) => {
  const { colors, spacing, fonts, shadows } = tokens
  const hoverShadowBlur = shadows.md * 1.5

  const buttonStyle: React.CSSProperties = {
    padding: `${spacing.s}px ${spacing.m}px`,
    backgroundColor: colors.accent,
    color: colors.text,
    fontFamily: fonts.body,
    boxShadow: `0 ${shadows.md}px ${shadows.md * 2}px rgba(0,0,0,0.15)`,
  }

  return (
    <button
      className="preview-button"
      style={buttonStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 ${shadows.md + 2}px ${hoverShadowBlur * 2}px rgba(0,0,0,0.2)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 ${shadows.md}px ${shadows.md * 2}px rgba(0,0,0,0.15)`
      }}
    >
      点击测试
    </button>
  )
}

export default PreviewButton
