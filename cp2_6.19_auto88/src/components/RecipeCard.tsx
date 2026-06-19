import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, ChefHat, Heart } from 'lucide-react';
import type { Recipe } from '../types';
import FavoriteButton from './FavoriteButton';
import StarRating from './StarRating';
import { recipeManager } from '../module1/recipeManager';
import { useUiController } from '../module3/uiController';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const { currentUser } = useUiController();

  const difficultyText = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  useEffect(() => {
    if (currentUser) {
      recipeManager.isFavorited(currentUser.id, recipe.id).then(setIsFavorited);
    }
    recipeManager.getFavoriteCount(recipe.id).then(setFavoriteCount);
  }, [currentUser, recipe.id]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card group">
      <div className="relative">
        {!imageLoaded && (
          <div
            className="recipe-card-image flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, var(--primary)22, var(--secondary)22)`,
            }}
          >
            <ChefHat className="w-12 h-12 text-[var(--primary)] opacity-50" />
          </div>
        )}
        {!imageError && (
          <img
            src={recipe.coverImage || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(recipe.title)}&image_size=square`}
            alt={recipe.title}
            className={`recipe-card-image ${imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'} transition-opacity duration-300`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
          />
        )}
        {imageError && (
          <div
            className="recipe-card-image flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, var(--primary)33, var(--secondary)33)`,
            }}
          >
            <ChefHat className="w-12 h-12 text-[var(--primary)]" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <FavoriteButton recipeId={recipe.id} />
        </div>
        {isFavorited && (
          <div className="absolute top-3 left-3">
            <Heart className="w-5 h-5 text-red-500" fill="#EF4444" />
          </div>
        )}
        {recipe.difficulty && (
          <div
            className={`absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
              recipe.difficulty === 'easy'
                ? 'text-green-600 bg-green-50'
                : recipe.difficulty === 'medium'
                ? 'text-yellow-600 bg-yellow-50'
                : 'text-red-600 bg-red-50'
            }`}
          >
            {difficultyText[recipe.difficulty]}
          </div>
        )}
        {favoriteCount > 0 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 rounded-full text-xs">
            <Heart className="w-3 h-3 text-red-500" fill="#EF4444" />
            <span>{favoriteCount}</span>
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
