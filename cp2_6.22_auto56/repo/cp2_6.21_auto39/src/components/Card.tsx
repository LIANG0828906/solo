import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import type { Card as CardType, TodoItem } from '../types';

interface CardProps {
  card: CardType;
  onEdit: (card: CardType) => void;
}

function parseTodoContent(content: string): TodoItem[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((text, index) => ({
        id: String(index),
        text: text.trim(),
        completed: false,
      }));
  }
  return [];
}

function highlightText(text: string, keyword: string): React.ReactNode {
  if (!keyword) return text;

  const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <span key={index} className="highlight">
        {part}
      </span>
    ) : (
      part
    )
  );
}

function Card({ card, onEdit }: CardProps) {
  const { moveCard, removeCard, selectCard, selectedCardId, searchKeyword, editCard } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: card.x, y: card.y });
  const dragStartRef = useRef({ x: 0, y: 0, cardX: 0, cardY: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const isTodo = card.type === 'todo';
  const isImage = card.type === 'image';
  const isSelected = selectedCardId === card.id;

  useEffect(() => {
    setPosition({ x: card.x, y: card.y });
  }, [card.x, card.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card-actions')) return;

    e.preventDefault();
    selectCard(card.id);
    setIsDragging(true);

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      cardX: position.x,
      cardY: position.y,
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const newX = dragStartRef.current.cardX + dx;
    const newY = dragStartRef.current.cardY + dy;

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    moveCard(card.id, position.x, position.y);

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这张卡片吗？')) {
      removeCard(card.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(card);
  };

  const handleDoubleClick = () => {
    onEdit(card);
  };

  const handleTodoToggle = (todoId: string, completed: boolean) => {
    const todos = parseTodoContent(card.content);
    const updatedTodos = todos.map((t) =>
      t.id === todoId ? { ...t, completed } : t
    );
    editCard(card.id, { content: JSON.stringify(updatedTodos) });
  };

  const renderContent = () => {
    if (isImage) {
      return (
        <div className="card-content">
          <img src={card.content} alt={card.title} onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160"><rect fill="%23f0f0f0" width="240" height="160"/><text fill="%23999" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">图片加载失败</text></svg>';
          }} />
        </div>
      );
    }

    if (isTodo) {
      const todos = parseTodoContent(card.content);
      const completedCount = todos.filter((t) => t.completed).length;
      const totalCount = todos.length;
      const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      return (
        <>
          <div className="card-content">
            <div className="todo-preview">
              {todos.slice(0, 5).map((todo) => (
                <div
                  key={todo.id}
                  className={`todo-item-preview ${todo.completed ? 'completed' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTodoToggle(todo.id, !todo.completed);
                  }}
                >
                  <div className={`todo-checkbox ${todo.completed ? 'checked' : ''}`} />
                  <span className="todo-text">
                    {highlightText(todo.text, searchKeyword)}
                  </span>
                </div>
              ))}
              {todos.length > 5 && (
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  还有 {todos.length - 5} 项...
                </div>
              )}
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-text">
              {completedCount}/{totalCount} 已完成
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="card-content">
        {highlightText(card.content, searchKeyword)}
      </div>
    );
  };

  const typeLabels: Record<string, string> = {
    text: '文本',
    image: '图片',
    todo: '待办',
  };

  return (
    <div
      ref={cardRef}
      className={`card ${isDragging ? 'dragging' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        zIndex: isSelected ? 100 : card.z_index,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {card.color && <div className="card-color-bar" style={{ backgroundColor: card.color }} />}

      <div className="card-header">
        <div className="card-title">
          {highlightText(card.title, searchKeyword)}
        </div>
        <div className="card-type">{typeLabels[card.type]}</div>
      </div>

      {renderContent()}

      <div className="card-footer">
        <span>{new Date(card.updated_at).toLocaleDateString('zh-CN')}</span>
        <div className="card-actions">
          <button className="card-action-btn" onClick={handleEdit}>
            编辑
          </button>
          <button className="card-action-btn delete" onClick={handleDelete}>
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

export default Card;
