import { useRef, useEffect, useState, useCallback } from 'react'
import { Package } from 'lucide-react'
import type { Equipment, EquipmentCategory } from '@/types'
import { CATEGORY_LABELS } from '@/types'

interface EquipmentPanelProps {
  equipment: Equipment[]
}

const ITEM_HEIGHT = 64
const HEADER_HEIGHT = 36
const OVERSCAN = 3

function getOccupancyColor(rate: number): string {
  if (rate <= 50) return 'bg-difficulty-easy'
  if (rate <= 80) return 'bg-difficulty-medium'
  return 'bg-difficulty-hard'
}

function getOccupancyTrack(rate: number): string {
  if (rate <= 50) return 'bg-difficulty-easy/20'
  if (rate <= 80) return 'bg-difficulty-medium/20'
  return 'bg-difficulty-hard/20'
}

export default function EquipmentPanel({ equipment }: EquipmentPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  const categories = Object.entries(CATEGORY_LABELS) as [EquipmentCategory, string][]

  const groupedItems: Array<{
    type: 'header' | 'item'
    category?: EquipmentCategory
    label?: string
    equipment?: Equipment
  }> = []

  categories.forEach(([cat, label]) => {
    const items = equipment.filter((e) => e.category === cat)
    if (items.length > 0) {
      groupedItems.push({ type: 'header', category: cat, label })
      items.forEach((item) => {
        groupedItems.push({ type: 'item', equipment: item })
      })
    }
  })

  const rowHeights = groupedItems.map((item) =>
    item.type === 'header' ? HEADER_HEIGHT : ITEM_HEIGHT
  )
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0)

  const rowPositions: number[] = []
  let pos = 0
  rowHeights.forEach((h) => {
    rowPositions.push(pos)
    pos += h
  })

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

  const visibleStart = scrollTop - 200
  const visibleEnd = scrollTop + containerHeight + 200

  const visibleRows = groupedItems.filter((_, idx) => {
    const rowTop = rowPositions[idx]
    const rowBottom = rowTop + rowHeights[idx]
    return rowBottom >= visibleStart && rowTop <= visibleEnd
  })

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">装备清单</h2>
        <Package size={14} className="text-text-secondary" />
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2"
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleRows.map((row, idx) => {
            const globalIdx = groupedItems.indexOf(row)
            const top = rowPositions[globalIdx]

            if (row.type === 'header') {
              return (
                <div
                  key={`header-${row.category}`}
                  style={{ position: 'absolute', top, left: 0, right: 0, height: HEADER_HEIGHT }}
                  className="flex items-center px-1"
                >
                  <span className="text-xs font-semibold text-earth-dark tracking-wide">
                    {row.label}
                  </span>
                </div>
              )
            }

            const eq = row.equipment!
            const rate = eq.totalStock > 0 ? Math.round((eq.allocated / eq.totalStock) * 100) : 0
            const isOverThreshold = rate > 80

            return (
              <div
                key={eq.id}
                style={{ position: 'absolute', top, left: 0, right: 0, height: ITEM_HEIGHT }}
                className={`
                  mx-0.5 mb-1 px-3 py-2 rounded-lg
                  transition-all duration-200 ease-out
                  hover:-translate-y-0.5 hover:shadow-card-hover
                  ${isOverThreshold ? 'animate-pulse-highlight rounded-lg' : 'bg-surface-card shadow-card'}
                `}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-text-primary truncate">{eq.name}</span>
                  <span className="text-xs text-text-secondary shrink-0 ml-2">
                    {eq.allocated}/{eq.totalStock}
                  </span>
                </div>
                <div className={`h-1.5 rounded-full ${getOccupancyTrack(rate)}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getOccupancyColor(rate)}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <div className="flex justify-end mt-1">
                  <span className={`text-[10px] font-medium ${rate > 80 ? 'text-difficulty-hard' : 'text-text-secondary'}`}>
                    {rate}% 占用
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
