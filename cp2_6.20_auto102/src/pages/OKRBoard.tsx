import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useOKRStore, Objective } from '../store/okrStore'
import ObjectiveCard from '../components/ObjectiveCard'

const LEVEL_CONFIG = [
  { key: 'company' as const, label: '公司级' },
  { key: 'department' as const, label: '部门级' },
  { key: 'individual' as const, label: '个人级' },
]

interface VirtualColumnProps {
  items: Objective[]
  renderItem: (obj: Objective) => React.ReactNode
}

const VirtualColumn = ({ items, renderItem }: VirtualColumnProps) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const measuredHeights = useRef<Record<string, number>>({})
  const [revision, setRevision] = useState(0)
  const estimatedHeight = 140
  const overscan = 3
  const containerHeight = 600

  const offsets = useMemo(() => {
    const result: number[] = []
    let acc = 0
    for (const item of items) {
      result.push(acc)
      acc += measuredHeights.current[item.id] ?? estimatedHeight
    }
    return result
  }, [items, estimatedHeight, revision])

  const totalHeight = offsets.length > 0
    ? offsets[offsets.length - 1] + (measuredHeights.current[items[items.length - 1]?.id] ?? estimatedHeight)
    : 0

  let startIdx = 0
  for (let i = 0; i < offsets.length; i++) {
    if (offsets[i] > scrollTop) { startIdx = i; break }
    startIdx = i
  }
  let endIdx = items.length - 1
  for (let i = startIdx; i < offsets.length; i++) {
    if (offsets[i] > scrollTop + containerHeight) { endIdx = i; break }
    endIdx = i
  }

  const startIndex = Math.max(0, startIdx - overscan)
  const endIndex = Math.min(items.length, endIdx + overscan + 1)
  const visibleItems = items.slice(startIndex, endIndex)

  const visibleKey = visibleItems.map((o) => o.id).join(',')

  useEffect(() => {
    if (!innerRef.current) return
    const observer = new ResizeObserver((entries) => {
      let changed = false
      for (const entry of entries) {
        const id = entry.target.getAttribute('data-item-id')
        if (id) {
          const height = Math.round(entry.contentRect.height + 16)
          if (measuredHeights.current[id] !== height) {
            measuredHeights.current[id] = height
            changed = true
          }
        }
      }
      if (changed) setRevision((n) => n + 1)
    })
    const cards = innerRef.current.querySelectorAll('[data-item-id]')
    cards.forEach((card) => observer.observe(card))
    return () => observer.disconnect()
  }, [visibleKey])

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflowY: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div ref={innerRef} style={{ position: 'absolute', top: offsets[startIndex] || 0, width: '100%' }}>
          {visibleItems.map((obj) => (
            <div key={obj.id} data-item-id={obj.id}>
              {renderItem(obj)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function OKRBoard() {
  const { objectives, fetchObjectives, createObjective, moveObjective, isDragLoading, setDragLoading, setObjectives } = useOKRStore()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const prevObjectivesRef = useRef<Objective[]>([])

  useEffect(() => {
    fetchObjectives()
  }, [fetchObjectives])

  const getObjectivesByLevel = useCallback(
    (level: string) => objectives.filter((o) => o.level === level),
    [objectives]
  )

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isDragLoading) return
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (isDragLoading) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== draggingId) {
      setDragOverId(id)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (isDragLoading) return

    const sourceId = e.dataTransfer.getData('text/plain')
    if (sourceId && sourceId !== targetId) {
      const sourceObj = objectives.find((o) => o.id === sourceId)
      const targetObj = objectives.find((o) => o.id === targetId)
      if (sourceObj && targetObj) {
        const levelOrder = ['company', 'department', 'individual']
        const sourceLevel = levelOrder.indexOf(sourceObj.level)
        const targetLevel = levelOrder.indexOf(targetObj.level)

        prevObjectivesRef.current = [...objectives]
        setDragLoading(true)

        try {
          if (sourceLevel > targetLevel) {
            await moveObjective(sourceId, targetId)
          } else if (sourceLevel < targetLevel) {
            await moveObjective(targetId, sourceId)
          }
          await fetchObjectives()
        } catch (e) {
          setObjectives(prevObjectivesRef.current)
        } finally {
          setDragLoading(false)
        }
      }
    }
    setDraggingId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    if (isDragLoading) return
    setDraggingId(null)
    setDragOverId(null)
  }

  const handleAddObjective = async (level: 'company' | 'department' | 'individual') => {
    const name = prompt('请输入目标名称：')
    if (name) {
      await createObjective({ name, level })
      await fetchObjectives()
    }
  }

  const renderCard = useCallback((obj: Objective) => (
    <ObjectiveCard
      key={obj.id}
      objective={obj}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      isDragOver={dragOverId === obj.id}
      isDragDisabled={isDragLoading}
    />
  ), [dragOverId, isDragLoading, objectives])

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#1e293b' }}>OKR 目标看板</h2>
      {isDragLoading && (
        <div style={{
          position: 'fixed', top: 0, left: 240, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.3)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', padding: '16px 32px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            正在更新目标关系...
          </div>
        </div>
      )}
      <div className="board-container">
        {LEVEL_CONFIG.map(({ key, label }) => {
          const items = getObjectivesByLevel(key)
          return (
            <div key={key} className="board-column">
              <div className="column-header">
                <span className="level-badge">{label}</span>
                <span className="count-badge">{items.length}</span>
              </div>
              <VirtualColumn items={items} renderItem={renderCard} />
              <button className="add-objective-btn" onClick={() => handleAddObjective(key)}>
                + 添加{label}目标
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
