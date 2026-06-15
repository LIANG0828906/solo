import React, { memo } from 'react';
import { Clock, Heart, ChefHat, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Recipe, SearchResult } from '@/types';
import { useRecipeStore, CURRENT_USER } from '@/modules/recipes/RecipeStore';
import { usePostStore } from '@/modules/community/PostStore';

interface BaseProps {
  recipe: Recipe;
  searchResult?: SearchResult;
  showProgress?: boolean;
  staggerDelay?: number;
  showAuthor?: boolean;
  onTogglePublic?: () => void;
}

const ProgressBar: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.round(score * 100);
  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-[11px] text-cocoa-200">
        <span>食材匹配度</span>
        <span className="font-medium text-warm-500">{pct}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-bar"
          style={{
            width: `${pct}%`,
          }}
        />
      </div>
    </div>
  );
};

const RecipeCardInner: React.FC<BaseProps> = ({
  recipe,
  searchResult,
  showProgress,
  staggerDelay = 0,
  showAuthor = true,
}) => {
  const navigate = useNavigate();
  const isFav = usePostStore((s) => s.isFavorite(recipe.id));
  const toggleFav = usePostStore((s) => s.toggleFavorite);
  const togglePublic = useRecipeStore((s) => s.togglePublic);
  const isMine = recipe.authorId === CURRENT_USER.id;

  const handleFavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFav(recipe.id);
  };

  const handlePublicClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePublic(recipe.id);
  };

  const matchInfo = searchResult;

  return (
    <div
      className="recipe-card stagger-item"
      style={{ animationDelay: `${staggerDelay}ms` }}
      onClick={() => navigate(`/recipe/${recipe.id}`)}
    >
      <div className="relative aspect-[4/3] bg-cream-100 overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23FFE2CC"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="%23FF8C42">🍽️</text></svg>';
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="absolute top-3 right-3 flex gap-1.5">
          {isMine && (
            <button
              onClick={handlePublicClick}
              title={recipe.isPublic ? '公开中' : '仅自己可见'}
              className="p-1.5 rounded-full bg-white/90 backdrop-blur text-cocoa-300 hover:text-warm-500 transition shadow-sm"
            >
              {recipe.isPublic ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          )}
          <button
            onClick={handleFavClick}
            className={`p-1.5 rounded-full backdrop-blur transition shadow-sm ${
              isFav
                ? 'bg-warm-400 text-white shadow-card'
                : 'bg-white/90 text-cocoa-200 hover:text-warm-400'
            }`}
          >
            <Heart size={14} fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 text-xs font-medium drop-shadow">
            <Clock size={12} />
            <span>{recipe.cookTime}分钟</span>
          </div>
          {recipe.favorites > 0 && (
            <div className="flex items-center gap-1 text-xs drop-shadow">
              <Heart size={12} fill="currentColor" />
              <span>{recipe.favorites}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-cocoa-400 line-clamp-1 leading-snug">
            {recipe.title}
          </h3>
          {showAuthor && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-cocoa-200">
              <ChefHat size={12} className="text-warm-400" />
              <span>{recipe.authorName}</span>
            </div>
          )}
        </div>

        {matchInfo && (
          <ProgressBar score={matchInfo.matchScore} />
        )}

        {matchInfo && matchInfo.matchedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {matchInfo.matchedIngredients.slice(0, 3).map((ing) => (
              <span
                key={ing}
                className="text-[10px] px-2 py-0.5 rounded-full bg-warm-50 text-warm-500 font-medium"
              >
                ✓ {ing}
              </span>
            ))}
            {matchInfo.missingIngredients.slice(0, 2).map((ing) => (
              <span
                key={ing}
                className="text-[10px] px-2 py-0.5 rounded-full bg-cream-100 text-cocoa-200"
              >
                {ing}
              </span>
            ))}
            {matchInfo.missingIngredients.length > 2 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream-100 text-cocoa-200">
              +{matchInfo.missingIngredients.length - 2}
            </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          {recipe.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full bg-cream-100 text-cocoa-300 font-medium border border-cream-200"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RecipeCard = memo(RecipeCardInner);
export default RecipeCard;
