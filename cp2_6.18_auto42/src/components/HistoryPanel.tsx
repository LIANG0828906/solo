import { useCardStore } from '@/store';
import { formatDateTime } from '@/utils/exportUtils';
import { X, Star, Clock, Heart } from 'lucide-react';
import type { CardData } from '@/constants/templates';

interface CardItemProps {
  card: CardData;
  source: 'history' | 'favorites';
}

function CardItem({ card, source }: CardItemProps) {
  const { restoreCard, toggleFavorite, removeFromHistory, showToast } = useCardStore();

  const handleRestore = () => {
    restoreCard(card.id);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(card.id);
    if (!card.isFavorite) {
      showToast('已收藏');
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (source === 'history') {
      removeFromHistory(card.id);
    }
  };

  return (
    <div className="history-item" onClick={handleRestore}>
      <div
        className="history-thumbnail"
        style={{
          background: card.colors.background,
          borderColor: card.colors.accent,
        }}
      >
        <span className="thumb-emoji">{card.emoji}</span>
        <span className="thumb-title" style={{ color: card.colors.title }}>
          {card.title.slice(0, 6)}
        </span>
      </div>
      <div className="history-info">
        <div className="history-title" style={{ color: '#333' }}>
          {card.title || '未命名卡片'}
        </div>
        <div className="history-time">{formatDateTime(card.createTime)}</div>
      </div>
      <div className="history-actions">
        <button
          className="icon-btn"
          onClick={handleToggleFavorite}
          title={card.isFavorite ? '取消收藏' : '收藏'}
        >
          <Star
            size={18}
            fill={card.isFavorite ? '#FFD700' : 'none'}
            stroke={card.isFavorite ? '#FFD700' : '#999'}
          />
        </button>
        {source === 'history' && (
          <button
            className="icon-btn"
            onClick={handleRemove}
            title="删除"
          >
            <X size={18} stroke="#999" />
          </button>
        )}
      </div>
    </div>
  );
}

export function HistoryPanel() {
  const { isHistoryOpen, toggleHistoryPanel, history, favorites } = useCardStore();

  return (
    <>
      <button
        className="history-toggle-btn"
        onClick={toggleHistoryPanel}
        title="历史记录"
      >
        <Clock size={20} />
        <span>历史</span>
      </button>

      <div
        className={`history-panel ${isHistoryOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="history-panel-header">
          <h3>历史记录与收藏</h3>
          <button className="icon-btn" onClick={toggleHistoryPanel}>
            <X size={20} />
          </button>
        </div>

        <div className="history-panel-content">
          {favorites.length > 0 && (
            <div className="history-section">
              <div className="section-header">
                <Heart size={16} fill="#FF6B6B" stroke="#FF6B6B" />
                <span>我的收藏 ({favorites.length})</span>
              </div>
              <div className="history-list">
                {favorites.map((card) => (
                  <CardItem key={card.id} card={card} source="favorites" />
                ))}
              </div>
            </div>
          )}

          <div className="history-section">
            <div className="section-header">
              <Clock size={16} />
              <span>最近编辑 ({history.length})</span>
            </div>
            {history.length === 0 ? (
              <div className="empty-history">暂无历史记录</div>
            ) : (
              <div className="history-list">
                {history.map((card) => (
                  <CardItem key={card.id} card={card} source="history" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isHistoryOpen && (
        <div className="history-overlay" onClick={toggleHistoryPanel} />
      )}
    </>
  );
}
