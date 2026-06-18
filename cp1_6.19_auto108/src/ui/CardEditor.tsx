import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCopy, FaPaste, FaTrash } from 'react-icons/fa';
import {
  Card,
  Deck,
  DEFAULT_CARD_LIBRARY,
  cloneCard,
} from '../domain/cardData';
import { eventBus, EventType } from '../eventBus';
import CardView from './CardView';
import CardEditPanel from './CardEditPanel';

interface CardEditorProps {
  leftDeck: Deck;
  rightDeck: Deck;
  onLeftDeckChange: (deck: Deck) => void;
  onRightDeckChange: (deck: Deck) => void;
}

const MAX_DECK_SIZE = 10;

type DragSource = 'library' | 'left' | 'right';

interface DragData {
  source: DragSource;
  card: Card;
  sourceIndex?: number;
}

const CardEditor: React.FC<CardEditorProps> = ({
  leftDeck,
  rightDeck,
  onLeftDeckChange,
  onRightDeckChange,
}) => {
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingPosition, setEditingPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingSource, setEditingSource] = useState<DragSource | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const dragDataRef = useRef<DragData | null>(null);

  useEffect(() => {
    const unsub = eventBus.on(EventType.SUGGESTION_APPLY, (data) => {
      const payload = data as {
        cardId: string;
        deckSide: 'left' | 'right';
        field: 'cost' | 'attack' | 'defense' | 'skillValue';
        to: number;
      };
      const deck = payload.deckSide === 'left' ? [...leftDeck] : [...rightDeck];
      const idx = deck.findIndex((c) => c.id === payload.cardId);
      if (idx >= 0) {
        deck[idx] = { ...deck[idx], [payload.field]: payload.to };
        if (payload.deckSide === 'left') {
          onLeftDeckChange(deck);
        } else {
          onRightDeckChange(deck);
        }
      }
    });
    return unsub;
  }, [leftDeck, rightDeck, onLeftDeckChange, onRightDeckChange]);

  const handleDragStart = useCallback(
    (source: DragSource, card: Card, index?: number) =>
      (e: React.DragEvent) => {
        dragDataRef.current = { source, card, sourceIndex: index };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.id);
      },
    [],
  );

  const handleDropToDeck = useCallback(
    (target: 'left' | 'right') =>
      (e: React.DragEvent) => {
        e.preventDefault();
        const data = dragDataRef.current;
        if (!data) return;
        dragDataRef.current = null;

        if (target === 'left') {
          if (data.source === 'left') return;
          if (leftDeck.length >= MAX_DECK_SIZE) return;
          if (data.source === 'right') {
            const newRight = [...rightDeck];
            const idx = newRight.findIndex((c) => c.id === data.card.id);
            if (idx >= 0) newRight.splice(idx, 1);
            onRightDeckChange(newRight);
            onLeftDeckChange([...leftDeck, { ...data.card }]);
          } else {
            onLeftDeckChange([...leftDeck, cloneCard(data.card)]);
          }
        } else {
          if (data.source === 'right') return;
          if (rightDeck.length >= MAX_DECK_SIZE) return;
          if (data.source === 'left') {
            const newLeft = [...leftDeck];
            const idx = newLeft.findIndex((c) => c.id === data.card.id);
            if (idx >= 0) newLeft.splice(idx, 1);
            onLeftDeckChange(newLeft);
            onRightDeckChange([...rightDeck, { ...data.card }]);
          } else {
            onRightDeckChange([...rightDeck, cloneCard(data.card)]);
          }
        }
      },
    [leftDeck, rightDeck, onLeftDeckChange, onRightDeckChange],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCardContextMenu = useCallback(
    (source: DragSource, card: Card, index?: number) =>
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingCard(card);
        setEditingPosition({ x: e.clientX, y: e.clientY });
        setEditingSource(source);
        setEditingIndex(index ?? null);
      },
    [],
  );

  const handleSaveCard = (updated: Card) => {
    if (editingSource === 'library') {
      return;
    }
    if (editingSource === 'left') {
      const newDeck = [...leftDeck];
      const idx = editingIndex ?? newDeck.findIndex((c) => c.id === updated.id);
      if (idx >= 0) {
        newDeck[idx] = updated;
        onLeftDeckChange(newDeck);
        eventBus.emit(EventType.CARD_UPDATED, { side: 'left', index: idx, card: updated });
      }
    } else if (editingSource === 'right') {
      const newDeck = [...rightDeck];
      const idx = editingIndex ?? newDeck.findIndex((c) => c.id === updated.id);
      if (idx >= 0) {
        newDeck[idx] = updated;
        onRightDeckChange(newDeck);
        eventBus.emit(EventType.CARD_UPDATED, { side: 'right', index: idx, card: updated });
      }
    }
    setEditingCard(null);
    setEditingPosition(null);
  };

  const removeFromDeck = (side: 'left' | 'right', index: number) => {
    if (side === 'left') {
      const newDeck = [...leftDeck];
      newDeck.splice(index, 1);
      onLeftDeckChange(newDeck);
    } else {
      const newDeck = [...rightDeck];
      newDeck.splice(index, 1);
      onRightDeckChange(newDeck);
    }
  };

  const copyDeck = (side: 'left' | 'right') => {
    const deck = side === 'left' ? leftDeck : rightDeck;
    try {
      navigator.clipboard.writeText(JSON.stringify(deck));
    } catch {
      /* ignore */
    }
  };

  const pasteDeck = async (side: 'left' | 'right') => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        const valid = parsed
          .filter(
            (c) =>
              c &&
              typeof c.id === 'string' &&
              typeof c.name === 'string' &&
              typeof c.cost === 'number',
          )
          .slice(0, MAX_DECK_SIZE);
        if (side === 'left') onLeftDeckChange(valid);
        else onRightDeckChange(valid);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #3A3A55',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: '#E0E0E0' }}>卡牌库</span>
        <span style={{ fontSize: 11, color: '#888' }}>拖拽到编组区 · 右键编辑</span>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 10,
          alignContent: 'start',
        }}
      >
        <AnimatePresence>
          {DEFAULT_CARD_LIBRARY.map((card) => (
            <CardView
              key={card.id}
              card={card}
              draggable
              onDragStart={handleDragStart('library', card)}
              onContextMenu={handleCardContextMenu('library', card)}
            />
          ))}
        </AnimatePresence>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: 12,
          borderTop: '1px solid #3A3A55',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: '#3498DB',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E0E0E0' }}>
              左方卡组 ({leftDeck.length}/{MAX_DECK_SIZE})
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => copyDeck('left')}
              title="复制卡组"
              style={{
                padding: '4px 6px',
                borderRadius: 4,
                backgroundColor: '#3A3A55',
                color: '#CCC',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4A4A65')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3A3A55')}
            >
              <FaCopy size={12} />
            </button>
            <button
              onClick={() => pasteDeck('left')}
              title="粘贴卡组"
              style={{
                padding: '4px 6px',
                borderRadius: 4,
                backgroundColor: '#3A3A55',
                color: '#CCC',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4A4A65')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3A3A55')}
            >
              <FaPaste size={12} />
            </button>
            <button
              onClick={() => onLeftDeckChange([])}
              title="清空卡组"
              style={{
                padding: '4px 6px',
                borderRadius: 4,
                backgroundColor: '#3A3A55',
                color: '#CCC',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C0392B')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3A3A55')}
            >
              <FaTrash size={12} />
            </button>
          </div>
        </div>

        <div
          onDrop={handleDropToDeck('left')}
          onDragOver={handleDragOver}
          style={{
            minHeight: 110,
            borderRadius: 8,
            backgroundColor: 'rgba(52, 152, 219, 0.08)',
            border: '1px dashed rgba(52, 152, 219, 0.35)',
            padding: 8,
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            alignItems: 'center',
          }}
        >
          {leftDeck.length === 0 && (
            <span style={{ fontSize: 12, color: '#555', margin: 'auto' }}>拖拽卡牌到此处</span>
          )}
          <AnimatePresence>
            {leftDeck.map((card, i) => (
              <div key={card.id} style={{ position: 'relative', flexShrink: 0 }}>
                <CardView
                  card={card}
                  highlight="blue"
                  size="sm"
                  onDragStart={handleDragStart('left', card, i)}
                  onContextMenu={handleCardContextMenu('left', card, i)}
                  draggable
                />
                <button
                  onClick={() => removeFromDeck('left', i)}
                  title="移除"
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#C0392B',
                    color: '#FFF',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #1E1E2E',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  ×
                </button>
              </div>
            ))}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: '#E74C3C',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E0E0E0' }}>
              右方卡组 ({rightDeck.length}/{MAX_DECK_SIZE})
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => copyDeck('right')}
              title="复制卡组"
              style={{
                padding: '4px 6px',
                borderRadius: 4,
                backgroundColor: '#3A3A55',
                color: '#CCC',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4A4A65')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3A3A55')}
            >
              <FaCopy size={12} />
            </button>
            <button
              onClick={() => pasteDeck('right')}
              title="粘贴卡组"
              style={{
                padding: '4px 6px',
                borderRadius: 4,
                backgroundColor: '#3A3A55',
                color: '#CCC',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4A4A65')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3A3A55')}
            >
              <FaPaste size={12} />
            </button>
            <button
              onClick={() => onRightDeckChange([])}
              title="清空卡组"
              style={{
                padding: '4px 6px',
                borderRadius: 4,
                backgroundColor: '#3A3A55',
                color: '#CCC',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C0392B')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3A3A55')}
            >
              <FaTrash size={12} />
            </button>
          </div>
        </div>

        <div
          onDrop={handleDropToDeck('right')}
          onDragOver={handleDragOver}
          style={{
            minHeight: 110,
            borderRadius: 8,
            backgroundColor: 'rgba(231, 76, 60, 0.08)',
            border: '1px dashed rgba(231, 76, 60, 0.35)',
            padding: 8,
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            alignItems: 'center',
          }}
        >
          {rightDeck.length === 0 && (
            <span style={{ fontSize: 12, color: '#555', margin: 'auto' }}>拖拽卡牌到此处</span>
          )}
          <AnimatePresence>
            {rightDeck.map((card, i) => (
              <div key={card.id} style={{ position: 'relative', flexShrink: 0 }}>
                <CardView
                  card={card}
                  highlight="red"
                  size="sm"
                  onDragStart={handleDragStart('right', card, i)}
                  onContextMenu={handleCardContextMenu('right', card, i)}
                  draggable
                />
                <button
                  onClick={() => removeFromDeck('right', i)}
                  title="移除"
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#C0392B',
                    color: '#FFF',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #1E1E2E',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  ×
                </button>
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <CardEditPanel
        card={editingCard}
        position={editingPosition}
        onClose={() => {
          setEditingCard(null);
          setEditingPosition(null);
          setEditingSource(null);
          setEditingIndex(null);
        }}
        onSave={handleSaveCard}
      />
    </div>
  );
};

export default CardEditor;
