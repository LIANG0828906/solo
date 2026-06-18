import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipeStore } from '@/store/recipeStore';
import type { Recipe, Comment } from '@/models/recipeTypes';

const keyframesStyle = document.createElement('style');
keyframesStyle.textContent = `
@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0 }
  to { transform: translateY(0); opacity: 1 }
}
`;
document.head.appendChild(keyframesStyle);

export default function RecipeDetail() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  const { recipes, comments, favorites, toggleFavorite, addComment } = useRecipeStore();

  const recipe: Recipe | undefined = recipes.find((r) => r.id === recipeId);
  const isFavorited = favorites.includes(recipeId ?? '');
  const recipeComments: Comment[] = comments
    .filter((c) => c.recipeId === recipeId)
    .sort((a, b) => b.createdAt - a.createdAt);

  const [nickname, setNickname] = useState('');
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  if (!recipe) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 72, fontWeight: 700, color: '#D4A574' }}>404</div>
          <div style={{ fontSize: 18, color: '#666', marginTop: 12 }}>食谱不存在</div>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>返回上一页</button>
        </div>
      </div>
    );
  }

  const handleToggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSubmitComment = () => {
    if (!nickname.trim() || !commentText.trim() || rating === 0) return;
    addComment(recipe.id, {
      userName: nickname.trim(),
      content: commentText.trim(),
      rating,
    });
    setNickname('');
    setRating(0);
    setCommentText('');
  };

  const steps = [...recipe.steps].sort((a, b) => a.order - b.order);

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ← 返回
        </button>
        <div style={styles.topInfo}>
          <h1 style={styles.title}>{recipe.title}</h1>
          <div style={styles.metaRow}>
            <span style={styles.metaItem}>👤 {recipe.authorName}</span>
            <span style={styles.metaItem}>⏱ {recipe.cookTime}分钟</span>
            <span style={styles.categoryTag}>{recipe.category}</span>
          </div>
        </div>
        <button
          onClick={() => toggleFavorite(recipe.id)}
          style={styles.favoriteBtn}
        >
          <span style={{ fontSize: 32, transition: 'transform 0.3s', display: 'inline-block', transform: isFavorited ? 'scale(1.15)' : 'scale(1)' }}>
            {isFavorited ? '❤️' : '🤍'}
          </span>
        </button>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.leftColumn}>
          <img
            src={recipe.coverImage}
            alt={recipe.title}
            style={styles.coverImage}
          />
          <div style={styles.ingredientSection}>
            <h3 style={styles.sectionTitle}>食材清单</h3>
            {recipe.ingredients.map((ing, i) => (
              <label key={i} style={{
                ...styles.ingredientItem,
                opacity: checkedIngredients.has(i) ? 0.5 : 1,
              }}>
                <input
                  type="checkbox"
                  checked={checkedIngredients.has(i)}
                  onChange={() => handleToggleIngredient(i)}
                  style={styles.checkbox}
                />
                <span style={{
                  ...styles.ingredientName,
                  textDecoration: checkedIngredients.has(i) ? 'line-through' : 'none',
                }}>
                  {ing.name}
                </span>
                <span style={styles.ingredientQty}>{ing.quantity}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={styles.rightColumn}>
          <h3 style={styles.sectionTitle}>烹饪步骤</h3>
          <div style={styles.stepsContainer}>
            {steps.map((step, i) => (
              <div key={step.order} style={styles.stepWrapper}>
                <div style={styles.stepLeft}>
                  <div style={styles.stepNumber}>{step.order}</div>
                  {i < steps.length - 1 && (
                    <div style={styles.stepLine} />
                  )}
                </div>
                <div style={styles.stepContent}>
                  <p style={styles.stepText}>{step.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.commentSection}>
        <h3 style={styles.sectionTitle}>评论区</h3>

        <div style={styles.commentForm}>
          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={styles.nicknameInput}
            />
          </div>
          <div style={styles.formRow}>
            <div style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  style={{
                    ...styles.star,
                    color: star <= (hoveredStar || rating) ? '#E88D3E' : '#ccc',
                    transform: hoveredStar === star ? 'scale(1.3)' : 'scale(1)',
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div style={styles.formRow}>
            <textarea
              placeholder="写下你的评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={styles.textarea}
            />
          </div>
          <button onClick={handleSubmitComment} style={styles.submitBtn}>
            提交评论
          </button>
        </div>

        <div style={styles.commentList}>
          {recipeComments.map((c, i) => (
            <div
              key={c.id}
              style={{
                ...styles.commentCard,
                animation: i === 0 ? 'slideIn 0.4s ease-out' : 'none',
              }}
            >
              <div style={styles.commentGradientBar} />
              <div style={styles.commentBody}>
                <div style={styles.commentHeader}>
                  <div style={styles.avatar}>
                    {(c.userName || '?')[0]}
                  </div>
                  <div style={styles.commentMeta}>
                    <span style={styles.commentUser}>{c.userName}</span>
                    <span style={styles.commentDate}>
                      {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div style={styles.commentRating}>
                    {'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}
                  </div>
                </div>
                <p style={styles.commentText}>{c.content}</p>
              </div>
            </div>
          ))}
          {recipeComments.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 32 }}>
              暂无评论，快来抢沙发吧！
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '24px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  backBtn: {
    background: 'none',
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: 14,
    color: '#555',
    flexShrink: 0,
  },
  topInfo: {
    flex: 1,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: '#333',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metaItem: {
    fontSize: 14,
    color: '#666',
  },
  categoryTag: {
    background: '#FFF3E0',
    color: '#E88D3E',
    padding: '2px 12px',
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 500,
  },
  favoriteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 8,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    width: 56,
    height: 56,
    transition: 'background 0.2s',
  },

  mainContent: {
    display: 'flex',
    gap: 32,
    marginBottom: 40,
  },
  leftColumn: {
    width: '40%',
    flexShrink: 0,
  },
  coverImage: {
    width: '100%',
    height: 400,
    objectFit: 'cover',
    borderRadius: 12,
    display: 'block',
  },
  ingredientSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#333',
    marginBottom: 16,
    borderBottom: '2px solid #E88D3E',
    paddingBottom: 8,
    display: 'inline-block',
  },
  ingredientItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  checkbox: {
    width: 18,
    height: 18,
    marginRight: 12,
    accentColor: '#E88D3E',
    cursor: 'pointer',
  },
  ingredientName: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    transition: 'text-decoration 0.2s',
  },
  ingredientQty: {
    fontSize: 14,
    color: '#999',
    marginLeft: 12,
  },

  rightColumn: {
    flex: 1,
  },
  stepsContainer: {
    marginTop: 8,
  },
  stepWrapper: {
    display: 'flex',
    gap: 20,
  },
  stepLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 36,
    flexShrink: 0,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E88D3E, #D4A574)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  stepLine: {
    width: 4,
    flex: 1,
    minHeight: 24,
    background: 'linear-gradient(to bottom, #E88D3E, #D4A574)',
    borderRadius: 2,
    margin: '4px 0',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 24,
  },
  stepText: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.7,
    color: '#444',
    paddingTop: 6,
  },

  commentSection: {
    borderTop: '1px solid #eee',
    paddingTop: 28,
  },
  commentForm: {
    background: '#FAFAFA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
  },
  formRow: {
    marginBottom: 14,
  },
  nicknameInput: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  starRow: {
    display: 'flex',
    gap: 8,
  },
  star: {
    fontSize: 28,
    cursor: 'pointer',
    transition: 'transform 0.2s, color 0.2s',
    userSelect: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    minHeight: 80,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #E88D3E, #D4A574)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 28px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },

  commentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  commentCard: {
    display: 'flex',
    gap: 12,
    padding: '16px 0',
    borderBottom: '1px solid #eee',
  },
  commentGradientBar: {
    width: 4,
    borderRadius: 2,
    background: 'linear-gradient(to bottom, #E88D3E, #D4A574)',
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#D4A574',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: 16,
    flexShrink: 0,
  },
  commentMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#aaa',
  },
  commentRating: {
    marginLeft: 'auto',
    color: '#E88D3E',
    fontSize: 14,
    letterSpacing: 1,
  },
  commentText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.7,
    color: '#555',
  },
};
