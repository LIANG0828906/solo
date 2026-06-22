import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, Recipe as RecipeType, Comment as CommentType, Ingredient } from '../App';

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}秒前`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}个月前`;
  return `${Math.floor(months / 12)}年前`;
}

const EMOJIS = ['❤️', '👍', '😋', '🤤', '😍', '🎉', '😂', '🔥'];

export default function Detail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<RecipeType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    Promise.all([
      axios.get(`/api/recipes/${id}`).catch(e => { if (e.response?.status === 404) setNotFound(true); throw e; }),
      axios.get(`/api/recipes/${id}/comments`).catch(() => ({ data: { comments: [] } })),
    ]).then(([recipeRes, commentsRes]) => {
      setRecipe(recipeRes.data.recipe);
      setComments(commentsRes.data.comments);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!user || !recipe) return;
    try {
      const res = await axios.post(`/api/recipes/${recipe.id}/like`);
      const liked = res.data.liked;
      setRecipe(prev => prev ? {
        ...prev,
        likes: liked ? [...prev.likes, user.id] : prev.likes.filter(uid => uid !== user.id),
      } : prev);
    } catch {}
  };

  const handleComment = async () => {
    if (!user || !id || !commentText.trim() || commentText.length > 200) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/recipes/${id}/comments`, { content: commentText.trim() });
      const res = await axios.get(`/api/recipes/${id}/comments`);
      setComments(res.data.comments);
      setCommentText('');
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    if (commentText.length + emoji.length <= 200) {
      setCommentText(prev => prev + emoji);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 80, maxWidth: 800, margin: '0 auto', padding: '80px 16px 40px' }}>
        <div style={{ width: '100%', height: 300, background: '#F0E6D8', borderRadius: 12, marginBottom: 24, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: '50%', height: 24, background: '#F0E6D8', borderRadius: 4, marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: '30%', height: 16, background: '#F0E6D8', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ paddingTop: 80, textAlign: 'center', padding: '120px 16px' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>😞</p>
        <p style={{ fontSize: 18, color: '#8B7355', marginBottom: 24 }}>菜谱未找到</p>
        <button onClick={() => navigate('/')}
          style={{ padding: '10px 24px', borderRadius: 8, background: '#F5A623', color: '#fff', fontSize: 15, fontWeight: 500 }}>
          返回社区
        </button>
      </div>
    );
  }

  if (!recipe) return null;

  const liked = user ? recipe.likes.includes(user.id) : false;
  const totalCalories = recipe.ingredients.reduce((s, i) => s + i.calories, 0);
  const totalProtein = recipe.ingredients.reduce((s, i) => s + i.protein, 0);
  const totalCarbs = recipe.ingredients.reduce((s, i) => s + i.carbs, 0);
  const totalFat = recipe.ingredients.reduce((s, i) => s + i.fat, 0);

  return (
    <div style={{ paddingTop: 76, maxWidth: 800, margin: '0 auto', padding: '76px 16px 40px' }}>
      <button onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none', color: '#8B7355',
          fontSize: 14, marginBottom: 16, transition: 'color 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#F5A623'}
        onMouseLeave={e => e.currentTarget.style.color = '#8B7355'}>
        ← 返回
      </button>

      {recipe.image ? (
        <img src={recipe.image} alt={recipe.name}
          style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 16, marginBottom: 24 }} />
      ) : (
        <div style={{
          width: '100%', height: 300, borderRadius: 16, marginBottom: 24,
          background: 'linear-gradient(135deg, #F5A623, #E8913A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64,
        }}>
          🍳
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#3D2C1E', marginBottom: 12 }}>{recipe.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={recipe.authorAvatar || `https://ui-avatars.com/api/?name=${recipe.authorName}&background=F5A623&color=fff`}
              alt={recipe.authorName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontSize: 15, fontWeight: 500, color: '#3D2C1E' }}>{recipe.authorName}</span>
          </div>
          <span style={{ fontSize: 13, color: '#8B7355', background: '#FFF8F0', padding: '4px 10px', borderRadius: 8 }}>
            {recipe.category}
          </span>
          <span style={{ fontSize: 13, color: '#8B7355' }}>⏱ {recipe.cookTime}分钟</span>
          <button onClick={handleLike}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, background: 'none',
              fontSize: 15, color: liked ? '#E53935' : '#8B7355',
              padding: '4px 12px', borderRadius: 8, border: liked ? '1.5px solid #E53935' : '1.5px solid #F0E6D8',
              transition: 'all 0.3s', fontWeight: 500,
            }}>
            {liked ? '❤️' : '🤍'} {recipe.likes.length}
          </button>
        </div>
        {recipe.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {recipe.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 12, padding: '3px 10px', borderRadius: 10, fontWeight: 500,
                background: '#FFF3E0', color: '#F5A623',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#3D2C1E', marginBottom: 16 }}>🥘 食材</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0E6D8' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#8B7355' }}>名称</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#8B7355' }}>用量</th>
              <th style={{ textAlign: 'center', padding: '8px 8px', fontSize: 13, fontWeight: 600, color: '#8B7355' }}>热量</th>
              <th style={{ textAlign: 'center', padding: '8px 8px', fontSize: 13, fontWeight: 600, color: '#8B7355' }}>蛋白质</th>
              <th style={{ textAlign: 'center', padding: '8px 8px', fontSize: 13, fontWeight: 600, color: '#8B7355' }}>碳水</th>
              <th style={{ textAlign: 'center', padding: '8px 8px', fontSize: 13, fontWeight: 600, color: '#8B7355' }}>脂肪</th>
            </tr>
          </thead>
          <tbody>
            {recipe.ingredients.map((ing, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F0E6D8' }}>
                <td style={{ padding: '10px 12px', fontSize: 14, color: '#3D2C1E' }}>{ing.name}</td>
                <td style={{ padding: '10px 12px', fontSize: 14, color: '#8B7355' }}>{ing.amount}</td>
                <td style={{ padding: '10px 8px', fontSize: 14, color: '#F5A623', textAlign: 'center', fontWeight: 500 }}>{ing.calories}</td>
                <td style={{ padding: '10px 8px', fontSize: 14, color: '#7CB342', textAlign: 'center' }}>{ing.protein}g</td>
                <td style={{ padding: '10px 8px', fontSize: 14, color: '#2196F3', textAlign: 'center' }}>{ing.carbs}g</td>
                <td style={{ padding: '10px 8px', fontSize: 14, color: '#FF9800', textAlign: 'center' }}>{ing.fat}g</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#FFF8F0' }}>
              <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600, color: '#3D2C1E' }}>合计</td>
              <td style={{ padding: '10px 12px' }}></td>
              <td style={{ padding: '10px 8px', fontSize: 14, fontWeight: 600, color: '#F5A623', textAlign: 'center' }}>{totalCalories}</td>
              <td style={{ padding: '10px 8px', fontSize: 14, fontWeight: 600, color: '#7CB342', textAlign: 'center' }}>{totalProtein}g</td>
              <td style={{ padding: '10px 8px', fontSize: 14, fontWeight: 600, color: '#2196F3', textAlign: 'center' }}>{totalCarbs}g</td>
              <td style={{ padding: '10px 8px', fontSize: 14, fontWeight: 600, color: '#FF9800', textAlign: 'center' }}>{totalFat}g</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#3D2C1E', marginBottom: 16 }}>📝 步骤</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {recipe.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{
                width: 32, height: 32, borderRadius: '50%', background: '#F5A623', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <p style={{ fontSize: 15, color: '#3D2C1E', lineHeight: 1.7, paddingTop: 4 }}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#3D2C1E', marginBottom: 16 }}>💬 评论 ({comments.length})</h2>

        {user && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => insertEmoji(emoji)}
                  style={{
                    fontSize: 20, background: '#FFF8F0', borderRadius: 8, padding: '4px 8px',
                    transition: 'transform 0.2s', border: '1px solid transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  {emoji}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder={user ? '写下你的评论...' : '请先登录'}
                maxLength={200}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #F0E6D8',
                  fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 60,
                  fontFamily: "'Noto Sans SC', sans-serif",
                }} />
              <button onClick={handleComment}
                disabled={!commentText.trim() || commentText.length > 200 || submitting}
                style={{
                  padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  background: (!commentText.trim() || commentText.length > 200 || submitting) ? '#F0E6D8' : '#F5A623',
                  color: (!commentText.trim() || commentText.length > 200 || submitting) ? '#8B7355' : '#fff',
                  transition: 'background 0.3s', whiteSpace: 'nowrap',
                }}>
                {submitting ? '发送中' : '发送'}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: commentText.length > 200 ? '#E53935' : '#8B7355' }}>
                {commentText.length}/200
              </span>
            </div>
          </div>
        )}

        {!user && (
          <p style={{ color: '#8B7355', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>请先登录后评论</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {comments.length === 0 ? (
            <p style={{ color: '#8B7355', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>暂无评论，快来抢沙发！</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <img src={comment.userAvatar || `https://ui-avatars.com/api/?name=${comment.username}&background=F5A623&color=fff`}
                  alt={comment.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#3D2C1E' }}>{comment.username}</span>
                    <span style={{ fontSize: 12, color: '#8B7355' }}>{relativeTime(comment.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#3D2C1E', lineHeight: 1.6 }}>{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
