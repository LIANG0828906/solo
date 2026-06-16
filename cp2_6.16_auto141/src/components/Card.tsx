import React, { useMemo } from 'react'
import { Draggable } from 'react-beautiful-dnd'
import type { Card as CardType, Priority } from '../types'
import { useBoardStore } from '../store'

const priorityColors: Record<Priority, string> = {
  high: '#EF4444',
  medium: '#F97316',
  low: '#22C55E',
}

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

interface CardProps {
  card: CardType
  index: number
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  const idx = lowerText.indexOf(lowerQuery)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ backgroundColor: '#FEF08A', padding: '0 2px', borderRadius: '2px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

const Card: React.FC<CardProps> = ({ card, index }) => {
  const setEditingCardId = useBoardStore((s) => s.setEditingCardId)
  const searchQuery = useBoardStore((s) => s.searchQuery)

  const isMatched = useMemo(() => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      card.title.toLowerCase().includes(q) ||
      card.description.toLowerCase().includes(q)
    )
  }, [card.title, card.description, searchQuery])

  const isOverdue = useMemo(() => {
    if (!card.dueDate) return false
    const due = new Date(card.dueDate)
    due.setHours(23, 59, 59, 999)
    return due.getTime() < Date.now()
  }, [card.dueDate])

  const handleClick = () => {
    setEditingCardId(card.id)
  }

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={handleClick}
          className={`wc-card ${snapshot.isDragging ? 'wc-card-dragging' : ''}`}
          style={{
            ...provided.draggableProps.style,
            opacity: searchQuery ? (isMatched ? 1 : 0.3) : 1,
            transition: 'opacity 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <div className="wc-card-header">
            <span
              className="wc-priority-dot"
              title={`优先级：${priorityLabels[card.priority]}`}
              style={{ backgroundColor: priorityColors[card.priority] }}
            />
            {card.dueDate && (
              <span
                className={`wc-due-date ${isOverdue ? 'wc-due-overdue' : ''}`}
                title={isOverdue ? '已逾期' : '截止日期'}
              >
                📅 {card.dueDate}
              </span>
            )}
          </div>
          <div className="wc-card-title">{highlightText(card.title, searchQuery)}</div>
          {card.description && (
            <div className="wc-card-description">
              {highlightText(card.description, searchQuery)}
            </div>
          )}
          {card.tags && card.tags.length > 0 && (
            <div className="wc-card-tags">
              {card.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="wc-tag"
                  style={{
                    backgroundColor: tag.color + '22',
                    color: tag.color,
                    border: `1px solid ${tag.color}44`,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {card.assignee && (
            <div className="wc-card-assignee">
              <span className="wc-avatar">
                {card.assignee.slice(0, 1)}
              </span>
              <span className="wc-assignee-name">{card.assignee}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

export default React.memo(Card)
