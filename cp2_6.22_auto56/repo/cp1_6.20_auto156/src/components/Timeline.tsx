import { useState, useRef, useEffect, useMemo } from 'react'
import { TimelineItem } from '@/types'
import { formatTime } from '@/utils/format'

interface TimelineProps {
  items: TimelineItem[]
  markedTimestamps: number[]
  onTimestampClick: (timestamp: number) => void
  currentTime: number
}

export default function Timeline({
  items,
  markedTimestamps,
  onTimestampClick,
  currentTime,
}: TimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hoveredMark, setHoveredMark] = useState<number | null>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const markCounts = useMemo(() => {
    const counts = new Map<number, number>()
    markedTimestamps.forEach((ts) => {
      counts.set(ts, (counts.get(ts) || 0) + 1)
    })
    return counts
  }, [markedTimestamps])

  const maxTimestamp = useMemo(() => {
    if (items.length === 0) return 0
    return Math.max(...items.map((item) => item.timestamp))
  }, [items])

  const getMarkPosition = (timestamp: number) => {
    if (maxTimestamp === 0) return 0
    return (timestamp / maxTimestamp) * 100
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleItemClick = (timestamp: number) => {
    onTimestampClick(timestamp)
  }

  useEffect(() => {
    const activeItem = items.find((item) => {
      const idx = items.findIndex((i) => i.id === item.id)
      const nextItem = items[idx + 1]
      if (nextItem) {
        return currentTime >= item.timestamp && currentTime < nextItem.timestamp
      }
      return currentTime >= item.timestamp
    })

    if (activeItem) {
      const element = itemRefs.current.get(activeItem.id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [currentTime, items])

  const isActive = (item: TimelineItem, index: number) => {
    const nextItem = items[index + 1]
    if (nextItem) {
      return currentTime >= item.timestamp && currentTime < nextItem.timestamp
    }
    return currentTime >= item.timestamp
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative mb-4 h-3 rounded-[10px] bg-background-darker shadow-inner">
        <div
          className="absolute left-0 top-0 h-full rounded-[10px] bg-primary transition-all duration-300"
          style={{ width: maxTimestamp > 0 ? `${(currentTime / maxTimestamp) * 100}%` : '0%' }}
        />
        {Array.from(markCounts.entries()).map(([timestamp, count]) => (
          <div
            key={timestamp}
            className="absolute top-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${getMarkPosition(timestamp)}%` }}
            onClick={() => onTimestampClick(timestamp)}
            onMouseEnter={() => setHoveredMark(timestamp)}
            onMouseLeave={() => setHoveredMark(null)}
          >
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: '#FF9F43' }}
            />
            {hoveredMark === timestamp && (
              <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
                {count} 条留言
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {items.map((item, index) => {
            const active = isActive(item, index)
            const expanded = expandedId === item.id

            return (
              <div
                key={item.id}
                ref={(el) => {
                  if (el) {
                    itemRefs.current.set(item.id, el)
                  }
                }}
                className={`cursor-pointer rounded-[10px] p-3 transition-all duration-300 shadow-inner ${
                  active
                    ? 'bg-primary/20 border border-primary/40'
                    : 'bg-background-darker border border-transparent hover:border-primary/30'
                }`}
                onClick={() => handleItemClick(item.timestamp)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: '#FF9F43' }}
                      >
                        {formatTime(item.timestamp)}
                      </span>
                      <span className="text-text-light font-medium">
                        {item.title}
                      </span>
                    </div>
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        maxHeight: expanded ? '500px' : '0px',
                        opacity: expanded ? 1 : 0,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="pt-2 text-sm text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <button
                    className="ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-background-dark text-gray-400 transition-transform duration-300 hover:text-text-light"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(item.id)
                    }}
                  >
                    <svg
                      className={`h-4 w-4 transition-transform duration-300 ${
                        expanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
