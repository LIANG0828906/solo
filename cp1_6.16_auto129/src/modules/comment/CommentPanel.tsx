import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useCommentStore } from './CommentStore';
import { useArtworkStore } from '../../store/ArtworkStore';
import { AuthService } from '../auth/AuthService';
import type { Artwork, Comment } from '../../shared/types';

interface CommentPanelProps {
  artwork: Artwork;
  onClose: () => void;
  isVisible: boolean;
  isMobile?: boolean;
}

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  return date.toLocaleDateString('zh-CN');
};

export const CommentPanel: React.FC<CommentPanelProps> = ({
  artwork,
  onClose,
  isVisible,
  isMobile = false,
}) => {
  const allComments = useCommentStore((s) => s.getComments(artwork.id));
  const addComment = useCommentStore((s) => s.addComment);
  const deleteComment = useCommentStore((s) => s.deleteComment);
  const likeComment = useCommentStore((s) => s.likeComment);
  const incrementLikes = useArtworkStore((s) => s.incrementArtworkLikes);
  const incrementCommentCount = useArtworkStore((s) => s.incrementCommentCount);

  const [text, setText] = useState('');
  const [likedArtwork, setLikedArtwork] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewHeight, setViewHeight] = useState(600);

  const currentUser = AuthService.getCurrentUser();

  const sortedComments = useMemo(() => {
    return [...allComments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allComments]);

  const ITEM_HEIGHT = 110;
  const OVERSCAN = 5;
  const MAX_VISIBLE = 30;

  useEffect(() => {
    if (scrollRef.current) {
      setViewHeight(scrollRef.current.clientHeight);
    }
  }, [isVisible]);

  const totalItems = Math.min(sortedComments.length, 1000);
  const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const visibleCount = Math.min(
    Math.ceil(viewHeight / ITEM_HEIGHT) + OVERSCAN * 2,
    MAX_VISIBLE
  );
  const endIdx = Math.min(startIdx + visibleCount, totalItems);
  const visible = sortedComments.slice(startIdx, endIdx);
  const totalHeight = totalItems * ITEM_HEIGHT;
  const offsetY = startIdx * ITEM_HEIGHT;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;
    addComment(
      artwork.id,
      currentUser.id,
      currentUser.username,
      currentUser.avatar,
      text.trim()
    );
    incrementCommentCount(artwork.id, 1);
    setText('');
    if (scrollRef.current) {
      setTimeout(() => { scrollRef.current!.scrollTop = 0; }, 50);
    }
  };

  const handleLikeArtwork = () => {
    if (likedArtwork) return;
    setLikedArtwork(true);
    incrementLikes(artwork.id);
    setLikeAnimating('artwork');
    setTimeout(() => setLikeAnimating(null), 400);
  };

  const handleLikeComment = (c: Comment) => {
    if (!currentUser) return;
    likeComment(artwork.id, c.id, currentUser.id);
    setLikeAnimating(c.id);
    setTimeout(() => setLikeAnimating(null), 400);
  };

  const handleDelete = (c: Comment) => {
    if (!currentUser || c.userId !== currentUser.id) return;
    if (!confirm('确定删除这条评论？')) return;
    deleteComment(artwork.id, c.id, currentUser.id);
    incrementCommentCount(artwork.id, -1);
  };

  const panelWidth = isMobile ? '100%' : '350px';
  const panelStyle: React.CSSProperties = {
    position: isMobile ? 'fixed' : 'relative',
    [isMobile ? 'bottom' : 'right']: 0,
    left: isMobile ? 0 : 'auto',
    width: panelWidth,
    height: isMobile ? '60%' : '100%',
    background: '#2C2C2C',
    borderLeft: isMobile ? 'none' : '3px solid #FFD700',
    borderTop: isMobile ? '3px solid #FFD700' : 'none',
    borderTopLeftRadius: isMobile ? 20 : 0,
    borderTopRightRadius: isMobile ? 20 : 0,
    display: 'flex',
    flexDirection: 'column',
    transform: isMobile
      ? isVisible ? 'translateY(0)' : 'translateY(100%)'
      : isVisible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    zIndex: 100,
    boxShadow: isVisible ? '-4px 0 24px rgba(0,0,0,0.5)' : 'none',
    overflow: 'hidden',
  };

  return (
    <div style={panelStyle}>
      <div style={{ padding: 16, borderBottom: '1px solid rgba(255,215,0,0.15)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{ width: 6, height: 24, background: 'linear-gradient(to bottom, #FFD700, #FF6B6B)', borderRadius: 3 }} />
            <div style={{ fontWeight: 600, fontSize: 16, color: '#FFD700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              评论 {sortedComments.length > 0 ? `(${sortedComments.length})` : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={btnCloseStyle}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.92)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >✕</button>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: 12, background: 'rgba(26,26,46,0.6)', borderRadius: 12, marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,215,0,0.3)' }}>
            <img src={artwork.thumbnailUrl || artwork.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="%23333"/></svg>'); }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: '#E0E0E0', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artwork.title}</div>
            <div style={{ fontSize: 12, color: '#A0A0A0', marginBottom: 6 }}>作者：{artwork.authorName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={handleLikeArtwork} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, border: 'none', background: likedArtwork ? 'rgba(255,51,102,0.15)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s', transform: likeAnimating === 'artwork' ? 'scale(1.2)' : 'scale(1)' }}>
                <span style={{ fontSize: 18, transition: 'color 0.2s', color: likedArtwork ? '#FF3366' : '#C0C0C0' }}>♥</span>
                <span style={{ fontSize: 13, color: likedArtwork ? '#FF3366' : '#C0C0C0' }}>{artwork.likes + (likedArtwork ? 1 : 0)}</span>
              </button>
              <div style={{ color: '#FFB800', fontSize: 13 }}>
                {'★'.repeat(Math.round(artwork.averageRating))}
                <span style={{ color: '#555' }}>{'★'.repeat(5 - Math.round(artwork.averageRating))}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={currentUser ? '写下你的评论...' : '请先登录发表评论'}
            disabled={!currentUser}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,215,0,0.2)',
              background: 'rgba(26,26,46,0.8)',
              color: '#E0E0E0',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || !currentUser}
            style={submitBtnStyle(text.trim() && currentUser)}
            onMouseDown={(e) => { if (text.trim() && currentUser) (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
          >发送</button>
        </form>
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        style={{ flex: 1, overflowY: 'auto', padding: 12, position: 'relative' }}
      >
        {sortedComments.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, color: '#666' }}>
            <div style={{ fontSize: 42, marginBottom: 12, opacity: 0.4 }}>💭</div>
            <div style={{ fontSize: 14 }}>暂无评论，来抢沙发吧~</div>
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', top: 0, left: 0, right: 0 }}>
              {visible.map((c, i) => {
                const isLiked = currentUser ? c.likedBy.includes(currentUser.id) : false;
                const canDelete = currentUser && c.userId === currentUser.id;
                return (
                  <div key={c.id} style={{ height: ITEM_HEIGHT, padding: '10px 4px' }}>
                    <div
                      style={commentItemStyle(startIdx + i)}
                      onAnimationEnd={(e) => {
                        if ((e.target as HTMLElement).dataset?.cleared) return;
                        (e.target as HTMLElement).dataset.cleared = '1';
                        (e.target as HTMLElement).style.animation = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,215,0,0.3)', background: '#333' }}>
                          {c.userAvatar ? (
                            <img src={c.userAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#FFD700', fontSize: 18 }}>
                              {c.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 500 }}>{c.username}</span>
                              <span style={{ fontSize: 12, color: '#808080' }}>{formatTime(c.createdAt)}</span>
                            </div>
                            {canDelete && (
                              <button onClick={() => handleDelete(c)} style={{ border: 'none', background: 'transparent', color: '#666', cursor: 'pointer', fontSize: 12, padding: 2, borderRadius: 4 }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#666'; }}>删除</button>
                            )}
                          </div>
                          <div style={{ fontSize: 13.5, color: '#D0D0D0', lineHeight: 1.6, marginBottom: 8, wordBreak: 'break-word' }}>{c.content}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => handleLikeComment(c)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'all 0.15s' }}
                            >
                              <span style={{ fontSize: 16, transition: 'all 0.2s', transform: likeAnimating === c.id ? 'scale(1.4)' : 'scale(1)', display: 'inline-block', color: isLiked ? '#FF3366' : '#C0C0C0' }}>♥</span>
                              <span style={{ fontSize: 12, color: isLiked ? '#FF3366' : '#A0A0A0', fontWeight: 500 }}>{c.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideInFromTop {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const btnCloseStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: 'none',
  background: 'rgba(255,255,255,0.05)',
  color: '#A0A0A0',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  flexShrink: 0,
  transition: 'all 0.15s',
};

const submitBtnStyle = (enabled: boolean): React.CSSProperties => ({
  padding: '10px 18px',
  borderRadius: 10,
  border: 'none',
  background: enabled ? 'linear-gradient(135deg, #FFD700, #FFA500)' : '#333',
  color: enabled ? '#1A1A2E' : '#666',
  fontWeight: 600,
  fontSize: 13,
  cursor: enabled ? 'pointer' : 'not-allowed',
  flexShrink: 0,
  transition: 'all 0.15s',
});

const commentItemStyle = (index: number): React.CSSProperties => ({
  background: 'rgba(26,26,46,0.6)',
  padding: 12,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.04)',
  height: '100%',
  animation: index < 2 ? `slideInFromTop ${0.3 + index * 0.08}s ease-out` : undefined,
});
