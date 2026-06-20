import { useRef, useState, useMemo, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  height?: number
  className?: string
  overscan?: number
}

export default function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  height,
  className,
  overscan = 5,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(height || 0)

  const totalHeight = items.length * itemHeight

  useEffect(() => {
    const container = containerRef.current
    if (!container || height) return

    const updateHeight = () => {
      setViewportHeight(container.clientHeight)
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(container)

    return () => observer.disconnect()
  }, [height])

  const effectiveHeight = height || viewportHeight

  const startIndex = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    return Math.max(0, start - overscan)
  }, [scrollTop, itemHeight, overscan])

  const endIndex = useMemo(() => {
    const visibleCount = Math.ceil(effectiveHeight / itemHeight)
    const end = startIndex + visibleCount + overscan * 2
    return Math.min(items.length, end)
  }, [startIndex, effectiveHeight, itemHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, i) => ({
      item,
      index: startIndex + i,
    }))
  }, [items, startIndex, endIndex])

  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  useEffect(() => {
    setScrollTop(0)
  }, [items])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: height || '100%', overflow: 'auto' }}
      className={cn(
        'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
        className
      )}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className="box-border"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
