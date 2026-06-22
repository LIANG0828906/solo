import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Recipe } from '@/api/recipes';
import { formatRelativeTime } from '@/utils/time';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const totalStars = 5;

  return (
    <div className="star-rating">
      {Array.from({ length: totalStars }).map((_, i) => {
        const isFull = i < fullStars;
        const isHalf = !isFull && i === fullStars && hasHalf;
        return (
          <span key={i} className={`star ${isFull ? 'full' : isHalf ? 'half' : 'empty'}`}>
            ★
          </span>
        );
      })}
    </div>
  );
};

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, index }) => {
  const navigate = useNavigate();
  const [clicked, setClicked] = React.useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => {
      navigate(`/recipe/${recipe.id}`);
    }, 200);
  };

  return (
    <div
      className={`recipe-card ${clicked ? 'card-clicked' : ''}`}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={handleClick}
    >
      <div className="card-overlay">
        <div className="card-actions">
          <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); }}>
            ❤
          </button>
          <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); }}>
            ➤
          </button>
        </div>
      </div>
      <div className="card-image-wrap">
        <img src={recipe.imageUrl} alt={recipe.name} className="card-image" loading="lazy" />
      </div>
      <div className="card-content">
        <h3 className="card-title">{recipe.name}</h3>
        <div className="card-author-row">
          <div className="author-avatar" style={{ backgroundColor: getAvatarColor(recipe.author) }}>
            {recipe.author.charAt(0)}
          </div>
          <span className="card-author">{recipe.author}</span>
        </div>
        <div className="card-footer">
          <StarRating rating={recipe.rating} />
          <span className="card-time">{formatRelativeTime(recipe.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

const avatarColors = ['#E8D5C4', '#D4A574', '#C9A86C', '#B8860B', '#CD853F', '#DEB887', '#D2B48C', '#BC8F8F'];

const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};
