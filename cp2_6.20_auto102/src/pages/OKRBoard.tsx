import { useEffect, useState, useCallback, useRef } from 'react'
import { useOKRStore, Objective } from '../store/okrStore'
import ObjectiveCard from '../components/ObjectiveCard'
import { v4 as uuidv4 } from 'uuid'

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
  const itemHeight = 140
  const overscan = 3
  const containerHeight = 600

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)
  const visibleItems = items.slice(startIndex, endIndex)

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflowY: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIndex * itemHeight, width: '100%' }}>
          {visibleItems.map(renderItem)}
        </div>
      </div>
    </div>
  )
}

export default function OKRBoard() {
  const { objectives, fetchObjectives, createObjective, moveObjective } = useOKRStore()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useEffect(() => {
    fetchObjectives()
  }, [fetchObjectives])

  const getObjectivesByLevel = useCallback(
    (level: string) => objectives.filter((o) => o.level === level),
    [objectives]
  )

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id !== draggingId) {
      setDragOverId(id)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    if (sourceId && sourceId !== targetId) {
      const sourceObj = objectives.find((o) => o.id === sourceId)
      const targetObj = objectives.find((o) => o.id === targetId)
      if (sourceObj && targetObj) {
        const levelOrder = ['company', 'department', 'individual']
        const sourceLevel = levelOrder.indexOf(sourceObj.level)
        const targetLevel = levelOrder.indexOf(targetObj.level)
        if (sourceLevel > targetLevel) {
          await moveObjective(sourceId, targetId)
        } else if (sourceLevel < targetLevel) {
          await moveObjective(targetId, sourceId)
        }
      }
    }
    setDraggingId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }

  const handleAddObjective = async (level: 'company' | 'department' | 'individual') => {
    const name = prompt('请输入目标名称：')
    if (name) {
      await createObjective({ name, level })
    }
  }

  const renderCard = (obj: Objective) => (
    <ObjectiveCard
      key={obj.id}
      objective={obj}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      isDragOver={dragOverId === obj.id}
    />
  )

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#1e293b' }}>OKR 目标看板</h2>
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
