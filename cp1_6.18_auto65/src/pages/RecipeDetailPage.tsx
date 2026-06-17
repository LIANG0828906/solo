import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, ThumbsUp, Heart, Clock, ChefHat, Sparkles } from 'lucide-react';
import useStore from '../store/useStore';
import RecipeCard from '../components/RecipeCard';
import { getMatchingRecipes } from '../shared/recipeUtils';
import { IngredientCategory } from '../shared/types';
import './RecipeDetailPage.css';

const categoryLabels: Record<IngredientCategory, string> = {
  meat: '肉类',
  vegetable: '蔬菜',
  seasoning: '调料',
  other: '其他'
};

function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [imageLoaded, setImageLoaded] = useState(false);

  const recipes = useStore(state => state.recipes);
  const currentRecipe = useStore(state => state.currentRecipe);
  const isLoading = useStore(state => state.isLoading);
  const fetchRecipeById = useStore(state => state.fetchRecipeById as (id: string) => Promise<void>);
  const fetchRecipes = useStore(state => state.fetchRecipes as () => Promise<void>);
  const isFavorite = useStore(state => state.favorites.includes(id || ''));
  const toggleFavorite = useStore(state => state.toggleFavorite);
  const incrementLikes = useStore(state => state.incrementLikes);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (id) {
      if (recipes.length === 0) {
        fetchRecipes();
      }
      fetchRecipeById(id);
    }
  }, [id, recipes.length, fetchRecipeById, fetchRecipes]);

  const matchedRecipes = useMemo(() => {
    if (!currentRecipe || recipes.length === 0) return [];
    return getMatchingRecipes(currentRecipe, recipes, 10);
  }, [currentRecipe, recipes]);

  const groupedIngredients = useMemo(() => {
    if (!currentRecipe) return {} as Partial<Record<IngredientCategory, typeof currentRecipe.ingredients>>;
    const grouped: Partial<Record<IngredientCategory, typeof currentRecipe.ingredients>> = {};
    for (const ing of currentRecipe.ingredients) {
      if (!grouped[ing.category]) grouped[ing.category] = [];
      grouped[ing.category]!.push(ing);
    }
    return grouped;
  }, [currentRecipe]);

  const handleLike = () => {
    if (!id || isLiking) return;
    setIsLiking(true);
    incrementLikes(id);
    setTimeout(() => setIsLiking(false), 400);
  };

  const handleFavorite = () => {
    if (!id) return;
    toggleFavorite(id);
  };

  if (isLoading && !currentRecipe) {
    return (
      <div className="detail-page loading-state">
        <div className="detail-container">
          <Link to="/" className="back-link-placeholder">← 返回</Link>
          <div className="skeleton-detail-image" />
          <div className="skeleton-detail-content">
            <div className="skeleton-line title" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentRecipe) {
    return (
      <div className="detail-page error-state">
        <div className="detail-container">
          <Link to="/" className="back-link">
            <ArrowLeft size={18} />
            返回首页
          </Link>
          <div className="not-found">
            <span className="not-found-icon">🍽️</span>
            <h2>菜谱不存在</h2>
            <p>该菜谱可能已被删除，请返回首页继续浏览</p>
            <Link to="/" className="primary-btn">返回首页</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-container">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          返回首页
        </Link>

        <article className="recipe-detail">
          <div className="detail-image-wrapper">
            {!imageLoaded && <div className="detail-image-placeholder" />}
            <img
              src={currentRecipe.image}
              alt={currentRecipe.title}
              className={`detail-image ${imageLoaded ? 'fade-in' : ''}`}
              onLoad={() => setImageLoaded(true)}
            />
            <div className="detail-stats-overlay">
              <span className="stat-badge">
                <Eye size={16} />
                {currentRecipe.views} 浏览
              </span>
              <span className="stat-badge">
                <ThumbsUp size={16} />
                {currentRecipe.likes} 点赞
              </span>
            </div>
          </div>

          <div className="detail-header">
            <h1 className="detail-title">{currentRecipe.title}</h1>
            <p className="detail-description">{currentRecipe.description}</p>

            <div className="detail-meta">
              <div className="author-info">
                <img src={currentRecipe.author.avatar} alt={currentRecipe.author.name} className="author-avatar" />
                <span className="author-name">{currentRecipe.author.name}</span>
              </div>

              <div className="detail-actions">
                <button
                  className={`action-btn like-btn ${isLiking ? 'liked' : ''}`}
                  onClick={handleLike}
                >
                  <ThumbsUp size={18} />
                  <span>点赞</span>
                </button>
                <button
                  className={`action-btn fav-btn ${isFavorite ? 'active' : ''}`}
                  onClick={handleFavorite}
                >
                  <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                  <span>{isFavorite ? '已收藏' : '收藏'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="detail-sections">
            <section className="detail-section">
              <div className="section-heading">
                <ChefHat size={22} />
                <h2>食材清单</h2>
              </div>
              <div className="ingredients-groups">
                {(Object.keys(groupedIngredients) as IngredientCategory[]).map(category => {
                  const ings = groupedIngredients[category];
                  if (!ings || ings.length === 0) return null;
                  return (
                    <div key={category} className="ingredient-group">
                      <h3 className={`group-title ${category}`}>
                        {categoryLabels[category]}
                      </h3>
                      <ul className="ingredient-list">
                        {ings.map((ing, idx: number) => (
                          <li key={idx}>
                            <span className="ing-dot" />
                            <span className="ing-name">{ing.name}</span>
                            <span className="ing-amount">{ing.amount}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="detail-section">
              <div className="section-heading">
                <Clock size={22} />
                <h2>制作步骤</h2>
              </div>
              <ol className="steps-list">
                {currentRecipe.steps.map((step, idx) => (
                  <li key={idx} className="step-item">
                    <div className="step-number">{idx + 1}</div>
                    <p className="step-text">{step}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </article>

        {matchedRecipes.length > 0 && (
          <section className="matching-section">
            <div className="matching-header">
              <div className="matching-title-wrapper">
                <Sparkles size={22} className="sparkles-icon" />
                <h2 className="matching-title">智能搭配推荐</h2>
              </div>
              <p className="matching-subtitle">根据相似食材为你推荐</p>
            </div>
            <div className="matching-grid">
              {matchedRecipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  showMatchPercentage
                  lazy={index >= 4}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default RecipeDetailPage;
