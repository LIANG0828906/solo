import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InspirationCard } from '../../types';
import { COLORS } from '../utils';

interface InspirationBoardProps {
  cards: InspirationCard[];
  onCardsChange: (cards: InspirationCard[]) => void;
  workId: string;
}

const boardStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: `
    linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 19px,
      rgba(201, 154, 62, 0.1) 20px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 19px,
      rgba(201, 154, 62, 0.1) 20px
    )
  `,
  backgroundColor: '#FFFBF0',
  borderRadius: '12px',
  padding: '16px',
  overflow: 'hidden',
  position: 'relative',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#3B4A6B',
};

const addBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #3B4A6B, #5A6B8C)',
  color: 'white',
  padding: '6px 12px',
  borderRadius: '6px',
  fontSize: '0.8rem',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.2s ease',
};

const cardsContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  columns: '3 150px',
  columnGap: '10px',
};

const cardStyle = (color: string, isEditing: boolean, isDragging: boolean, isCompleted: boolean): React.CSSProperties => ({
  background: color,
  borderRadius: '10px',
  padding: '12px',
  marginBottom: '10px',
  breakInside: 'avoid',
  cursor: isEditing ? 'text' : 'grab',
  transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  position: 'relative',
  border: isEditing ? '2px dashed #3B4A6B' : 'none',
  opacity: isCompleted ? 0.6 : 1,
  transform: isDragging ? 'scale(1.2) rotate(2deg)' : 'scale(1)',
  zIndex: isDragging ? 100 : 1,
});

const colorTagStyle = (color: string): React.CSSProperties => ({
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: color,
  border: '2px solid white',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
  position: 'absolute',
  top: '8px',
  left: '8px',
});

const cardContentStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#2D3748',
  lineHeight: 1.5,
  wordBreak: 'break-word',
  marginTop: '16px',
};

const priorityStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2px',
  marginTop: '8px',
  fontSize: '0.75rem',
};

const starStyle = (filled: boolean): React.CSSProperties => ({
  color: filled ? '#F6AD55' : '#E2E8F0',
  cursor: 'pointer',
  transition: 'color 0.2s ease',
});

const cardFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '8px',
};

const deleteBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.5)',
  border: 'none',
  width: '22px',
  height: '22px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.7rem',
  color: '#718096',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const completedZoneStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '12px',
  border: '2px dashed #C99A3E',
  borderRadius: '10px',
  textAlign: 'center',
  color: '#C99A3E',
  fontSize: '0.8rem',
  fontWeight: 500,
  background: 'rgba(201, 154, 62, 0.05)',
  transition: 'all 0.2s ease',
  minHeight: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
};

const colorPickerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  marginTop: '8px',
  flexWrap: 'wrap',
};

const colorOptionStyle = (color: string, selected: boolean): React.CSSProperties => ({
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  background: color,
  cursor: 'pointer',
  border: selected ? '2px solid #3B4A6B' : '2px solid transparent',
  transition: 'all 0.2s ease',
  transform: selected ? 'scale(1.2)' : 'scale(1)',
});

const successCheckStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%) scale(0)',
  fontSize: '2rem',
  color: '#48BB78',
  zIndex: 10,
  pointerEvents: 'none',
};

const successAnimStyle: React.CSSProperties = {
  animation: 'successPulse 0.5s ease forwards',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#A0AEC0',
  fontSize: '0.85rem',
  padding: '30px 10px',
  gridColumn: '1 / -1',
};

const newCardStyle = (show: boolean): React.CSSProperties => ({
  animation: show ? 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
});

export default function InspirationBoard({
  cards,
  onCardsChange,
  workId,
}: InspirationBoardProps) {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState(COLORS[2]);
  const [editPriority, setEditPriority] = useState(1);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const activeCards = cards.filter((c) => !c.completed);
  const completedCards = cards.filter((c) => c.completed);

  const handleAddCard = () => {
    const newCard: InspirationCard = {
      id: uuidv4(),
      content: '',
      color: COLORS[2],
      priority: 1,
      completed: false,
      order: 0,
      workId,
      authorId: '',
      createdAt: new Date().toISOString(),
    };
    onCardsChange([newCard, ...cards]);
    setEditingCardId(newCard.id);
    setEditContent('');
    setEditColor(newCard.color);
    setEditPriority(newCard.priority);
  };

  const handleLongPressStart = (cardId: string) => {
    longPressTimer.current = setTimeout(() => {
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        setEditingCardId(cardId);
        setEditContent(card.content);
        setEditColor(card.color);
        setEditPriority(card.priority);
      }
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSaveEdit = () => {
    if (!editingCardId) return;
    if (!editContent.trim()) {
      handleDeleteCard(editingCardId);
      return;
    }
    const updatedCards = cards.map((c) =>
      c.id === editingCardId
        ? { ...c, content: editContent.trim(), color: editColor, priority: editPriority }
        : c
    );
    onCardsChange(updatedCards);
    setEditingCardId(null);
    setShowColorPicker(null);
  };

  const handleDeleteCard = (cardId: string) => {
    const updatedCards = cards.filter((c) => c.id !== cardId);
    onCardsChange(updatedCards);
    setEditingCardId(null);
    setShowColorPicker(null);
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnCompleted = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedCardId) return;

    const card = cards.find((c) => c.id === draggedCardId);
    if (card && !card.completed) {
      setShowSuccess(draggedCardId);
      setTimeout(() => {
        const updatedCards = cards.map((c) =>
          c.id === draggedCardId ? { ...c, completed: true } : c
        );
        onCardsChange(updatedCards);
        setShowSuccess(null);
      }, 500);
    }
    setDraggedCardId(null);
  };

  const handleCardDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedCardId || draggedCardId === targetCardId) return;

    const draggedIndex = cards.findIndex((c) => c.id === draggedCardId);
    const targetIndex = cards.findIndex((c) => c.id === targetCardId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newCards = [...cards];
    const [draggedCard] = newCards.splice(draggedIndex, 1);
    newCards.splice(targetIndex, 0, draggedCard);

    const reorderedCards = newCards.map((c, i) => ({ ...c, order: i }));
    onCardsChange(reorderedCards);
    setDraggedCardId(null);
  };

  const handlePriorityClick = (e: React.MouseEvent, cardId: string, priority: number) => {
    e.stopPropagation();
    const updatedCards = cards.map((c) =>
      c.id === cardId ? { ...c, priority } : c
    );
    onCardsChange(updatedCards);
  };

  const handleRestoreCard = (cardId: string) => {
    const updatedCards = cards.map((c) =>
      c.id === cardId ? { ...c, completed: false } : c
    );
    onCardsChange(updatedCards);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingCardId) {
        const target = e.target as HTMLElement;
        if (!target.closest('.inspiration-card') && !target.closest('.color-picker')) {
          handleSaveEdit();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingCardId, editContent, editColor, editPriority]);

  return (
    <div style={boardStyle} ref={boardRef}>
      <div style={headerStyle}>
        <span style={titleStyle}>💡 灵感板</span>
        <button
          style={addBtnStyle}
          onClick={handleAddCard}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #C99A3E, #E8B85C)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3B4A6B, #5A6B8C)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          + 灵感
        </button>
      </div>

      <div style={cardsContainerStyle}>
        {activeCards.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
            <p>记录你的灵感吧</p>
          </div>
        ) : (
          activeCards.map((card, index) => (
            <div
              key={card.id}
              className="inspiration-card"
              style={{
                ...cardStyle(card.color, editingCardId === card.id, draggedCardId === card.id, false),
                ...newCardStyle(index < 3),
              }}
              draggable={editingCardId !== card.id}
              onDragStart={(e) => handleDragStart(e, card.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleCardDrop(e, card.id)}
              onMouseDown={() => handleLongPressStart(card.id)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(card.id)}
              onTouchEnd={handleLongPressEnd}
            >
              <div style={colorTagStyle(card.color)} />

              {showSuccess === card.id && (
                <div style={{ ...successCheckStyle, ...successAnimStyle }}>✓</div>
              )}

              {editingCardId === card.id ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '6px',
                      fontSize: '0.85rem',
                      border: 'none',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.5)',
                      resize: 'vertical',
                      outline: 'none',
                      marginTop: '16px',
                    }}
                    placeholder="写下你的灵感..."
                  />

                  <div className="color-picker" style={colorPickerStyle}>
                    {COLORS.map((color) => (
                      <div
                        key={color}
                        style={colorOptionStyle(color, editColor === color)}
                        onClick={() => setEditColor(color)}
                      />
                    ))}
                  </div>

                  <div style={priorityStyle}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        style={starStyle(star <= editPriority)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditPriority(star);
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div style={cardContentStyle}>
                    {card.content || '点击编辑...'}
                  </div>
                  <div style={cardFooterStyle}>
                    <div style={priorityStyle}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          style={starStyle(star <= card.priority)}
                          onClick={(e) => handlePriorityClick(e, card.id, star)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <button
                      style={deleteBtnStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(card.id);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FED7D7';
                        e.currentTarget.style.color = '#E53E3E';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                        e.currentTarget.style.color = '#718096';
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {completedCards.length > 0 && (
        <div
          style={completedZoneStyle}
          onDragOver={handleDragOver}
          onDrop={handleDropOnCompleted}
        >
          <span>✓ 已完成</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
            ({completedCards.length})
          </span>
        </div>
      )}

      {completedCards.length > 0 && (
        <div style={{ marginTop: '10px', maxHeight: '120px', overflowY: 'auto' }}>
          {completedCards.map((card) => (
            <div
              key={card.id}
              style={{
                ...cardStyle(card.color, false, false, true),
                textDecoration: 'line-through',
                padding: '8px',
                marginBottom: '6px',
                cursor: 'pointer',
              }}
              onClick={() => handleRestoreCard(card.id)}
              title="点击恢复"
            >
              <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                {card.content.slice(0, 30)}{card.content.length > 30 ? '...' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
