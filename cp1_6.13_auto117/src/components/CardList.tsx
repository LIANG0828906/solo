import { useMemo, memo } from 'react';
import { Board, Card, SortOrder } from '../types';
import DigestCard from './DigestCard';

interface CardListProps {
  board: Board;
  cards: Card[];
  filterTag: string | null;
  setFilterTag: (tag: string | null) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  onAddCard: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (card: Card) => void;
}

function CardList({
  board,
  cards,
  filterTag,
  setFilterTag,
  sortOrder,
  setSortOrder,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: CardListProps) {
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (let i = 0; i < cards.length; i++) {
      const cardTags = cards[i].tags;
      for (let j = 0; j < cardTags.length; j++) {
        tagSet.add(cardTags[j]);
      }
    }
    return Array.from(tagSet);
  }, [cards]);

  const processedCards = useMemo(() => {
    let result: Card[];
    if (filterTag) {
      result = [];
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].tags.includes(filterTag)) {
          result.push(cards[i]);
        }
      }
    } else {
      result = cards.slice();
    }
    result.sort((a, b) => {
      return sortOrder === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
    });
    return result;
  }, [cards, filterTag, sortOrder]);

  const toggleSort = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="card-list-section">
      <div className="section-header">
        <div className="section-title-row">
          <h2 className="section-title">
            <span className="board-indicator">📒</span>
            {board.name}
          </h2>
          <span className="card-counter">{processedCards.length} / {cards.length} 张</span>
        </div>
        <button className="btn btn-primary create-board-btn" onClick={onAddCard}>
          + 添加书摘
        </button>
      </div>

      <div className="filter-bar">
        <div className="tags-container">
          <button
            className={`tag-pill ${filterTag === null ? 'tag-active' : 'tag-inactive'}`}
            onClick={() => setFilterTag(null)}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-pill ${filterTag === tag ? 'tag-active' : 'tag-inactive'}`}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
        <div className="sort-container">
          <button
            className={`sort-btn sort-${sortOrder}`}
            onClick={toggleSort}
            title="切换排序方式"
          >
            <span className="sort-icon">{sortOrder === 'desc' ? '↓' : '↑'}</span>
            <span className="sort-text">时间</span>
          </button>
        </div>
      </div>

      {processedCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✍️</div>
          <p className="empty-text">
            {cards.length === 0
              ? '这个主题板还没有书摘卡片，点击「添加书摘」记录你的第一则摘录吧！'
              : '当前筛选条件下没有匹配的卡片。'}
          </p>
        </div>
      ) : (
        <div className="card-waterfall">
          {processedCards.map((card, index) => (
            <div
              key={card.id}
              className="card-wrapper card-item-enter"
              style={{ animationDelay: `${Math.min(index * 40, 800)}ms` }}
            >
              <DigestCard
                card={card}
                mode="preview"
                onEdit={() => onEditCard(card)}
                onDelete={() => onDeleteCard(card)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(CardList);
