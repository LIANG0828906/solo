import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Hotel,
  Bus,
  MessageSquare,
  Send,
  GripVertical,
  Trash2,
} from 'lucide-react';
import type { DayPlan, Attraction, Comment } from '@/types';
import useTripStore from '@/stores/tripStore';

interface DayCardProps {
  dayPlan: DayPlan;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function DayCard({ dayPlan, isExpanded = true, onToggle }: DayCardProps) {
  const {
    selectedAttractionId,
    selectedDayId,
    setSelectedAttraction,
    setSelectedDay,
    deleteAttraction,
    addComment,
  } = useTripStore();

  const [isOpen, setIsOpen] = useState(isExpanded);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen, dayPlan.attractions.length]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    onToggle?.();
  }, [onToggle]);

  const handleAttractionClick = useCallback(
    (attractionId: string) => {
      setSelectedDay(dayPlan.id);
      setSelectedAttraction(attractionId);
    },
    [dayPlan.id, setSelectedDay, setSelectedAttraction]
  );

  const handleDeleteAttraction = useCallback(
    (e: React.MouseEvent, attractionId: string) => {
      e.stopPropagation();
      deleteAttraction(dayPlan.id, attractionId);
    },
    [dayPlan.id, deleteAttraction]
  );

  const handleCommentChange = useCallback((attractionId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [attractionId]: value }));
  }, []);

  const handleAddComment = useCallback(
    (attractionId: string) => {
      const content = commentInputs[attractionId]?.trim();
      if (!content) return;

      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const comment: Comment = {
        id: `comment-${Date.now()}`,
        userId: user?.id || 'anonymous',
        username: user?.username || '匿名用户',
        content,
        createdAt: new Date().toISOString(),
        attractionId,
      };

      addComment(dayPlan.id, attractionId, comment);
      setCommentInputs((prev) => ({ ...prev, [attractionId]: '' }));
    },
    [commentInputs, dayPlan.id, addComment]
  );

  const handleDragStart = useCallback((e: React.DragEvent, attractionId: string) => {
    setDraggedId(attractionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', attractionId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverIndex(null);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        marginBottom: '16px',
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      <div
        onClick={handleToggle}
        style={{
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: selectedDayId === dayPlan.id ? '#eff6ff' : 'white',
          transition: 'background-color 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#1a73e8',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            D{dayPlan.dayNumber}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>
              第 {dayPlan.dayNumber} 天
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{formatDate(dayPlan.date)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            {dayPlan.attractions.length} 个景点
          </span>
          {isOpen ? (
            <ChevronUp size={20} style={{ color: '#6b7280' }} />
          ) : (
            <ChevronDown size={20} style={{ color: '#6b7280' }} />
          )}
        </div>
      </div>

      <div
        style={{
          height: contentHeight,
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}
      >
        <div ref={contentRef} style={{ padding: '0 20px 20px' }}>
          {(dayPlan.accommodation || dayPlan.transportation) && (
            <div
              style={{
                display: 'flex',
                gap: '16px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              {dayPlan.accommodation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <Hotel size={16} style={{ color: '#34a853' }} />
                  <span style={{ fontSize: '13px', color: '#4b5563' }}>
                    {dayPlan.accommodation}
                  </span>
                </div>
              )}
              {dayPlan.transportation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <Bus size={16} style={{ color: '#1a73e8' }} />
                  <span style={{ fontSize: '13px', color: '#4b5563' }}>
                    {dayPlan.transportation}
                  </span>
                </div>
              )}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            {dayPlan.attractions.map((attraction, index) => (
              <div
                key={attraction.id}
                draggable
                onDragStart={(e) => handleDragStart(e, attraction.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleAttractionClick(attraction.id)}
                style={{
                  position: 'relative',
                  padding: '12px 12px 12px 32px',
                  marginBottom: index < dayPlan.attractions.length - 1 ? '8px' : 0,
                  backgroundColor:
                    selectedAttractionId === attraction.id ? '#eff6ff' : '#f9fafb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease, transform 0.2s ease',
                  opacity: draggedId === attraction.id ? 0.5 : 1,
                  transform: dragOverIndex === index && draggedId !== attraction.id ? 'translateY(4px)' : 'none',
                }}
                onMouseOver={(e) => {
                  if (selectedAttractionId !== attraction.id) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedAttractionId !== attraction.id) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'grab',
                    color: '#9ca3af',
                  }}
                >
                  <GripVertical size={16} />
                </div>

                <div style={{ position: 'absolute', left: '24px', top: '14px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor:
                        selectedAttractionId === attraction.id ? '#1a73e8' : '#d1d5db',
                      border: '2px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '4px',
                      }}
                    >
                      <MapPin size={14} style={{ color: '#1a73e8', flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#1f2937',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {attraction.name}
                      </span>
                    </div>
                    {attraction.notes && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          margin: '4px 0 0 20px',
                          lineHeight: 1.4,
                        }}
                      >
                        {attraction.notes}
                      </p>
                    )}
                    {attraction.duration && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '6px',
                          marginLeft: '20px',
                        }}
                      >
                        <Clock size={12} style={{ color: '#9ca3af' }} />
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {attraction.duration} 分钟
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDeleteAttraction(e, attraction.id)}
                    style={{
                      padding: '4px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      opacity: 0,
                      transition: 'opacity 0.2s, color 0.2s',
                      flexShrink: 0,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.opacity = '0';
                      e.currentTarget.style.color = '#9ca3af';
                    }}
                    onFocus={(e) => (e.currentTarget.style.opacity = '1')}
                    onBlur={(e) => (e.currentTarget.style.opacity = '0')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {attraction.comments.length > 0 && (
                  <div
                    style={{
                      marginTop: '10px',
                      marginLeft: '20px',
                      paddingTop: '8px',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    {attraction.comments.slice(-2).map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          padding: '6px 0',
                          fontSize: '12px',
                          color: '#4b5563',
                        }}
                      >
                        <span style={{ fontWeight: 500, color: '#1a73e8' }}>
                          {comment.username}
                        </span>
                        <span style={{ color: '#9ca3af', marginLeft: '6px' }}>
                          {formatTime(comment.createdAt)}
                        </span>
                        <p style={{ margin: '2px 0 0', lineHeight: 1.4 }}>{comment.content}</p>
                      </div>
                    ))}
                    {attraction.comments.length > 2 && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                        还有 {attraction.comments.length - 2} 条评论
                      </div>
                    )}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '10px',
                    marginLeft: '20px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e5e7eb',
                  }}
                >
                  <MessageSquare size={14} style={{ color: '#9ca3af' }} />
                  <input
                    type="text"
                    value={commentInputs[attraction.id] || ''}
                    onChange={(e) => handleCommentChange(attraction.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(attraction.id);
                      }
                    }}
                    placeholder="添加评论..."
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px',
                      outline: 'none',
                      backgroundColor: 'white',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1a73e8')}
                    onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                  />
                  <button
                    onClick={() => handleAddComment(attraction.id)}
                    style={{
                      padding: '6px 10px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: commentInputs[attraction.id]?.trim() ? '#1a73e8' : '#d1d5db',
                      color: 'white',
                      cursor: commentInputs[attraction.id]?.trim() ? 'pointer' : 'not-allowed',
                      transition: 'background-color 0.2s',
                    }}
                    disabled={!commentInputs[attraction.id]?.trim()}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayCard;
