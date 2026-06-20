import { useState, useCallback, useRef, useEffect } from 'react';
import type { Idea, Comment } from '../types';

interface IdeaCardProps {
  idea: Idea;
  onLike: (ideaId: string) => void;
  onAddComment: (ideaId: string, text: string) => void;
  onDragStart: (e: React.DragEvent, ideaId: string) => void;
  onDragEnd: () => void;
  onLongPressStart: (ideaId: string) => void;
  onLongPressEnd: () => void;
  isDragging: boolean;
  isLongPressing: boolean;
  userId: string;
  isNew?: boolean;
  startPosition?: { x: number; y: number };
}

function IdeaCard({ 
  idea, 
  onLike, 
  onAddComment, 
  onDragStart, 
  onDragEnd,
  onLongPressStart,
  onLongPressEnd,
  isDragging, 
  isLongPressing,
  userId,
  isNew,
  startPosition
}: IdeaCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [dropAnimating, setDropAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const rotationRef = useRef(0);

  const isLiked = idea.likedBy.includes(userId);

  useEffect(() => {
    if (isNew && startPosition && cardRef.current) {
      const card = cardRef.current;
      const endRect = card.getBoundingClientRect();
      
      const startX = startPosition.x - endRect.left;
      const startY = startPosition.y - endRect.top;
      
      const keyframes = [
        { 
          transform: `translate(${startX}px, ${startY}px) scale(0.8)`,
          opacity: 0 
        },
        { 
          transform: 'translate(0, 20px) scale(0.95)',
          opacity: 0.8,
          offset: 0.6 
        },
        { 
          transform: 'translate(0, 0) scale(1.05)',
          opacity: 1,
          offset: 0.85 
        },
        { 
          transform: 'translate(0, 0) scale(1)',
          opacity: 1 
        }
      ];

      const options: KeyframeAnimationOptions = {
        duration: 600,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'forwards'
      };

      const animation = card.animate(keyframes, options);
      
      return () => {
        animation.cancel();
      };
    }
  }, [isNew, startPosition]);

  useEffect(() => {
    if (isLongPressing && cardRef.current) {
      let startTime: number;
      const targetRotation = 3;
      const duration = 200;
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        rotationRef.current = targetRotation * easeProgress;
        
        if (cardRef.current) {
          cardRef.current.style.transform = `rotate(${rotationRef.current}deg) scale(1.05)`;
          cardRef.current.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.25)';
        }
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (cardRef.current) {
          cardRef.current.style.transform = '';
          cardRef.current.style.boxShadow = '';
        }
        rotationRef.current = 0;
      };
    }
  }, [isLongPressing]);

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
    
    if (e.dataTransfer) {
      e.dataTransfer.setDragImage(new Image(), 0, 0);
    }
  };

  const handleDragEnd = () => {
    onDragEnd();
    setDropAnimating(true);
    
    if (cardRef.current) {
      const keyframes = [
        { transform: 'scale(1)' },
        { transform: 'scale(1.08)' },
        { transform: 'scale(1)' }
      ];
      
      const options: KeyframeAnimationOptions = {
        duration: 300,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      };
      
      cardRef.current.animate(keyframes, options);
    }
    
    setTimeout(() => setDropAnimating(false), 300);
  };

  const handleMouseDown = () => {
    onLongPressStart(idea.id);
  };

  const handleMouseUp = () => {
    onLongPressEnd();
  };

  const handleMouseLeave = () => {
    onLongPressEnd();
  };

  return (
    <div
      ref={cardRef}
      className={`idea-card ${isDragging ? 'dragging' : ''} ${dropAnimating ? 'drop-animation' : ''} ${isLongPressing ? 'long-pressing' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
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
              {idea.comments.map((comment: Comment) => (
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
