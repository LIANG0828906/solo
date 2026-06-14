import { useState, useRef, useCallback } from 'react'
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

const ITEM_HEIGHT = 80
const VISIBLE_COUNT = 50

export default function EventList({ events, onDelete }: EventListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = events.length * ITEM_HEIGHT
  const startIndex = Math.floor(scrollTop / ITEM_HEIGHT)
  const endIndex = Math.min(startIndex + VISIBLE_COUNT, events.length)
  const visibleEvents = events.slice(startIndex, endIndex)
  const offsetY = startIndex * ITEM_HEIGHT

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-y-auto"
      style={{ maxHeight: 500, position: 'relative' }}
    >
      {events.length === 0 ? (
        <div className="text-center py-8" style={{ color: '#94a3b8', fontSize: 14 }}>
          暂无养护记录
        </div>
      ) : (
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', top: 0, left: 0, right: 0 }}>
            {visibleEvents.map((event) => {
              const config = eventTypeConfig[event.type]
              return (
                <div
                  key={event.id}
                  className="flex gap-3"
                  style={{ height: ITEM_HEIGHT, marginBottom: 8, padding: '0 4px' }}
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
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 16, fontWeight: 500, color: '#334155' }}>
                          {config.label}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8' }}>
                          {event.date}
                        </span>
                      </div>
                      {event.notes && (
                        <p style={{ fontSize: 14, fontWeight: 400, color: '#64748b', margin: '4px 0 0' }}>
                          {event.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(event.id)
                      }}
                      className="text-gray-400 hover:text-red-400 transition-colors ml-3"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                      title="删除"
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
  )
}
