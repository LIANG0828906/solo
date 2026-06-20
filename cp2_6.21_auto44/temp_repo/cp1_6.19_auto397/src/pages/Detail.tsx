import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGalleryStore } from '../store/galleryStore';
import './Detail.css';

const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const memes = useGalleryStore((s) => s.memes);
  const comments = useGalleryStore((s) => s.comments);
  const fetchComments = useGalleryStore((s) => s.fetchComments);
  const addComment = useGalleryStore((s) => s.addComment);
  const likeMeme = useGalleryStore((s) => s.likeMeme);
  const likedMemes = useGalleryStore((s) => s.likedMemes);

  const [commentText, setCommentText] = useState('');
  const commentsRef = useRef<HTMLDivElement>(null);

  const meme = memes.find((m) => m.id === id);
  const memeComments = comments[id || ''] || [];
  const isLiked = id ? likedMemes[id] : false;

  useEffect(() => {
    if (id) {
      fetchComments(id);
    }
  }, [id, fetchComments]);

  useEffect(() => {
    if (commentsRef.current) {
      commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
    }
  }, [memeComments.length]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !id) return;
    await addComment(id, '匿名用户', commentText.trim());
    setCommentText('');
  };

  const handleLike = async () => {
    if (id) {
      await likeMeme(id);
    }
  };

  if (!meme) {
    return (
      <div className="detail-not-found">
        <p>表情包不存在</p>
        <button onClick={() => navigate('/')}>返回首页</button>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={() => navigate('/')}>
        ← 返回画廊
      </button>

      <div className="detail-content">
        <div className="detail-image-wrap">
          <img src={meme.imageUrl} alt={meme.description} className="detail-image" />
        </div>

        <div className="detail-info">
          <div className="detail-author">
            <img src={meme.authorAvatar} alt={meme.author} className="detail-avatar" />
            <span className="detail-author-name">{meme.author}</span>
          </div>

          <p className="detail-description">{meme.description || '暂无描述'}</p>

          {meme.tags && meme.tags.length > 0 && (
            <div className="detail-tags">
              {meme.tags.map((tag) => (
                <span key={tag} className="detail-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="detail-actions">
            <button
              className={`detail-like ${isLiked ? 'liked' : ''} ripple-btn`}
              onClick={handleLike}
            >
              <span className="heart">{isLiked ? '❤️' : '🤍'}</span>
              <span>{meme.likes}</span>
            </button>
            <div className="detail-comment-count">
              💬 {meme.commentsCount}
            </div>
          </div>

          <div className="detail-comments-section">
            <h3 className="detail-comments-title">评论</h3>
            <div className="detail-comments" ref={commentsRef}>
              {memeComments.length === 0 ? (
                <p className="detail-no-comments">还没有评论，快来抢沙发吧～</p>
              ) : (
                memeComments.map((c) => (
                  <div key={c.id} className="detail-comment-item">
                    <div className="detail-comment-author">{c.author}</div>
                    <div className="detail-comment-content">{c.content}</div>
                  </div>
                ))
              )}
            </div>

            <div className="detail-comment-input-wrap">
              <input
                type="text"
                className="detail-comment-input"
                placeholder="说点什么..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              />
              <button
                className="detail-comment-send ripple-btn"
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
