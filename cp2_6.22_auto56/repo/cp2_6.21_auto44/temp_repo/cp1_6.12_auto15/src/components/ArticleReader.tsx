import React, { useEffect, useRef, useCallback } from 'react'
import type { Highlight } from '../main'

interface ArticleReaderProps {
  paragraphs: { id: number; text: string }[]
  highlights: Highlight[]
  onProgressChange: (progress: number) => void
  onEstimatedTimeChange: (time: number) => void
  onAddHighlight: (highlight: Highlight) => void
}

const ArticleReader: React.FC<ArticleReaderProps> = ({
  paragraphs,
  highlights,
  onProgressChange,
  onEstimatedTimeChange,
  onAddHighlight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)
  const scrollSpeeds = useRef<number[]>([])
  const rafId = useRef<number | null>(null)
  const totalWordCount = useRef(0)

  useEffect(() => {
    totalWordCount.current = paragraphs.reduce((sum, p) => sum + p.text.length, 0)
  }, [paragraphs])

  const calculateProgress = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
    const progress = scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0
    return { scrollTop, progress }
  }, [])

  const calculateEstimatedTime = useCallback((scrollTop: number) => {
    const currentSpeed = Math.abs(scrollTop - lastScrollTop.current)
    if (currentSpeed > 0) {
      scrollSpeeds.current.push(currentSpeed)
      if (scrollSpeeds.current.length > 20) {
        scrollSpeeds.current.shift()
      }
    }
    lastScrollTop.current = scrollTop

    const avgSpeed =
      scrollSpeeds.current.length > 0
        ? scrollSpeeds.current.reduce((a, b) => a + b, 0) / scrollSpeeds.current.length
        : 50

    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
    const remainingScroll = Math.max(0, scrollHeight - scrollTop)
    const estimatedSeconds = avgSpeed > 0 ? remainingScroll / avgSpeed / 2 : 0

    return Math.round(estimatedSeconds)
  }, [])

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return

    rafId.current = requestAnimationFrame(() => {
      const { scrollTop, progress } = calculateProgress()
      onProgressChange(progress)
      const estimatedTime = calculateEstimatedTime(scrollTop)
      onEstimatedTimeChange(estimatedTime)
      rafId.current = null
    })
  }, [calculateProgress, calculateEstimatedTime, onProgressChange, onEstimatedTimeChange])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [handleScroll])

  const renderHighlightedText = useCallback(
    (text: string, paragraphIndex: number) => {
      const paragraphHighlights = highlights.filter(h => h.paragraphIndex === paragraphIndex)
      if (paragraphHighlights.length === 0) return text

      let result: (string | React.ReactNode)[] = [text]
      paragraphHighlights.forEach((highlight, idx) => {
        const newResult: (string | React.ReactNode)[] = []
        result.forEach(part => {
          if (typeof part !== 'string') {
            newResult.push(part)
            return
          }
          const foundIndex = part.indexOf(highlight.text)
          if (foundIndex === -1) {
            newResult.push(part)
          } else {
            if (foundIndex > 0) {
              newResult.push(part.slice(0, foundIndex))
            }
            newResult.push(
              <span
                key={`${highlight.id}-${idx}`}
                style={{
                  background: 'linear-gradient(90deg, #FFF8DC 0%, #FFE4B5 100%)',
                  borderRadius: '3px',
                  padding: '1px 3px',
                }}
              >
                {highlight.text}
              </span>
            )
            const remaining = part.slice(foundIndex + highlight.text.length)
            if (remaining.length > 0) {
              newResult.push(remaining)
            }
          }
        })
        result = newResult
      })
      return result
    },
    [highlights]
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent, paragraphIndex: number) => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      if (!selectedText || selectedText.length < 2) return

      const paragraphText = paragraphs[paragraphIndex]?.text || ''
      const startOffset = paragraphText.indexOf(selectedText)
      if (startOffset === -1) return

      const highlight: Highlight = {
        id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: selectedText,
        startOffset,
        endOffset: startOffset + selectedText.length,
        paragraphIndex,
      }
      onAddHighlight(highlight)
      selection?.removeAllRanges()
    },
    [paragraphs, onAddHighlight]
  )

  if (paragraphs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '16px', opacity: 0.7 }}>
        正在加载文章...
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        paddingBottom: '80px',
      }}
    >
      <h1
        style={{
          fontSize: '32px',
          fontWeight: 700,
          lineHeight: 1.3,
          marginBottom: '12px',
        }}
      >
        莫兰迪色系的设计哲学与应用艺术
      </h1>
      <p
        style={{
          fontSize: '14px',
          opacity: 0.6,
          marginBottom: '40px',
          fontStyle: 'italic',
        }}
      >
        ——探索低饱和度色彩如何塑造宁静和谐的视觉体验
      </p>

      {paragraphs.map((paragraph, index) => (
        <p
          key={paragraph.id}
          id={`paragraph-${index}`}
          onDoubleClick={e => handleDoubleClick(e, index)}
          style={{
            fontSize: '17px',
            lineHeight: 1.9,
            marginBottom: '24px',
            letterSpacing: '0.3px',
            cursor: 'text',
            userSelect: 'text',
          }}
        >
          {renderHighlightedText(paragraph.text, index)}
        </p>
      ))}
    </div>
  )
}

export default ArticleReader
