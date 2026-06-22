import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Ingredient, RecipeSummary, RecipeDetail } from './types';
import SearchBar from './components/SearchBar';
import IngredientCard from './components/IngredientCard';
import RecipeCard from './components/RecipeCard';

const LoadingSpinner: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <div className="loading-text">正在加载...</div>
  </div>
);

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="empty-state">
        <div className="empty-emoji">😕</div>
        <div className="empty-text">出错了</div>
        <div className="empty-subtext">{error?.message || '请刷新页面重试'}</div>
      </div>
    );
  }

  return <>{children}</>;
};

const IngredientSelectPage: React.FC<{
  selectedIngredients: Ingredient[];
  onAddIngredient: (ingredient: Ingredient) => void;
  onRemoveIngredient: (id: string) => void;
  onSearchRecipes: () => void;
  loading: boolean;
}> = ({ selectedIngredients, onAddIngredient, onRemoveIngredient, onSearchRecipes, loading }) => {
  return (
    <div className="page">
      <h1 className="page-title">🧑‍🍳 食材搭配大师</h1>
      <p className="page-subtitle">输入你冰箱里的食材，我来帮你想出美味佳肴！</p>
      
      <SearchBar onAddIngredient={onAddIngredient} selectedIds={selectedIngredients.map(i => i.id)} />
      
      {selectedIngredients.length > 0 && (
        <>
          <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#ff9800' }}>
            已选食材 ({selectedIngredients.length})
          </h2>
          <div className="ingredients-grid">
            {selectedIngredients.map(ingredient => (
              <IngredientCard
                key={ingredient.id}
                ingredient={ingredient}
                onRemove={onRemoveIngredient}
              />
            ))}
          </div>
          <div className="action-bar">
            <button 
              className="primary-btn" 
              onClick={onSearchRecipes}
              disabled={loading}
            >
              {loading ? '正在推荐...' : '🔍 查看推荐菜谱'}
            </button>
          </div>
        </>
      )}
      
      {selectedIngredients.length === 0 && (
        <div className="empty-state">
          <div className="empty-emoji">🥗</div>
          <div className="empty-text">还没有添加食材</div>
          <div className="empty-subtext">在上方搜索框输入你拥有的食材开始吧</div>
        </div>
      )}
    </div>
  );
};

const RecipeListPage: React.FC<{
  recipes: RecipeSummary[];
  selectedIngredients: string[];
  loading: boolean;
  onBack: () => void;
}> = ({ recipes, selectedIngredients, loading, onBack }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="page">
        <button className="back-btn" onClick={onBack} style={{ marginBottom: '20px' }}>
          ← 返回
        </button>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="detail-page-header">
        <button className="back-btn" onClick={onBack}>
          ← 返回
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>🍽️ 推荐菜谱</h1>
        <div style={{ width: '120px' }}></div>
      </div>
      
      {recipes.length > 0 ? (
        <div className="recipes-grid">
          {recipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              selectedIngredients={selectedIngredients}
              onTry={() => navigate(`/recipe/${recipe.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-emoji">🤔</div>
          <div className="empty-text">没有找到合适的菜谱</div>
          <div className="empty-subtext">尝试添加更多食材，或者减少必需食材的要求</div>
          <button 
            className="primary-btn" 
            onClick={onBack}
            style={{ marginTop: '20px' }}
          >
            返回添加食材
          </button>
        </div>
      )}
    </div>
  );
};

const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightedSteps, setHighlightedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!id) return;
    
    const fetchRecipe = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/recipe/${id}`);
        const data = await response.json();
        setRecipe(data);
      } catch (error) {
        console.error('Failed to fetch recipe:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipe();
  }, [id]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const toggleStepHighlight = useCallback((stepNumber: number) => {
    setHighlightedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-emoji">❓</div>
          <div className="empty-text">菜谱不存在</div>
          <button 
            className="primary-btn" 
            onClick={() => navigate('/recipes')}
            style={{ marginTop: '20px' }}
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isFullscreen ? 'app-fullscreen' : ''}>
      <div className="page">
        <div className="detail-page-header">
          <button className="back-btn" onClick={() => navigate('/recipes')}>
            ← 返回列表
          </button>
          <h1 style={{ margin: 0, color: '#ff9800', fontSize: '24px' }}>烹饪模式</h1>
          <button className="fullscreen-btn" onClick={toggleFullscreen}>
            {isFullscreen ? '⊠ 退出全屏' : '⛶ 全屏模式'}
          </button>
        </div>

        <div className="recipe-detail-header">
          <h2 className="recipe-detail-title">{recipe.name}</h2>
          <p className="recipe-detail-desc">{recipe.description}</p>
          <div className="recipe-detail-meta">
            <div className="meta-item">
              <span className="meta-icon">⏱️</span>
              <span>{recipe.cookTime} 分钟</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">🔥</span>
              <span>{recipe.calories} 千卡</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">{'🔥'.repeat(recipe.difficulty)}</span>
              <span>难度 {recipe.difficulty}/3</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">👥</span>
              <span>{recipe.servings} 人份</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto 40px' }}>
          <h3 style={{ color: '#ff9800', marginBottom: '16px' }}>📝 所需食材</h3>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '10px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            {recipe.ingredients.map(ing => (
              <div key={ing.id} style={{
                padding: '8px 16px',
                backgroundColor: '#fff3e0',
                borderRadius: '20px',
                fontSize: '15px'
              }}>
                {ing.name}: {ing.quantity}
                {!ing.required && <span style={{ color: '#9e9e9e', fontSize: '13px' }}> (可选)</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="timeline-container">
          <div className="timeline-line"></div>
          <h3 style={{ color: '#ff9800', marginBottom: '30px', textAlign: 'center' }}>
            👨‍🍳 烹饪步骤
          </h3>
          {recipe.steps.map(step => (
            <div key={step.stepNumber} className="timeline-step">
              <div className="timeline-dot"></div>
              <div className="step-number">{step.stepNumber}</div>
              <div className="step-bubble">
                <div 
                  className={`step-content ${highlightedSteps.has(step.stepNumber) ? 'highlighted' : ''}`}
                  onClick={() => toggleStepHighlight(step.stepNumber)}
                  title="点击做笔记"
                >
                  {step.description}
                </div>
                {step.duration && (
                  <div className="step-duration">⏱️ 约 {step.duration} 分钟</div>
                )}
                {step.tips && (
                  <div className="step-tips">
                    💡 <strong>小贴士：</strong>{step.tips}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: '#9e9e9e', fontSize: '14px' }}>
            💡 点击步骤文字可以高亮标记，方便边看边做
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddIngredient = useCallback((ingredient: Ingredient) => {
    setSelectedIngredients(prev => {
      if (prev.find(i => i.id === ingredient.id)) {
        return prev;
      }
      return [...prev, ingredient];
    });
  }, []);

  const handleRemoveIngredient = useCallback((id: string) => {
    setSelectedIngredients(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleSearchRecipes = useCallback(async () => {
    if (selectedIngredients.length === 0) return;
    
    setRecipesLoading(true);
    try {
      const startTime = Date.now();
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: selectedIngredients.map(i => i.id),
        }),
      });
      const data = await response.json();
      
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }
      
      setRecommendedRecipes(data);
      navigate('/recipes');
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setRecipesLoading(false);
    }
  }, [selectedIngredients, navigate]);

  useEffect(() => {
    const loadIngredients = async () => {
      setLoading(true);
      try {
        await fetch('/api/ingredients');
      } catch (error) {
        console.error('Failed to load ingredients:', error);
      } finally {
        setLoading(false);
      }
    };
    loadIngredients();
  }, []);

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Routes>
          <Route 
            path="/" 
            element={
              <IngredientSelectPage
                selectedIngredients={selectedIngredients}
                onAddIngredient={handleAddIngredient}
                onRemoveIngredient={handleRemoveIngredient}
                onSearchRecipes={handleSearchRecipes}
                loading={recipesLoading}
              />
            } 
          />
          <Route 
            path="/recipes" 
            element={
              <RecipeListPage
                recipes={recommendedRecipes}
                selectedIngredients={selectedIngredients.map(i => i.id)}
                loading={recipesLoading}
                onBack={() => navigate('/')}
              />
            } 
          />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

export default App;
