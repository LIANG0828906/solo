import { useRef, useEffect, useState, useCallback } from 'react'
import { Users, Calendar } from 'lucide-react'
import type { Activity } from '@/types'
import { DIFFICULTY_LABELS } from '@/types'

interface ActivityListProps {
  activities: Activity[]
  selectedId: string | null
  onSelect: (id: string) => void
}

const ITEM_HEIGHT = 88
const OVERSCAN = 5

export default function ActivityList({
  activities,
  selectedId,
  onSelect,
}: ActivityListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    observer.observe(container)
    setContainerHeight(container.clientHeight)
    return () => observer.disconnect()
  }, [])

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  const totalHeight = activities.length * ITEM_HEIGHT
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(
    activities.length - 1,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
  )
  const visibleItems = activities.slice(startIndex, endIndex + 1)

  const difficultyColor = (d: Activity['difficulty']) => {
    switch (d) {
      case 'easy': return 'bg-difficulty-easy text-white'
      case 'medium': return 'bg-difficulty-medium text-white'
      case 'hard': return 'bg-difficulty-hard text-white'
    }
  }

  const difficultyBorder = (d: Activity['difficulty']) => {
    switch (d) {
      case 'easy': return 'border-l-difficulty-easy'
      case 'medium': return 'border-l-difficulty-medium'
      case 'hard': return 'border-l-difficulty-hard'
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">活动列表</h2>
        <span className="text-xs text-text-secondary">{activities.length} 个活动</span>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ willChange: 'scroll-position' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map((activity, idx) => {
            const globalIdx = startIndex + idx
            const count = activity.registrationCount || 0
            const isSelected = selectedId === activity.id
            return (
              <div
                key={activity.id}
                style={{
                  position: 'absolute',
                  top: globalIdx * ITEM_HEIGHT,
                  left: 0,
                  right: 0,
                  height: ITEM_HEIGHT,
                }}
              >
                <button
                  onClick={() => onSelect(activity.id)}
                  className={`
                    w-full mx-2 px-3 py-3 rounded-lg border-l-4 text-left
                    transition-all duration-200 ease-out
                    hover:-translate-y-1 hover:shadow-card-hover
                    ${difficultyBorder(activity.difficulty)}
                    ${isSelected
                      ? 'bg-forest-50 shadow-card-hover -translate-y-0.5'
                      : 'bg-surface-card shadow-card hover:bg-gray-50'
                    }
                  `}
                  style={{ width: 'calc(100% - 16px)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-text-primary leading-tight truncate">
                      {activity.name}
                    </h3>
                    <span
                      className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${difficultyColor(activity.difficulty)}`}
                    >
                      {DIFFICULTY_LABELS[activity.difficulty]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {activity.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {count}/{activity.maxMembers}
                    </span>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
