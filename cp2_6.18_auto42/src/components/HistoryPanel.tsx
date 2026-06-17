import { useCardStore } from '@/store';
import { formatDateTime } from '@/utils/exportUtils';
import { getTemplateByName } from '@/constants/templates';
import { X, Star, Clock, Heart } from 'lucide-react';
import type { CardData } from '@/constants/templates';

interface CardItemProps {
  card: CardData;
  source: 'history' | 'favorites';
}

function ThumbnailFallback({ card }: { card: CardData }) {
  const template = getTemplateByName(card.template);
  const containerStyle: React.CSSProperties = {
    width: 80,
    minWidth: 80,
    height: 60,
    borderRadius: 8,
    background: card.colors.background,
    border: `1px solid ${card.colors.accent}`,
    fontFamily: template.fontFamily,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '6px 6px 6px',
    gap: 4,
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  };
  const emojiWrapStyle: React.CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  const emojiStyle: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1,
  };
  const titleStyle: React.CSSProperties = {
    color: card.colors.title,
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'center',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    flexShrink: 0,
  };
  const bodyStyle: React.CSSProperties = {
    color: card.colors.body,
    fontSize: 6,
    lineHeight: 1.5,
    textAlign: 'justify',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    maxWidth: '100%',
    textIndent: '1em',
  };

  return (
    <div style={containerStyle}>
      <div style={emojiWrapStyle}>
        <span style={emojiStyle}>{card.emoji}</span>
      </div>
      <div style={titleStyle}>{card.title || '未命名'}</div>
      <div style={bodyStyle}>{card.body || ''}</div>
    </div>
  );
}

function CardItem({ card, source }: CardItemProps) {
  const { restoreCard, toggleFavorite, removeFromHistory, showToast } = useCardStore();

  const handleRestore = () => {
    restoreCard(card.id);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = toggleFavorite(card.id);

    if (result.action === 'favorited' && result.success) {
      showToast('已收藏');
    } else if (result.action === 'limit' && !result.success) {
      showToast('收藏已达上限（50条），请先移除部分收藏');
    } else if (result.action === 'unfavorited' && result.success) {
      showToast('已取消收藏');
    } else if (result.action === 'error' && !result.success) {
      if (card.isFavorite) {
        showToast('取消收藏失败，请重试');
      } else {
        showToast('收藏失败，请重试');
      }
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
      {card.thumbnail ? (
        <img
          src={card.thumbnail}
          alt={card.title}
          className="history-thumbnail-img"
          style={{
            width: 80,
            height: 60,
            borderRadius: 8,
            objectFit: 'cover',
          }}
        />
      ) : (
        <ThumbnailFallback card={card} />
      )}
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
