import { Link } from 'react-router-dom';
import { Clock, Users, ChefHat } from 'lucide-react';
import type { Recipe } from '../types';
import FavoriteButton from './FavoriteButton';
import StarRating from './StarRating';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const difficultyText = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  const difficultyColor = {
    easy: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    hard: 'text-red-600 bg-red-50',
  };

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card group">
      <div className="relative">
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          className="recipe-card-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(recipe.title)}&image_size=square`;
          }}
        />
        <div className="absolute top-3 right-3">
          <FavoriteButton recipeId={recipe.id} />
        </div>
        {recipe.difficulty && (
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${difficultyColor[recipe.difficulty]}`}>
            {difficultyText[recipe.difficulty]}
          </div>
        )}
      </div>
      <div className="recipe-card-content">
        <h3 className="recipe-card-title group-hover:text-[var(--primary)] transition-colors">
          {recipe.title}
        </h3>
        <p className="recipe-card-description">
          {recipe.description}
        </p>
        <div className="flex items-center justify-between mb-3">
          <StarRating rating={recipe.rating} readonly />
          <span className="text-xs text-[var(--text-secondary)]">
            ({recipe.ratingCount || 0})
          </span>
        </div>
        <div className="recipe-card-footer">
          <div className="recipe-card-meta">
            <Clock className="w-4 h-4" />
            <span>{recipe.cookingTime}分钟</span>
          </div>
          <div className="recipe-card-meta">
            <Users className="w-4 h-4" />
            <span>{recipe.servings}人份</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[var(--border)]">
          <ChefHat className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-sm text-[var(--text-secondary)] truncate">
            {recipe.authorName}
          </span>
        </div>
      </div>
    </Link>
  );
}
