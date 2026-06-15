import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useRecipeStore from '../store/recipeStore';
import type { Recipe } from '../types';
import RecipeCard from './RecipeCard';
import './RecipeDetail.css';

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const { fetchRecipeById, fetchRecommendations, recommendations, loading } = useRecipeStore();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      setRecipe(null);
      const data = await fetchRecipeById(id);
      setRecipe(data);
      await fetchRecommendations(id);
      setAnimKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    loadData();
  }, [id, fetchRecipeById, fetchRecommendations]);

  const renderStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i key={i} className={`fa-star ${i < difficulty ? 'fa-solid filled' : 'fa-regular'}`}></i>
    ));
  };

  if (!recipe && loading) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner">
          <i className="fa-solid fa-spinner fa-spin"></i>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="detail-not-found">
        <i className="fa-solid fa-circle-exclamation"></i>
        <p>未找到该食谱</p>
        <Link to="/" className="back-home">
          <i className="fa-solid fa-arrow-left"></i>
          返回列表
        </Link>
      </div>
    );
  }

  return (
    <div className="recipe-detail" key={animKey}>
      <Link to="/" className="back-btn">
        <i className="fa-solid fa-arrow-left"></i>
        返回列表
      </Link>

      <div className="detail-hero">
        <div className="detail-image-wrapper">
          <img src={recipe.image} alt={recipe.name} className="detail-image" />
          <div className="detail-image-overlay"></div>
        </div>
        <div className="detail-header-info">
          <div className="detail-tags">
            {recipe.tags.map((tag) => (
              <span key={tag} className="detail-tag">{tag}</span>
            ))}
          </div>
          <h1 className="detail-title">{recipe.name}</h1>
          <div className="detail-meta">
            <div className="detail-meta-item">
              <i className="fa-solid fa-clock"></i>
              <span>{recipe.time} 分钟</span>
            </div>
            <div className="detail-meta-item">
              <i className="fa-solid fa-gauge-high"></i>
              <span>难度</span>
              <div className="detail-stars">{renderStars(recipe.difficulty)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-section ingredients-section">
          <h2 className="section-title">
            <i className="fa-solid fa-carrot"></i>
            食材清单
          </h2>
          <div className="ingredients-grid">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={ingredient} className="ingredient-item" style={{ animationDelay: `${index * 0.05}s` }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>{ingredient}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section steps-section">
          <h2 className="section-title">
            <i className="fa-solid fa-list-ol"></i>
            烹饪步骤
          </h2>
          <ol className="steps-list">
            {recipe.steps.map((step, index) => (
              <li key={index} className="step-item" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="step-number">{index + 1}</div>
                <p className="step-text">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="detail-section comments-section">
          <h2 className="section-title">
            <i className="fa-solid fa-comments"></i>
            用户评论 ({recipe.comments.length})
          </h2>
          <div className="comments-list">
            {recipe.comments.map((comment, index) => (
              <div key={comment.id} className="comment-item" style={{ animationDelay: `${index * 0.08}s` }}>
                <div className="comment-avatar">
                  <i className="fa-solid fa-user"></i>
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-user">{comment.user}</span>
                    <span className="comment-date">{comment.date}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="recommendations-section">
        <h2 className="section-title">
          <i className="fa-solid fa-lightbulb"></i>
          智能推荐
        </h2>
        <p className="recommendations-subtitle">基于当前食谱的食材和口味，为你推荐以下相似食谱</p>
        {recommendations.length > 0 ? (
          <div className="recommendations-grid" key={`rec-${animKey}`}>
            {recommendations.map((rec, index) => (
              <div key={rec.id} className="recommendation-item" style={{ animationDelay: `${index * 0.12}s` }}>
                <RecipeCard recipe={rec} compact={true} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="no-recommendations">
            <i className="fa-solid fa-search"></i>
            <p>暂无相关推荐</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipeDetail;
