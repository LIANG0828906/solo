import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Brain, Network, BookOpen, Clock } from 'lucide-react';
import { useStore } from '@/store';
import { CATEGORY_COLORS, CATEGORY_LABELS, type Card, type Category } from '@/types';
import '@/components/CardView.css';

const CATEGORIES: (Category | 'all')[] = ['all', 'programming', 'history', 'life', 'other'];

function ReviewTimeline() {
  const { dueCards, loadDueCards } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadDueCards();
  }, [loadDueCards]);

  if (dueCards.length === 0) return null;

  return (
    <div className="review-timeline">
      <div className="review-timeline-header">
        <Clock size={18} />
        <span>今日待复习</span>
        <span className="review-count">{dueCards.length}</span>
      </div>
      <div className="review-timeline-scroll">
        {dueCards.map((card) => (
          <div
            key={card.id}
            className="review-card-thumb"
            onClick={() => navigate('/review')}
            style={{
              '--cat-color': CATEGORY_COLORS[card.category],
            } as React.CSSProperties}
          >
            <div className="review-pulse-ring" />
            <svg className="progress-ring" width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#e0e0e0" strokeWidth="3" />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke={CATEGORY_COLORS[card.category]}
                strokeWidth="3"
                strokeDasharray={`${Math.min(card.reviewCount / 5, 1) * 125.6} 125.6`}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
              />
            </svg>
            <span className="review-card-title">{card.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardItem({ card }: { card: Card }) {
  const navigate = useNavigate();
  return (
    <div
      className="card-item"
      style={{
        '--cat-color': CATEGORY_COLORS[card.category],
      } as React.CSSProperties}
      onClick={() => navigate(`/card/${card.id}`)}
    >
      <div className="card-category-tag" style={{ backgroundColor: CATEGORY_COLORS[card.category] }}>
        {CATEGORY_LABELS[card.category]}
      </div>
      <h3 className="card-title">{card.title}</h3>
      <div
        className="card-content-preview"
        dangerouslySetInnerHTML={{
          __html: card.content.length > 120 ? card.content.slice(0, 120) + '…' : card.content,
        }}
      />
      <div className="card-meta">
        <span>{card.linkedCardIds.length} 个关联</span>
        <span>复习 {card.reviewCount} 次</span>
      </div>
    </div>
  );
}

export default function CardView() {
  const { cards, loading, searchQuery, selectedCategory, loadCards, setSearchQuery, setSelectedCategory } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadCards();
  }, [searchQuery, selectedCategory, loadCards]);

  const filteredCards = useMemo(() => {
    let result = cards;
    if (selectedCategory !== 'all') {
      result = result.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [cards, selectedCategory, searchQuery]);

  return (
    <div className="card-view">
      <ReviewTimeline />

      <div className="card-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索卡片..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="category-filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
              style={
                selectedCategory === cat && cat !== 'all'
                  ? { backgroundColor: CATEGORY_COLORS[cat as Category], color: '#fff' }
                  : undefined
              }
            >
              {cat === 'all' ? '全部' : CATEGORY_LABELS[cat as Category]}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button className="nav-btn" onClick={() => navigate('/review')} title="复习模式">
            <Brain size={18} />
            <span>复习</span>
          </button>
          <button className="nav-btn" onClick={() => navigate('/graph')} title="知识图谱">
            <Network size={18} />
            <span>图谱</span>
          </button>
          <button className="add-btn" onClick={() => navigate('/card/new')}>
            <Plus size={18} />
            <span>新建卡片</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <BookOpen size={48} className="loading-icon" />
          <p>加载中...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} />
          <p>还没有知识卡片</p>
          <button className="add-btn" onClick={() => navigate('/card/new')}>
            <Plus size={18} />
            创建第一张卡片
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {filteredCards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
