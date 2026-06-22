import React, { useReducer, useEffect, useState, useCallback } from 'react';
import RecipeCard from './components/RecipeCard';
import type { AppState, Action, Recipe, Comment } from './types';
import { ALL_TAGS } from './types';

const initialState: AppState = {
  recipes: [],
  recommendedRecipes: [],
  favorites: [],
  searchQuery: '',
  selectedTags: [],
  currentView: 'list',
  selectedRecipe: null,
  showFavoritesDrawer: false,
  comments: {},
  isRecommendLoading: false
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload };
    case 'SET_RECOMMENDED':
      return { ...state, recommendedRecipes: action.payload, isRecommendLoading: false };
    case 'TOGGLE_FAVORITE': {
      const isFav = state.favorites.includes(action.payload);
      return {
        ...state,
        favorites: isFav
          ? state.favorites.filter(id => id !== action.payload)
          : [...state.favorites, action.payload]
      };
    }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'TOGGLE_TAG': {
      const isSelected = state.selectedTags.includes(action.payload);
      return {
        ...state,
        selectedTags: isSelected
          ? state.selectedTags.filter(t => t !== action.payload)
          : [...state.selectedTags, action.payload]
      };
    }
    case 'SHOW_DETAIL':
      return { ...state, currentView: 'detail', selectedRecipe: action.payload };
    case 'SHOW_LIST':
      return { ...state, currentView: 'list', selectedRecipe: null };
    case 'TOGGLE_FAVORITES_DRAWER':
      return { ...state, showFavoritesDrawer: !state.showFavoritesDrawer };
    case 'ADD_COMMENT': {
      const existing = state.comments[action.payload.recipeId] || [];
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.recipeId]: [action.payload.comment, ...existing]
        },
        selectedRecipe: state.selectedRecipe && state.selectedRecipe.id === action.payload.recipeId
          ? {
              ...state.selectedRecipe,
              rating: action.payload.comment.rating,
              reviewCount: state.selectedRecipe.reviewCount + 1
            }
          : state.selectedRecipe
      };
    }
    case 'SET_COMMENTS':
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.recipeId]: action.payload.comments
        }
      };
    case 'SET_RECOMMEND_LOADING':
      return { ...state, isRecommendLoading: action.payload };
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [commentText, setCommentText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(state.searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [state.searchQuery]);

  useEffect(() => {
    const fetchRecipes = async () => {
      const params = new URLSearchParams({
        limit: '20',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(state.selectedTags.length > 0 && { tags: state.selectedTags.join(',') })
      });
      const res = await fetch(`/api/recipes?${params}`);
      const data = await res.json();
      dispatch({ type: 'SET_RECIPES', payload: data.recipes });
    };
    fetchRecipes();
  }, [debouncedSearch, state.selectedTags]);

  const fetchRecommendations = useCallback(async () => {
    dispatch({ type: 'SET_RECOMMEND_LOADING', payload: true });
    const params = new URLSearchParams({
      ...(state.favorites.length > 0 && { favorites: state.favorites.join(',') })
    });
    const res = await fetch(`/api/recommend?${params}`);
    const data = await res.json();
    setTimeout(() => {
      dispatch({ type: 'SET_RECOMMENDED', payload: data.recommendations });
    }, 300);
  }, [state.favorites]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecommendations();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchRecommendations]);

  useEffect(() => {
    if (state.selectedRecipe) {
      const fetchComments = async () => {
        const res = await fetch(`/api/recipes/${state.selectedRecipe!.id}/comments`);
        const data = await res.json();
        dispatch({
          type: 'SET_COMMENTS',
          payload: { recipeId: state.selectedRecipe!.id, comments: data.comments }
        });
      };
      fetchComments();
    }
  }, [state.selectedRecipe]);

  const handleFavoriteToggle = (id: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: id });
    setTimeout(() => fetchRecommendations(), 100);
  };

  const handleShowDetail = (recipe: Recipe) => {
    setIsTransitioning(true);
    setTimeout(() => {
      dispatch({ type: 'SHOW_DETAIL', payload: recipe });
      setIsTransitioning(false);
    }, 400);
  };

  const handleShowList = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      dispatch({ type: 'SHOW_LIST' });
      setIsTransitioning(false);
    }, 400);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || selectedRating === 0 || !state.selectedRecipe) return;

    const res = await fetch(`/api/recipes/${state.selectedRecipe.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentText.trim(), rating: selectedRating })
    });
    const data = await res.json();

    if (data.success) {
      dispatch({
        type: 'ADD_COMMENT',
        payload: { recipeId: state.selectedRecipe.id, comment: data.comment }
      });
      setCommentText('');
      setSelectedRating(0);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const favoriteRecipes = state.recipes.filter(r => state.favorites.includes(r.id));
  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map(star => (
          <svg
            key={star}
            viewBox="0 0 24 24"
            className={`star ${interactive ? 'interactive' : ''} ${
              (interactive ? (hoverRating || selectedRating) : count) >= star ? 'filled' : ''
            }`}
            onClick={() => {
              if (interactive) setSelectedRating(star);
            }}
            onMouseEnter={() => {
              if (interactive) setHoverRating(star);
            }}
            onMouseLeave={() => {
              if (interactive) setHoverRating(0);
            }}
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header sticky">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">🍳</span>
            美食分享
          </h1>
          <div className="header-actions">
            <div
              className="favorites-trigger"
              onClick={() => dispatch({ type: 'TOGGLE_FAVORITES_DRAWER' })}
            >
              <svg viewBox="0 0 24 24" fill="#E74C3C" className="favorites-icon">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {state.favorites.length > 0 && (
                <span className="favorites-count">{state.favorites.length}</span>
              )}
            </div>
          </div>
        </div>

        <div className={`favorites-drawer ${state.showFavoritesDrawer ? 'open' : ''}`}>
          <div className="drawer-header">
            <h3>我的收藏</h3>
            <button
              className="close-drawer"
              onClick={() => dispatch({ type: 'TOGGLE_FAVORITES_DRAWER' })}
            >
              ✕
            </button>
          </div>
          {favoriteRecipes.length === 0 ? (
            <p className="empty-favorites">暂无收藏的食谱</p>
          ) : (
            <div className="favorites-list">
              {favoriteRecipes.map(recipe => (
                <div
                  key={recipe.id}
                  className="favorite-item"
                  onClick={() => {
                    dispatch({ type: 'TOGGLE_FAVORITES_DRAWER' });
                    handleShowDetail(recipe);
                  }}
                >
                  <img src={recipe.image} alt={recipe.name} className="favorite-thumb" />
                  <span className="favorite-name">{recipe.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {state.currentView === 'list' ? (
        <main className={`main-content ${isTransitioning ? 'slide-out' : ''}`}>
          <div className="search-filter-section sticky-filters">
            <div className="search-container">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="搜索食谱..."
                className="search-input"
                value={state.searchQuery}
                onChange={e => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
              />
            </div>
            <div className="tags-filter">
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  className={`tag-btn ${state.selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => dispatch({ type: 'TOGGLE_TAG', payload: tag })}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <section className="recommend-section">
            <h2 className="section-title">为你推荐</h2>
            <div className={`recipes-grid recommend-grid ${state.isRecommendLoading ? 'loading' : 'fade-in'}`}>
              {state.recommendedRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isFavorite={state.favorites.includes(recipe.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                  onClick={handleShowDetail}
                  isRecommended
                />
              ))}
            </div>
          </section>

          <section className="all-recipes-section">
            <h2 className="section-title">所有食谱</h2>
            {state.recipes.length === 0 ? (
              <p className="no-results">没有找到匹配的食谱</p>
            ) : (
              <div className="recipes-grid">
                {state.recipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={state.favorites.includes(recipe.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onClick={handleShowDetail}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      ) : (
        <main className={`detail-view ${isTransitioning ? 'slide-out-right' : 'slide-in'}`}>
          {state.selectedRecipe && (
            <>
              <div
                className="detail-hero"
                style={{ backgroundImage: `url(${state.selectedRecipe.image})` }}
              >
                <button className="back-btn" onClick={handleShowList}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12,19 5,12 12,5" />
                  </svg>
                </button>
                <button
                  className={`detail-favorite-btn ${state.selectedRecipe && state.favorites.includes(state.selectedRecipe.id) ? 'favorited' : ''}`}
                  onClick={() => state.selectedRecipe && handleFavoriteToggle(state.selectedRecipe.id)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill={state.selectedRecipe && state.favorites.includes(state.selectedRecipe.id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>

              <div className="detail-content">
                <h1 className="detail-title">{state.selectedRecipe.name}</h1>
                <div className="detail-meta">
                  <span className="cook-time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="meta-icon">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                    {state.selectedRecipe.cookTime}
                  </span>
                  <span className="rating">
                    <svg viewBox="0 0 24 24" fill="#FFD700" className="star-icon">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" />
                    </svg>
                    {state.selectedRecipe.rating.toFixed(1)} ({state.selectedRecipe.reviewCount}条评价)
                  </span>
                </div>

                <div className="detail-tags">
                  {state.selectedRecipe.tags.map(tag => (
                    <span key={tag} className="detail-tag">{tag}</span>
                  ))}
                </div>

                <section className="detail-section">
                  <h3 className="detail-section-title">食材清单</h3>
                  <ul className="ingredients-list">
                    {state.selectedRecipe.ingredients.map((ing, idx) => (
                      <li key={idx} className="ingredient-item">
                        <span className="ingredient-name">{ing.name}</span>
                        <span className="ingredient-quantity">{ing.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="detail-section">
                  <h3 className="detail-section-title">烹饪步骤</h3>
                  <ol className="steps-list">
                    {state.selectedRecipe.steps.map((step, idx) => (
                      <li key={idx} className="step-item">
                        <span className="step-number">{idx + 1}</span>
                        <span className="step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                <section className="detail-section">
                  <h3 className="detail-section-title">发表评论</h3>
                  <div className="comment-input-section">
                    <div className="rating-input">
                      <label>评分：</label>
                      {renderStars(selectedRating, true)}
                    </div>
                    <div className="comment-textarea-wrapper">
                      <textarea
                        className="comment-textarea"
                        placeholder="分享你的烹饪心得（最多100字）"
                        maxLength={100}
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                      />
                      <span className="char-count">{commentText.length}/100</span>
                    </div>
                    <button
                      className="submit-comment-btn"
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || selectedRating === 0}
                    >
                      提交评论
                    </button>
                  </div>
                </section>

                <section className="detail-section">
                  <h3 className="detail-section-title">用户评价</h3>
                  <div className="comments-list">
                    {(state.comments[state.selectedRecipe.id] || []).map((comment: Comment, idx: number) => (
                      <div key={comment.id} className={`comment-item ${idx === 0 ? 'new-comment' : ''}`}>
                        <div className="comment-header">
                          <span className="comment-username">{comment.username}</span>
                          <span className="comment-time">{formatTime(comment.createdAt)}</span>
                        </div>
                        <div className="comment-rating">
                          {renderStars(comment.rating)}
                        </div>
                        <p className="comment-content">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
};

export default App;
