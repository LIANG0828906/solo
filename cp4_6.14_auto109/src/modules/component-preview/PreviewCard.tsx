import React from 'react'
import type { DesignTokens } from '../../context/DesignTokensContext'

interface PreviewCardProps {
  tokens: DesignTokens
}

const PreviewCard: React.FC<PreviewCardProps> = ({ tokens }) => {
  const { colors, spacing, fonts, shadows } = tokens

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    border: `1px solid ${colors.primary}`,
    padding: `${spacing.m}px`,
    boxShadow: `0 ${shadows.lg}px ${shadows.lg * 2}px rgba(0,0,0,0.15)`,
  }

  const titleStyle: React.CSSProperties = {
    color: colors.text,
    fontFamily: fonts.heading,
  }

  const contentStyle: React.CSSProperties = {
    color: colors.text,
    fontFamily: fonts.body,
  }

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

export default PreviewCard
