import React, { useState } from 'react';
import type { Deck, Card } from '../types';
import { CardModal } from './CardModal';

interface DeckListProps {
  decks: Deck[];
  onAddDeck: (name: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onAddCard: (deckId: string, front: string, back: string) => void;
  onUpdateCard: (deckId: string, cardId: string, front: string, back: string) => void;
  onDeleteCard: (deckId: string, cardId: string) => void;
  onImport: (deckId: string, file: File) => Promise<void>;
  onStartReview: (deckId: string) => void;
  getTodayReviewCount: (deck: Deck) => number;
}

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  onAddDeck,
  onDeleteDeck,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onImport,
  onStartReview,
  getTodayReviewCount,
}) => {
  const [newDeckName, setNewDeckName] = useState('');
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);

  const handleAddDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeckName.trim()) {
      onAddDeck(newDeckName.trim());
      setNewDeckName('');
    }
  };

  const handleOpenAddModal = (deckId: string) => {
    setActiveDeckId(deckId);
    setEditingCard(null);
    setModalIsOpen(true);
  };

  const handleOpenEditModal = (deckId: string, card: Card) => {
    setActiveDeckId(deckId);
    setEditingCard(card);
    setModalIsOpen(true);
  };

  const handleSaveCard = (front: string, back: string) => {
    if (!activeDeckId) return;
    if (editingCard) {
      onUpdateCard(activeDeckId, editingCard.id, front, back);
    } else {
      onAddCard(activeDeckId, front, back);
    }
  };

  const handleImport = async (file: File) => {
    if (!activeDeckId) return;
    await onImport(activeDeckId, file);
  };

  const toggleExpand = (deckId: string) => {
    setExpandedDeckId(prev => (prev === deckId ? null : deckId));
  };

  return (
    <div className="deck-list-container">
      <div className="header">
        <h1 className="app-title">📚 FlashCardForge</h1>
        <p className="app-subtitle">高效记忆，从闪卡开始</p>
      </div>

      <form onSubmit={handleAddDeck} className="add-deck-form">
        <input
          type="text"
          value={newDeckName}
          onChange={e => setNewDeckName(e.target.value)}
          placeholder="输入新卡片组名称..."
          className="deck-input"
        />
        <button type="submit" className="btn-primary" disabled={!newDeckName.trim()}>
          + 创建卡片组
        </button>
      </form>

      <div className="deck-grid">
        {decks.map(deck => {
          const todayCount = getTodayReviewCount(deck);
          const isExpanded = expandedDeckId === deck.id;

          return (
            <div key={deck.id} className="deck-card">
              {todayCount > 0 && (
                <div className="review-badge breathing-badge">
                  {todayCount}
                </div>
              )}

              <div className="deck-card-header" onClick={() => toggleExpand(deck.id)}>
                <h3 className="deck-name">{deck.name}</h3>
                <div className="deck-stats">
                  <span className="stat-item">共 {deck.cards.length} 张</span>
                  <span className="stat-item highlight">今日待复习 {todayCount} 张</span>
                </div>
              </div>

              {isExpanded && (
                <div className="deck-card-content">
                  <div className="deck-actions">
                    <button className="btn-primary" onClick={() => onStartReview(deck.id)}>
                      开始复习
                    </button>
                    <button className="btn-secondary" onClick={() => handleOpenAddModal(deck.id)}>
                      + 添加卡片
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => {
                        if (confirm('确定要删除这个卡片组吗？')) {
                          onDeleteDeck(deck.id);
                        }
                      }}
                    >
                      删除组
                    </button>
                  </div>

                  <div className="card-list">
                    {deck.cards.length === 0 ? (
                      <p className="empty-state">暂无卡片，点击"添加卡片"开始创建</p>
                    ) : (
                      deck.cards.map((card, index) => (
                        <div key={card.id} className="card-item">
                          <span className="card-number">{index + 1}</span>
                          <div className="card-content-preview">
                            <span className="card-front-preview">{card.front}</span>
                            <span className="card-divider">→</span>
                            <span className="card-back-preview">{card.back}</span>
                          </div>
                          <div className="card-item-actions">
                            <button
                              className="icon-btn"
                              onClick={() => handleOpenEditModal(deck.id, card)}
                            >
                              ✏️
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => {
                                if (confirm('确定要删除这张卡片吗？')) {
                                  onDeleteCard(deck.id, card.id);
                                }
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {decks.length === 0 && (
        <div className="empty-decks">
          <p>还没有卡片组，创建一个开始你的记忆之旅吧！</p>
        </div>
      )}

      <CardModal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        onSave={handleSaveCard}
        onImport={handleImport}
        editingCard={editingCard}
      />
    </div>
  );
};
