import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRecipeStore } from '../../stores/recipeStore';

const EMOJI_OPTIONS = ['😊', '❤️', '🤤', '👍', '🔥', '✨', '😍', '😋'];

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecipeById, addComment, likeRecipe, unlikeRecipe, likedRecipes, calculateMatchPercentage, userProfile } = useRecipeStore();
  const [recipe, setRecipe] = useState(getRecipeById(id || ''));
  const [commentText, setCommentText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLiked = likedRecipes.includes(id || '');
  const matchPercentage = recipe && userProfile ? calculateMatchPercentage(recipe.flavorProfile) : 0;

  useEffect(() => {
    if (id) {
      setRecipe(getRecipeById(id));
      const timer1 = setTimeout(() => setShowIngredients(true), 300);
      const timer2 = setTimeout(() => setShowSteps(true), 800);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [id, getRecipeById]);

  useEffect(() => {
    const unsubscribe = useRecipeStore.subscribe((state) => {
      if (id) {
        setRecipe(state.recipes.find(r => r.id === id));
      }
    });
    return unsubscribe;
  }, [id]);

  const handleSubmitComment = () => {
    if (!commentText.trim() && !selectedEmoji) return;
    if (!id) return;

    const userName = userProfile?.userName || '匿名美食家';
    addComment(id, {
      userName,
      content: commentText,
      emoji: selectedEmoji,
    });

    setCommentText('');
    setSelectedEmoji('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  const handleLikeClick = () => {
    if (!id) return;
    if (isLiked) {
      unlikeRecipe(id);
    } else {
      likeRecipe(id);
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case '简单': return '🥄';
      case '中等': return '🍳';
      case '困难': return '👨‍🍳';
      default: return '🍳';
    }
  };

  const getTimeIcon = (time: number) => {
    if (time <= 15) return '⚡';
    if (time <= 45) return '⏰';
    return '🕰️';
  };

  const formatTime = (time: number) => {
    if (time < 60) return `${time}分钟`;
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  };

  if (!recipe) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📜</div>
        <p className="empty-state-text">找不到这张食谱卡片...</p>
        <button className="load-more-btn" onClick={() => navigate('/')} style={{ marginTop: 20 }}>
          返回首页
        </button>
      </div>
    );
  }

  const comments = [...recipe.comments].reverse();

  return (
    <div>
      <button className="detail-back-btn" onClick={() => navigate(-1)}>
        ← 返回
      </button>

      <article className="recipe-detail">
        <div className="detail-header-image">
          <img src={recipe.coverImage} alt={recipe.name} />
          <div className="detail-header-overlay">
            <span className="detail-cuisine-tag">{recipe.cuisine}</span>
            <h1 className="detail-title">{recipe.name}</h1>
            <div className="detail-meta">
              <span className="detail-meta-item">
                {getDifficultyIcon(recipe.difficulty)} {recipe.difficulty}
              </span>
              <span className="detail-meta-item">
                {getTimeIcon(recipe.cookTime)} {formatTime(recipe.cookTime)}
              </span>
              <button
                className={`like-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLikeClick}
                style={{ color: isLiked ? '#8B0000' : '#FFF8E7' }}
              >
                <span className="like-icon">{isLiked ? '❤️' : '🤍'}</span>
                <span>{recipe.likes} 人喜欢</span>
              </button>
            </div>
          </div>
        </div>

        <div className="detail-content">
          {userProfile && (
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: '#6B7F99' }}>口味匹配度：</span>
              <span
                style={{
                  background: matchPercentage > 70 ? '#8B0000' : '#D4C5A9',
                  color: '#FFF8E7',
                  padding: '4px 12px',
                  borderRadius: 16,
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {matchPercentage}%
              </span>
            </div>
          )}

          <section className="detail-section">
            <h2 className="detail-section-title">📖 背后的故事</h2>
            <div className="story-box">"{recipe.story}"</div>
          </section>

          <section className="detail-section">
            <h2 className="detail-section-title">🥘 食材清单</h2>
            <ul className="ingredients-list">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className={`ingredient-item ${showIngredients ? 'animate-in' : ''}`}
                  style={{
                    animationDelay: `${index * 0.12}s`,
                    opacity: showIngredients ? 1 : 0,
                    transform: showIngredients ? 'translateY(0)' : 'translateY(30px)',
                    transition: `opacity 0.5s ease ${index * 0.12}s, transform 0.5s ease ${index * 0.12}s`,
                  }}
                >
                  {ingredient}
                </li>
              ))}
            </ul>
          </section>

          <section className="detail-section">
            <h2 className="detail-section-title">👩‍🍳 烹饪步骤</h2>
            <ol className="steps-list">
              {recipe.steps.map((step, index) => (
                <li
                  key={index}
                  className={`step-item ${showSteps ? 'animate-in' : ''}`}
                  style={{
                    animationDelay: `${index * 0.18}s`,
                    opacity: showSteps ? 1 : 0,
                    transform: showSteps ? 'translateY(0)' : 'translateY(30px)',
                    transition: `opacity 0.5s ease ${index * 0.18}s, transform 0.5s ease ${index * 0.18}s`,
                  }}
                >
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">{step}</div>
                </li>
              ))}
            </ol>
          </section>

          <section className="detail-section comments-section">
            <h2 className="detail-section-title">💬 食友留言 ({recipe.comments.length})</h2>
            {comments.length > 0 ? (
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-item fade-in">
                    <div className="comment-header">
                      <span className="comment-user">
                        <span className="comment-avatar">
                          {comment.userName.charAt(0)}
                        </span>
                        {comment.userName}
                      </span>
                      <span className="comment-time">
                        {format(new Date(comment.createdAt), 'M月d日 HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                    {comment.content && <p className="comment-content">{comment.content}</p>}
                    {comment.emoji && <span className="comment-emoji">{comment.emoji}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon" style={{ fontSize: 40 }}>💭</div>
                <p className="empty-state-text">还没有留言，来说点什么吧~</p>
              </div>
            )}
          </section>
        </div>
      </article>

      <div className="comment-input-wrapper">
        <div className="comment-input-container">
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={inputRef}
              type="text"
              className="comment-input"
              placeholder="留下你的美食感想..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
              onKeyPress={handleKeyPress}
            />
            {isInputFocused && !commentText && (
              <span 
                className="cursor-blink" 
                style={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 16,
                  pointerEvents: 'none',
                }}
              >
                |
              </span>
            )}
            {isInputFocused && commentText && (
              <span 
                className="cursor-blink" 
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 16,
                  pointerEvents: 'none',
                }}
              >
                |
              </span>
            )}
          </div>
          <div className="emoji-picker">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            className="submit-comment-btn"
            onClick={handleSubmitComment}
            disabled={!commentText.trim() && !selectedEmoji}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
