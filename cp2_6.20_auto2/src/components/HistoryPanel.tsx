import React, { useState } from 'react';
import { HistoryItem, PasswordMode } from '../utils/passwordGenerator';

interface HistoryPanelProps {
  history: HistoryItem[];
  draggedItemId: string | null;
  setDraggedItemId: (id: string | null) => void;
  onCopy: (text: string) => Promise<boolean>;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  onClear: () => void;
}

const modeLabels: Record<PasswordMode, { label: string; icon: string }> = {
  random: { label: '随机', icon: '🔀' },
  phrase: { label: '短语', icon: '📝' },
  readable: { label: '可读', icon: '📖' }
};

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  draggedItemId,
  setDraggedItemId,
  onCopy,
  onToggleFavorite,
  onDelete,
  onReorder,
  onClear
}) => {
  const [favAnimatingIds, setFavAnimatingIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleFavoriteClick = (id: string) => {
    setFavAnimatingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setFavAnimatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400);
    onToggleFavorite(id);
  };

  const handleCopyClick = async (id: string, password: string) => {
    const success = await onCopy(password);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', id);
    } catch (_) { /* ignore */ }
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggedItemId;
    if (sourceId && sourceId !== targetId) {
      onReorder(sourceId, targetId);
    }
    setDraggedItemId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverId(null);
  };

  const favorites = history.filter(item => item.isFavorite);
  const regular = history.filter(item => !item.isFavorite);

  return (
    <section className="history-panel animate-fade-in">
      <div className="history-header">
        <h2 className="history-title">
          📜 历史记录
          <span className="history-count">{history.length} / 20</span>
        </h2>
        {history.length > 0 && (
          <button
            className="history-clear-btn"
            onClick={onClear}
          >
            清空全部
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🔐</div>
          <div className="empty-state__title">暂无历史记录</div>
          <div className="empty-state__desc">
            点击「生成新密码」按钮来创建您的第一个安全密码
          </div>
        </div>
      ) : (
        <div className="history-list">
          {favorites.length > 0 && favorites.map(item => (
            <HistoryCard
              key={item.id}
              item={item}
              isDragging={draggedItemId === item.id}
              isDragOver={dragOverId === item.id}
              isFavAnimating={favAnimatingIds.has(item.id)}
              isCopied={copiedId === item.id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onCopy={handleCopyClick}
              onFavorite={handleFavoriteClick}
              onDelete={onDelete}
            />
          ))}
          {regular.map(item => (
            <HistoryCard
              key={item.id}
              item={item}
              isDragging={draggedItemId === item.id}
              isDragOver={dragOverId === item.id}
              isFavAnimating={favAnimatingIds.has(item.id)}
              isCopied={copiedId === item.id}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onCopy={handleCopyClick}
              onFavorite={handleFavoriteClick}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
};

interface HistoryCardProps {
  item: HistoryItem;
  isDragging: boolean;
  isDragOver: boolean;
  isFavAnimating: boolean;
  isCopied: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onCopy: (id: string, password: string) => Promise<void>;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({
  item,
  isDragging,
  isDragOver,
  isFavAnimating,
  isCopied,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onCopy,
  onFavorite,
  onDelete
}) => {
  const modeInfo = modeLabels[item.mode];

  return (
    <div
      className={`history-card 
        ${item.isFavorite ? 'history-card--favorite' : ''} 
        ${isDragging ? 'history-card--dragging' : ''}
      `}
      style={{
        borderColor: isDragOver && !isDragging ? 'var(--accent)' : undefined,
        boxShadow: isDragOver && !isDragging ? '0 0 0 2px rgba(233, 69, 96, 0.3)' : undefined
      }}
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, item.id)}
      onDragEnd={onDragEnd}
    >
      <div className="history-card__top">
        <span className="history-card__time">
          {formatTime(item.createdAt)}
        </span>
        <span className="history-card__mode">
          {modeInfo.icon} {modeInfo.label}
        </span>
      </div>
      <div className="history-card__password" title={item.password}>
        {item.password}
      </div>
      <div className="history-card__actions">
        <button
          className={`icon-btn ${item.isFavorite ? 'icon-btn--favorite' : ''}`}
          onClick={() => onFavorite(item.id)}
          title={item.isFavorite ? '取消收藏' : '收藏'}
        >
          <span className={`icon-btn__icon ${isFavAnimating ? 'icon-btn__icon--spin' : ''}`}>
            {item.isFavorite ? '★' : '☆'}
          </span>
        </button>
        <button
          className="icon-btn"
          onClick={() => onCopy(item.id, item.password)}
          title="复制"
        >
          <span className="icon-btn__icon">
            {isCopied ? '✓' : '📋'}
          </span>
        </button>
        <button
          className="icon-btn icon-btn--delete"
          onClick={() => onDelete(item.id)}
          title="删除"
        >
          <span className="icon-btn__icon">🗑️</span>
        </button>
      </div>
    </div>
  );
};

export default HistoryPanel;
