import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { recipeApi } from '../api';
import { useAppStore } from '../store';
import type { Recipe } from '../types';

function getLevelColor(value: number, isCalorie = false) {
  if (isCalorie) {
    if (value < 100) return '#D8F3DC';
    if (value < 200) return '#52B788';
    return '#2D6A4F';
  }
  if (value < 10) return '#D8F3DC';
  if (value <= 20) return '#52B788';
  return '#2D6A4F';
}

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAppStore();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const data = await recipeApi.getRecipe(id);
        setRecipe(data);
      } catch (error) {
        console.error('Failed to fetch recipe:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const handleSubmitRating = async () => {
    if (!id || !user || rating === 0 || submitting) return;
    try {
      setSubmitting(true);
      const updatedRecipe = await recipeApi.rateRecipe(id, {
        userId: user.id,
        userName: user.name,
        score: rating,
        comment,
      });
      setRecipe(updatedRecipe);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  if (!recipe) {
    return (
      <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px', textAlign: 'center' }}>
        菜谱不存在
      </div>
    );
  }

  const nutritionItems = [
    { label: '蛋白质', value: recipe.nutritionPer100g.protein, unit: 'g' },
    { label: '脂肪', value: recipe.nutritionPer100g.fat, unit: 'g' },
    { label: '碳水', value: recipe.nutritionPer100g.carbs, unit: 'g' },
    { label: '热量', value: recipe.nutritionPer100g.calories, unit: 'kcal', isCalorie: true },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
      <style>{`
        .detail-container {
          display: flex;
          gap: 24px;
        }
        .detail-content {
          flex: 1;
          margin-right: 24px;
        }
        .detail-sidebar {
          width: 300px;
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .detail-container {
            flex-direction: column;
          }
          .detail-content {
            margin-right: 0;
          }
          .detail-sidebar {
            width: 100%;
          }
        }
      `}</style>
      <div className="detail-container">
        <div className="detail-content">
          <div>
            <div
              style={{
                height: '300px',
                borderRadius: '16px',
                background: recipe.coverGradient,
              }}
            />
            <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '24px 0 16px' }}>
              {recipe.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <img
                src={recipe.authorAvatar}
                alt={recipe.author}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <span style={{ fontSize: '16px' }}>{recipe.author}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
                烹饪时间: {recipe.cookTime}分钟
              </span>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>食材清单</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ background: 'var(--primary-lighter)', textAlign: 'left', padding: '12px' }}>食材</th>
                  <th style={{ background: 'var(--primary-lighter)', textAlign: 'left', padding: '12px' }}>用量</th>
                  <th style={{ background: 'var(--primary-lighter)', textAlign: 'left', padding: '12px' }}>蛋白质</th>
                  <th style={{ background: 'var(--primary-lighter)', textAlign: 'left', padding: '12px' }}>脂肪</th>
                  <th style={{ background: 'var(--primary-lighter)', textAlign: 'left', padding: '12px' }}>碳水</th>
                  <th style={{ background: 'var(--primary-lighter)', textAlign: 'left', padding: '12px' }}>热量</th>
                </tr>
              </thead>
              <tbody>
                {recipe.ingredients.map((ingredient, index) => (
                  <tr key={index}>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>{ingredient.name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>{ingredient.amount}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>{ingredient.protein}g</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>{ingredient.fat}g</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>{ingredient.carbs}g</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>{ingredient.calories}kcal</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '32px 0 16px' }}>烹饪步骤</h2>
            <ol style={{ paddingLeft: '24px' }}>
              {recipe.steps.map((step, index) => (
                <li key={index} style={{ marginBottom: '12px', lineHeight: 1.8 }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{index + 1}. </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="detail-sidebar">
          <div style={{ position: 'sticky', top: '80px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>营养成分（每100g）</h3>
              {nutritionItems.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: index < nutritionItems.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '4px',
                        marginRight: '8px',
                        background: getLevelColor(item.value, item.isCalorie),
                      }}
                    />
                    <span>{item.label}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>
                    {item.value}{item.unit}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>用户评价</h3>
              <div>
                {recipe.ratings.map((r, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px 0',
                      borderBottom: index < recipe.ratings.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--primary-lighter)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 500,
                        }}
                      >
                        {r.userName.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{r.userName}</span>
                      <div style={{ marginLeft: 'auto' }}>
                        <StarRating value={r.score} size="sm" />
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{r.comment}</p>
                  </div>
                ))}
                {recipe.ratings.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>
                    暂无评价
                  </p>
                )}
              </div>

              {user && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                  <StarRating value={rating} onChange={setRating} />
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="写下你的评价..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      margin: '12px 0',
                      resize: 'vertical',
                      minHeight: '80px',
                    }}
                  />
                  <button
                    onClick={handleSubmitRating}
                    disabled={submitting || rating === 0}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      padding: '8px 24px',
                      borderRadius: '8px',
                      opacity: rating === 0 ? 0.5 : 1,
                      cursor: rating === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? '提交中...' : '提交评价'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
