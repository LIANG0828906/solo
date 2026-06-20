import { useState, useMemo } from 'react'
import type { Bookmark } from '../server'

interface BookmarkCardProps {
  bookmark: Bookmark
  isHighlighted: boolean
  animationDelay: number
  onDelete: (id: string) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  design: '#e57373',
  programming: '#64b5f6',
  writing: '#81c784',
  life: '#ffb74d'
}

const TYPE_LABELS: Record<string, string> = {
  text: '📝 文本',
  image: '🖼️ 图片',
  note: '📌 笔记'
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function generateSoftColor(input: string): string {
  const hash = hashString(input)
  const hue = hash % 360
  const saturation = 35 + (hash % 16)
  const lightness = 82 + (hash % 9)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

function randomWidth(id: string): number {
  const hash = hashString(id)
  return 180 + (hash % 41)
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function BookmarkCard({ bookmark, isHighlighted, animationDelay, onDelete }: BookmarkCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const bgColor = useMemo(() => generateSoftColor(bookmark.category + bookmark.id), [bookmark.category, bookmark.id])
  const cardWidth = useMemo(() => randomWidth(bookmark.id), [bookmark.id])
  const categoryColor = CATEGORY_COLORS[bookmark.category] || '#999'

  return (
    <div
      style={{
        width: cardWidth,
        perspective: '1000px',
        animationDelay: `${animationDelay}ms`,
        display: 'inline-block'
      }}
      onMouseEnter={() => {
        setIsFlipped(true)
        setIsHovering(true)
      }}
      onMouseLeave={() => {
        setIsFlipped(false)
        setIsHovering(false)
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 500ms ease',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        <div
          style={{
            background: bgColor,
            borderRadius: 12,
            padding: 16,
            boxShadow: isHovering
              ? '0 4px 16px rgba(0,0,0,0.12)'
              : '0 2px 8px rgba(0,0,0,0.06)',
            transform: isHovering ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'box-shadow 300ms ease, transform 300ms ease',
            border: isHighlighted ? `2px solid ${categoryColor}` : '2px solid transparent',
            backfaceVisibility: 'hidden',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 999,
                background: `${categoryColor}30`,
                color: categoryColor,
                fontWeight: 500
              }}
            >
              {TYPE_LABELS[bookmark.type]}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(bookmark.id)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                color: '#999',
                padding: 2,
                opacity: isHovering ? 1 : 0,
                transition: 'opacity 200ms'
              }}
              title="删除"
            >
              ×
            </button>
          </div>

          {bookmark.type === 'image' ? (
            <div
              style={{
                width: 80,
                height: 80,
                margin: '0 auto 12px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            >
              <img
                src={bookmark.content}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          ) : (
            <p
              style={{
                color: '#333',
                fontSize: 13,
                lineHeight: 1.6,
                marginBottom: 12,
                wordBreak: 'break-word',
                animation: isHovering ? 'textColorShift 2s ease-in-out infinite' : 'none'
              }}
            >
              {bookmark.content}
            </p>
          )}

          {bookmark.note && (
            <p
              style={{
                fontSize: 11,
                color: '#888',
                fontStyle: 'italic',
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px dashed rgba(0,0,0,0.1)'
              }}
            >
              💭 {bookmark.note}
            </p>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: bgColor,
            borderRadius: 12,
            padding: 16,
            boxShadow: isHovering
              ? '0 4px 16px rgba(0,0,0,0.12)'
              : '0 2px 8px rgba(0,0,0,0.06)',
            transform: 'rotateY(180deg) translateY(-2px)',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            border: isHighlighted ? `2px solid ${categoryColor}` : '2px solid transparent'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>保存时间</p>
            <p
              style={{
                fontSize: 14,
                color: '#333',
                fontWeight: 500,
                marginBottom: 16
              }}
            >
              🕐 {formatTimestamp(bookmark.timestamp)}
            </p>
            <p style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>备注</p>
            <p
              style={{
                fontSize: 13,
                color: '#333',
                fontStyle: bookmark.note ? 'normal' : 'italic'
              }}
            >
              {bookmark.note || '暂无备注'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookmarkCard
