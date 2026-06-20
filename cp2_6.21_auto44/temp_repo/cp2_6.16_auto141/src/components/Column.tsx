import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Droppable } from 'react-beautiful-dnd'
import type { Card as CardType, Column as ColumnType } from '../types'
import { useBoardStore } from '../store'
import Card from './Card'
import VirtualCardList from './VirtualCardList'

interface ColumnProps {
  column: ColumnType
  cards: CardType[]
  confirmDeleteId: string | null
}

const Column: React.FC<ColumnProps> = ({ column, cards, confirmDeleteId }) => {
  const updateColumnTitle = useBoardStore((s) => s.updateColumnTitle)
  const setConfirmDeleteColumnId = useBoardStore((s) => s.setConfirmDeleteColumnId)
  const deleteColumn = useBoardStore((s) => s.deleteColumn)
  const addCard = useBoardStore((s) => s.addCard)
  const setEditingCardId = useBoardStore((s) => s.setEditingCardId)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(column.title)
  const [showAddCard, setShowAddCard] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const addCardTitleRef = useRef<HTMLInputElement>(null)

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => a.order - b.order),
    [cards]
  )

  useEffect(() => {
    setTitleValue(column.title)
  }, [column.title])

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (showAddCard && addCardTitleRef.current) {
      addCardTitleRef.current.focus()
    }
  }, [showAddCard])

  const handleTitleSubmit = () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== column.title) {
      updateColumnTitle(column.id, trimmed)
    } else {
      setTitleValue(column.title)
    }
    setIsEditingTitle(false)
  }

  const handleAddCard = () => {
    const trimmedTitle = newTitle.trim()
    if (!trimmedTitle) return
    addCard(column.id, {
      title: trimmedTitle,
      description: newDesc.trim(),
      priority: 'medium',
      assignee: '',
      dueDate: '',
      tags: [],
    })
    setNewTitle('')
    setNewDesc('')
    setShowAddCard(false)
  }

  const isConfirming = confirmDeleteId === column.id

  return (
    <div className="wc-column-wrapper">
      {isConfirming && (
        <div className="wc-confirm-overlay" onClick={() => setConfirmDeleteColumnId(null)}>
          <div
            className="wc-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wc-confirm-title">确认删除</div>
            <div className="wc-confirm-message">
              确定要删除阶段「{column.title}」吗？该阶段下的所有卡片也将被删除。
            </div>
            <div className="wc-confirm-buttons">
              <button
                className="wc-btn wc-btn-cancel"
                onClick={() => setConfirmDeleteColumnId(null)}
              >
                取消
              </button>
              <button
                className="wc-btn wc-btn-danger"
                onClick={() => deleteColumn(column.id)}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="wc-column">
        <div className="wc-column-header">
          <div className="wc-column-title-wrapper">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                className="wc-column-title-input"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit()
                  if (e.key === 'Escape') {
                    setTitleValue(column.title)
                    setIsEditingTitle(false)
                  }
                }}
              />
            ) : (
              <div
                className="wc-column-title"
                onDoubleClick={() => setIsEditingTitle(true)}
                title="双击编辑"
              >
                {column.title}
                <span className="wc-column-count">{sortedCards.length}</span>
              </div>
            )}
          </div>
          <button
            className="wc-column-delete"
            onClick={() => setConfirmDeleteColumnId(column.id)}
            title="删除阶段"
          >
            ✕
          </button>
        </div>

        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`wc-column-body ${snapshot.isDraggingOver ? 'wc-drag-over' : ''}`}
            >
              {sortedCards.length === 0 ? (
                <div className="wc-empty-state">
                  <div className="wc-empty-icon">📝</div>
                  <div className="wc-empty-text">暂无任务卡片</div>
                  <div className="wc-empty-hint">点击下方「添加卡片」按钮创建</div>
                </div>
              ) : sortedCards.length > 200 ? (
                <VirtualCardList cards={sortedCards} />
              ) : (
                sortedCards.map((card, idx) => (
                  <Card
                    key={card.id}
                    card={card}
                    index={idx}
                  />
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {showAddCard ? (
          <div className="wc-add-card-form">
            <input
              ref={addCardTitleRef}
              type="text"
              className="wc-input"
              placeholder="卡片标题..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCard()
                if (e.key === 'Escape') {
                  setShowAddCard(false)
                  setNewTitle('')
                  setNewDesc('')
                }
              }}
            />
            <textarea
              className="wc-textarea"
              placeholder="描述（可选）..."
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="wc-add-card-buttons">
              <button className="wc-btn wc-btn-primary" onClick={handleAddCard}>
                添加
              </button>
              <button
                className="wc-btn wc-btn-cancel"
                onClick={() => {
                  setShowAddCard(false)
                  setNewTitle('')
                  setNewDesc('')
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            className="wc-add-card-btn"
            onClick={() => setShowAddCard(true)}
          >
            ＋ 添加卡片
          </button>
        )}
      </div>
      {sortedCards.length > 0 && (
        <div style={{ display: 'none' }}>
          {setEditingCardId.toString()}
        </div>
      )}
    </div>
  )
}

export default React.memo(Column)
