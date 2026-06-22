import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore, MemeCard } from '../store/editorStore';
import { formatDate } from '../utils/exportImage';
import './Community.css';

interface CommunityProps {
  showFavorites?: boolean;
}

const Community: React.FC<CommunityProps> = ({ showFavorites = false }) => {
  const { communityMemes, searchQuery, setSearchQuery, toggleFavorite, loadFromStorage } = useEditorStore();
  const [visibleItems, setVisibleItems] = useState<MemeCard[]>([]);
  const [hasAnimated, setHasAnimated] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    let filtered = communityMemes;
    if (showFavorites) {
      filtered = communityMemes.filter((meme) => meme.isFavorite);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((meme) =>
        meme.creatorName.toLowerCase().includes(query)
      );
    }
    setVisibleItems(filtered);
  }, [communityMemes, searchQuery, showFavorites]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-id');
            if (id && !hasAnimated.has(id)) {
              setHasAnimated((prev) => new Set(prev).add(id));
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const currentObserver = observerRef.current;
    cardRefs.current.forEach((card) => {
      if (card) currentObserver.observe(card);
    });

    return () => {
      currentObserver.disconnect();
    };
  }, [visibleItems, hasAnimated]);

  const setCardRef = (index: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[index] = el;
  };

  const leftColumn = visibleItems.filter((_, i) => i % 2 === 0);
  const rightColumn = visibleItems.filter((_, i) => i % 2 === 1);

  const renderCard = (meme: MemeCard, index: number) => {
    const isAnimated = hasAnimated.has(meme.id);
    return (
      <div
        key={meme.id}
        ref={setCardRef(index)}
        data-id={meme.id}
        className={`meme-card ${isAnimated ? 'animate-in' : ''}`}
        style={{ animationDelay: `${(index % 5) * 0.08}s` }}
      >
        <div className="card-image-wrapper">
          <img
            src={meme.imageUrl}
            alt=""
            className="card-image"
            loading="lazy"
          />
          <button
            className={`favorite-btn ${meme.isFavorite ? 'active' : ''}`}
            onClick={() => toggleFavorite(meme.id)}
            title={meme.isFavorite ? '取消收藏' : '收藏'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={meme.isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
        <div className="card-info">
          <div className="card-creator">
            <div className="creator-avatar">
              {meme.creatorName.charAt(0)}
            </div>
            <span className="creator-name">{meme.creatorName}</span>
          </div>
          <span className="card-date">{formatDate(meme.createdAt)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="community-page">
      <div className="community-header">
        <h1 className="page-title">
          {showFavorites ? '我的收藏' : '表情包社区'}
        </h1>
        {!showFavorites && (
          <div className="search-bar">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="search-icon"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="搜索创作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <div className="empty-state">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p>{showFavorites ? '还没有收藏的表情包' : '暂无匹配的表情包'}</p>
        </div>
      ) : (
        <div className="masonry-grid">
          <div className="masonry-column">
            {leftColumn.map((meme, i) => renderCard(meme, i * 2))}
          </div>
          <div className="masonry-column">
            {rightColumn.map((meme, i) => renderCard(meme, i * 2 + 1))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
