import React, { useEffect, useRef, useState } from 'react';
import { useTimelineStore, type TimelineEvent } from '../store/useTimelineStore';

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#C9733F' : 'none'} stroke={filled ? '#C9733F' : '#8B7A63'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B7A63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CalendarSmallIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

interface TimelineCardProps {
  event: TimelineEvent;
  index: number;
  onLike: () => void;
  onOpenComments: () => void;
  liked: boolean;
  heartAnimating: boolean;
}

const CommunityCard: React.FC<TimelineCardProps> = ({ event, index, onLike, onOpenComments, liked, heartAnimating }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#D4A373', '#C9733F', '#8B7A63', '#C4A882', '#A67B5B'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      ref={cardRef}
      style={{
        width: 280,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `all 0.5s ease-out ${Math.min(index % 9, 8) * 0.1}s`,
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFBF0',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 2px 12px rgba(224, 208, 188, 0.3)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(224, 208, 188, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(224, 208, 188, 0.3)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: getAvatarColor(event.authorName),
              border: '2px solid #D4A373',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {event.authorName.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#5C4033', fontSize: 13, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {event.authorName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8B7A63', fontSize: 11 }}>
              <CalendarSmallIcon />
              <span>{formatDate(event.date)}</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, marginBottom: 14 }}>
          <h3 style={{ color: '#5C4033', fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>
            {event.title}
          </h3>
          <p style={{ color: '#8B7A63', fontSize: 12, lineHeight: 1.5, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {event.content}
          </p>
          {event.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {event.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  style={{
                    padding: '2px 8px',
                    backgroundColor: '#F5E6CA',
                    color: '#5C4033',
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 12, borderTop: '1px solid #F0E5D8' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: liked ? '#C9733F' : '#8B7A63',
              fontSize: 12,
              fontWeight: 500,
              padding: 0,
              transition: 'all 0.2s',
            }}
          >
            <span className={heartAnimating ? 'heart-fill' : ''}>
              <HeartIcon filled={liked} />
            </span>
            <span>{event.likes + (liked ? 1 : 0)}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenComments(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#8B7A63',
              fontSize: 12,
              fontWeight: 500,
              padding: 0,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#C9733F'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8B7A63'; }}
          >
            <CommentIcon />
            <span>{event.comments.length}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface CommentModalProps {
  event: TimelineEvent | null;
  onClose: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ event, onClose }) => {
  const { addComment, currentUser } = useTimelineStore();
  const [commentInput, setCommentInput] = useState('');

  if (!event) return null;

  const handleSubmit = () => {
    if (commentInput.trim()) {
      addComment(event.id, commentInput.trim());
      setCommentInput('');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(92, 64, 51, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '80vh',
          backgroundColor: '#FFFBF0',
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(92, 64, 51, 0.3)',
          animation: 'fadeInUp 0.3s ease-out',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0E5D8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: '#5C4033', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{event.title}</h3>
            <p style={{ color: '#8B7A63', fontSize: 12 }}>评论 ({event.comments.length})</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              backgroundColor: 'transparent', cursor: 'pointer', color: '#8B7A63',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5E6CA'; e.currentTarget.style.color = '#5C4033'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8B7A63'; }}
          >
            <XIcon />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {event.comments.length === 0 && (
            <div style={{ textAlign: 'center', color: '#8B7A63', fontSize: 13, padding: 40 }}>
              还没有评论，快来发表第一条吧！
            </div>
          )}
          {event.comments.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', gap: 12, animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  backgroundColor: '#F5E6CA', border: '2px solid #D4A373',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#5C4033', fontSize: 13, fontWeight: 600, flexShrink: 0,
                }}
              >
                {c.userName.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                  <span style={{ color: '#5C4033', fontSize: 13, fontWeight: 600 }}>{c.userName}</span>
                  <span style={{ color: '#8B7A63', fontSize: 11 }}>
                    {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#F8F4E6',
                  borderRadius: '0 12px 12px 12px',
                  padding: '10px 14px',
                  color: '#5C4033',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}>
                  {c.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #F0E5D8', backgroundColor: '#fff' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="写下你的评论，按回车发送..."
              style={{
                flex: 1,
                height: 42,
                padding: '0 16px',
                borderRadius: 10,
                border: '1px solid #E0D0BC',
                backgroundColor: '#F8F4E6',
                color: '#5C4033',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#D4A373'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0D0BC'; }}
            />
            <button
              onClick={handleSubmit}
              disabled={!commentInput.trim()}
              style={{
                width: 42, height: 42, borderRadius: 10,
                backgroundColor: commentInput.trim() ? '#C9733F' : '#E0D0BC',
                border: 'none', cursor: commentInput.trim() ? 'pointer' : 'not-allowed',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CommunitySquare: React.FC = () => {
  const { communityEvents, loadCommunityEvents, loadMoreCommunityEvents, isLoading, likeEvent } = useTimelineStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [commentModalEvent, setCommentModalEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    loadCommunityEvents();
  }, [loadCommunityEvents]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreCommunityEvents();
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreCommunityEvents]);

  const handleLike = (eventId: string) => {
    if (!likedIds.has(eventId)) {
      setLikedIds(prev => new Set(prev).add(eventId));
      setAnimatingIds(prev => new Set(prev).add(eventId));
      likeEvent(eventId);
      setTimeout(() => {
        setAnimatingIds(prev => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
      }, 400);
    }
  };

  const chunkSize = 3;
  const rows: TimelineEvent[][] = [];
  for (let i = 0; i < communityEvents.length; i += chunkSize) {
    rows.push(communityEvents.slice(i, i + chunkSize));
  }

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#F8F4E6', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 40px', borderBottom: '1px solid #F0E5D8', backgroundColor: '#FFFBF0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ color: '#5C4033', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
            社区广场
          </h1>
          <p style={{ color: '#8B7A63', fontSize: 14 }}>
            发现别人的精彩人生故事，点赞并分享你的感动
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {communityEvents.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', padding: 80, color: '#8B7A63' }}>
              <p style={{ fontSize: 16 }}>暂无公开的时间轴</p>
            </div>
          )}

          <div className="stagger-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {rows.map((row, rowIdx) => (
              <div key={rowIdx} style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                {row.map((event, colIdx) => (
                  <CommunityCard
                    key={event.id}
                    event={event}
                    index={rowIdx * chunkSize + colIdx}
                    onLike={() => handleLike(event.id)}
                    onOpenComments={() => setCommentModalEvent(event)}
                    liked={likedIds.has(event.id)}
                    heartAnimating={animatingIds.has(event.id)}
                  />
                ))}
              </div>
            ))}
          </div>

          <div ref={sentinelRef} style={{ height: 40 }} />

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '3px solid #E0D0BC', borderTopColor: '#C9733F',
                animation: 'pulse 1s linear infinite',
              }} />
            </div>
          )}
        </div>
      </div>

      <CommentModal event={commentModalEvent} onClose={() => setCommentModalEvent(null)} />
    </div>
  );
};
