import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { client } from '../api/client';

interface Ingredient {
  name: string;
  amount: string;
}

interface Step {
  description: string;
}

interface Recipe {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  cookTime: number;
  avgRating: number;
  ingredients: Ingredient[];
  steps: Step[];
}

interface Interaction {
  id: string;
  userId: string;
  recipeId: string;
  type: string;
  value?: number;
  comment?: string;
  createdAt: string;
}

export const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    client.get(`/recipes/${id}`).then((res) => {
      setRecipe(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    client.get('/interactions', { params: { recipeId: id } }).then((res) => {
      setInteractions(res.data);
      const hasFav = res.data.some(
        (i: Interaction) => i.userId === 'user1' && i.type === 'favorite'
      );
      setFavorite(hasFav);
      const rating = res.data.find(
        (i: Interaction) => i.userId === 'user1' && i.type === 'rating'
      );
      if (rating) setUserRating(rating.value || 0);
    }).catch(() => {});
  }, [id]);

  const handleFavorite = async () => {
    if (!id) return;
    const next = !favorite;
    setFavorite(next);
    try {
      await client.post('/interactions', {
        userId: 'user1',
        recipeId: id,
        type: 'favorite',
        value: next,
      });
    } catch {
      setFavorite(!next);
    }
  };

  const handleRate = async (rating: number) => {
    if (!id) return;
    setUserRating(rating);
    try {
      await client.post('/interactions', {
        userId: 'user1',
        recipeId: id,
        type: 'rating',
        value: rating,
      });
    } catch {
      setUserRating(0);
    }
  };

  const handleComment = async () => {
    if (!id || !commentText.trim()) return;
    try {
      const res = await client.post('/interactions', {
        userId: 'user1',
        recipeId: id,
        type: 'comment',
        comment: commentText.trim(),
      });
      setInteractions((prev) => [...prev, res.data]);
      setCommentText('');
    } catch {}
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!recipe) {
    return <div style={{ padding: '88px 24px', textAlign: 'center' }}>菜谱不存在</div>;
  }

  const comments = interactions.filter((i) => i.type === 'comment');

  return (
    <div className="detail-layout">
      <div className="detail-steps">
        <img className="detail-cover" src={recipe.coverImage} alt={recipe.title} />
        <h1 className="detail-title">{recipe.title}</h1>
        <div className="detail-meta">
          <span>{recipe.author}</span>
          <span>·</span>
          <span>{recipe.cookTime}分钟</span>
          <span>·</span>
          <span>{'★'.repeat(Math.round(recipe.avgRating))}{'☆'.repeat(5 - Math.round(recipe.avgRating))}</span>
        </div>

        {recipe.steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="step-item">
              <span className="step-number">{index + 1}</span>
              <span className="step-text">{step.description}</span>
            </div>
            {index < recipe.steps.length - 1 && <hr className="step-divider" />}
          </React.Fragment>
        ))}
      </div>

      <div className="detail-ingredients">
        <div className="ingredients-panel">
          <h3 className="ingredients-title">用料清单</h3>
          {recipe.ingredients.map((ing, index) => (
            <div className="ingredient-row" key={index}>
              <span className="ingredient-name">{ing.name}</span>
              <span className="ingredient-amount">{ing.amount}</span>
            </div>
          ))}
        </div>

        <div className="interaction-panel">
          <button
            className={`interaction-btn${favorite ? ' active' : ''}`}
            onClick={handleFavorite}
          >
            {favorite ? '❤️ 已收藏' : '🤍 收藏'}
          </button>

          <div className="rating-stars">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={`rating-star${i < userRating ? ' filled' : ''}`}
                onClick={() => handleRate(i + 1)}
              >
                ★
              </span>
            ))}
          </div>

          <div className="comment-section">
            <div className="comment-input">
              <input
                type="text"
                placeholder="写下你的评论..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              <button onClick={handleComment}>发送</button>
            </div>
            {comments.map((c) => (
              <div className="comment-item" key={c.id}>
                <div className="comment-user">{c.userId}</div>
                <div className="comment-text">{c.comment}</div>
                <div className="comment-time">{c.createdAt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
