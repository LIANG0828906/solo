import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Exhibit, Booth, Comment } from '../types';
import apiService from '../services/apiService';

interface BoothData {
  booth: Booth;
  exhibits: Exhibit[];
}

interface CommentMap {
  [exhibitId: string]: Comment[];
}

interface LikeState {
  [exhibitId: string]: { liked: boolean; lockedUntil: number };
}

interface PendingComment {
  author: string;
  content: string;
}

const POLL_INTERVAL = 5000;
const LIKE_COOLDOWN = 5000;
const MY_NAME_KEY = 'expoflow_visitor_name';
const LIKE_LOCK_KEY = 'expoflow_like_locks';

const loadLikeLocks = (): { [exhibitId: string]: number } => {
  try {
    const raw = localStorage.getItem(LIKE_LOCK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveLikeLock = (exhibitId: string, lockedUntil: number) => {
  try {
    const locks = loadLikeLocks();
    locks[exhibitId] = lockedUntil;
    const now = Date.now();
    Object.keys(locks).forEach((id) => {
      if (locks[id] < now) delete locks[id];
    });
    localStorage.setItem(LIKE_LOCK_KEY, JSON.stringify(locks));
  } catch {
  }
};

const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const formatTime = (ts: number): string => {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const ExhibitList: React.FC = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const [boothData, setBoothData] = useState<BoothData | null>(null);
  const [comments, setComments] = useState<CommentMap>({});
  const [likeStates, setLikeStates] = useState<LikeState>(() => {
    const locks = loadLikeLocks();
    const now = Date.now();
    const initial: LikeState = {};
    Object.keys(locks).forEach((id) => {
      if (locks[id] > now) {
        initial[id] = { liked: true, lockedUntil: locks[id] };
      }
    });
    return initial;
  });
  const [commentInputs, setCommentInputs] = useState<{ [exhibitId: string]: PendingComment }>({});
  const [submittingComments, setSubmittingComments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>(() => localStorage.getItem(MY_NAME_KEY) || '');
  const pollTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const likeTimeoutRefs = useRef<{ [exhibitId: string]: number }>({});

  const loadInitialData = useCallback(async () => {
    if (!boothId) return;
    try {
      setLoading(true);
      const result = await apiService.getBoothExhibits(boothId);
      setBoothData(result);

      const commentPromises = result.exhibits.map((e) =>
        apiService.getExhibitComments(e.id).catch(() => [] as Comment[])
      );
      const commentResults = await Promise.all(commentPromises);
      const commentMap: CommentMap = {};
      result.exhibits.forEach((ex, idx) => {
        commentMap[ex.id] = commentResults[idx] || [];
      });
      setComments(commentMap);

      const initialInputs: { [k: string]: PendingComment } = {};
      result.exhibits.forEach((e) => {
        initialInputs[e.id] = { author: myName, content: '' };
      });
      setCommentInputs(initialInputs);

      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || '加载展位数据失败');
    } finally {
      setLoading(false);
    }
  }, [boothId, myName]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const schedulePoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }
    pollTimerRef.current = window.setTimeout(() => {
      rafRef.current = requestAnimationFrame(() => {
        doPoll();
        schedulePoll();
      });
    }, POLL_INTERVAL);
  }, []);

  const doPoll = useCallback(async () => {
    if (!boothId) return;
    try {
      const result = await apiService.pollBooth(boothId);
      setBoothData((prev) => (prev ? { ...prev, exhibits: result.exhibits } : prev));
      const commentMap: CommentMap = {};
      result.exhibits.forEach((ex) => {
        commentMap[ex.id] = result.comments.filter((c) => c.exhibitId === ex.id);
      });
      setComments(commentMap);
    } catch {
    }
  }, [boothId]);

  useEffect(() => {
    if (!loading && boothData && boothData.exhibits.length > 0) {
      schedulePoll();
    }
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      Object.values(likeTimeoutRefs.current).forEach((t) => clearTimeout(t));
      likeTimeoutRefs.current = {};
    };
  }, [loading, boothData, schedulePoll]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      setLikeStates((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach((id) => {
          if (next[id].liked && next[id].lockedUntil <= now) {
            next[id] = { ...next[id], liked: false };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(checkInterval);
  }, []);

  const handleLike = async (exhibit: Exhibit) => {
    const state = likeStates[exhibit.id];
    const now = Date.now();
    if (state && state.lockedUntil > now) return;

    try {
      const result = await apiService.likeExhibit(exhibit.id);
      setBoothData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exhibits: prev.exhibits.map((e) =>
            e.id === exhibit.id ? { ...e, likes: result.likes } : e
          ),
        };
      });
      const lockedUntil = now + LIKE_COOLDOWN;
      setLikeStates((prev) => ({
        ...prev,
        [exhibit.id]: { liked: true, lockedUntil },
      }));
      saveLikeLock(exhibit.id, lockedUntil);

      if (likeTimeoutRefs.current[exhibit.id]) {
        clearTimeout(likeTimeoutRefs.current[exhibit.id]);
      }
      likeTimeoutRefs.current[exhibit.id] = window.setTimeout(() => {
        setLikeStates((prev) => {
          const s = prev[exhibit.id];
          if (!s) return prev;
          return { ...prev, [exhibit.id]: { ...s, liked: false } };
        });
        delete likeTimeoutRefs.current[exhibit.id];
      }, LIKE_COOLDOWN);
    } catch {
    }
  };

  const updateCommentInput = (exhibitId: string, field: keyof PendingComment, value: string) => {
    setCommentInputs((prev) => ({
      ...prev,
      [exhibitId]: { ...(prev[exhibitId] || { author: myName, content: '' }), [field]: value },
    }));
    if (field === 'author') {
      setMyName(value);
      localStorage.setItem(MY_NAME_KEY, value);
    }
  };

  const handleSubmitComment = async (exhibitId: string, e: React.FormEvent) => {
    e.preventDefault();
    const input = commentInputs[exhibitId];
    if (!input || !input.author.trim() || !input.content.trim()) return;
    if (submittingComments.has(exhibitId)) return;

    setSubmittingComments((prev) => new Set(prev).add(exhibitId));
    try {
      const newComment = await apiService.createComment(exhibitId, {
        author: input.author.trim(),
        content: input.content.trim(),
      });
      setComments((prev) => ({
        ...prev,
        [exhibitId]: [...(prev[exhibitId] || []), newComment],
      }));
      setCommentInputs((prev) => ({
        ...prev,
        [exhibitId]: { author: input.author, content: '' },
      }));
    } catch (err: any) {
      alert(err?.response?.data?.error || '评论发表失败');
    } finally {
      setSubmittingComments((prev) => {
        const next = new Set(prev);
        next.delete(exhibitId);
        return next;
      });
    }
  };

  const isLikeLocked = (exhibitId: string): boolean => {
    const state = likeStates[exhibitId];
    const locks = loadLikeLocks();
    const now = Date.now();
    return !!(state?.lockedUntil && state.lockedUntil > now) || !!(locks[exhibitId] && locks[exhibitId] > now);
  };

  if (loading) {
    return (
      <div className="visitor-page">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            color: '#6366f1',
            fontSize: '16px',
          }}
        >
          加载中...
        </div>
      </div>
    );
  }

  if (error || !boothData) {
    return (
      <div className="visitor-page">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            color: '#6b7280',
            padding: '20px',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '48px' }}>😔</div>
          <div>{error || '展位不存在'}</div>
        </div>
      </div>
    );
  }

  const { booth, exhibits } = boothData;

  return (
    <div className="visitor-page">
      <div className="visitor-header">
        <div className="visitor-booth-number">{booth.number}</div>
        <div className="visitor-booth-name">{booth.name}</div>
        <div className="visitor-booth-desc">欢迎参观 · 扫码互动</div>
      </div>

      <div className="visitor-content">
        {exhibits.length === 0 ? (
          <div className="visitor-empty">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
            <div>该展位暂无展品</div>
          </div>
        ) : (
          exhibits.map((exhibit, index) => {
            const exhibitComments = comments[exhibit.id] || [];
            const input = commentInputs[exhibit.id] || { author: myName, content: '' };
            const isLocked = isLikeLocked(exhibit.id);
            const isLiked = !!(likeStates[exhibit.id]?.liked);
            const isSubmitting = submittingComments.has(exhibit.id);
            const lockState = likeStates[exhibit.id];
            const remaining = lockState && lockState.lockedUntil > Date.now()
              ? Math.ceil((lockState.lockedUntil - Date.now()) / 1000)
              : 0;

            return (
              <div
                key={exhibit.id}
                className="visitor-card fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img
                  src={exhibit.imageUrl}
                  alt={exhibit.name}
                  className="visitor-card-img"
                  loading="lazy"
                />
                <div className="visitor-card-body">
                  <div className="visitor-card-name">{exhibit.name}</div>
                  <div className="visitor-card-desc">{exhibit.description}</div>
                  {exhibit.tags.length > 0 && (
                    <div className="visitor-card-tags">
                      {exhibit.tags.map((tag) => (
                        <span key={tag} className="visitor-card-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="visitor-actions">
                  <button
                    className={`like-btn ${isLiked ? 'liked' : ''}`}
                    onClick={() => handleLike(exhibit)}
                    disabled={isLocked}
                    title={isLocked ? `${remaining}秒后可再次点赞` : '点赞'}
                  >
                    <HeartIcon filled={isLiked} />
                    <span>{exhibit.likes}</span>
                    {isLocked && remaining > 0 && (
                      <span style={{ fontSize: '11px', marginLeft: '4px' }}>({remaining}s)</span>
                    )}
                  </button>
                </div>

                <div className="comment-section">
                  <form onSubmit={(e) => handleSubmitComment(exhibit.id, e)}>
                    <div className="comment-input-wrap">
                      <input
                        type="text"
                        className="comment-author-input"
                        placeholder="昵称"
                        value={input.author}
                        onChange={(e) => updateCommentInput(exhibit.id, 'author', e.target.value)}
                        maxLength={12}
                      />
                      <input
                        type="text"
                        className="comment-input"
                        placeholder="说点什么..."
                        value={input.content}
                        onChange={(e) => updateCommentInput(exhibit.id, 'content', e.target.value)}
                        maxLength={200}
                      />
                      <button
                        type="submit"
                        className="comment-submit"
                        disabled={
                          isSubmitting || !input.author.trim() || !input.content.trim()
                        }
                      >
                        发送
                      </button>
                    </div>
                  </form>

                  {exhibitComments.length > 0 && (
                    <div className="comment-list">
                      {exhibitComments.map((comment) => {
                        const isOwn = comment.author === myName && myName !== '';
                        return (
                          <div
                            key={comment.id}
                            className={`comment-bubble ${isOwn ? 'own' : 'other'}`}
                          >
                            <div className="comment-content">
                              <div className="comment-author">{comment.author}</div>
                              <div>{comment.content}</div>
                              <div className="comment-time">{formatTime(comment.timestamp)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExhibitList;
