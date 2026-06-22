import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Heart, Share2, Eye } from 'lucide-react';
import type { Recipe } from '@/types';
import MiniStarRating from './MiniStarRating';

interface RecipeCardProps {
  recipe: Recipe;
  isFavorited?: boolean;
  onToggleFavorite?: (recipeId: string) => void;
  onRate?: (recipeId: string, rating: number) => void;
  onQuickPreview?: (recipe: Recipe) => void;
}

const difficultyLabel = { easy: '简单', medium: '中等', hard: '困难' } as const;
const difficultyColor = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
} as const;

export default function RecipeCard({
  recipe,
  isFavorited = false,
  onToggleFavorite,
  onRate,
  onQuickPreview,
}: RecipeCardProps) {
  const navigate = useNavigate();
  const [showShareToast, setShowShareToast] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action]')) return;
    navigate(`/recipe/${recipe.id}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/recipe/${recipe.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 1500);
    } catch {}
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-warm-card rounded-2xl overflow-hidden shadow-sm border border-warm-border hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.thumbnail}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <span
          className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColor[recipe.difficulty]} shadow-sm`}
        >
          {difficultyLabel[recipe.difficulty]}
        </span>
        <button
          data-action="preview"
          onClick={(e) => {
            e.stopPropagation();
            onQuickPreview?.(recipe);
          }}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-warm-brown shadow-md transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 ${
            'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          <Eye size={16} />
        </button>
        <div
          className={`absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none transition-opacity duration-300 ${
            'opacity-0 group-hover:opacity-100'
          }`}
        />
      </div>

      <div className="p-4">
        <h3 className="font-serif text-lg text-warm-brown mb-1 truncate">{recipe.title}</h3>
        <p className="text-sm text-warm-brown-light line-clamp-2 mb-3 h-10">{recipe.description}</p>
        <div className="flex items-center justify-between text-xs text-warm-gray">
          <span className="flex items-center gap-1">
            <Clock size={14} /> {recipe.prepTime + recipe.cookTime}分钟
          </span>
          <div className="flex items-center gap-1.5">
            <MiniStarRating
              rating={recipe.avgRating}
              size={14}
              onRate={onRate ? (rating) => onRate(recipe.id, rating) : undefined}
            />
            <span className="font-medium text-warm-brown-light">{recipe.avgRating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 px-4 py-2.5 flex items-center justify-center gap-2 bg-warm-card/95 backdrop-blur-md border-t border-warm-border transition-all duration-300 ${
          'opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0'
        }`}
      >
        <button
          data-action="favorite"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(recipe.id);
          }}
          className="btn-ripple flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium active:scale-95 transition-all duration-150 hover:bg-cream-dark"
        >
          <Heart
            size={16}
            className={`transition-all duration-200 ${
              isFavorited ? 'fill-red-500 text-red-500 scale-110' : 'text-warm-brown-light'
            }`}
          />
          <span className="text-warm-brown">{isFavorited ? '已收藏' : '收藏'}</span>
        </button>
        <button
          data-action="share"
          onClick={handleShare}
          className="btn-ripple relative flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium text-warm-brown active:scale-95 transition-all duration-150 hover:bg-cream-dark"
        >
          <Share2 size={16} className="text-warm-brown-light" />
          <span>分享</span>
          {showShareToast && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-warm-brown text-white text-xs rounded whitespace-nowrap animate-crossfade-in">
              链接已复制
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
