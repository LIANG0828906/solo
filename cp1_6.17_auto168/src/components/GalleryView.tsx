import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GraffitiWork } from '../gallery/GalleryManager';
import useStore from '../App';

const containerStyle: React.CSSProperties = {
  height: '100%',
  overflowY: 'auto',
  padding: '24px 32px',
};

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '24px',
};

const sortSelectStyle: React.CSSProperties = {
  background: '#222',
  color: '#EEE',
  border: '1px solid #444',
  borderRadius: '8px',
  padding: '8px 14px',
  fontSize: '13px',
  cursor: 'pointer',
  outline: 'none',
};

const masonryStyle: React.CSSProperties = {
  columns: 'auto 260px',
  columnGap: '16px',
};

const cardStyle: React.CSSProperties = {
  breakInside: 'avoid',
  marginBottom: '16px',
  background: '#222',
  borderRadius: '12px',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  contentVisibility: 'auto',
  containIntrinsicSize: '300px',
};

const cardImgStyle: React.CSSProperties = {
  width: '100%',
  display: 'block',
};

const cardBodyStyle: React.CSSProperties = {
  padding: '12px',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#EEE',
  marginBottom: '8px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const cardMetaStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  fontSize: '12px',
  color: '#999',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.85)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  paddingTop: '40px',
  zIndex: 1000,
  overflowY: 'auto',
  paddingBottom: '40px',
};

const detailCardStyle: React.CSSProperties = {
  background: '#1A1A2E',
  borderRadius: '16px',
  maxWidth: '900px',
  width: '90%',
  overflow: 'hidden',
  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
};

const detailImgStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '80vh',
  objectFit: 'contain',
  display: 'block',
  background: '#F5F5DC',
};

const detailBodyStyle: React.CSSProperties = {
  padding: '24px',
};

const detailTitleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#EEE',
  marginBottom: '16px',
};

const likeBtnStyle = (liked: boolean): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: 'none',
  border: '1px solid #444',
  borderRadius: '20px',
  padding: '8px 18px',
  cursor: 'pointer',
  color: liked ? '#E74C3C' : '#FFF',
  fontSize: '16px',
  transition: 'all 0.2s ease',
});

const commentInputStyle: React.CSSProperties = {
  width: '80%',
  background: '#333',
  border: '1px solid #444',
  borderBottomLeftRadius: '8px',
  borderBottomRightRadius: '8px',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
  color: '#EEE',
  padding: '12px 16px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border 0.2s',
};

const commentItemStyle: React.CSSProperties = {
  padding: '10px 0',
  borderBottom: '1px solid #2A2A4A',
  fontSize: '14px',
  color: '#CCC',
};

const commentTimeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#666',
  marginTop: '4px',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '80px 20px',
  color: '#666',
  fontSize: '16px',
};

const closeBtnStyle: React.CSSProperties = {
  position: 'fixed',
  top: '16px',
  right: '24px',
  background: '#333',
  border: 'none',
  color: '#EEE',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  fontSize: '20px',
  cursor: 'pointer',
  zIndex: 1001,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function HeartSVG({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#E74C3C' : 'none'} stroke={filled ? '#E74C3C' : '#FFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.2s ease' }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function GalleryCard({ work, index, onClick }: { work: GraffitiWork; index: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      ref={ref}
      style={{
        ...cardStyle,
        opacity: visible ? 1 : 0,
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={work.dataURI} alt={work.title} style={cardImgStyle} loading="lazy" />
      <div style={cardBodyStyle}>
        <div style={cardTitleStyle}>{work.title}</div>
        <div style={cardMetaStyle}>
          <span>❤️ {work.likes}</span>
          <span>💬 {work.comments.length}</span>
          <span>{formatTime(work.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function DetailView({ workId, onClose }: { workId: string; onClose: () => void }) {
  const works = useStore(s => s.works);
  const toggleLike = useStore(s => s.toggleLike);
  const addComment = useStore(s => s.addComment);
  const [commentText, setCommentText] = useState('');
  const [likeAnimating, setLikeAnimating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const work = works.find(w => w.id === workId);

  const handleLike = useCallback(() => {
    toggleLike(workId);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 300);
  }, [workId, toggleLike]);

  const handleComment = useCallback(() => {
    if (!commentText.trim()) return;
    addComment(workId, commentText.trim());
    setCommentText('');
  }, [workId, commentText, addComment]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleComment();
    }
  }, [handleComment]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!work) return null;

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <button style={closeBtnStyle} onClick={onClose} onMouseEnter={e => { (e.target as HTMLElement).style.background = '#555'; }} onMouseLeave={e => { (e.target as HTMLElement).style.background = '#333'; }}>✕</button>
      <div style={detailCardStyle}>
        <img src={work.dataURI} alt={work.title} style={detailImgStyle} />
        <div style={detailBodyStyle}>
          <div style={detailTitleStyle}>{work.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <button
              style={{
                ...likeBtnStyle(work.liked),
                transform: likeAnimating ? 'scale(1.2)' : 'scale(1)',
              }}
              onClick={handleLike}
            >
              <HeartSVG filled={work.liked} />
              <span>{work.likes}</span>
            </button>
            <span style={{ color: '#888', fontSize: '13px' }}>{formatTime(work.createdAt)}</span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#EEE', marginBottom: '12px' }}>评论 ({work.comments.length})</div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
              {work.comments.length === 0 && <div style={{ color: '#666', fontSize: '13px' }}>暂无评论，快来发表第一条评论吧！</div>}
              {work.comments.map(c => (
                <div key={c.id} style={commentItemStyle}>
                  <div>{c.text}</div>
                  <div style={commentTimeStyle}>{formatTime(c.createdAt)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                style={commentInputStyle}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入评论，按 Enter 提交..."
                onFocus={e => { e.target.style.border = '1px solid #E74C3C'; }}
                onBlur={e => { e.target.style.border = '1px solid #444'; }}
              />
              <button
                style={{
                  background: '#E74C3C',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFF',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onClick={handleComment}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = '#C0392B'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = '#E74C3C'; }}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GalleryView() {
  const works = useStore(s => s.works);
  const [sortBy, setSortBy] = useState<'time' | 'likes'>('time');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  const sortedWorks = useMemo(() => {
    const list = [...works];
    if (sortBy === 'likes') {
      list.sort((a, b) => b.likes - a.likes);
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }, [works, sortBy]);

  return (
    <div style={containerStyle}>
      <div style={topBarStyle}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#EEE' }}>涂鸦画廊</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#888' }}>排序：</span>
          <select
            style={sortSelectStyle}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'time' | 'likes')}
          >
            <option value="time">最新发布</option>
            <option value="likes">最受欢迎</option>
          </select>
        </div>
      </div>

      {sortedWorks.length === 0 ? (
        <div style={emptyStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
          <div>画廊空空如也，快去创作你的第一幅涂鸦吧！</div>
        </div>
      ) : (
        <div style={masonryStyle}>
          {sortedWorks.map((work, index) => (
            <GalleryCard
              key={work.id}
              work={work}
              index={index}
              onClick={() => setSelectedWorkId(work.id)}
            />
          ))}
        </div>
      )}

      {selectedWorkId && (
        <DetailView workId={selectedWorkId} onClose={() => setSelectedWorkId(null)} />
      )}
    </div>
  );
}
