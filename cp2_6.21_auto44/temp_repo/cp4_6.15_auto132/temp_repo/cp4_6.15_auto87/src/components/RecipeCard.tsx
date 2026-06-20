import { useNavigate } from 'react-router-dom';
import type { Recipe } from '../types';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: Recipe;
  compact?: boolean;
  index?: number;
}

function RecipeCard({ recipe, compact = false, index = 0 }: RecipeCardProps) {
  const navigate = useNavigate();

  const renderStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`fa-star ${i < difficulty ? 'fa-solid filled' : 'fa-regular'}`}
      ></i>
    ));
  };

  const handleClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <div
      className={`recipe-card ${compact ? 'compact' : ''}`}
      onClick={handleClick}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="card-image-wrapper">
        <img src={recipe.image} alt={recipe.name} className="card-image" loading="lazy" />
        <div className="card-overlay">
          <button className="view-detail-btn" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
            <i className="fa-solid fa-eye"></i>
            <span>查看详情</span>
          </button>
        </div>
      </div>
      <div className="card-content">
        <h3 className="card-title">{recipe.name}</h3>
        <div className="card-meta">
          <div className="card-time">
            <i className="fa-solid fa-clock"></i>
            <span>{recipe.time} 分钟</span>
          </div>
          <div className="card-difficulty">{renderStars(recipe.difficulty)}</div>
        </div>
        <div className="card-tags">
          {recipe.tags.slice(0, compact ? 2 : 3).map((tag) => (
            <span key={tag} className="card-tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecipeCard;
