import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { CareEvent, EventType } from '@/types'

const eventTypeConfig: Record<EventType, { label: string; color: string }> = {
  water: { label: '浇水', color: '#3b82f6' },
  fertilize: { label: '施肥', color: '#a855f7' },
  repot: { label: '换盆', color: '#22c55e' },
  prune: { label: '修剪', color: '#f97316' },
}

interface EventListProps {
  events: CareEvent[]
  onDelete: (eventId: string) => void
}

const ITEM_HEIGHT = 88
const MAX_RENDER_ITEMS = 50
const OVERSCAN = 5

export default function EventList({ events, onDelete }: EventListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(500)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      setViewportHeight(containerRef.current.clientHeight || 500)
    }
  }, [])

  const totalHeight = useMemo(
    () => events.length * ITEM_HEIGHT,
    [events.length]
  )

  const startIndex = useMemo(() => {
    const raw = Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN
    return Math.max(0, raw)
  }, [scrollTop])

  const endIndex = useMemo(() => {
    const visibleCount = Math.ceil(viewportHeight / ITEM_HEIGHT) + OVERSCAN * 2
    const count = Math.min(MAX_RENDER_ITEMS, visibleCount)
    return Math.min(startIndex + count, events.length)
  }, [startIndex, viewportHeight, events.length])

  const visibleEvents = useMemo(
    () => events.slice(startIndex, endIndex),
    [events, startIndex, endIndex]
  )

  const offsetY = startIndex * ITEM_HEIGHT

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  const actualRenderedCount = endIndex - startIndex

  return (
    <div className="relative">
      {events.length > MAX_RENDER_ITEMS && (
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
          共 {events.length} 条记录，当前渲染 {actualRenderedCount} 条（虚拟滚动）
        </div>
      )}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto"
        style={{ maxHeight: 500, position: 'relative', borderRadius: 8 }}
      >
        {events.length === 0 ? (
          <div className="text-center py-8" style={{ color: '#94a3b8', fontSize: 14 }}>
            暂无养护记录
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative', width: '100%' }}>
            <div
              style={{
                transform: `translateY(${offsetY}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
              }}
            >
              {visibleEvents.map((event, localIndex) => {
                const config = eventTypeConfig[event.type]
                const globalIndex = startIndex + localIndex
                return (
                  <div
                    key={event.id}
                    data-event-id={event.id}
                    data-index={globalIndex}
                    className="flex gap-3 animate-fade-in-up opacity-0"
                    style={{
                      height: ITEM_HEIGHT - 8,
                      marginBottom: 8,
                      padding: '0 4px',
                      animationDelay: `${Math.min(localIndex * 0.01, 0.3)}s`,
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        borderRadius: 4,
                        background: config.color,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      className="flex-1 flex items-center justify-between px-4"
                      style={{
                        background: '#ffffff',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        transition: 'box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 500,
                              color: '#334155',
                              flexShrink: 0,
                            }}
                          >
                            {config.label}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8' }}>
                            {event.date}
                          </span>
                        </div>
                        {event.notes && (
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 400,
                              color: '#64748b',
                              margin: '4px 0 0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={event.notes}
                          >
                            {event.notes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(event.id)
                        }}
                        className="transition-colors ml-3 flex-shrink-0 opacity-40 hover:opacity-100"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 6,
                          color: '#ef4444',
                          borderRadius: 6,
                          fontSize: 14,
                          lineHeight: 1,
                        }}
                        title="删除记录"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
