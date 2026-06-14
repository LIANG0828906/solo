import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Card, Deck } from './types';

interface DeckManagerProps {
  cardLibrary: Card[];
  deck: Deck;
  onDeckChange: (deck: Deck) => void;
}

const MAX_DECK_SIZE = 30;
const MAX_TOTAL_COST = 50;
const LONG_PRESS_DELAY = 500;

const DeckManager: React.FC<DeckManagerProps> = ({ cardLibrary, deck, onDeckChange }) => {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [longPressCardId, setLongPressCardId] = useState<string | null>(null);
  const [removingCardId, setRemovingCardId] = useState<string | null>(null);
  const [selectedCardForAdd, setSelectedCardForAdd] = useState<string | null>(null);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartIndexRef = useRef<number | null>(null);

  const totalCost = deck.reduce((sum, card) => sum + card.cost, 0);
  const isCostOverLimit = totalCost > MAX_TOTAL_COST;

  const addCardToDeck = useCallback((card: Card) => {
    if (deck.length >= MAX_DECK_SIZE) return;
    onDeckChange([...deck, card]);
    setSelectedCardForAdd(card.id);
    setTimeout(() => setSelectedCardForAdd(null), 300);
  }, [deck, onDeckChange]);

  const removeCardFromDeck = useCallback((index: number) => {
    const cardId = deck[index].id;
    setRemovingCardId(cardId);
    setTimeout(() => {
      const newDeck = [...deck];
      newDeck.splice(index, 1);
      onDeckChange(newDeck);
      setRemovingCardId(null);
      setLongPressCardId(null);
    }, 200);
  }, [deck, onDeckChange]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragStartIndexRef.current = index;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.4';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragStartIndexRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = dragStartIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDraggingIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newDeck = [...deck];
    const movedCard = newDeck.splice(fromIndex, 1)[0];
    if (movedCard) {
      newDeck.splice(dropIndex, 0, movedCard);
      onDeckChange(newDeck);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
    dragStartIndexRef.current = null;
  };

  const handlePointerDown = (cardId: string) => {
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      setLongPressCardId(cardId);
    }, LONG_PRESS_DELAY);
  };

  const handlePointerUp = () => {
    clearLongPressTimer();
  };

  const handlePointerMove = () => {
    clearLongPressTimer();
  };

  const DeckCardItem: React.FC<{ card: Card; index: number }> = ({ card, index }) => {
    const isDragging = draggingIndex === index;
    const isDragOver = dragOverIndex === index && draggingIndex !== null && draggingIndex !== index;
    const isLongPress = longPressCardId === card.id;
    const isRemoving = removingCardId === card.id;
    const healthPercent = Math.min(100, (card.health / 30) * 100);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onPointerDown={() => handlePointerDown(card.id)}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerCancel={handlePointerUp}
        onMouseLeave={handlePointerUp}
        className={isRemoving ? 'shrink-out' : ''}
        style={{
          position: 'relative',
          padding: '8px 10px',
          backgroundColor: isDragOver ? '#334155' : '#1e293b',
          borderRadius: '8px',
          border: isLongPress ? '1px solid #ef4444' : isDragOver ? '1px dashed #0ea5e9' : '1px solid #334155',
          marginBottom: '6px',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background-color 0.15s, border-color 0.15s, transform 0.1s',
          opacity: isDragging ? 0.4 : 1,
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <span style={{
          fontSize: '11px',
          color: '#64748b',
          width: '18px',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {index + 1}.
        </span>

        <span style={{
          backgroundColor: '#0ea5e9',
          color: '#fff',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {card.cost}
        </span>

        <div style={{
          flex: 1,
          minWidth: 0,
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#f8fafc',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {card.name}
          </div>
          <div style={{
            height: '3px',
            backgroundColor: '#334155',
            borderRadius: '2px',
            marginTop: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${healthPercent}%`,
              background: `linear-gradient(90deg, #22c55e, #4ade80)`,
              borderRadius: '2px',
            }} />
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '4px',
          flexShrink: 0,
        }}>
          <span style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
          }}>
            {card.attack}
          </span>
          <span style={{
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
            color: '#4ade80',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
          }}>
            {card.health}
          </span>
        </div>

        {isLongPress && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeCardFromDeck(index);
            }}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              border: '2px solid #1e293b',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
              cursor: 'pointer',
              zIndex: 10,
              animation: 'statsFadeIn 0.2s ease-out',
            }}
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0f172a',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #334155',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#f8fafc',
          }}>
            📚 卡组管理
          </h2>
          <span style={{
            fontSize: '11px',
            color: deck.length >= MAX_DECK_SIZE ? '#ef4444' : '#94a3b8',
            fontWeight: 600,
            backgroundColor: deck.length >= MAX_DECK_SIZE ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
            padding: '2px 8px',
            borderRadius: '12px',
          }}>
            {deck.length}/{MAX_DECK_SIZE}
          </span>
        </div>

        {cardLibrary.length > 0 && (
          <div style={{
            marginBottom: '8px',
          }}>
            <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginBottom: '6px',
              fontWeight: 500,
            }}>
              快速添加：
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              maxHeight: '80px',
              overflowY: 'auto',
              padding: '4px',
              backgroundColor: '#1e293b',
              borderRadius: '8px',
            }}>
              {cardLibrary.map(card => (
                <button
                  key={card.id}
                  onClick={() => addCardToDeck(card)}
                  disabled={deck.length >= MAX_DECK_SIZE}
                  style={{
                    padding: '3px 8px',
                    fontSize: '10px',
                    borderRadius: '6px',
                    backgroundColor: deck.length >= MAX_DECK_SIZE ? '#334155' : '#0ea5e9',
                    color: '#fff',
                    border: 'none',
                    cursor: deck.length >= MAX_DECK_SIZE ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.15s',
                    transform: selectedCardForAdd === card.id ? 'scale(0.92)' : 'scale(1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (deck.length < MAX_DECK_SIZE) {
                      e.currentTarget.style.backgroundColor = '#0284c7';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (deck.length < MAX_DECK_SIZE) {
                      e.currentTarget.style.backgroundColor = '#0ea5e9';
                    }
                  }}
                >
                  <span style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    fontSize: '9px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {card.cost}
                  </span>
                  {card.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
      }}>
        {deck.length === 0 ? (
          <div style={{
            padding: '30px 16px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '12px',
            backgroundColor: '#1e293b',
            borderRadius: '8px',
            border: '2px dashed #334155',
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🃏</div>
            <p style={{ marginBottom: '4px' }}>卡组为空</p>
            <p style={{ fontSize: '11px', color: '#475569' }}>
              点击上方卡牌添加，或从编辑器中拖拽卡牌
            </p>
          </div>
        ) : (
          deck.map((card, index) => (
            <DeckCardItem key={`${card.id}-${index}`} card={card} index={index} />
          ))
        )}
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #334155',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>卡组总费用</span>
          <span className={isCostOverLimit ? 'cost-blink' : ''} style={{
            fontSize: '20px',
            fontWeight: 700,
            color: isCostOverLimit ? '#ef4444' : '#f8fafc',
            transition: 'color 0.2s',
          }}>
            {totalCost}
          </span>
        </div>
        <div style={{
          height: '6px',
          backgroundColor: '#334155',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, (totalCost / MAX_TOTAL_COST) * 100)}%`,
            background: isCostOverLimit
              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
              : 'linear-gradient(90deg, #0ea5e9, #0284c7)',
            borderRadius: '3px',
            transition: 'width 0.3s, background 0.3s',
          }} />
        </div>
        {isCostOverLimit && (
          <p style={{
            fontSize: '10px',
            color: '#ef4444',
            marginTop: '6px',
            textAlign: 'center',
          }}>
            ⚠ 总费用超过{MAX_TOTAL_COST}限制！
          </p>
        )}
        <p style={{
          fontSize: '10px',
          color: '#475569',
          marginTop: deck.length > 0 ? '8px' : '6px',
          textAlign: 'center',
        }}>
          {deck.length > 0 ? '💡 拖拽调整顺序 · 长按卡牌显示删除按钮' : '先创建卡牌并添加到卡组'}
        </p>
      </div>
    </div>
  );
};

export default DeckManager;
