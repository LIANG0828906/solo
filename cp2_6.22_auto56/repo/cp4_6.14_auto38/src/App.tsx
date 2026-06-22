import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import type { Recipe, TimerState, CreateRecipeRequest, Review, Ingredient, Step } from './types';
import { recipeApi, timerApi } from './api';
import TimerDashboard from './components/TimerDashboard';

const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const totalTime = recipe.prepTime + recipe.cookTime;
  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card">
      {recipe.coverImage ? (
        <img src={recipe.coverImage} alt={recipe.title} className="recipe-card-image" />
      ) : (
        <div className="recipe-card-image" />
      )}
      <h3 className="recipe-card-title">{recipe.title}</h3>
      <p className="recipe-card-desc">{recipe.description}</p>
      <div className="recipe-card-meta">
        <span className="meta-item">⏱️ {totalTime} 分钟</span>
        <span className="meta-item">📝 {recipe.steps.length} 步骤</span>
        <span className="meta-item">⭐ {recipe.averageRating.toFixed(1)}</span>
      </div>
    </Link>
  );
};

const StarRating: React.FC<{
  rating: number;
  onRate?: (rating: number) => void;
  interactive?: boolean;
}> = ({ rating, onRate, interactive = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
          onClick={interactive && onRate ? () => onRate(star) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const HomePage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recipeApi.getRecipes().then((data) => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">🍳 食谱分享</h1>
        <Link to="/create" className="btn btn-primary">
          + 创建食谱
        </Link>
      </div>
      {recipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽️</div>
          <p>还没有食谱，快来创建第一个吧！</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
};

const CreateRecipePage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateRecipeRequest>({
    title: '',
    coverImage: '',
    description: '',
    prepTime: 0,
    cookTime: 0,
    steps: [],
  });

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        { description: '', duration: 0, ingredients: [] },
      ],
    });
  };

  const updateStep = (index: number, field: string, value: string | number) => {
    const newSteps = [...formData.steps];
    (newSteps[index] as Record<string, unknown>)[field] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const addIngredient = (stepIndex: number) => {
    const newSteps = [...formData.steps];
    newSteps[stepIndex].ingredients.push({ name: '', quantity: '' });
    setFormData({ ...formData, steps: newSteps });
  };

  const updateIngredient = (
    stepIndex: number,
    ingIndex: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const newSteps = [...formData.steps];
    newSteps[stepIndex].ingredients[ingIndex][field] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const removeIngredient = (stepIndex: number, ingIndex: number) => {
    const newSteps = [...formData.steps];
    newSteps[stepIndex].ingredients.splice(ingIndex, 1);
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const recipe = await recipeApi.createRecipe(formData);
      navigate(`/recipe/${recipe.id}`);
    } catch (error) {
      console.error('Failed to create recipe:', error);
    }
  };

  return (
    <div>
      <h1 className="page-title">📝 创建新食谱</h1>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label className="form-label">食谱标题</label>
          <input
            type="text"
            className="form-input"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="例如：番茄炒蛋"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">封面图片URL</label>
          <input
            type="url"
            className="form-input"
            value={formData.coverImage}
            onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">简介</label>
          <textarea
            className="form-textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="简单介绍一下这道菜..."
            required
          />
        </div>

        <div className="row">
          <div className="form-group">
            <label className="form-label">准备时间（分钟）</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={formData.prepTime || ''}
              onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">烹饪时间（分钟）</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={formData.cookTime || ''}
              onChange={(e) => setFormData({ ...formData, cookTime: parseInt(e.target.value) || 0 })}
              required
            />
          </div>
        </div>

        <h2 className="section-title" style={{ marginTop: '32px' }}>
          📋 烹饪步骤
        </h2>

        {formData.steps.map((step, stepIndex) => (
          <div key={stepIndex} className="step-editor">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ color: '#4E342E' }}>步骤 {stepIndex + 1}</h3>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '4px 12px', fontSize: '12px' }}
                onClick={() => removeStep(stepIndex)}
              >
                删除
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">描述</label>
              <input
                type="text"
                className="form-input"
                value={step.description}
                onChange={(e) => updateStep(stepIndex, 'description', e.target.value)}
                placeholder="描述这个步骤..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">所需时间（秒）</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={step.duration || ''}
                onChange={(e) => updateStep(stepIndex, 'duration', parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">食材</label>
              {step.ingredients.map((ing, ingIndex) => (
                <div key={ingIndex} className="ingredient-item">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="食材名称"
                    value={ing.name}
                    onChange={(e) => updateIngredient(stepIndex, ingIndex, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="用量"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(stepIndex, ingIndex, 'quantity', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px' }}
                    onClick={() => removeIngredient(stepIndex, ingIndex)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => addIngredient(stepIndex)}
              >
                + 添加食材
              </button>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button type="button" className="btn btn-secondary" onClick={addStep}>
            + 添加步骤
          </button>
          <button type="submit" className="btn btn-primary">
            保存食谱
          </button>
        </div>
      </form>
    </div>
  );
};

const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [shoppingList, setShoppingList] = useState<Ingredient[]>([]);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');

  useEffect(() => {
    if (!id) return;

    const loadRecipe = async () => {
      try {
        const data = await recipeApi.getRecipe(id);
        setRecipe(data);
      } catch (error) {
        console.error('Failed to load recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let pollInterval: number | null = null;

    const pollTimer = async () => {
      try {
        const state = await timerApi.getTimerState(id);
        if (state.lastUpdated > (timerState?.lastUpdated || 0)) {
          setTimerState(state);
        }
      } catch (error) {
        // Ignore poll errors
      }
    };

    pollTimer();
    pollInterval = window.setInterval(pollTimer, 800);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id, timerState?.lastUpdated]);

  const handleTimerUpdate = useCallback((state: TimerState) => {
    setTimerState(state);
  }, []);

  const handleStart = useCallback(async () => {
    if (!id || !recipe) return;
    const state = await timerApi.startTimer(id);
    setTimerState(state);
  }, [id, recipe]);

  const handlePause = useCallback(async () => {
    if (!id) return;
    const state = await timerApi.pauseTimer(id);
    setTimerState(state);
  }, [id]);

  const handleSkip = useCallback(async () => {
    if (!id) return;
    const state = await timerApi.skipStep(id);
    setTimerState(state);
  }, [id]);

  const handleReset = useCallback(async () => {
    if (!id) return;
    const state = await timerApi.resetTimer(id);
    setTimerState(state);
  }, [id]);

  const handleSyncTimer = useCallback(async (state: TimerState) => {
    if (!id) return;
    try {
      const newState = await timerApi.syncTimer(id, state);
      if (newState.lastUpdated > (timerState?.lastUpdated || 0)) {
        setTimerState(newState);
      }
    } catch (error) {
      // Ignore sync errors
    }
  }, [id, timerState?.lastUpdated]);

  const toggleIngredient = (ingKey: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingKey)) {
        next.delete(ingKey);
      } else {
        next.add(ingKey);
      }
      return next;
    });
  };

  const addToShoppingList = () => {
    if (!recipe) return;

    const unselectedIngredients: Ingredient[] = [];
    recipe.steps.forEach((step) => {
      step.ingredients.forEach((ing) => {
        const key = `${step.id}-${ing.name}`;
        if (!checkedIngredients.has(key)) {
          const exists = unselectedIngredients.find((i) => i.name === ing.name);
          if (!exists) {
            unselectedIngredients.push(ing);
          }
        }
      });
    });

    setShoppingList(unselectedIngredients);
    setShoppingListOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reviewerName.trim()) return;

    try {
      const updated = await recipeApi.addReview(id, {
        userName: reviewerName,
        rating: reviewRating,
        comment: reviewComment,
      });
      setRecipe(updated);
      setReviewComment('');
      setReviewRating(5);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❓</div>
        <p>食谱不存在</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
          返回首页
        </Link>
      </div>
    );
  }

  const allIngredients: { stepId: string; ingredient: Ingredient }[] = [];
  recipe.steps.forEach((step) => {
    step.ingredients.forEach((ing) => {
      allIngredients.push({ stepId: step.id, ingredient: ing });
    });
  });

  const sortedReviews = [...recipe.reviews].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div>
      <button
        className="btn btn-secondary"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '16px' }}
      >
        ← 返回
      </button>

      <div className="recipe-detail">
        <div className="recipe-header">
          {recipe.coverImage ? (
            <img src={recipe.coverImage} alt={recipe.title} className="recipe-cover" />
          ) : (
            <div className="recipe-cover" />
          )}
          <div className="recipe-info">
            <h1 className="recipe-title">{recipe.title}</h1>
            <p className="recipe-description">{recipe.description}</p>
            <div className="recipe-card-meta">
              <span className="meta-item">⏱️ 准备 {recipe.prepTime} 分钟</span>
              <span className="meta-item">🔥 烹饪 {recipe.cookTime} 分钟</span>
              <span className="meta-item">📝 {recipe.steps.length} 步骤</span>
              <span className="meta-item">⭐ {recipe.averageRating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <TimerDashboard
          recipe={recipe}
          timerState={timerState}
          onTimerUpdate={handleTimerUpdate}
          onStart={handleStart}
          onPause={handlePause}
          onSkip={handleSkip}
          onReset={handleReset}
          syncTimer={handleSyncTimer}
        />

        <h2 className="section-title">📋 烹饪步骤</h2>
        <div className="step-list">
          {recipe.steps.map((step: Step, index: number) => {
            const isCompleted = timerState?.completedSteps.includes(step.id);
            const isActive = timerState?.currentStepIndex === index && !isCompleted;

            return (
              <div
                key={step.id}
                className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <span className="step-number">{index + 1}</span>
                <strong>{step.description}</strong>
                <span style={{ color: '#8D6E63', marginLeft: '12px' }}>
                  ({step.duration} 秒)
                </span>
                {step.ingredients.length > 0 && (
                  <div style={{ marginTop: '8px', paddingLeft: '40px' }}>
                    <span style={{ color: '#6D4C41', fontSize: '13px' }}>
                      食材：{step.ingredients.map((i) => `${i.name} ${i.quantity}`).join('、')}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <h2 className="section-title">🥬 食材清单</h2>
        <div className="ingredients-list">
          {allIngredients.map(({ stepId, ingredient }) => {
            const key = `${stepId}-${ingredient.name}`;
            const isChecked = checkedIngredients.has(key);
            return (
              <div key={key} className="ingredient-row">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleIngredient(key)}
                />
                <span className={`ingredient-name ${isChecked ? 'checked' : ''}`}>
                  {ingredient.name}
                </span>
                <span className="ingredient-quantity">{ingredient.quantity}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <button className="btn btn-primary" onClick={addToShoppingList}>
            🛒 加入购物清单
          </button>
        </div>

        {shoppingList.length > 0 && (
          <div className="shopping-list">
            <div
              className="shopping-list-header"
              onClick={() => setShoppingListOpen(!shoppingListOpen)}
            >
              <strong>🛒 购物清单 ({shoppingList.length} 项)</strong>
              <span>{shoppingListOpen ? '▲' : '▼'}</span>
            </div>
            {shoppingListOpen && (
              <div className="shopping-list-items">
                {shoppingList.map((ing, index) => (
                  <div key={index} className="ingredient-row">
                    <span className="ingredient-name">{ing.name}</span>
                    <span className="ingredient-quantity">{ing.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <h2 className="section-title">💬 用户评价</h2>

        <form onSubmit={handleSubmitReview} className="review-form">
          <div className="form-group">
            <label className="form-label">您的昵称</label>
            <input
              type="text"
              className="form-input"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="请输入您的昵称"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">评分</label>
            <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
          </div>
          <div className="form-group">
            <label className="form-label">评价</label>
            <textarea
              className="form-textarea"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="分享您的烹饪体验..."
            />
          </div>
          <button type="submit" className="btn btn-primary">
            提交评价
          </button>
        </form>

        {sortedReviews.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px' }}>
            <p>还没有评价，快来第一个评价吧！</p>
          </div>
        ) : (
          <div className="review-list">
            {sortedReviews.map((review: Review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <span className="review-author">{review.userName}</span>
                  <span className="review-rating">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
                <div className="review-date">
                  {new Date(review.createdAt).toLocaleString('zh-CN')}
                </div>
                {review.comment && <p className="review-comment">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div>
      <header className="header">
        <Link to="/" className="logo">
          🍳 食谱协作厨房
        </Link>
        <nav className="nav-links">
          <Link to="/" className="nav-link">首页</Link>
          <Link to="/create" className="nav-link">创建食谱</Link>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateRecipePage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
