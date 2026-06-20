import React, { useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { animateLines } from '@/core/animationEngine'
import { getThemeStyles } from '@/core/themeEngine'
import type { RootState } from '@/store/poemStore'
import type { Poem, PoemLine } from '@/types'

interface PoemPreviewProps {
  poem?: Poem
}

const PoemPreview: React.FC<PoemPreviewProps> = ({ poem: propPoem }) => {
  const storePoem = useSelector((state: RootState) => state.poem.currentPoem)
  const theme = useSelector((state: RootState) => state.poem.theme)
  const previewRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const poem = propPoem || storePoem
  const themeConfig = getThemeStyles(theme || 'default')

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])

  const handleMouseEnter = () => {
    if (previewRef.current) {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      previewRef.current.dataset.animationId = Math.random().toString(36)
      cleanupRef.current = animateLines(previewRef.current, {
        delay: 100,
        duration: 600,
        stagger: 40,
      })
    }
  }

  const handleMouseLeave = () => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    const chars = previewRef.current?.querySelectorAll('.poem-char')
    chars?.forEach((char) => {
      char.style.opacity = '1'
      char.style.transform = 'translateY(0)'
    })
  }

  const renderLine = (line: PoemLine) => (
    <div
      key={line.id}
      className="poem-line"
      style={{
        fontFamily: line.style.fontFamily,
        fontSize: `${line.style.fontSize}px`,
        color: line.style.color,
        lineHeight: line.style.lineHeight,
        textAlign: line.style.textAlign,
        padding: '4px 12px',
        margin: '2px 0',
        borderRadius: 6,
        background: line.style.background || 'transparent',
        transition: 'background 0.3s ease',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {line.text || '点击编辑诗句...'}
    </div>
  )

  if (!poem) {
    return (
      <div style={emptyStyle}>
        <p>选择或创建诗歌开始预览</p>
      </div>
    )
  }

  return (
    <div
      style={{
        ...containerStyle,
        background: themeConfig.backgroundGradient,
      }}
    >
      <div style={headerStyle}>
        <h2 style={{
          ...titleStyle,
          color: themeConfig.cssVariables['--text-primary'],
          fontFamily: themeConfig.fontFamily,
        }}>
          {poem.title || '无题'}
        </h2>
        <p style={{
          ...authorStyle,
          color: themeConfig.cssVariables['--text-secondary'],
        }}>
          {poem.author || '匿名'}
        </p>
      </div>

      <div
        ref={previewRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={contentStyle}
      >
        {poem.paragraphs.map((paragraph, pIndex) => (
          <div key={paragraph.id} style={{ marginBottom: pIndex < poem.paragraphs.length - 1 ? 24 : 0 }}>
            {paragraph.lines.map(renderLine)}
          </div>
        ))}
      </div>

      <p style={hintStyle}>
        悬停预览逐字动画效果
      </p>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  padding: 40,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.5s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 40,
}

const titleStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 600,
  marginBottom: 12,
}

const authorStyle: React.CSSProperties = {
  fontSize: 16,
}

const contentStyle: React.CSSProperties = {
  maxWidth: 600,
  width: '100%',
  cursor: 'default',
}

const hintStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 20,
  fontSize: 12,
  color: 'var(--text-secondary)',
  opacity: 0.6,
}

const emptyStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-secondary)',
  fontSize: 16,
}

export default PoemPreview
