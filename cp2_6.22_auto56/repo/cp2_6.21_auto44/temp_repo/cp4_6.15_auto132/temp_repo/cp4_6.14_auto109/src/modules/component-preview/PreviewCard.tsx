import React, { useMemo } from 'react'
import type { DesignTokens } from '../../context/DesignTokensContext'

interface PreviewCardProps {
  tokens: DesignTokens
}

const PreviewCard: React.FC<PreviewCardProps> = ({ tokens }) => {
  const { colors, spacing, fonts, shadows } = tokens

  const cardStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundColor: colors.background,
      border: `1px solid ${colors.primary}`,
      padding: `${spacing.m}px`,
      boxShadow: `0 ${shadows.lg}px ${shadows.lg * 2}px rgba(0,0,0,0.15)`,
      transition: 'all 0.2s ease',
    }),
    [colors, spacing, shadows]
  )

  const titleStyle = useMemo<React.CSSProperties>(
    () => ({
      color: colors.text,
      fontFamily: fonts.heading,
      transition: 'all 0.2s ease',
    }),
    [colors, fonts]
  )

  const contentStyle = useMemo<React.CSSProperties>(
    () => ({
      color: colors.text,
      fontFamily: fonts.body,
      transition: 'all 0.2s ease',
    }),
    [colors, fonts]
  )

  return (
    <div className="preview-card" style={cardStyle}>
      <div className="preview-card-title" style={titleStyle}>
        卡片标题
      </div>
      <div className="preview-card-content" style={contentStyle}>
        卡片内容区域
      </div>
    </div>
  )
}

export default React.memo(PreviewCard)
