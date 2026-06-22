import React, { useState, useEffect, useRef, useCallback, CSSProperties } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getCommunityFeed, likePost, commentPost, getTrendingVinyls } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import type { Post, Comment } from '../types';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const BACKGROUND_COLOR = '#1a1a2e';
const CARD_COLOR = '#16213e';
const PRIMARY_COLOR = '#e94560';

interface TrendingVinyl {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  add_count: number;
}

const FALLBACK_TRENDING: TrendingVinyl[] = [
  {
    id: 'fb-1',
    title: 'Thriller',
    artist: 'Michael Jackson',
    cover_url: 'https://picsum.photos/seed/thriller/160',
    add_count: 128,
  },
  {
    id: 'fb-2',
    title: 'Back in Black',
    artist: 'AC/DC',
    cover_url: 'https://picsum.photos/seed/backinblack/160',
    add_count: 96,
  },
  {
    id: 'fb-3',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    cover_url: 'https://picsum.photos/seed/darksidemoon/160',
    add_count: 87,
  },
  {
    id: 'fb-4',
    title: 'Rumours',
    artist: 'Fleetwood Mac',
    cover_url: 'https://picsum.photos/seed/rumours/160',
    add_count: 72,
  },
];

interface FeedState {
  posts: Post[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

const pageStyle: CSSProperties = {
  padding: '100px 24px 40px',
  minHeight: '100vh',
  backgroundColor: BACKGROUND_COLOR,
  color: '#fff',
};

const containerStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  gap: '2%',
  alignItems: 'flex-start',
};

const leftColumnStyle: CSSProperties = {
  width: '68%',
  minWidth: 0,
};

const rightColumnStyle: CSSProperties = {
  width: '30%',
  minWidth: 0,
  position: 'sticky',
  top: '100px',
};

const mobileResponsiveStyle = `
  @media (max-width: 768px) {
    .community-container {
      flex-direction: column-reverse !important;
      gap: 24px !important;
    }
    .community-left, .community-right {
      width: 100% !important;
      position: static !important;
    }
  }
`;

const shimmerKeyframesStyle = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .shimmer-bg {
    background: linear-gradient(
      45deg,
      transparent 0%,
      rgba(255,255,255,0.05) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
  }
`;

const SectionTitle: React.FC<{ children: React.ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <h2 style={{
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 20px 0',
    color: '#fff',
    ...style,
  }}>
    {children}
  </h2>
);

const renderStars = (rating: number): string => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '⭐'.repeat(full) + (half ? '✨' : '') + '☆'.repeat(empty);
};

const SkeletonCard: React.FC = () => (
  <div className="shimmer-bg" style={{
    backgroundColor: CARD_COLOR,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid rgba(255,255,255,0.05)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
      <div className="shimmer-bg" style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255,255,255,0.06)',
      }} />
      <div style={{ marginLeft: '12px', flex: 1 }}>
        <div className="shimmer-bg" style={{
          width: '100px',
          height: '14px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.06)',
          marginBottom: '8px',
        }} />
        <div className="shimmer-bg" style={{
          width: '80px',
          height: '12px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.06)',
        }} />
      </div>
    </div>
    <div className="shimmer-bg" style={{
      width: '80%',
      height: '14px',
      borderRadius: '4px',
      backgroundColor: 'rgba(255,255,255,0.06)',
      marginBottom: '16px',
    }} />
    <div style={{
      display: 'flex',
      padding: '12px',
      borderRadius: '10px',
      backgroundColor: 'rgba(255,255,255,0.03)',
      marginBottom: '16px',
    }}>
      <div className="shimmer-bg" style={{
        width: '80px',
        height: '80px',
        borderRadius: '8px',
        backgroundColor: 'rgba(255,255,255,0.06)',
        flexShrink: 0,
      }} />
      <div style={{ marginLeft: '14px', flex: 1 }}>
        <div className="shimmer-bg" style={{
          width: '60%',
          height: '15px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.06)',
          marginBottom: '10px',
        }} />
        <div className="shimmer-bg" style={{
          width: '40%',
          height: '13px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.06)',
          marginBottom: '10px',
        }} />
        <div className="shimmer-bg" style={{
          width: '30%',
          height: '13px',
          borderRadius: '4px',
          backgroundColor: 'rgba(255,255,255,0.06)',
        }} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: '24px' }}>
      <div className="shimmer-bg" style={{
        width: '50px',
        height: '16px',
        borderRadius: '4px',
        backgroundColor: 'rgba(255,255,255,0.06)',
      }} />
      <div className="shimmer-bg" style={{
        width: '50px',
        height: '16px',
        borderRadius: '4px',
        backgroundColor: 'rgba(255,255,255,0.06)',
      }} />
    </div>
  </div>
);

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => Promise<void>;
  currentUserAvatar?: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, currentUserAvatar }) => {
  const [isLiked, setIsLiked] = useState(!!post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [countAnimating, setCountAnimating] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(post.comments ?? []);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [hoverLike, setHoverLike] = useState(false);
  const [hoverComment, setHoverComment] = useState(false);

  const handleLike = () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    if (!prevLiked) {
      setLikeAnimating(true);
      setCountAnimating(true);
      setTimeout(() => setLikeAnimating(false), 1300);
      setTimeout(() => setCountAnimating(false), 400);
    }
    onLike(post.id);
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      await onComment(post.id, commentText.trim());
      const newComment: Comment = {
        id: `temp_${Date.now()}`,
        user_id: '',
        post_id: post.id,
        content: commentText.trim(),
        created_at: new Date().toISOString(),
        user: post.user,
      };
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (e) {
      console.error('Comment failed', e);
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div
      className="animate-slideUp"
      style={{
        backgroundColor: CARD_COLOR,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <img
          src={post.user?.avatar_url || 'https://picsum.photos/seed/default/80'}
          alt={post.user?.username || 'user'}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid rgba(255,255,255,0.1)',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/default/80';
          }}
        />
        <div style={{ marginLeft: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
            {post.user?.username || '匿名用户'}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            {dayjs(post.created_at).fromNow()}
          </div>
        </div>
      </div>

      <div style={{
        fontSize: '14px',
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 1.6,
        marginBottom: '16px',
      }}>
        {post.content}
      </div>

      {post.vinyl && (
        <div
          style={{
            display: 'flex',
            padding: '12px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255,255,255,0.03)',
            marginBottom: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.06)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
          }}
          onClick={() => {
            window.location.hash = '#/collection';
          }}
        >
          <img
            src={post.vinyl.cover_url || 'https://picsum.photos/seed/vinyl/160'}
            alt={post.vinyl.title}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '8px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/vinyl/160';
            }}
          />
          <div style={{ marginLeft: '14px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: '6px',
            }}>
              {post.vinyl.title}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: '6px',
            }}>
              {post.vinyl.artist}
            </div>
            <div style={{ fontSize: '13px' }}>
              {renderStars(post.vinyl.rating || 0)}
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: '24px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <button
          onClick={handleLike}
          onMouseEnter={() => setHoverLike(true)}
          onMouseLeave={() => setHoverLike(false)}
          className={likeAnimating ? 'animate-heartBeat' : ''}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            color: isLiked ? PRIMARY_COLOR : (hoverLike ? PRIMARY_COLOR : 'rgba(255,255,255,0.6)'),
            fontSize: '14px',
            padding: '4px 8px',
            borderRadius: '6px',
            transform: hoverLike && !isLiked ? 'scale(1.1)' : 'scale(1)',
            transition: 'color 0.2s ease, transform 0.2s ease',
          }}
        >
          <span style={{ fontSize: '16px' }}>❤️</span>
          <span
            style={{
              transition: 'color 0.3s ease, transform 0.3s ease',
              transform: countAnimating ? 'scale(1.2)' : 'scale(1)',
              fontWeight: 600,
            }}
          >
            {likesCount}
          </span>
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          onMouseEnter={() => setHoverComment(true)}
          onMouseLeave={() => setHoverComment(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            color: hoverComment ? PRIMARY_COLOR : 'rgba(255,255,255,0.6)',
            fontSize: '14px',
            padding: '4px 8px',
            borderRadius: '6px',
            transform: hoverComment ? 'scale(1.05)' : 'scale(1)',
            transition: 'color 0.2s ease, transform 0.2s ease',
          }}
        >
          <span style={{ fontSize: '16px' }}>💬</span>
          <span style={{ fontWeight: 600 }}>{comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div
          className="animate-fadeIn"
          style={{
            marginTop: '16px',
            backgroundColor: 'rgba(255,255,255,0.02)',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          {comments.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              {comments.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="animate-slideUp"
                  style={{
                    display: 'flex',
                    padding: '8px 0',
                    borderBottom: idx < comments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <img
                    src={c.user?.avatar_url || 'https://picsum.photos/seed/cmt/56'}
                    alt={c.user?.username || 'u'}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/cmt/56';
                    }}
                  />
                  <div style={{ marginLeft: '10px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: PRIMARY_COLOR,
                      }}>
                        {c.user?.username || '匿名'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {dayjs(c.created_at).fromNow()}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.85)',
                      marginTop: '4px',
                      wordBreak: 'break-word',
                      lineHeight: 1.5,
                    }}>
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <img
              src={currentUserAvatar || 'https://picsum.photos/seed/me/56'}
              alt="me"
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                placeholder="写下你的评论..."
                style={{
                  flex: 1,
                  resize: 'none',
                  minHeight: '36px',
                  maxHeight: '120px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  fontSize: '13px',
                  lineHeight: 1.4,
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = PRIMARY_COLOR;
                }}
                onBlur={(e) => {
                  (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              />
              <button
                onClick={handleSendComment}
                disabled={commentLoading || !commentText.trim()}
                style={{
                  padding: '0 16px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: !commentText.trim() ? 'rgba(233,69,96,0.4)' : PRIMARY_COLOR,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: commentLoading || !commentText.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  whiteSpace: 'nowrap',
                  alignSelf: 'flex-start',
                }}
              >
                {commentLoading ? (
                  <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span>
                ) : '发送'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TrendingCard: React.FC = () => {
  const [vinyls, setVinyls] = useState<TrendingVinyl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTrendingVinyls();
      const list: TrendingVinyl[] = Array.isArray(res) ? res : (res as any)?.items || [];
      if (list.length === 0) {
        setVinyls(FALLBACK_TRENDING);
      } else {
        setVinyls(list.slice(0, 8));
      }
    } catch (e: any) {
      setError(e?.message || '加载失败');
      setVinyls(FALLBACK_TRENDING);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div style={{
      backgroundColor: CARD_COLOR,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <SectionTitle>🔥 本周热门唱片</SectionTitle>
      {loading && (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer-bg" style={{
              display: 'flex',
              padding: '10px 0',
              borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div className="shimmer-bg" style={{
                width: '44px',
                height: '44px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255,255,255,0.06)',
              }} />
              <div style={{ marginLeft: '10px', flex: 1 }}>
                <div className="shimmer-bg" style={{
                  width: '70%',
                  height: '12px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  marginTop: '4px',
                  marginBottom: '8px',
                }} />
                <div className="shimmer-bg" style={{
                  width: '50%',
                  height: '10px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && !loading && vinyls.length === 0 && (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.6)',
        }}>
          <div style={{ marginBottom: '10px' }}>{error}</div>
          <button
            onClick={fetchData}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: PRIMARY_COLOR,
              color: '#fff',
              fontSize: '12px',
            }}
          >
            重试
          </button>
        </div>
      )}
      {!loading && vinyls.map((v, idx) => (
        <div
          key={v.id}
          className="animate-fadeIn"
          style={{
            display: 'flex',
            padding: '10px 0',
            alignItems: 'center',
            borderBottom: idx < vinyls.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            borderRadius: '6px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.03)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
          }}
          onClick={() => {
            window.location.hash = '#/collection';
          }}
        >
          <img
            src={v.cover_url || `https://picsum.photos/seed/tr${idx}/88`}
            alt={v.title}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '6px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/tr${idx}/88`;
            }}
          />
          <div style={{ marginLeft: '10px', flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: '3px',
            }}>
              {v.title}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.5)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: '3px',
            }}>
              {v.artist}
            </div>
            <div style={{
              fontSize: '11px',
              color: PRIMARY_COLOR,
              fontWeight: 600,
            }}>
              被收藏 {v.add_count ?? 0} 次
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const TipsCard: React.FC = () => (
  <div style={{
    backgroundColor: CARD_COLOR,
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.05)',
  }}>
    <SectionTitle>💡 快速提示</SectionTitle>
    <ul style={{
      listStyle: 'none',
      padding: 0,
      margin: 0,
      fontSize: '13px',
      color: 'rgba(255,255,255,0.75)',
      lineHeight: 1.8,
    }}>
      {[
        '添加新唱片会自动生成动态',
        '为唱片打分帮助其他人发现好音乐',
        '点赞和评论支持你的好友',
        '在个人资料可以查看你的收藏热力图',
      ].map((tip, idx) => (
        <li key={idx} style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '6px 0',
        }}>
          <span style={{
            color: PRIMARY_COLOR,
            marginRight: '8px',
            fontWeight: 700,
            flexShrink: 0,
          }}>
            ·
          </span>
          <span>{tip}</span>
        </li>
      ))}
    </ul>
  </div>
);

const CommunityPage: React.FC = () => {
  const { ensureDemoUser, user } = useAuthStore();
  const [feed, setFeed] = useState<FeedState>({
    posts: [],
    page: 1,
    hasMore: true,
    loading: false,
    error: null,
  });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const feedRef = useRef(feed);
  feedRef.current = feed;

  useEffect(() => {
    ensureDemoUser();
  }, [ensureDemoUser]);

  const loadFeed = useCallback(async (pageNum: number, append = true) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setFeed((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await getCommunityFeed({ page: pageNum, limit: 10 });
      const items: Post[] = res.items || [];
      setFeed((prev) => ({
        ...prev,
        posts: append ? [...prev.posts, ...items] : items,
        page: pageNum,
        hasMore: items.length >= 10 && pageNum < (res.pages || 999),
        loading: false,
        error: null,
      }));
    } catch (e: any) {
      setFeed((prev) => ({
        ...prev,
        loading: false,
        error: e?.message || '加载失败，请稍后重试',
      }));
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadFeed(1, false);
  }, [loadFeed]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (loadingRef.current) return;
        if (!feedRef.current.hasMore) return;
        if (entries[0].isIntersecting) {
          loadFeed(feedRef.current.page + 1, true);
        }
      },
      {
        rootMargin: '200px 0px',
        threshold: 0.1,
      }
    );
    observerRef.current = observer;
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [loadFeed]);

  const handleLike = useCallback(async (postId: string) => {
    try {
      const res = await likePost(postId);
      setFeed((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          p.id === postId
            ? { ...p, is_liked: res.is_liked, likes_count: res.likes_count }
            : p
        ),
      }));
    } catch (e) {
      console.error('Like failed', e);
    }
  }, []);

  const handleComment = useCallback(async (postId: string, content: string) => {
    const comment = await commentPost(postId, content);
    setFeed((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [...(p.comments || []), comment],
            }
          : p
      ),
    }));
  }, []);

  return (
    <>
      <style>{mobileResponsiveStyle}</style>
      <style>{shimmerKeyframesStyle}</style>
      <div style={pageStyle}>
        <div className="community-container" style={containerStyle}>
          <div className="community-left" style={leftColumnStyle}>
            <SectionTitle>好友动态</SectionTitle>

            {feed.error && feed.posts.length === 0 && (
              <div style={{
                backgroundColor: CARD_COLOR,
                borderRadius: '12px',
                padding: '40px 24px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>😵</div>
                <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                  {feed.error}
                </div>
                <button
                  onClick={() => loadFeed(1, false)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    backgroundColor: PRIMARY_COLOR,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  重新加载
                </button>
              </div>
            )}

            {feed.loading && feed.posts.length === 0 && (
              <div>
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {feed.posts.map((post, idx) => (
              <PostCard
                key={post.id || idx}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                currentUserAvatar={user?.avatar_url}
              />
            ))}

            {feed.loading && feed.posts.length > 0 && (
              <div>
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={`more-${i}`} />
                ))}
              </div>
            )}

            <div ref={sentinelRef} style={{ height: '1px' }} />

            {!feed.loading && !feed.hasMore && feed.posts.length > 0 && (
              <div className="animate-fadeIn" style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '13px',
                letterSpacing: '2px',
              }}>
                — 你已追上所有动态 —
              </div>
            )}

            {!feed.loading && feed.posts.length === 0 && !feed.error && (
              <div style={{
                backgroundColor: CARD_COLOR,
                borderRadius: '12px',
                padding: '60px 24px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
                <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                  还没有任何动态
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  添加第一张唱片，开启你的黑胶之旅吧！
                </div>
              </div>
            )}
          </div>

          <div className="community-right" style={rightColumnStyle}>
            <TrendingCard />
            <TipsCard />
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityPage;
