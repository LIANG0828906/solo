import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Painting, Comment } from './types';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 30) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

function PaintingDetail() {
  const { id } = useParams<{ id: string }>();
  const [painting, setPainting] = useState<Painting | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newCommentId, setNewCommentId] = useState<string | null>(null);
  const commentsListRef = useRef<HTMLDivElement>(null);

  const checkFavorite = (paintingId: string) => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      return favorites.some((f: Painting) => f.id === paintingId);
    } catch {
      return false;
    }
  };

  const toggleFavorite = () => {
    if (!painting) return;
    try {
      const favorites: Painting[] = JSON.parse(localStorage.getItem('favorites') || '[]');
      const exists = favorites.some(f => f.id === painting.id);
      let newFavorites: Painting[];
      if (exists) {
        newFavorites = favorites.filter(f => f.id !== painting.id);
      } else {
        newFavorites = [...favorites, painting];
      }
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setIsFavorite(!exists);
    } catch (error) {
      console.error('收藏操作失败:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [paintingRes, commentsRes] = await Promise.all([
          fetch(`/api/paintings/${id}`),
          fetch(`/api/comments/${id}`)
        ]);
        const paintingData: Painting = await paintingRes.json();
        const commentsData: Comment[] = await commentsRes.json();
        setPainting(paintingData);
        setComments(commentsData);
        setIsFavorite(checkFavorite(id));
      } catch (error) {
        console.error('获取详情失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !nickname.trim() || !content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paintingId: id, nickname: nickname.trim(), content: content.trim() })
      });
      const newComment: Comment = await res.json();

      const commentsRes = await fetch(`/api/comments/${id}`);
      const updatedComments: Comment[] = await commentsRes.json();
      setComments(updatedComments);
      setNewCommentId(newComment.id);
      setContent('');

      setTimeout(() => setNewCommentId(null), 500);
    } catch (error) {
      console.error('提交评论失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><div className="loading-spinner">加载中...</div></div>;
  }

  if (!painting) {
    return (
      <div className="page-container">
        <div className="favorites-empty">
          <div className="favorites-empty-icon">❓</div>
          <p className="favorites-empty-text">画作不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-container fade-in">
      <Link to="/" className="back-link">← 返回画廊</Link>

      <div className="detail-image-wrapper">
        <img src={painting.imageUrl} alt={painting.title} className="detail-image" />
      </div>

      <div className="detail-info">
        <div className="detail-info-left">
          <h1 className="detail-title">{painting.title}</h1>
          <p className="detail-artist">{painting.artist} · {painting.year}年</p>
          <div className="detail-tags">
            <span className="detail-tag">情绪：{painting.emotion}</span>
          </div>
        </div>
        <button
          className={`detail-favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={toggleFavorite}
          title={isFavorite ? '取消收藏' : '加入收藏'}
        >
          <span className="heart-icon">{isFavorite ? '❤️' : '🤍'}</span>
        </button>
      </div>

      <div className="detail-description">{painting.description}</div>

      <div className="comments-section">
        <h2 className="comments-title">观展感想 ({comments.length})</h2>

        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="comment-input-group">
            <input
              type="text"
              className="comment-input"
              placeholder="您的昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>
          <textarea
            className="comment-textarea"
            placeholder="写下您的观展感想..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
          />
          <button
            type="submit"
            className="comment-submit-btn"
            disabled={submitting || !nickname.trim() || !content.trim()}
          >
            {submitting ? '提交中...' : '发表评论'}
          </button>
        </form>

        <div className="comments-list" ref={commentsListRef}>
          {comments.length === 0 ? (
            <div className="favorites-empty" style={{ padding: '40px 20px' }}>
              <div className="favorites-empty-icon" style={{ fontSize: '48px' }}>💬</div>
              <p className="favorites-empty-text">还没有评论，来发表第一条感想吧！</p>
            </div>
          ) : (
            comments.map(comment => (
              <div
                key={comment.id}
                className="comment-item"
                style={{
                  animation: newCommentId === comment.id ? 'slideIn 0.3s ease' : undefined
                }}
              >
                <div className="comment-header">
                  <span className="comment-nickname">{comment.nickname}</span>
                  <span className="comment-time">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PaintingDetail;
