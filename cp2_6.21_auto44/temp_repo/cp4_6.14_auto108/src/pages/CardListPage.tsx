import { useState, useEffect } from 'react';
import { useCardStore } from '../store/useCardStore';
import FlashCard from '../components/FlashCard';
import NewCardModal from '../components/NewCardModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import type { Card } from '../types';

const PAGE_SIZE = 20;

const CardListPage = () => {
  const { cards, loading, fetchCards, deleteCard } = useCardStore();
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Card | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fadingCardIds, setFadingCardIds] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleDeleteClick = (card: Card) => {
    setDeleteTarget(card);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async (card: Card) => {
    setFadingCardIds((prev) => new Set(prev).add(card.id));
    setTimeout(async () => {
      try {
        await deleteCard(card.id);
      } catch (error) {
        console.error('Failed to delete card:', error);
      }
      setFadingCardIds((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }, 300);
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  };

  const displayCards = cards.slice(0, displayCount);
  const hasMore = displayCount < cards.length;

  return (
    <div className="page-transition page-container">
      <div className="page-header">
        <h1 className="page-title">知识卡片</h1>
        <button className="btn-primary" onClick={() => setShowNewModal(true)}>
          + 新建卡片
        </button>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">暂无卡片</div>
          <div className="empty-state-text">点击右上角按钮创建第一张卡片</div>
        </div>
      ) : (
        <>
          <div className="card-grid">
            {displayCards.map((card) => (
              <FlashCard
                key={card.id}
                card={card}
                fading={fadingCardIds.has(card.id)}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button className="btn-primary" onClick={handleLoadMore}>
                加载更多
              </button>
            </div>
          )}
        </>
      )}

      <NewCardModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
      />

      <DeleteConfirmModal
        card={deleteTarget}
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
};

export default CardListPage;
