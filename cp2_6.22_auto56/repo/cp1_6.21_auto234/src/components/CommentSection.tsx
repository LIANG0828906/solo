import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Play, Pause, Plus, MessageCircle, Trash2, Reply, Send } from 'lucide-react';

interface Comment {
  id: string;
  projectId: string;
  content: string;
  author: string;
  authorAvatar?: string;
  timestamp: string;
  timePoint?: number;
  parentId?: string;
}

interface CommentSectionProps {
  projectId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ projectId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 600;
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [activeInputTime, setActiveInputTime] = useState<number | null>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState(0);
  const [loading, setLoading] = useState(true);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const playbackRef = useRef<number | null>(null);

  useEffect(() => {
    loadComments();
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, [projectId]);

  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = window.setInterval(() => {
        setCurrentTime((t) => {
          if (t >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    } else {
      if (playbackRef.current) clearInterval(playbackRef.current);
    }
    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, [isPlaying, duration]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/projects/${projectId}/comments`);
      setComments(res.data || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = Math.round(ratio * duration);
    if (isAddingMode) {
      setActiveInputTime(time);
      setIsAddingMode(false);
      setReplyToId(null);
      setNewCommentText('');
    } else {
      setCurrentTime(time);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || activeInputTime === null) return;
    try {
      const res = await axios.post(`/api/projects/${projectId}/comments`, {
        content: newCommentText,
        timePoint: activeInputTime,
      });
      setComments((prev) => [...prev, res.data]);
      setActiveInputTime(null);
      setNewCommentText('');
    } catch {
      const newComment: Comment = {
        id: `local-${Date.now()}`,
        projectId,
        content: newCommentText,
        author: '当前用户',
        timestamp: new Date().toISOString(),
        timePoint: activeInputTime,
      };
      setComments((prev) => [...prev, newComment]);
      setActiveInputTime(null);
      setNewCommentText('');
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await axios.post(`/api/projects/${projectId}/comments`, {
        content: replyText,
        parentId,
      });
      setComments((prev) => [...prev, res.data]);
    } catch {
      const newComment: Comment = {
        id: `local-${Date.now()}`,
        projectId,
        content: replyText,
        author: '当前用户',
        timestamp: new Date().toISOString(),
        parentId,
      };
      setComments((prev) => [...prev, newComment]);
    }
    setReplyToId(null);
    setReplyText('');
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/projects/${projectId}/comments/${id}`);
    } catch {}
    setComments((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
  };

  const handleMarkerClick = (comment: Comment) => {
    if (comment.timePoint !== undefined) {
      setCurrentTime(comment.timePoint);
    }
    setHighlightedId(comment.id);
    setTimeout(() => {
      const el = commentRefs.current[comment.id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
    setTimeout(() => setHighlightedId(null), 2500);
  };

  const markersWithTime = useMemo(
    () => comments.filter((c) => c.timePoint !== undefined && !c.parentId),
    [comments]
  );

  const rootComments = useMemo(
    () => comments.filter((c) => !c.parentId),
    [comments]
  );

  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parentId === parentId);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getRelativeTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return '刚刚';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}分钟前`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}小时前`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}天前`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}个月前`;
    return `${Math.floor(mo / 12)}年前`;
  };

  const getAvatar = (author: string, seed?: string) => {
    const s = seed || author;
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s)}&backgroundColor=3B82F6,10B981,F59E0B,EF4444,8B5CF6&textColor=ffffff`;
  };

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@[\u4e00-\u9fa5A-Za-z0-9_]+)/g);
    return parts.map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} style={{ color: '#3B82F6', fontWeight: 500 }}>
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const renderComment = (comment: Comment, depth = 0) => {
    const replies = getReplies(comment.id);
    const isHighlighted = highlightedId === comment.id;
    const isReply = depth > 0;

    return (
      <div key={comment.id}>
        <div
          ref={(el) => {
            commentRefs.current[comment.id] = el;
          }}
          className="comment-item"
          style={{
            marginLeft: isReply ? 32 : 0,
            background: '#1E293B',
            borderRadius: 12,
            padding: 12,
            borderLeft: `3px solid ${isReply ? '#3B82F6' : '#10B981'}`,
            marginBottom: 12,
            transition: 'box-shadow 0.3s, transform 0.3s',
            boxShadow: isHighlighted
              ? '0 0 0 2px #3B82F6, 0 0 20px rgba(59, 130, 246, 0.4)'
              : 'none',
            transform: isHighlighted ? 'scale(1.01)' : 'scale(1)',
            animation: 'fadeIn 0.3s ease-out',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <img
              src={getAvatar(comment.author, comment.authorAvatar)}
              alt={comment.author}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                flexShrink: 0,
                background: '#334155',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14 }}>
                    {comment.author}
                  </span>
                  {comment.timePoint !== undefined && (
                    <span
                      onClick={() => {
                        if (comment.timePoint !== undefined) {
                          setCurrentTime(comment.timePoint);
                        }
                      }}
                      style={{
                        background: '#EF4444',
                        color: '#fff',
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      ⏱ {formatTime(comment.timePoint)}
                    </span>
                  )}
                  <span style={{ color: '#64748B', fontSize: 12 }}>
                    {getRelativeTime(comment.timestamp)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => {
                      setReplyToId(replyToId === comment.id ? null : comment.id);
                      setActiveInputTime(null);
                      setReplyText('');
                    }}
                    className="action-btn"
                    style={{
                      color: '#64748B',
                      fontSize: 12,
                      padding: '4px 8px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#3B82F6';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59, 130, 246, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#64748B';
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                  >
                    <Reply size={14} />
                    回复
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="delete-btn"
                    style={{
                      color: '#64748B',
                      fontSize: 12,
                      padding: '4px 8px',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      opacity: 0,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#EF4444';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#64748B';
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
              <div
                style={{
                  color: '#CBD5E1',
                  fontSize: 14,
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {renderContentWithMentions(comment.content)}
              </div>
            </div>
          </div>

          {replyToId === comment.id && (
            <div style={{ marginTop: 12, marginLeft: 52 }}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`回复 @${comment.author}...`}
                autoFocus
                rows={2}
                style={{
                  width: '100%',
                  background: '#334155',
                  border: '1px solid #475569',
                  borderRadius: 8,
                  padding: 10,
                  color: '#F1F5F9',
                  fontSize: 14,
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = '#3B82F6';
                }}
                onBlur={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = '#475569';
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => {
                    setReplyToId(null);
                    setReplyText('');
                  }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: '1px solid #475569',
                    background: 'transparent',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#64748B';
                    (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#475569';
                    (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
                  }}
                >
                  取消
                </button>
                <button
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyText.trim()}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: replyText.trim() ? '#10B981' : '#475569',
                    color: '#fff',
                    cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (replyText.trim()) {
                      (e.currentTarget as HTMLButtonElement).style.background = '#059669';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = replyText.trim() ? '#10B981' : '#475569';
                  }}
                >
                  <Send size={14} />
                  发送回复
                </button>
              </div>
            </div>
          )}
        </div>

        {replies.map((r) => renderComment(r, depth + 1))}
      </div>
    );
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 20,
        color: '#F1F5F9',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .comment-item:hover .delete-btn {
          opacity: 1 !important;
        }
        .marker-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          transform: translateX(-50%);
          background: #0F172A;
          border: 1px solid #334155;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          color: #CBD5E1;
          white-space: nowrap;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 100;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        .marker-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #0F172A;
        }
      `}</style>

      <div
        style={{
          background: '#0F172A',
          borderRadius: 12,
          overflow: 'hidden',
          width: '100%',
          aspectRatio: '16 / 9',
          position: 'relative',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              color: '#475569',
            }}
          >
            <button
              onClick={() => setIsPlaying((p) => !p)}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '2px solid #334155',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(51, 65, 85, 0.9)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#475569';
                (e.currentTarget as HTMLButtonElement).style.color = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(30, 41, 59, 0.8)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#334155';
                (e.currentTarget as HTMLButtonElement).style.color = '#94A3B8';
              }}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 4 }} />}
            </button>
            <span style={{ fontSize: 12 }}>预览视频</span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 20px 14px',
            background:
              'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 60%, transparent 100%)',
          }}
        >
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            style={{
              position: 'relative',
              height: 8,
              background: '#334155',
              borderRadius: 4,
              cursor: isAddingMode ? 'crosshair' : 'pointer',
              userSelect: 'none',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(currentTime / duration) * 100}%`,
                background: '#3B82F6',
                borderRadius: 4,
                transition: 'width 0.1s linear',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${(currentTime / duration) * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 14,
                height: 14,
                background: '#fff',
                border: '2px solid #3B82F6',
                borderRadius: '50%',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
              }}
            />

            {markersWithTime.map((c) => (
              <div
                key={c.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkerClick(c);
                }}
                onMouseEnter={(e) => {
                  setHoveredMarkerId(c.id);
                  if (c.timePoint !== undefined) {
                    setTooltipPos((c.timePoint / duration) * 100);
                  }
                }}
                onMouseLeave={() => setHoveredMarkerId(null)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${((c.timePoint ?? 0) / duration) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 14,
                  height: 14,
                  background: '#EF4444',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  zIndex: 2,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: hoveredMarkerId === c.id ? '0 0 0 4px rgba(239, 68, 68, 0.35)' : 'none',
                }}
              >
                {hoveredMarkerId === c.id && (
                  <div
                    className="marker-tooltip"
                    style={{ left: `${tooltipPos}%` }}
                  >
                    <div style={{ color: '#EF4444', fontWeight: 600, marginBottom: 2 }}>
                      {formatTime(c.timePoint ?? 0)} · {c.author}
                    </div>
                    <div
                      style={{
                        color: '#94A3B8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 200,
                      }}
                    >
                      {c.content.length > 40 ? c.content.slice(0, 40) + '…' : c.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {activeInputTime !== null && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${(activeInputTime / duration) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 16,
                  height: 16,
                  background: '#EF4444',
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  zIndex: 3,
                  boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.4)',
                  animation: 'pulse 1s ease-in-out infinite',
                }}
              />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94A3B8', fontSize: 12 }}>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(currentTime)}</span>
              <span style={{ color: '#475569' }}>/</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(duration)}</span>
            </div>
            <button
              onClick={() => {
                setIsAddingMode((v) => !v);
                setActiveInputTime(null);
                setReplyToId(null);
                setNewCommentText('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: isAddingMode ? '#059669' : '#10B981',
                color: '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isAddingMode ? '0 0 0 3px rgba(16, 185, 129, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#059669';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isAddingMode ? '#059669' : '#10B981';
              }}
            >
              <Plus size={16} />
              {isAddingMode ? '点击进度条选择时间点…' : '添加评论'}
            </button>
          </div>
        </div>
      </div>

      {activeInputTime !== null && (
        <div
          className="comment-item"
          style={{
            background: '#1E293B',
            borderRadius: 12,
            padding: 16,
            borderLeft: '3px solid #EF4444',
            marginBottom: 20,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span
              style={{
                background: '#EF4444',
                color: '#fff',
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              ⏱ 时间点: {formatTime(activeInputTime)}
            </span>
            <button
              onClick={() => {
                setActiveInputTime(null);
                setNewCommentText('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </div>
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="写下你的评论... 输入 @ 可以提及用户"
            autoFocus
            rows={3}
            style={{
              width: '100%',
              background: '#334155',
              border: '1px solid #475569',
              borderRadius: 8,
              padding: 12,
              color: '#F1F5F9',
              fontSize: 14,
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = '#3B82F6';
            }}
            onBlur={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = '#475569';
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              onClick={handleAddComment}
              disabled={!newCommentText.trim()}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: newCommentText.trim() ? '#10B981' : '#475569',
                color: '#fff',
                cursor: newCommentText.trim() ? 'pointer' : 'not-allowed',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                if (newCommentText.trim()) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#059669';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = newCommentText.trim() ? '#10B981' : '#475569';
              }}
            >
              <Send size={14} />
              发布评论
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          marginTop: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={18} style={{ color: '#10B981' }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9' }}>
            评论
          </span>
          <span
            style={{
              background: '#334155',
              color: '#94A3B8',
              padding: '2px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {comments.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: 60,
            color: '#64748B',
          }}
        >
          加载中...
        </div>
      ) : comments.length === 0 ? (
        <div
          style={{
            background: '#1E293B',
            borderRadius: 12,
            padding: 48,
            textAlign: 'center',
            border: '1px dashed #334155',
          }}
        >
          <MessageCircle size={40} style={{ color: '#475569', margin: '0 auto 16px' }} />
          <p style={{ color: '#94A3B8', fontSize: 15, margin: 0 }}>
            暂无评论，点击视频任意时间点添加第一条评论
          </p>
        </div>
      ) : (
        <div>{rootComments.map((c) => renderComment(c, 0))}</div>
      )}
    </div>
  );
};

export default CommentSection;
