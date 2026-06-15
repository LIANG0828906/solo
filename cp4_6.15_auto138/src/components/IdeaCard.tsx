import { useState, useCallback } from 'react';
import type { Idea } from '../types';

interface IdeaCardProps {
  idea: Idea;
  onLike: (ideaId: string) => void;
  onAddComment: (ideaId: string, text: string) => void;
  onDragStart: (e: React.DragEvent, ideaId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  userId: string;
}

function IdeaCard({ idea, onLike, onAddComment, onDragStart, onDragEnd, isDragging, userId }: IdeaCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [dropAnimating, setDropAnimating] = useState(false);

  const isLiked = idea.likedBy.includes(userId);

  const handleLike = useCallback(() => {
    setLikeAnimating(true);
    onLike(idea.id);
    setTimeout(() => setLikeAnimating(false), 400);
  }, [idea.id, onLike]);

  const handleCommentSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(idea.id, commentText.trim());
      setCommentText('');
    }
  }, [idea.id, commentText, onAddComment]);

  const toggleComments = useCallback(() => {
    setShowComments(prev => !prev);
  }, []);

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(e, idea.id);
    setTimeout(() => setDropAnimating(false), 300);
  };

  const handleDragEnd = () => {
    onDragEnd();
    setDropAnimating(true);
    setTimeout(() => setDropAnimating(false), 300);
  };

  return (
    <div
      className={`idea-card ${isDragging ? 'dragging' : ''} ${dropAnimating ? 'drop-animation' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="card-header">
        <img
          src={idea.authorAvatar}
          alt={idea.author}
          className="avatar"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${idea.id}`;
          }}
        />
        <span className="card-author">{idea.author}</span>
      </div>
      
      <h3 className="card-title">{idea.title}</h3>
      
      {idea.description && (
        <p className="card-description">{idea.description}</p>
      )}
      
      <div className="card-actions">
        <button
          className={`like-button ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <span className={`heart-icon ${likeAnimating ? 'pulse' : ''}`}>
            {isLiked ? '❤️' : '🤍'}
          </span>
          <span>{idea.likes}</span>
        </button>
        
        <button
          className="comment-button"
          onClick={toggleComments}
        >
          <span>💬</span>
          <span>{idea.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {idea.comments.length > 0 && (
            <div className="comments-list">
              {idea.comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <span className="comment-author">{comment.author}:</span>
                  <span>{comment.text}</span>
                </div>
              ))}
            </div>
          )}
          
          <form className="comment-input-container" onSubmit={handleCommentSubmit}>
            <input
              type="text"
              className="comment-input"
              placeholder="写评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="comment-submit">
              发送
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default IdeaCard;
