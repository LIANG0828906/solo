import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getThemeStyles } from '@/core/themeEngine'
import type { Poem } from '@/types'

interface PoemCardProps {
  poem: Poem
}

const PoemCard: React.FC<PoemCardProps> = ({ poem }) => {
  const navigate = useNavigate()
  const themeConfig = getThemeStyles(poem.theme)

  const handleClick = () => {
    navigate(`/poem/${poem.id}`)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        ...cardStyle,
        background: themeConfig.backgroundGradient,
        color: themeConfig.cssVariables['--text-primary'],
      }}
    >
      <h3 style={{
        ...titleStyle,
        color: themeConfig.cssVariables['--text-primary'],
        fontFamily: themeConfig.fontFamily,
      }}>
        {poem.title}
      </h3>
      <p style={{
        ...authorStyle,
        color: themeConfig.cssVariables['--text-secondary'],
      }}>
        {poem.author}
      </p>
      <p style={{
        ...firstLineStyle,
        color: themeConfig.cssVariables['--text-primary'],
        fontFamily: themeConfig.fontFamily,
      }}>
        {poem.firstLine}...
      </p>
      <div style={footerStyle}>
        <span style={{
          ...likeStyle,
          color: themeConfig.cssVariables['--text-secondary'],
        }}>
          ♥ {poem.likes}
        </span>
        <span style={{
          ...themeTagStyle,
          backgroundColor: themeConfig.cssVariables['--accent'],
        }}>
          {themeConfig.displayName}
        </span>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  breakInside: 'avoid',
  marginBottom: 20,
}

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  margin: 0,
}

const authorStyle: React.CSSProperties = {
  fontSize: 13,
  margin: 0,
}

const firstLineStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.7,
  margin: '8px 0',
  opacity: 0.9,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 'auto',
  paddingTop: 12,
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}

const likeStyle: React.CSSProperties = {
  fontSize: 13,
}

const themeTagStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  fontSize: 11,
  color: 'white',
}

export default PoemCard
