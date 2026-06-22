import React, { useEffect, useState } from 'react';
import type { StoryboardCard } from '../types';

interface Props {
  card: StoryboardCard | null;
  index: number;
  total: number;
  onClose: () => void;
}

export const DetailModal: React.FC<Props> = ({ card, index, total, onClose }) => {
  const [closing, setClosing] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!card) {
      setClosing(false);
      setZoomed(false);
      return;
    }
    setClosing(false);
    setZoomed(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAnimated();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card]);

  if (!card) return null;

  const closeAnimated = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`detail-mask ${closing ? 'closing' : ''}`}
      onClick={closeAnimated}
    >
      <div className="detail-box" onClick={(e) => e.stopPropagation()}>
        <div className="detail-info">
          <button className="detail-close" onClick={closeAnimated} title="关闭 (ESC)">✕</button>
          <span className="tag">作品详情 · {index + 1}/{total}</span>
          <h2>{card.title || `未命名作品 ${index + 1}`}</h2>
          <p>
            {card.description ||
              '暂无描述。在编辑页面为这张作品添加故事背景，让你的叙事更加完整。'}
          </p>
          <div style={{ marginTop: 20, padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.2)', fontSize: 12, color: 'var(--text-dim)' }}>
            <div style={{ marginBottom: 4 }}>🎬 过渡动画</div>
            <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>
              {{
                none: '无动画',
                slideLeft: '从左向右滑入',
                slideUp: '从下向上滑动',
                zoomFade: '缩放淡入',
              }[card.animation]}
            </div>
          </div>
        </div>
        <div className="detail-img" onClick={() => setZoomed((z) => !z)}>
          {card.imageUrl ? (
            <img src={card.imageUrl} className={zoomed ? 'zoomed' : ''} alt="" draggable={false} />
          ) : (
            <div style={{ color: 'var(--text-dim)', fontSize: 16 }}>暂无图片</div>
          )}
          {card.imageUrl && (
            <span className="zoom-hint">点击图片{zoomed ? '缩小' : '放大 1.5×'}</span>
          )}
        </div>
      </div>
    </div>
  );
};
