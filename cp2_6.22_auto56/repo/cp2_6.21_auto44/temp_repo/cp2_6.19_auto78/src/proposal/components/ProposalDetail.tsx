import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useProposalStore } from '../store';
import { authService } from '../../user/auth';
import type { Comment, VoteType } from '../types';
import './ProposalDetail.css';

export const ProposalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchProposalById, currentProposal, fetchComments, comments, addComment, vote, userVotes, togglePin, updateStatus } = useProposalStore();
  const [commentText, setCommentText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [imageZoom, setImageZoom] = useState<string | null>(null);
  const [isVoteAnimating, setIsVoteAnimating] = useState<'up' | 'down' | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const isAdmin = authService.isAdmin();

  const userVote: VoteType = id ? (userVotes[id] || null) : null;

  useEffect(() => {
    if (id) {
      fetchProposalById(id);
      fetchComments(id);
    }
    setTimeout(() => setIsVisible(true), 10);
    return () => setIsVisible(false);
  }, [id, fetchProposalById, fetchComments]);

  const handleBack = () => {
    setIsVisible(false);
    setTimeout(() => navigate(-1), 300);
  };

  const handleVote = (type: 'up' | 'down') => {
    if (!id) return;
    setIsVoteAnimating(type);
    setTimeout(() => setIsVoteAnimating(null), 150);
    
    const newVote: VoteType = userVote === type ? null : type;
    vote(id, newVote);
  };

  const handleSubmitComment = () => {
    if (!commentText.trim() || !id) return;
    addComment(id, commentText.trim());
    setCommentText('');
  };

  const handleImageClick = (src: string) => {
    setImageZoom(src);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已通过': return '#1abc9c';
      case '审核中': return '#f39c12';
      case '已关闭': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  if (!currentProposal) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className={`proposal-detail-overlay ${isVisible ? 'visible' : ''}`}>
      <div className="detail-backdrop" onClick={handleBack}></div>
      
      <div ref={detailRef} className={`detail-container ${isVisible ? 'visible' : ''}`}>
        <button className="back-button" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        {isAdmin && (
          <div className="admin-toolbar">
            <button className="admin-action-btn" onClick={() => id && togglePin(id)}>
              {currentProposal.isPinned ? '取消置顶' : '置顶'}
            </button>
            <button 
              className="admin-action-btn"
              onClick={() => id && updateStatus(id, currentProposal.status === '已通过' ? '已关闭' : '已通过')}
            >
              {currentProposal.status === '已通过' ? '关闭提案' : '通过提案'}
            </button>
          </div>
        )}

        <div className="detail-header">
          <div className="author-section">
            <div 
              className="author-avatar"
              style={{ background: currentProposal.authorAvatar }}
            >
              {currentProposal.authorName.charAt(0)}
            </div>
            <div className="author-meta">
              <span className="author-name">{currentProposal.authorName}</span>
              <span className="publish-time">{formatDate(currentProposal.createdAt)}</span>
            </div>
          </div>
          
          <div className="status-tags">
            <span 
              className="status-tag"
              style={{ backgroundColor: getStatusColor(currentProposal.status) + '20', color: getStatusColor(currentProposal.status) }}
            >
              {currentProposal.status}
            </span>
            <span className="category-tag">{currentProposal.category}</span>
          </div>
        </div>

        <h1 className="detail-title">{currentProposal.title}</h1>

        <div className="detail-vote-section">
          <button
            className={`detail-vote-btn up ${userVote === 'up' ? 'active' : ''} ${isVoteAnimating === 'up' ? 'animating' : ''}`}
            onClick={() => handleVote('up')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <span>点赞</span>
            <span className="vote-number">{currentProposal.upVotes}</span>
          </button>

          <button
            className={`detail-vote-btn down ${userVote === 'down' ? 'active' : ''} ${isVoteAnimating === 'down' ? 'animating' : ''}`}
            onClick={() => handleVote('down')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
            </svg>
            <span>点踩</span>
            <span className="vote-number">{currentProposal.downVotes}</span>
          </button>

          <div className="vote-stats">
            <span className="stats-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {currentProposal.commentCount} 评论
            </span>
          </div>
        </div>

        <div className="detail-content markdown-body">
          <ReactMarkdown
            components={{
              img: ({ src, alt }) => (
                <img 
                  src={src} 
                  alt={alt} 
                  className="markdown-image"
                  onClick={() => src && handleImageClick(src)}
                />
              ),
            }}
          >
            {currentProposal.content}
          </ReactMarkdown>
        </div>

        <div className="comments-section">
          <h3 className="comments-title">评论 ({comments.length})</h3>
          
          <div className="comment-input-wrapper">
            <textarea
              className="comment-input"
              placeholder="写下你的评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmitComment();
                }
              }}
            />
            <button 
              className="submit-comment-btn"
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
            >
              发布评论
            </button>
          </div>

          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="empty-comments">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p>暂无评论，快来发表第一条评论吧</p>
              </div>
            ) : (
              comments.map((comment: Comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-avatar">
                    {comment.userName.charAt(0)}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.userName}</span>
                      <span className="comment-time">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {imageZoom && (
        <div className="image-zoom-overlay" onClick={() => setImageZoom(null)}>
          <img src={imageZoom} alt="放大查看" className="zoomed-image" />
          <button className="close-zoom-btn" onClick={() => setImageZoom(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};
