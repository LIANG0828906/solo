import React, { useState } from 'react'
import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import { useBoardStore } from '../store'
import Column from './Column'

const Board: React.FC = () => {
  const columns = useBoardStore((s) => s.columns)
  const cards = useBoardStore((s) => s.cards)
  const moveCard = useBoardStore((s) => s.moveCard)
  const addColumn = useBoardStore((s) => s.addColumn)
  const confirmDeleteColumnId = useBoardStore((s) => s.confirmDeleteColumnId)

  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [showAddColumn, setShowAddColumn] = useState(false)

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  const getCardsForColumn = (columnId: string) =>
    cards.filter((card) => card.columnId === columnId)

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return
    moveCard(
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    )
  }

  const handleAddColumn = () => {
    const trimmed = newColumnTitle.trim()
    if (!trimmed) return
    addColumn(trimmed)
    setNewColumnTitle('')
    setShowAddColumn(false)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="wc-board">
        {sortedColumns.map((column) => (
          <Column
            key={column.id}
            column={column}
            cards={getCardsForColumn(column.id)}
            confirmDeleteId={confirmDeleteColumnId}
          />
        ))}

        <div className="wc-add-column-wrapper">
          {showAddColumn ? (
            <div className="wc-add-column-form">
              <input
                type="text"
                className="wc-input"
                placeholder="阶段名称..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColumn()
                  if (e.key === 'Escape') {
                    setShowAddColumn(false)
                    setNewColumnTitle('')
                  }
                }}
              />
              <div className="wc-add-column-buttons">
                <button className="wc-btn wc-btn-primary" onClick={handleAddColumn}>
                  添加
                </button>
                <button
                  className="wc-btn wc-btn-cancel"
                  onClick={() => {
                    setShowAddColumn(false)
                    setNewColumnTitle('')
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              className="wc-add-column-btn"
              onClick={() => setShowAddColumn(true)}
            >
              ＋ 添加阶段
            </button>
          )}
        </div>
      </div>
    </DragDropContext>
  )
}

export default Board
