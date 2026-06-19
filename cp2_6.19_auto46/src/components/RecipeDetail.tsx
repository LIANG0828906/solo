import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipeStore } from '../store/recipeStore';
import CommentItem from './CommentItem';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface StepTimerProps {
  duration: number;
  stepId: string;
}

const StepTimer: React.FC<StepTimerProps> = ({ duration, stepId }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const initialTimeRef = useRef<number>(duration);

  const progress = isCompleted ? 0 : ((duration - timeLeft) / duration) * 100;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const tick = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const remaining = Math.max(0, initialTimeRef.current - elapsed);
    setTimeLeft(Math.ceil(remaining));

    if (remaining <= 0) {
      setIsRunning(false);
      setIsCompleted(true);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    animationRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (isCompleted) {
      setTimeLeft(duration);
      setIsCompleted(false);
      initialTimeRef.current = duration;
      return;
    }

    if (isRunning) {
      setIsRunning(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      initialTimeRef.current = timeLeft;
    } else {
      setIsRunning(true);
      startTimeRef.current = Date.now();
      animationRef.current = requestAnimationFrame(tick);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(false);
    setIsCompleted(false);
    setTimeLeft(duration);
    initialTimeRef.current = duration;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  return (
    <div className="step-timer">
      <button
        className={`timer-button ${isRunning ? 'running' : ''} ${isCompleted ? 'completed' : ''}`}
        onClick={handleClick}
        title={isCompleted ? '重新开始' : isRunning ? '暂停' : '开始计时'}
      >
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="#F5F0EB"
            strokeWidth="4"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={isCompleted ? '#6B8E23' : '#FFB380'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 32 32)"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        <div className="timer-content">
          {isCompleted ? (
            <span className="timer-icon">✓</span>
          ) : (
            <span className="timer-text">{formatTime(timeLeft)}</span>
          )}
        </div>
      </button>
      {(isRunning || isCompleted || timeLeft < duration) && (
        <button className="timer-reset" onClick={handleReset} title="重置">
          ↺
        </button>
      )}
    </div>
  );
};

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getRecipeById,
    getCommentsByRecipeId,
    addComment,
    updateIngredientChecked
  } = useRecipeStore();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [newCommentId, setNewCommentId] = useState<string | null>(null);

  const recipe = id ? getRecipeById(id) : undefined;
  const comments = id ? getCommentsByRecipeId(id) : [];

  useEffect(() => {
    setRating(0);
    setCommentText('');
    setNewCommentId(null);
  }, [id]);

  if (!recipe) {
    return (
      <div className="detail-container">
        <div className="not-found">
          <p>食谱不存在</p>
          <button onClick={() => navigate('/')}>返回首页</button>
        </div>
      </div>
    );
  }

  const handleIngredientToggle = (ingredientId: string, checked: boolean) => {
    if (id) {
      updateIngredientChecked(id, ingredientId, checked);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !commentText.trim()) return;

    if (id) {
      addComment(id, rating, commentText.trim());
      setNewCommentId(Date.now().toString());
      setRating(0);
      setCommentText('');
      setTimeout(() => setNewCommentId(null), 600);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className={`rating-stars ${interactive ? 'interactive' : ''}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`rating-star ${
              (interactive ? hoverRating || rating : count) >= star ? 'filled' : ''
            }`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="detail-container">
      <button className="back-button" onClick={() => navigate('/')}>
        ← 返回
      </button>

      <div className="detail-hero">
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          className="detail-image"
        />
        <div className="detail-overlay">
          <h1 className="detail-title">{recipe.title}</h1>
          <div className="detail-meta">
            <div className="detail-author">
              <img src={recipe.author.avatar} alt={recipe.author.name} />
              <span>{recipe.author.name}</span>
            </div>
            <div className="detail-rating">
              {renderStars(Math.round(recipe.averageRating))}
              <span className="rating-score">{recipe.averageRating}</span>
              <span className="rating-count">({recipe.totalRatings}人评价)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <section className="ingredients-section">
          <h2 className="section-title">🥬 食材清单</h2>
          <div className="ingredients-list">
            {recipe.ingredients.map((ingredient) => (
              <label
                key={ingredient.id}
                className={`ingredient-item ${ingredient.checked ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={ingredient.checked}
                  onChange={(e) => handleIngredientToggle(ingredient.id, e.target.checked)}
                />
                <span className="ingredient-name">{ingredient.name}</span>
                <span className="ingredient-quantity">{ingredient.quantity}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="steps-section">
          <h2 className="section-title">👨‍🍳 烹饪步骤</h2>
          <div className="steps-list">
            {recipe.steps.map((step) => (
              <div key={step.id} className="step-item">
                <div className="step-number">
                  <span>{step.order}</span>
                </div>
                <div className="step-content">
                  <p className="step-description">{step.description}</p>
                  {step.tip && (
                    <p className="step-tip">💡 小贴士：{step.tip}</p>
                  )}
                  <div className="step-duration">
                    <span>预计时间：{formatTime(step.duration)}</span>
                    <StepTimer duration={step.duration} stepId={step.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="comments-section">
          <h2 className="section-title">💬 美食点评</h2>

          <form className="comment-form" onSubmit={handleSubmitComment}>
            <div className="form-row">
              <label className="form-label">为这道菜打分：</label>
              {renderStars(rating, true)}
              {rating > 0 && (
                <span className="rating-selected">你打了 {rating} 星</span>
              )}
            </div>
            <div className="form-row">
              <textarea
                className="comment-input"
                placeholder="分享你的烹饪心得或对这道菜的评价..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="submit-button"
              disabled={rating === 0 || !commentText.trim()}
            >
              发布评价
            </button>
          </form>

          <div className="comments-list">
            {comments.length === 0 ? (
              <p className="no-comments">暂无评价，快来抢沙发吧！</p>
            ) : (
              comments.map((comment, index) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isNew={index === 0 && newCommentId !== null}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RecipeDetail;
