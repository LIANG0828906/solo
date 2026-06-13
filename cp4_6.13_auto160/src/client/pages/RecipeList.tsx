import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecipes, likeRecipe } from '../api/recipes';
import type { RecipeSummary } from '../../types';

function RecipeList() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [likedRecipes, setLikedRecipes] = useState<Set<string>>(new Set());
  const [bouncingId, setBouncingId] = useState<string | null>(null);
  const [bouncingCountId, setBouncingCountId] = useState<string | null>(null);
  const navigate = useNavigate();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchRecipes = useCallback(async (search?: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const data = await getRecipes(search);
      setRecipes(data);
      setError(null);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Failed to load recipes');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchRecipes]);

  const debouncedSearch = useCallback((value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchRecipes(value || undefined);
      debounceTimerRef.current = null;
    }, 500);
  }, [fetchRecipes]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (likedRecipes.has(id)) {
      return;
    }

    try {
      setBouncingId(id);
      setBouncingCountId(id);
      const result = await likeRecipe(id);
      setRecipes(prev =>
        prev.map(r => (r.id === id ? { ...r, likes: result.likes } : r))
      );
      setLikedRecipes(prev => new Set(prev).add(id));
      setTimeout(() => {
        setBouncingId(null);
        setBouncingCountId(null);
      }, 200);
    } catch (err) {
      console.error('Failed to like recipe:', err);
      setBouncingId(null);
      setBouncingCountId(null);
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="搜索食谱..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {recipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍳</div>
          <p>暂无食谱，快来发布第一个吧！</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              className="recipe-card"
              onClick={() => navigate(`/recipe/${recipe.id}`)}
            >
              <div className="recipe-card-image">🍽️</div>
              <div className="recipe-card-content">
                <h3 className="recipe-card-title">{recipe.name}</h3>
                <div className="recipe-card-author">
                  <div className="avatar-placeholder">
                    {getInitials(recipe.author)}
                  </div>
                  <span>{recipe.author}</span>
                </div>
                <div className="recipe-card-meta">
                  <span className="recipe-calories">
                    🔥 {recipe.calories} 千卡
                  </span>
                  <button
                    className="like-button"
                    onClick={(e) => handleLike(e, recipe.id)}
                  >
                    <span
                      className={`heart-icon ${
                        likedRecipes.has(recipe.id) ? 'filled' : 'empty'
                      } ${bouncingId === recipe.id ? 'bounce' : ''}`}
                    >
                      {likedRecipes.has(recipe.id) ? '♥' : '♡'}
                    </span>
                    <span
                      className={`like-count ${bouncingCountId === recipe.id ? 'bounce' : ''}`}
                    >
                      {recipe.likes}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecipeList;
