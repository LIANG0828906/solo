import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '../components/Sidebar';
import { useRecipeStore } from '../store/recipeStore';
import { useListStore } from '../store/listStore';
import { Ingredient, Comment } from '../types';

const RecipeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [recipeComments, setRecipeComments] = useState<Comment[]>([]);

  const getRecipeById = useRecipeStore((state) => state.getRecipeById);
  const toggleFavorite = useRecipeStore((state) => state.toggleFavorite);
  const isFavorite = useRecipeStore((state) => state.isFavorite);
  const addToHistory = useRecipeStore((state) => state.addToHistory);
  const searchIngredients = useRecipeStore((state) => state.searchIngredients);
  const addMissingIngredients = useListStore((state) => state.addMissingIngredients);
  const addIngredientFromRecipe = useListStore((state) => state.addIngredientFromRecipe);

  const recipe = id ? getRecipeById(id) : undefined;
  const favorite = recipe ? isFavorite(recipe.id) : false;

  useEffect(() => {
    if (recipe) {
      addToHistory(recipe.id);
      setRecipeComments(recipe.comments);
    }
  }, [recipe, addToHistory]);

  if (!recipe) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Sidebar />
        <div
          style={{
            marginLeft: '240px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <style>{`@media (max-width: 1024px) { div { margin-left: 0 !important; } }`}</style>
          <div style={{ textAlign: 'center', color: 'var(--color-text-light)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
            <p style={{ fontSize: '18px', marginBottom: '16px' }}>菜谱不存在</p>
            <button
              onClick={() => navigate('/')}
              className="hover-scale"
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--color-primary)',
                color: 'white',
                fontWeight: 600,
              }}
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleFavorite = async () => {
    setIsAnimating(true);
    await toggleFavorite(recipe.id);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleToggleStep = (order: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(order)) {
        next.delete(order);
      } else {
        next.add(order);
      }
      return next;
    });
  };

  const handleAddMissingToList = async () => {
    await addMissingIngredients(recipe.ingredients, searchIngredients);
  };

  const handleAddIngredientToList = async (ing: Ingredient) => {
    await addIngredientFromRecipe(ing);
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: uuidv4(),
      userName: '我',
      rating: newRating,
      text: newComment,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setRecipeComments([comment, ...recipeComments]);
    setNewComment('');
  };

  const isOwned = (name: string) => searchIngredients.includes(name);

  const renderStars = (count: number, interactive = false, onRate?: (n: number) => void) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            style={{
              fontSize: interactive ? '24px' : '16px',
              cursor: interactive ? 'pointer' : 'default',
              opacity: n <= count ? 1 : 0.3,
            }}
            onClick={() => interactive && onRate && onRate(n)}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar />

      <div
        style={{
          marginLeft: '240px',
          minHeight: '100vh',
          padding: '0',
        }}
        className="detail-page"
      >
        <style>{`
          @media (max-width: 1024px) {
            .detail-page { margin-left: 0 !important; padding-top: 60px !important; }
          }
        `}</style>

        <div className="slide-in-right">
          <div
            style={{
              height: '280px',
              background: `linear-gradient(135deg, ${recipe.gradientColors[0]}, ${recipe.gradientColors[1]})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <button
              onClick={() => navigate('/')}
              className="hover-scale"
              style={{
                position: 'absolute',
                top: '24px',
                left: '32px',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              ←
            </button>

            <button
              onClick={handleToggleFavorite}
              className={isAnimating ? 'heart-bounce' : ''}
              style={{
                position: 'absolute',
                top: '24px',
                right: '32px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {favorite ? '❤️' : '🤍'}
            </button>

            <span style={{ fontSize: '120px', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' }}>
              {recipe.emoji}
            </span>
          </div>

          <main style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px' }}>
                {recipe.name}
              </h1>
              <div style={{ display: 'flex', gap: '24px', color: 'var(--color-text-light)' }}>
                <span>⏱️ 烹饪时间：{recipe.cookTime} 分钟</span>
                <span>难度：{renderStars(recipe.difficulty)}</span>
              </div>
            </div>

            <section style={{ marginBottom: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <h2 style={{ fontSize: '22px', fontWeight: 600 }}>🥗 所需食材</h2>
                <button
                  onClick={handleAddMissingToList}
                  className="hover-scale"
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  🛒 缺少食材加入清单
                </button>
              </div>

              <div
                style={{
                  background: 'var(--color-card)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                }}
              >
                {recipe.ingredients.map((ing, index) => {
                  const owned = isOwned(ing.name);
                  return (
                    <div
                      key={ing.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px 20px',
                        borderBottom: index < recipe.ingredients.length - 1 ? '1px solid rgba(46,134,171,0.1)' : 'none',
                        background: owned ? 'var(--color-success-light)' : 'transparent',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <span style={{ fontSize: '24px', marginRight: '12px' }}>{ing.emoji}</span>
                      <span
                        style={{
                          fontWeight: 500,
                          color: owned ? 'var(--color-success)' : 'var(--color-text)',
                        }}
                      >
                        {ing.name}
                      </span>
                      <span style={{ marginLeft: 'auto', color: 'var(--color-text-light)' }}>
                        {ing.quantity} {ing.unit}
                      </span>
                      <span
                        style={{
                          marginLeft: '12px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: owned ? 'var(--color-success)' : 'var(--color-danger)',
                          color: 'white',
                        }}
                      >
                        {owned ? '已有' : '缺少'}
                      </span>
                      {!owned && (
                        <button
                          onClick={() => handleAddIngredientToList(ing)}
                          className="hover-scale"
                          style={{
                            marginLeft: '8px',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-primary)',
                            color: 'var(--color-primary)',
                            fontSize: '12px',
                          }}
                        >
                          +
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px' }}>👨‍🍳 烹饪步骤</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recipe.steps.map((step) => {
                  const isDone = completedSteps.has(step.order);
                  return (
                    <div
                      key={step.order}
                      onClick={() => handleToggleStep(step.order)}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px 20px',
                        background: 'var(--color-card)',
                        border: `2px solid ${isDone ? 'var(--color-success)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        opacity: isDone ? 0.7 : 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: isDone ? 'var(--color-success)' : 'var(--color-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                        className={isDone ? 'check-animation' : ''}
                      >
                        {isDone ? '✓' : step.order}
                      </div>
                      <p
                        style={{
                          flex: 1,
                          lineHeight: 1.7,
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? 'var(--color-text-light)' : 'var(--color-text)',
                        }}
                      >
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px' }}>
                💬 用户评论 ({recipeComments.length})
              </h2>

              <div
                style={{
                  background: 'var(--color-card)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--color-text-light)' }}>
                    评分
                  </label>
                  {renderStars(newRating, true, setNewRating)}
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="分享你的烹饪心得..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(46,134,171,0.2)',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px',
                    marginBottom: '12px',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={handleSubmitComment}
                    className="hover-scale"
                    disabled={!newComment.trim()}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 'var(--radius-xl)',
                      background: newComment.trim()
                        ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))'
                        : '#ccc',
                      color: 'white',
                      fontWeight: 600,
                      cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    发表评论
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recipeComments.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '20px' }}>
                    暂无评论，快来发表第一条吧！
                  </p>
                ) : (
                  recipeComments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        background: 'var(--color-card)',
                        border: '1px solid rgba(46,134,171,0.15)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px 20px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '8px',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        >
                          {comment.userName[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '14px' }}>{comment.userName}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {renderStars(comment.rating)}
                            <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                              {comment.createdAt}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p style={{ color: 'var(--color-text)', fontSize: '14px', lineHeight: 1.7 }}>
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailPage;
