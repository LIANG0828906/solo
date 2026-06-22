import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTimelineStore, type TimelineEvent } from '../store/useTimelineStore';
import { timelineEngine } from '../engine/TimelineEngine';

const HeartIcon = ({ filled, size = 18 }: { filled: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#C9733F' : 'none'} stroke={filled ? '#C9733F' : '#8B7A63'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B7A63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const MapPinSmallIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B7A63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

interface TimelineCardProps {
  event: TimelineEvent;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

const TimelineCard: React.FC<TimelineCardProps> = ({ event, index, isExpanded, onToggle, onEdit }) => {
  const { likeEvent, toggleCommentSidebar, commentSidebarOpen, commentSidebarEventId, addComment, currentUser } = useTimelineStore();
  const [liked, setLiked] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [commentInput, setCommentInput] = useState('');
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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!liked) {
      setLiked(true);
      setHeartAnimating(true);
      likeEvent(event.id);
      setTimeout(() => setHeartAnimating(false), 400);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCommentSidebar(event.id);
  };

  const handleSubmitComment = () => {
    if (commentInput.trim()) {
      addComment(event.id, commentInput.trim());
      setCommentInput('');
    }
  };

  const truncateText = (text: string, maxLines: number = 2) => {
    if (isExpanded) return text;
    const charsPerLine = 35;
    const maxChars = charsPerLine * maxLines;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars - 3) + '...';
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.images.length > 0) {
      setCarouselIndex((carouselIndex + 1) % event.images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.images.length > 0) {
      setCarouselIndex((carouselIndex - 1 + event.images.length) % event.images.length);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <>
      <div
        ref={cardRef}
        onClick={() => { onToggle(); onEdit(); }}
        style={{
          position: 'absolute',
          left: 'calc(50% - 370px)',
          top: index * 160 + 40,
          width: 320,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(40px)',
          transition: `all 0.4s ease-out ${Math.min(index, 5) * 0.1}s`,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            backgroundColor: isExpanded ? '#FFFBF0' : '#fff',
            borderRadius: 16,
            padding: isExpanded ? 20 : 16,
            boxShadow: '0 4px 16px rgba(224, 208, 188, 0.4)',
            transition: 'all 0.3s ease',
            height: isExpanded ? 'auto' : undefined,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(224, 208, 188, 0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(224, 208, 188, 0.4)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h3 style={{ color: '#5C4033', fontSize: 16, fontWeight: 700, flex: 1, lineHeight: 1.4 }}>
              {event.title}
            </h3>
            {event.isPublic && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8, flexShrink: 0 }}>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12, color: '#8B7A63' }}>
            <span>{formatDate(event.date)}</span>
            {event.location && (
              <>
                <span>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MapPinSmallIcon />
                  {event.location}
                </span>
              </>
            )}
          </div>

          {event.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {event.tags.slice(0, 4).map(tag => (
                <span
                  key={tag}
                  style={{
                    padding: '3px 10px',
                    backgroundColor: '#F5E6CA',
                    color: '#5C4033',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p
            style={{
              color: '#5C4033',
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: isExpanded ? 16 : 0,
              whiteSpace: isExpanded ? 'pre-wrap' : 'normal',
              overflow: isExpanded ? 'visible' : 'hidden',
            }}
          >
            {truncateText(event.content)}
          </p>

          {!isExpanded && event.content.length > 70 && (
            <div
              style={{
                height: 20,
                marginTop: -20,
                background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))',
                position: 'relative',
                pointerEvents: 'none',
              }}
            />
          )}

          {isExpanded && event.images.length > 0 && (
            <div style={{ position: 'relative', marginBottom: 16, borderRadius: 12, overflow: 'hidden', height: 200 }}>
              <div
                style={{
                  display: 'flex',
                  transform: `translateX(-${carouselIndex * 100}%)`,
                  transition: 'transform 0.3s ease',
                  height: '100%',
                }}
              >
                {event.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`图片 ${idx + 1}`}
                    style={{ width: '100%', height: 200, objectFit: 'cover', flexShrink: 0 }}
                    loading="lazy"
                  />
                ))}
              </div>
              {event.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#5C4033',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8B7A63'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'; e.currentTarget.style.color = '#5C4033'; }}
                  >
                    <ChevronLeftIcon />
                  </button>
                  <button
                    onClick={nextImage}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#5C4033',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8B7A63'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'; e.currentTarget.style.color = '#5C4033'; }}
                  >
                    <ChevronRightIcon />
                  </button>
                  <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                    {event.images.map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: idx === carouselIndex ? '#C9733F' : 'rgba(255, 255, 255, 0.7)',
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {isExpanded && event.images.length === 0 && (
            <div
              style={{
                marginBottom: 16,
                height: 120,
                borderRadius: 12,
                backgroundColor: '#F5ECD6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8B7A63',
                fontSize: 13,
                gap: 6,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              暂无图片
            </div>
          )}

          {isExpanded && (
            <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid #F0E5D8' }}>
              <button
                onClick={handleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid #E0D0BC',
                  cursor: 'pointer',
                  color: liked ? '#C9733F' : '#8B7A63',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FDF6E3'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span className={heartAnimating ? 'heart-fill' : ''}>
                  <HeartIcon filled={liked} />
                </span>
                <span>{event.likes + (liked ? 1 : 0)}</span>
              </button>
              <button
                onClick={handleComment}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid #E0D0BC',
                  cursor: 'pointer',
                  color: commentSidebarOpen && commentSidebarEventId === event.id ? '#C9733F' : '#8B7A63',
                  fontSize: 13,
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FDF6E3'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <CommentIcon />
                <span>{event.comments.length}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {commentSidebarOpen && commentSidebarEventId === event.id && (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: 380,
            height: '100vh',
            backgroundColor: '#FFFBF0',
            boxShadow: '-4px 0 24px rgba(224, 208, 188, 0.4)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.3s ease-out',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0E5D8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#5C4033', fontSize: 16, fontWeight: 700 }}>评论 ({event.comments.length})</h3>
            <button
              onClick={() => toggleCommentSidebar(null)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                backgroundColor: 'transparent', cursor: 'pointer', color: '#8B7A63',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5E6CA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <XIcon />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {event.comments.length === 0 && (
              <div style={{ textAlign: 'center', color: '#8B7A63', fontSize: 13, padding: 40 }}>
                还没有评论，快来发表第一条吧！
              </div>
            )}
            {event.comments.map((c, i) => (
              <div key={c.id} style={{ display: 'flex', gap: 10, animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both` }}>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    backgroundColor: '#F5E6CA', border: '2px solid #D4A373',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#5C4033', fontSize: 14, fontWeight: 600, flexShrink: 0,
                  }}
                >
                  {c.userName.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
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
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                placeholder="写下你的评论..."
                style={{
                  flex: 1,
                  height: 40,
                  padding: '0 14px',
                  borderRadius: 8,
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
                onClick={handleSubmitComment}
                disabled={!commentInput.trim()}
                style={{
                  width: 40, height: 40, borderRadius: 8,
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
      )}
    </>
  );
};

export const TimelineView: React.FC = () => {
  const { events, selectedEventId, setSelectedEvent, loadEvents, loadMoreEvents, isLoading } = useTimelineStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    timelineEngine.setEvents(events);
  }, [events]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreEvents();
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMoreEvents]);

  const totalHeight = Math.max(events.length * 160 + 120, 600);

  const handleCardClick = useCallback((eventId: string) => {
    setSelectedEvent(selectedEventId === eventId ? null : eventId);
  }, [selectedEventId, setSelectedEvent]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        backgroundColor: '#F0E5D8',
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 400,
      }}
    >
      <div
        ref={scrollRef}
        style={{
          height: '100%',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {events.length === 0 && !isLoading && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#8B7A63',
            gap: 16,
            padding: 40,
            textAlign: 'center',
          }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#5C4033', marginBottom: 6 }}>还没有时间线事件</p>
              <p style={{ fontSize: 13 }}>使用左侧面板创建你的第一个人生重要时刻吧！</p>
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div style={{ position: 'relative', height: totalHeight, width: '100%' }}>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 3,
                backgroundColor: '#C4A882',
                transform: 'translateX(-50%)',
                borderRadius: 2,
              }}
            />

            {events.map((event, index) => (
              <div
                key={`node-${event.id}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: index * 160 + 80,
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#FFFBF0',
                  border: '3px solid #D4A373',
                  boxShadow: '0 0 0 4px rgba(212, 163, 115, 0.2)',
                  zIndex: 2,
                  transition: 'all 0.2s ease',
                }}
              />
            ))}

            {events.map((event, index) => (
              <TimelineCard
                key={event.id}
                event={event}
                index={index}
                isExpanded={selectedEventId === event.id}
                onToggle={() => handleCardClick(event.id)}
                onEdit={() => {}}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 40 }} />

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '3px solid #E0D0BC', borderTopColor: '#C9733F',
              animation: 'pulse 1s linear infinite',
            }} />
          </div>
        )}
      </div>
    </div>
  );
};
