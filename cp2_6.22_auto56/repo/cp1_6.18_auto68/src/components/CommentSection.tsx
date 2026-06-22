import React, { useState, useCallback } from 'react';
import { useGalleryStore, WorkInfo } from '@/store';
import { COLORS, ANIMATION } from '@/shared/styles';
import { Heart, MessageCircle, Send, X } from 'lucide-react';

export default function CommentSection() {
  const showWorkPreview = useGalleryStore((s) => s.showWorkPreview);
  const works = useGalleryStore((s) => s.works);
  const toggleLike = useGalleryStore((s) => s.toggleLike);
  const addComment = useGalleryStore((s) => s.addComment);
  const setShowWorkPreview = useGalleryStore((s) => s.setShowWorkPreview);

  const [commentText, setCommentText] = useState('');
  const [likeAnimating, setLikeAnimating] = useState(false);

  const work = works.find((w) => w.id === showWorkPreview) as WorkInfo | undefined;

  const handleLike = useCallback(() => {
    if (!work) return;
    toggleLike(work.id);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), ANIMATION.likeDuration);
  }, [work, toggleLike]);

  const handleComment = useCallback(() => {
    if (!work || !commentText.trim()) return;
    addComment(work.id, commentText.trim());
    setCommentText('');
  }, [work, commentText, addComment]);

  const handleClose = useCallback(() => {
    setShowWorkPreview(null);
    setCommentText('');
  }, [setShowWorkPreview]);

  if (!work) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="preview-image-container">
          <img
            src={work.imageUrl}
            alt={work.title}
            className="preview-full-image"
          />
          <button className="preview-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="preview-info">
          <h2 className="preview-title">{work.title}</h2>
          <p className="preview-desc">{work.description}</p>

          <div className="preview-actions">
            <button
              className={`like-btn ${work.liked ? 'liked' : ''} ${likeAnimating ? 'animating' : ''}`}
              onClick={handleLike}
            >
              <Heart
                size={18}
                fill={work.liked ? COLORS.likeActive : 'none'}
              />
              <span>{work.likes}</span>
            </button>

            <div className="comment-count">
              <MessageCircle size={18} />
              <span>{work.comments.length}</span>
            </div>
          </div>

          <div className="comment-input-row">
            <input
              type="text"
              placeholder="写下你的评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              className="comment-input"
            />
            <button
              className="comment-send-btn"
              onClick={handleComment}
              disabled={!commentText.trim()}
            >
              <Send size={16} />
            </button>
          </div>

          <div className="comment-list">
            {work.comments.length === 0 && (
              <div className="no-comments">暂无评论，来说点什么吧</div>
            )}
            {work.comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-username">{comment.username}</span>
                  <span className="comment-time">{comment.createdAt}</span>
                </div>
                <div className="comment-content">{comment.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn ${ANIMATION.modalFadeIn}ms ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .preview-modal {
          max-width: 600px;
          width: 90vw;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
        }
        .modal-content {
          background: ${COLORS.modalBg};
          border-radius: 12px;
          border: 1px solid ${COLORS.modalBorder};
          overflow: hidden;
          animation: slideUp 0.2s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .preview-image-container {
          position: relative;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          max-height: 350px;
          overflow: hidden;
        }
        .preview-full-image {
          max-width: 100%;
          max-height: 350px;
          object-fit: contain;
        }
        .preview-close {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          border: none;
          color: white;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .preview-close:hover {
          background: rgba(0, 0, 0, 0.8);
        }
        .preview-info {
          padding: 16px 20px;
          overflow-y: auto;
          flex: 1;
        }
        .preview-title {
          margin: 0 0 6px;
          color: ${COLORS.text};
          font-size: 18px;
          font-weight: 700;
        }
        .preview-desc {
          margin: 0 0 14px;
          color: ${COLORS.textSecondary};
          font-size: 13px;
          line-height: 1.5;
        }
        .preview-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }
        .like-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: ${COLORS.likeDefault};
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
          transition: color 0.2s;
        }
        .like-btn.liked {
          color: ${COLORS.likeActive};
        }
        .like-btn.animating {
          animation: likePop 0.2s ease;
        }
        @keyframes likePop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .comment-count {
          display: flex;
          align-items: center;
          gap: 6px;
          color: ${COLORS.text};
          font-size: 12px;
        }
        .comment-input-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        .comment-input {
          flex: 1;
          width: 240px;
          max-width: 100%;
          background: ${COLORS.inputBg};
          border-radius: 8px;
          border: 1px solid ${COLORS.inputBorder};
          padding: 10px 14px;
          color: ${COLORS.text};
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }
        .comment-input::placeholder {
          color: ${COLORS.textSecondary};
        }
        .comment-input:focus {
          border-color: ${COLORS.highlight};
        }
        .comment-send-btn {
          background: ${COLORS.success};
          border: none;
          border-radius: 8px;
          color: ${COLORS.background};
          padding: 10px;
          cursor: pointer;
          transition: transform 0.2s;
          flex-shrink: 0;
        }
        .comment-send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        .comment-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .comment-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .no-comments {
          color: ${COLORS.textSecondary};
          font-size: 12px;
          text-align: center;
          padding: 12px;
        }
        .comment-item {
          background: ${COLORS.inputBg};
          border-radius: 8px;
          padding: 10px 14px;
        }
        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .comment-username {
          color: ${COLORS.highlight};
          font-size: 12px;
          font-weight: 600;
        }
        .comment-time {
          color: ${COLORS.textSecondary};
          font-size: 11px;
        }
        .comment-content {
          color: ${COLORS.text};
          font-size: 13px;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
