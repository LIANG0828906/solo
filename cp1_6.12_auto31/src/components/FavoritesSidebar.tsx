import React, { useMemo } from 'react';
import { Star, X } from 'lucide-react';
import { useTimelineStore } from '../store';
import { CATEGORIES } from '../types';

export const FavoritesSidebar: React.FC = () => {
  const {
    favorites,
    getFavoriteEvents,
    removeFromFavorites,
    setScrollToYear,
    setHighlightedEvent,
    toggleYear,
    expandedYears,
  } = useTimelineStore();

  const favoriteEvents = useMemo(() => {
    return getFavoriteEvents().sort((a, b) => b.year - a.year);
  }, [getFavoriteEvents]);

  const handleJumpToEvent = (eventId: string, year: number) => {
    if (!expandedYears.includes(year)) {
      toggleYear(year);
    }
    
    setScrollToYear(year);
    
    setTimeout(() => {
      setHighlightedEvent(eventId);
    }, 500);
  };

  const handleRemove = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    removeFromFavorites(eventId);
  };

  return (
    <div className="favorites-sidebar">
      <div className="sidebar-header">
        <Star size={20} fill="#fbbf24" />
        <h3>我的收藏</h3>
        <span className="favorites-count">{favorites.length}</span>
      </div>

      <div className="favorites-list">
        {favoriteEvents.length === 0 ? (
          <div className="empty-favorites">
            <Star size={32} className="empty-icon" />
            <p>还没有收藏的事件</p>
            <span>点击事件卡片上的收藏按钮添加</span>
          </div>
        ) : (
          favoriteEvents.map((event) => {
            const catInfo = CATEGORIES.find((c) => c.value === event.category);
            return (
              <div
                key={event.id}
                className="favorite-item"
                onClick={() => handleJumpToEvent(event.id, event.year)}
              >
                <div
                  className="favorite-color-bar"
                  style={{ backgroundColor: event.colors[0] }}
                />
                <div className="favorite-content">
                  <div className="favorite-header">
                    <span className="favorite-year">{event.year}</span>
                    <span
                      className="favorite-category"
                      style={{ color: catInfo?.color }}
                    >
                      {catInfo?.label}
                    </span>
                  </div>
                  <p className="favorite-title">{event.title}</p>
                </div>
                <button
                  className="remove-btn"
                  onClick={(e) => handleRemove(e, event.id)}
                  title="移除收藏"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
