import { useState, useEffect } from 'react';
import { Heart, Star, Clock, Users } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface RecipeTag {
  id: number;
  tag: string;
}

interface Recipe {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: string | null;
  user_id: number | null;
  created_at: string;
  tags?: RecipeTag[];
  avg_rating?: number;
  comment_count?: number;
  is_favorited?: boolean;
}

interface RecipeCardProps {
  recipe: Recipe;
  initialFavorited?: boolean;
  onFavoriteChange?: (recipeId: number, favorited: boolean) => void;
}

export default function RecipeCard({ recipe, initialFavorited = false, onFavoriteChange }: RecipeCardProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (isFavoriteLoading) return;

    setIsFavoriteLoading(true);
    const prevState = isFavorited;
    setIsFavorited(!prevState);

    try {
      const res = await fetch(`/api/recipes/${recipe.id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        setIsFavorited(prevState);
      } else {
        const data = await res.json();
        setIsFavorited(data.favorited);
        onFavoriteChange?.(recipe.id, data.favorited);
      }
    } catch {
      setIsFavorited(prevState);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const displayTags = recipe.tags?.slice(0, 3) || [];
  const extraTagCount = (recipe.tags?.length || 0) - 3;

  const rating = recipe.avg_rating || 0;
  const roundedRating = Math.round(rating);
  const hasRating = recipe.comment_count && recipe.comment_count > 0;

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-card cursor-pointer
                 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover
                 hover:shadow-glow-orange"
    >
      <div className="relative overflow-hidden aspect-[4/3] bg-cream-100">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 ease-out
                       group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cream-100 to-cream-200">
            <span className="text-terracotta-400 text-4xl">🍽️</span>
          </div>
        )}

        {!imageLoaded && recipe.image && (
          <div className="absolute inset-0 bg-gradient-to-br from-cream-100 to-cream-200 animate-pulse" />
        )}

        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={handleFavoriteClick}
            disabled={isFavoriteLoading}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center
                       shadow-md transition-all duration-200 hover:bg-white hover:scale-110
                       active:scale-95 disabled:opacity-70"
            aria-label={isFavorited ? '取消收藏' : '收藏'}
          >
            <Heart
              size={18}
              className={`transition-all duration-300 ${
                isFavorited
                  ? 'text-terracotta-500 fill-terracotta-500 scale-110'
                  : 'text-caramel-600 fill-transparent'
              }`}
            />
          </button>
        </div>

        <div className="absolute bottom-3 right-3 z-10">
          {hasRating ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-caramel-700">{roundedRating}</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 shadow-md">
              <span className="text-xs font-semibold text-white tracking-wide">新</span>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-caramel-700 mb-2 line-clamp-1 group-hover:text-terracotta-600 transition-colors">
          {recipe.title}
        </h3>

        <p className="text-sm text-caramel-600/70 line-clamp-2 mb-3 min-h-[2.5rem]">
          {recipe.description || '暂无描述'}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-3 min-h-[1.5rem]">
          {displayTags.map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-0.5 rounded-full text-xs font-medium
                         bg-terracotta-50 text-caramel-700 border border-terracotta-100
                         transition-colors group-hover:bg-terracotta-100"
            >
              {tag.tag}
            </span>
          ))}
          {extraTagCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium
                             bg-terracotta-50 text-caramel-600 border border-terracotta-100">
              +{extraTagCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-caramel-600/80 pt-3 border-t border-cream-200">
          {recipe.cook_time !== null && (
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-terracotta-400" />
              <span>{recipe.cook_time}分钟</span>
            </div>
          )}
          {recipe.servings !== null && (
            <div className="flex items-center gap-1">
              <Users size={14} className="text-terracotta-400" />
              <span>{recipe.servings}人份</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
