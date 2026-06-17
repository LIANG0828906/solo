import { useState, useRef, useCallback, useEffect } from 'react'
import TaskCard from './TaskCard'
import { useBoardStore } from '../store'
import { Column as ColumnType, ColumnId, Task } from '../types'

interface ColumnProps {
  column: ColumnType
  onOpenDetail: (task: Task) => void
}

interface DragInfo {
  taskId: string
  fromColumn: ColumnId
}

export default function Column({ column, onOpenDetail }: ColumnProps) {
  const tasks = useBoardStore((s) => s.tasks)
  const deletingTaskIds = useBoardStore((s) => s.deletingTaskIds)
  const createTask = useBoardStore((s) => s.createTask)
  const moveTask = useBoardStore((s) => s.moveTask)
  const reorderTask = useBoardStore((s) => s.reorderTask)

  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const dragOverTimer = useRef<number | null>(null)

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showInput])

  const taskList = column.taskIds
    .map((id) => tasks[id])
    .filter((t): t is Task => !!t)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (inputValue.trim()) {
        createTask(column.id, inputValue)
      }
      setInputValue('')
      setShowInput(false)
    },
    [inputValue, column.id, createTask]
  )

  const handleInputBlur = useCallback(() => {
    if (!inputValue.trim()) {
      setInputValue('')
      setShowInput(false)
    }
  }, [inputValue])

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInputValue('')
      setShowInput(false)
    }
  }, [])

  const computeInsertIndex = useCallback(
    (clientY: number): number => {
      const listEl = listRef.current
      if (!listEl) return 0
      const listRect = listEl.getBoundingClientRect()

      let idx = taskList.length
      for (let i = 0; i < taskList.length; i++) {
        const t = taskList[i]
        const cardEl = cardRefs.current.get(t.id)
        if (!cardEl) continue
        const rect = cardEl.getBoundingClientRect()
        const midpoint = rect.top + rect.height / 2
        if (clientY < midpoint) {
          idx = i
          break
        }
      }
      if (clientY > listRect.bottom && taskList.length === 0) {
        idx = 0
      }
      return Math.max(0, Math.min(idx, taskList.length))
    },
    [taskList]
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent, taskId: string) => {
      const info: DragInfo = { taskId, fromColumn: column.id }
      e.dataTransfer.setData('application/json', JSON.stringify(info))
      e.dataTransfer.effectAllowed = 'move'
      try {
        const cardEl = cardRefs.current.get(taskId)
        if (cardEl) {
          e.dataTransfer.setDragImage(cardEl, 20, 20)
        }
      } catch {
        // ignore
      }
    },
    [column.id]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setIsDragOver(true)

      if (dragOverTimer.current !== null) {
        cancelAnimationFrame(dragOverTimer.current)
      }
      dragOverTimer.current = requestAnimationFrame(() => {
        const idx = computeInsertIndex(e.clientY)
        setInsertIndex(idx)
        dragOverTimer.current = null
      })
    },
    [computeInsertIndex]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
      setInsertIndex(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const raw = e.dataTransfer.getData('application/json')
      let info: DragInfo | null = null
      try {
        info = raw ? (JSON.parse(raw) as DragInfo) : null
      } catch {
        info = null
      }
      if (!info) {
        setInsertIndex(null)
        return
      }

      const targetIdx = computeInsertIndex(e.clientY)
      setInsertIndex(null)

      const { taskId, fromColumn } = info
      if (fromColumn === column.id) {
        const currentIdx = column.taskIds.indexOf(taskId)
        if (currentIdx === -1) return
        let effectiveIdx = targetIdx
        if (targetIdx > currentIdx) effectiveIdx = targetIdx - 1
        if (effectiveIdx === currentIdx) return
        reorderTask(taskId, column.id, effectiveIdx)
      } else {
        moveTask(taskId, fromColumn, column.id, targetIdx)
      }
    },
    [column, computeInsertIndex, moveTask, reorderTask]
  )

  const handleDragEnd = useCallback(() => {
    setIsDragOver(false)
    setInsertIndex(null)
    if (dragOverTimer.current !== null) {
      cancelAnimationFrame(dragOverTimer.current)
      dragOverTimer.current = null
    }
  }, [])

  const computeInsertLineTop = useCallback((): number => {
    if (insertIndex === null) return -1000
    const listEl = listRef.current
    if (!listEl) return -1000
    const listRect = listEl.getBoundingClientRect()

    if (taskList.length === 0 || insertIndex === 0) {
      return 0
    }
    if (insertIndex >= taskList.length) {
      const last = taskList[taskList.length - 1]
      const lastEl = cardRefs.current.get(last.id)
      if (lastEl) {
        const r = lastEl.getBoundingClientRect()
        return r.bottom - listRect.top + 5
      }
      return listEl.offsetHeight
    }
    const before = taskList[insertIndex]
    const beforeEl = cardRefs.current.get(before.id)
    if (beforeEl) {
      const r = beforeEl.getBoundingClientRect()
      return r.top - listRect.top - 5
    }
    return 0
  }, [insertIndex, taskList])

  const insertLineTop = computeInsertLineTop()

  return (
    <div
      className={`column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      <div className="column-header">
        <span className="column-title">{column.title}</span>
        <span className="column-badge">{column.taskIds.length}</span>
      </div>

      {showInput && (
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="add-task-input"
            placeholder="输入任务标题，按回车创建..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
        </form>
      )}

      <div className="task-list" ref={listRef}>
        {insertIndex !== null && (
          <div
            className="insert-line"
            style={{ top: `${insertLineTop}px` }}
          />
        )}
        {taskList.map((task) => {
          const isDeleting = deletingTaskIds.has(task.id)
          return (
            <TaskCard
              key={task.id}
              task={task}
              isDeleting={isDeleting}
              refEl={(el) => {
                if (el) {
                  cardRefs.current.set(task.id, el)
                } else {
                  cardRefs.current.delete(task.id)
                }
              }}
              onDragStart={(e) => handleDragStart(e, task.id)}
              onClick={() => onOpenDetail(task)}
            />
          )
        })}
      </div>

      {!showInput && (
        <button
          type="button"
          className="add-task-btn"
          onClick={() => setShowInput(true)}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
          <span>添加任务</span>
        </button>
      )}
    </div>
  )
}
