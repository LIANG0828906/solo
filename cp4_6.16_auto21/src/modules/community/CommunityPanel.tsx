import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore } from '../../stores/recipeStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const EMOJI_OPTIONS = ['😊', '❤️', '🤤', '👍', '🔥', '✨', '😍', '😋'];

function TrendingCard() {
  const navigate = useNavigate();
  const { getTrendingRecipes } = useRecipeStore();
  const trendingRecipes = useMemo(() => getTrendingRecipes(7), [getTrendingRecipes]);

  const getRankStyle = (index: number) => {
    if (index === 0) return { color: '#FFD700', fontSize: '28px' };
    if (index === 1) return { color: '#C0C0C0', fontSize: '24px' };
    if (index === 2) return { color: '#CD7F32', fontSize: '22px' };
    return {};
  };

  return (
    <div className="trending-sidebar">
      <div className="trending-card">
        <h3 className="trending-title">
          <span className="flame-icon">🔥</span>
          美食雷达
        </h3>
        <p style={{ fontSize: '12px', color: '#6B7F99', marginBottom: 16 }}>
          最近7天点赞最多的食谱
        </p>
        <div className="trending-list">
          {trendingRecipes.length > 0 ? (
            trendingRecipes.map((recipe, index) => (
              <div
                key={recipe.id}
                className="trending-item"
                onClick={() => navigate(`/recipe/${recipe.id}`)}
              >
                <span className="trending-rank" style={getRankStyle(index)}>
                  {index + 1}
                </span>
                <div className="trending-item-info">
                  <div className="trending-item-name">{recipe.name}</div>
                  <div className="trending-item-stats">
                    <span>{recipe.cuisine}</span>
                    <span className="trending-item-likes">
                      <span className="flame-icon">🔥</span> {recipe.likes}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '13px', color: '#6B7F99', textAlign: 'center', padding: 20 }}>
              暂无热门食谱
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CommunityFeed() {
  const navigate = useNavigate();
  const { recipes, addComment, likedRecipes, likeRecipe, unlikeRecipe, userProfile } = useRecipeStore();
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');

  const recentRecipes = useMemo(() => {
    return [...recipes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [recipes]);

  const handleSubmitComment = (recipeId: string) => {
    if (!commentText.trim() && !selectedEmoji) return;

    const userName = userProfile?.userName || '匿名美食家';
    addComment(recipeId, {
      userName,
      content: commentText,
      emoji: selectedEmoji,
    });

    setCommentText('');
    setSelectedEmoji('');
    setExpandedRecipe(null);
  };

  const handleLikeClick = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation();
    if (likedRecipes.includes(recipeId)) {
      unlikeRecipe(recipeId);
    } else {
      likeRecipe(recipeId);
    }
  };

  return (
    <div className="community-main">
      <div className="hero-section">
        <h1 className="hero-title">味蕾社区</h1>
        <p className="hero-subtitle">和口味相投的食友们一起分享美食的快乐 🥂</p>
      </div>

      {recentRecipes.map((recipe) => {
        const isLiked = likedRecipes.includes(recipe.id);
        const isExpanded = expandedRecipe === recipe.id;
        const latestComments = [...recipe.comments].reverse().slice(0, 3);

        return (
          <div
            key={recipe.id}
            className="recipe-card"
            style={{ marginBottom: 0 }}
            onClick={() => navigate(`/recipe/${recipe.id}`)}
          >
            <div className="recipe-card-image" style={{ height: 180 }}>
              <img src={recipe.coverImage} alt={recipe.name} />
              <span className="recipe-card-cuisine retro-font">{recipe.cuisine}</span>
              <div style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(0,0,0,0.5)',
                color: '#FFF8E7',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 13,
              }}>
                <span className="flame-icon">🔥</span>
                <span>{recipe.likes}</span>
              </div>
            </div>
            <div className="recipe-card-content">
              <h3 className="recipe-card-title">{recipe.name}</h3>
              <p className="recipe-card-story">{recipe.story}</p>

              <div className="recipe-card-footer" style={{ borderTop: '1px dashed #D4C5A9', paddingTop: 12 }}>
                <button
                  className={`like-btn ${isLiked ? 'liked' : ''}`}
                  onClick={(e) => handleLikeClick(e, recipe.id)}
                >
                  <span className="like-icon">{isLiked ? '❤️' : '🤍'}</span>
                  <span>点赞</span>
                </button>
                <button
                  className="like-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedRecipe(isExpanded ? null : recipe.id);
                  }}
                >
                  💬 {recipe.comments.length}
                </button>
                <span style={{ fontSize: 12, color: '#6B7F99' }}>
                  {format(new Date(recipe.createdAt), 'M月d日', { locale: zhCN })}
                </span>
              </div>

              {latestComments.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #D4C5A9' }}>
                  {latestComments.map((comment) => (
                    <div key={comment.id} style={{
                      fontSize: 13,
                      marginBottom: 8,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                    }}>
                      <span style={{
                        fontWeight: 600,
                        color: '#2C4A6E',
                        flexShrink: 0,
                      }}>
                        {comment.userName}:
                      </span>
                      <span style={{ color: '#6B7F99' }}>
                        {comment.content} {comment.emoji}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px dashed #D4C5A9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <input
                    type="text"
                    className="comment-input"
                    placeholder="写下你的评论..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: 13 }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="emoji-picker">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                          onClick={() => setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)}
                          style={{ fontSize: 18 }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <button
                      className="submit-comment-btn"
                      onClick={() => handleSubmitComment(recipe.id)}
                      disabled={!commentText.trim() && !selectedEmoji}
                      style={{ padding: '6px 16px', fontSize: 13 }}
                    >
                      发送
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CommunityPanel() {
  return (
    <div className="community-layout">
      <CommunityFeed />
      <TrendingCard />
    </div>
  );
}
