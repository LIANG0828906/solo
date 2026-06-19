import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KeywordItem, randomThemeColor } from './utils'

interface WordCloudProps {
  keywords: KeywordItem[]
}

export default function WordCloud({ keywords }: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)

  const bubbles = useMemo(() => {
    if (keywords.length === 0) return []

    const maxCount = Math.max(...keywords.map(k => k.count))
    const minCount = Math.min(...keywords.map(k => k.count))
    const range = Math.max(1, maxCount - minCount)

    return keywords.map(k => {
      const ratio = (k.count - minCount) / range
      const fontSize = 12 + ratio * 36
      return {
        ...k,
        fontSize,
        color: randomThemeColor(),
      }
    })
  }, [keywords])

  if (keywords.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          color: '#CCC',
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p style={{ marginTop: 12, fontSize: 13 }}>暂无关键词</p>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          padding: 16,
          gap: 8,
          minHeight: 300,
        }}
      >
        <AnimatePresence mode="popLayout">
          {bubbles.map((bubble) => {
            const isHovered = hoveredWord === bubble.word
            return (
              <motion.div
                key={bubble.word}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: 1,
                  scale: isHovered ? 1.1 : 1,
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onMouseEnter={() => setHoveredWord(bubble.word)}
                onMouseLeave={() => setHoveredWord(null)}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: `${bubble.fontSize * 0.2}px ${bubble.fontSize * 0.4}px`,
                  borderRadius: bubble.fontSize,
                  backgroundColor: `${bubble.color}15`,
                  cursor: 'default',
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: bubble.fontSize,
                    fontWeight: 500 + Math.floor(bubble.fontSize / 48 * 300),
                    color: bubble.color,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {bubble.word}
                </span>

                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: -4 }}
                      exit={{ opacity: 0, y: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '4px 10px',
                        backgroundColor: 'rgba(51,51,51,0.9)',
                        color: '#fff',
                        fontSize: 12,
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    >
                      出现 {bubble.count} 次
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <div
        style={{
          marginTop: 8,
          textAlign: 'center',
          fontSize: 11,
          color: '#AAA',
        }}
      >
        共 {keywords.length} 个关键词 · 悬停查看词频
      </div>
    </div>
  )
}
