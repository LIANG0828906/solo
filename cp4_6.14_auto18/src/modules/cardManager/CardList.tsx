import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Card } from '../../types';
import { api } from '../../utils/api';
import { isOverdue, getDaysOverdue } from '../../utils/spacedRepetition';
import './CardList.css';

function CardList() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await api.getCards();
      setCards(data);
    } catch (error) {
      console.error('加载卡片失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    cards.forEach(card => {
      card.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [cards]);

  const filteredAndSortedCards = useMemo(() => {
    let filtered = cards;
    
    if (selectedTags.length > 0) {
      filtered = cards.filter(card =>
        selectedTags.some(tag => card.tags.includes(tag))
      );
    }

    return filtered.sort((a, b) =>
      new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
    );
  }, [cards, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleStartReview = () => {
    navigate('/review');
  };

  const handleDeleteCard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这张卡片吗？')) {
      try {
        await api.deleteCard(id);
        setCards(prev => prev.filter(card => card.id !== id));
      } catch (error) {
        console.error('删除卡片失败:', error);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card-list-header">
        <h2 className="section-title">我的卡片</h2>
        <div className="header-actions">
          <span className="card-count">
            共 {filteredAndSortedCards.length} 张卡片
          </span>
          <button className="review-btn" onClick={handleStartReview}>
            开始复习
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="tag-filter glass-card">
          <div className="filter-label">按标签筛选：</div>
          <div className="tag-filter-buttons">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card-list">
        {filteredAndSortedCards.length === 0 ? (
          <div className="empty-state glass-card">
            <div className="empty-icon">📭</div>
            <div className="empty-text">
              {selectedTags.length > 0
                ? '没有符合筛选条件的卡片'
                : '还没有卡片，点击右上角创建第一张吧！'}
            </div>
          </div>
        ) : (
          filteredAndSortedCards.map(card => {
            const overdue = isOverdue(card.nextReviewDate);
            const daysOverdue = getDaysOverdue(card.nextReviewDate);
            const urgencyWidth = Math.min(daysOverdue * 20, 100);

            return (
              <div
                key={card.id}
                className={`card-item glass-card ${overdue ? 'overdue' : ''}`}
                onClick={handleStartReview}
              >
                {overdue && (
                  <div className="urgency-bar">
                    <div
                      className="urgency-progress"
                      style={{ width: `${urgencyWidth}%` }}
                    />
                  </div>
                )}
                <div className="card-item-content">
                  <div className="card-front-preview">
                    {truncateText(card.front, 30)}
                  </div>
                  <div className="card-item-tags">
                    {card.tags.map((tag, index) => (
                      <span key={index} className="tag-chip small">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="card-item-meta">
                  <div className={`next-review ${overdue ? 'overdue' : ''}`}>
                    {overdue ? '已过期' : '下次复习'}：
                    {formatDate(card.nextReviewDate)}
                    {overdue && ` (${daysOverdue}天)`}
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteCard(card.id, e)}
                    title="删除卡片"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CardList;
