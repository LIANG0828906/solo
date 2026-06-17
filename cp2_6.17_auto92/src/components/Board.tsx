import { useState, useEffect, useCallback } from 'react'
import Column from './Column'
import TaskCard, { DetailPanel } from './TaskCard'
import { useBoardStore } from '../store'
import { Task, ColumnId } from '../types'

export default function Board() {
  const columns = useBoardStore((s) => s.columns)
  const columnOrder = useBoardStore((s) => s.columnOrder)
  const onlineUsers = useBoardStore((s) => s.onlineUsers)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [onlineCount, setOnlineCount] = useState(onlineUsers)

  useEffect(() => {
    const base = 1 + Math.floor(Math.random() * 3)
    setOnlineCount(base)
    const timer = setInterval(() => {
      const variation = Math.floor(Math.random() * 5) - 2
      setOnlineCount(Math.max(1, base + variation))
    }, 10000)
    return () => clearInterval(timer)
  }, [onlineUsers])

  const handleOpenDetail = useCallback((task: Task) => {
    setDetailTask(task)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetailTask(null)
  }, [])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseDetail()
    }
  }, [handleCloseDetail])

  return (
    <div className="board-container">
      <header className="board-header">
        <div className="brand-area">
          <h1 className="brand-title">TaskPulse</h1>
          <div className="online-indicator">
            <span className="online-dot" />
            <span>{onlineCount} 人在线</span>
          </div>
        </div>
      </header>

      <main className="board-main">
        {columnOrder.map((colId: ColumnId) => {
          const col = columns[colId]
          return (
            <Column
              key={col.id}
              column={col}
              onOpenDetail={handleOpenDetail}
            />
          )
        })}
      </main>

      {detailTask && (
        <div className="detail-panel-overlay" onClick={handleBackdropClick}>
          <DetailPanel task={detailTask} onClose={handleCloseDetail} />
        </div>
      )}
    </div>
  )
}
