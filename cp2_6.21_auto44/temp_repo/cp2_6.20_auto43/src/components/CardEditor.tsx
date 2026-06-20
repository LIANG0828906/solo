import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import CardView from './CardView';
import type { Card } from '../types';

const CardEditor: React.FC = () => {
  const navigate = useNavigate();
  const { presetCards, selectedDeck, addCardToDeck, removeCardFromDeck, reorderDeck, resetDeck } =
    useGameStore();

  const [filterCost, setFilterCost] = useState<number | 'all'>('all');
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [detailCard, setDetailCard] = useState<Card | null>(null);

  const filteredCards = useMemo(() => {
    if (filterCost === 'all') return presetCards;
    return presetCards.filter((c) => c.cost === filterCost);
  }, [presetCards, filterCost]);

  const handlePoolCardClick = (card: Card) => {
    setDetailCard(card);
  };

  const handlePoolCardDoubleClick = (card: Card) => {
    addCardToDeck(card);
  };

  const handleDeckCardDoubleClick = (index: number) => {
    removeCardFromDeck(index);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.droppableId === 'deck' && result.destination.droppableId === 'deck') {
      reorderDeck(result.source.index, result.destination.index);
    } else if (result.source.droppableId === 'pool' && result.destination.droppableId === 'deck') {
      const card = filteredCards[result.source.index];
      addCardToDeck(card);
    }
  };

  const startBattle = () => {
    if (selectedDeck.cards.length < 10) {
      alert('卡组至少需要10张卡牌才能开始对战！');
      return;
    }
    navigate('/battle');
  };

  return (
    <div className="editor-container">
      <div className="page-header">
        <h1 className="page-title">卡组编辑器</h1>
        <div className="card-count-badge">
          已选 {selectedDeck.cards.length} / 30 张
        </div>
      </div>

      <div className="card-pool-section">
        <div className="section-header">
          <h2 className="section-title">卡牌池</h2>
        </div>

        <div className="filter-bar">
          <button
            className={`filter-chip ${filterCost === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCost('all')}
          >
            全部
          </button>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              className={`filter-chip ${filterCost === n ? 'active' : ''}`}
              onClick={() => setFilterCost(n)}
            >
              {n}费
            </button>
          ))}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="pool" isDropDisabled={true}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="card-grid"
              >
                {filteredCards.map((card, i) => (
                  <Draggable key={`pool-${card.id}`} draggableId={`pool-${card.id}-${i}`} index={i}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        style={{
                          ...dragProvided.draggableProps.style,
                          transform: snapshot.isDragging
                            ? dragProvided.draggableProps.style?.transform + ' rotate(2deg)'
                            : dragProvided.draggableProps.style?.transform,
                        }}
                      >
                        <CardView
                          card={card}
                          onClick={() => handlePoolCardClick(card)}
                          onMouseEnter={() => setHoveredCard(card)}
                          onMouseLeave={() => setHoveredCard(null)}
                          onDoubleClick={() => handlePoolCardDoubleClick(card)}
                          className={snapshot.isDragging ? 'shadow-2xl' : ''}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="deck-bar">
            <div className="deck-bar-header">
              <span className="deck-bar-title">
                {selectedDeck.name} · {selectedDeck.cards.length}/30
              </span>
              <div className="deck-actions">
                <button
                  className="btn btn-secondary"
                  onClick={resetDeck}
                  disabled={selectedDeck.cards.length === 0}
                >
                  清空
                </button>
                <button
                  className="btn btn-primary"
                  onClick={startBattle}
                  disabled={selectedDeck.cards.length < 10}
                >
                  开始对战 →
                </button>
              </div>
            </div>

            {selectedDeck.cards.length === 0 ? (
              <div className="deck-empty-hint">
                从卡牌池拖拽或双击卡牌添加到卡组（建议卡组：30张）
              </div>
            ) : (
              <Droppable droppableId="deck" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="deck-cards-scroll"
                  >
                    {selectedDeck.cards.map((card, i) => (
                      <Draggable
                        key={`deck-${card.id}-${i}`}
                        draggableId={`deck-${card.id}-${i}`}
                        index={i}
                      >
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="deck-card-slot"
                            style={{
                              ...dragProvided.draggableProps.style,
                              transform: snapshot.isDragging
                                ? dragProvided.draggableProps.style?.transform + ' scale(1.05)'
                                : dragProvided.draggableProps.style?.transform,
                            }}
                            onDoubleClick={() => handleDeckCardDoubleClick(i)}
                          >
                            <div className="deck-card-index">{i + 1}</div>
                            <CardView
                              card={card}
                              onMouseEnter={() => setHoveredCard(card)}
                              onMouseLeave={() => setHoveredCard(null)}
                              onClick={() => setDetailCard(card)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        </DragDropContext>
      </div>

      <AnimatePresence>
        {hoveredCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="hover-preview-overlay"
          >
            <CardView card={hoveredCard} size="preview" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="modal-backdrop"
            onClick={() => setDetailCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="modal-content modal-wrapper"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={() => setDetailCard(null)}>
                ✕
              </button>
              <h2 className="modal-title">卡牌详情</h2>
              <div className="detail-card-wrapper">
                <CardView card={detailCard} size="preview" />
              </div>
              <div className="detail-props">
                <div className="detail-prop">
                  <div className="detail-prop-label">费用</div>
                  <div className="detail-prop-value">{detailCard.cost} 水晶</div>
                </div>
                <div className="detail-prop">
                  <div className="detail-prop-label">攻击力</div>
                  <div className="detail-prop-value">{detailCard.attack}</div>
                </div>
                <div className="detail-prop">
                  <div className="detail-prop-label">生命值</div>
                  <div className="detail-prop-value">{detailCard.health}</div>
                </div>
                <div className="detail-prop">
                  <div className="detail-prop-label">稀有度</div>
                  <div className="detail-prop-value">
                    {detailCard.rarity === 'common' && '普通'}
                    {detailCard.rarity === 'rare' && '稀有'}
                    {detailCard.rarity === 'epic' && '史诗'}
                    {detailCard.rarity === 'legendary' && '传说'}
                  </div>
                </div>
              </div>
              <div className="detail-prop">
                <div className="detail-prop-label">特殊技能</div>
                <div className="detail-prop-value" style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                  {detailCard.skill}
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (addCardToDeck(detailCard)) {
                      // added
                    }
                  }}
                >
                  添加到卡组
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CardEditor;
