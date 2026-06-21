import { useState } from 'react';
import type { Meme } from './types';
import { useMemeContext } from './App';

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  '今日梗': { bg: '#FEF3C7', text: '#D97706' },
  '暖心': { bg: '#DBEAFE', text: '#2563EB' },
  '冷笑话': { bg: '#D1FAE5', text: '#059669' },
  '金句': { bg: '#FCE7F3', text: '#DB2777' },
  '吐槽': { bg: '#E0E7FF', text: '#4F46E5' },
};

interface MemeWallProps {
  memes: Meme[];
}

export default function MemeWall({ memes }: MemeWallProps) {
  const { likeMeme } = useMemeContext();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  const handleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (likedIds.has(id)) return;

    setAnimatingIds(prev => new Set(prev).add(id));
    setLikedIds(prev => new Set(prev).add(id));
    likeMeme(id);

    setTimeout(() => {
      setAnimatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (memes.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>💭</div>
        <p style={styles.emptyText}>还没有妙语，快来发布第一条吧！</p>
      </div>
    );
  }

  return (
    <div className="meme-wall">
      {memes.map((meme, index) => {
        const isLiked = likedIds.has(meme.id);
        const isAnimating = animatingIds.has(meme.id);

        return (
          <div
            key={meme.id}
            className="meme-card"
            style={{
              animation: `fadeIn 0.4s ease ${index * 0.05}s both`,
            }}
          >
            {meme.tags.length > 0 && (
              <div style={styles.tagRow}>
                {meme.tags.map(tag => {
                  const colors = TAG_COLORS[tag] || { bg: '#E2E8F0', text: '#475569' };
                  return (
                    <span
                      key={tag}
                      style={{
                        ...styles.tagPill,
                        backgroundColor: colors.bg,
                        color: colors.text,
                      }}
                    >
                      #{tag}
                    </span>
                  );
                })}
              </div>
            )}

            <p style={styles.content}>{meme.content}</p>

            <div style={styles.cardFooter}>
              <div style={styles.authorInfo}>
                <span style={styles.authorName}>{meme.author}</span>
                <span style={styles.time}>{formatTime(meme.timestamp)}</span>
              </div>

              <button
                className="like-btn"
                onClick={(e) => handleLike(e, meme.id)}
                style={{
                  transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                }}
                aria-label={isLiked ? '已点赞' : '点赞'}
              >
                <HeartIcon filled={isLiked} />
                <span style={{
                  ...styles.likeCount,
                  color: isLiked ? '#EF4444' : '#94A3B8',
                }}>
                  {meme.likes}
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? '#EF4444' : 'none'}
      stroke={filled ? '#EF4444' : '#CBD5E1'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: 'all 0.2s ease' }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
  },
  content: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.6,
    marginBottom: 16,
    wordBreak: 'break-word',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTop: '1px solid #F1F5F9',
  },
  authorInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  authorName: {
    color: '#475569',
    fontSize: 13,
    fontWeight: 600,
  },
  time: {
    color: '#94A3B8',
    fontSize: 11,
  },
  likeCount: {
    fontSize: 13,
    fontWeight: 600,
    transition: 'color 0.2s ease',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 16,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.5,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
  },
};
