import { useState, useEffect, useCallback } from 'react';
import { Heart, Star, Clock, Users, AlertCircle } from 'lucide-react';
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
}

interface RecipeCardProps {
  recipe: Recipe;
  onFavoriteChange?: (recipeId: number, favorited: boolean) => void;
}

type ToastType = 'success' | 'error' | 'info';
interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export default function RecipeCard({ recipe, onFavoriteChange }: RecipeCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [favoriteStatusLoading, setFavoriteStatusLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });

  const { token, user } = useAuthStore();
  const navigate = useNavigate();

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2500);
  }, []);

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!user || !token) {
        setFavoriteStatusLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/recipes/${recipe.id}/favorite/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setIsFavorited(data.favorited);
        }
      } catch {
        // 静默处理收藏状态查询失败
      } finally {
        setFavoriteStatusLoading(false);
      }
    };

    fetchFavoriteStatus();
  }, [recipe.id, user, token]);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const res = await fetch(`/api/recipes/${recipe.id}/rating`);
        if (res.ok) {
          const data = await res.json();
          setRating(data.avg_rating);
          setRatingCount(data.rating_count);
        }
      } catch {
        // 静默处理评分查询失败，fallback 到 recipe 自带的
        if (recipe.avg_rating !== undefined) {
          setRating(recipe.avg_rating);
          setRatingCount(recipe.comment_count || 0);
        }
      } finally {
        setRatingLoading(false);
      }
    };

    fetchRating();
  }, [recipe.id, recipe.avg_rating, recipe.comment_count]);

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
      const method = !prevState ? 'POST' : 'DELETE';
      const res = await fetch(`/api/recipes/${recipe.id}/favorite`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        setIsFavorited(prevState);
        const errorText = !prevState ? '收藏失败，请稍后重试' : '取消收藏失败，请稍后重试';
        showToast(errorText, 'error');
        return;
      }

      const data = await res.json();
      setIsFavorited(data.favorited);
      onFavoriteChange?.(recipe.id, data.favorited);
      const successText = data.favorited ? '已添加到收藏' : '已取消收藏';
      showToast(successText, 'success');
    } catch {
      setIsFavorited(prevState);
      const errorText = !prevState ? '收藏失败，网络连接异常' : '取消收藏失败，网络连接异常';
      showToast(errorText, 'error');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  const allTags = recipe.tags || [];
  const displayTags = allTags.slice(0, 3);
  const extraTagCount = Math.max(0, allTags.length - 3);

  const hasValidRating =
    rating !== null &&
    rating !== undefined &&
    !isNaN(rating) &&
    rating > 0 &&
    ratingCount > 0;
  const roundedRating = hasValidRating ? Math.round(rating!) : 0;

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
                       active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            aria-label={isFavorited ? '取消收藏' : '收藏'}
          >
            {favoriteStatusLoading && isFavoriteLoading === false && !user ? (
              <Heart size={18} className="text-caramel-600 fill-transparent animate-pulse" />
            ) : (
              <Heart
                size={18}
                className={`transition-all duration-300 ${
                  isFavoriteLoading
                    ? 'text-terracotta-300 scale-90'
                    : isFavorited
                    ? 'text-terracotta-500 fill-terracotta-500 scale-110'
                    : 'text-caramel-600 fill-transparent group-hover:text-terracotta-400'
                }`}
              />
            )}
          </button>
        </div>

        <div className="absolute bottom-3 right-3 z-10">
          {ratingLoading ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 backdrop-blur-sm shadow-md animate-pulse">
              <Star size={14} className="text-caramel-300" />
              <span className="w-3 h-4 bg-caramel-200 rounded" />
            </div>
          ) : hasValidRating ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-caramel-700 tabular-nums">
                {roundedRating}
              </span>
              {ratingCount > 0 && (
                <span className="text-xs text-caramel-500 ml-0.5">({ratingCount})</span>
              )}
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
              className="px-2.5 py-0.5 rounded-full text-xs font-medium
                         bg-terracotta-50 text-caramel-700 border border-terracotta-100
                         transition-colors group-hover:bg-terracotta-100"
            >
              {tag.tag}
            </span>
          ))}
          {extraTagCount > 0 && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold
                         bg-terracotta-100 text-terracotta-700 border border-terracotta-200
                         transition-colors group-hover:bg-terracotta-200"
              title={`还有 ${extraTagCount} 个标签`}
            >
              +{extraTagCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-caramel-600/80 pt-3 border-t border-cream-200">
          {recipe.cook_time !== null && recipe.cook_time !== undefined && (
            <div className="flex items-center gap-1">
              <Clock size={14} className="text-terracotta-400" />
              <span>{recipe.cook_time}分钟</span>
            </div>
          )}
          {recipe.servings !== null && recipe.servings !== undefined && (
            <div className="flex items-center gap-1">
              <Users size={14} className="text-terracotta-400" />
              <span>{recipe.servings}人份</span>
            </div>
          )}
        </div>
      </div>

      {toast.visible && (
        <div
          className={`absolute top-12 left-1/2 -translate-x-1/2 z-20
                      px-3 py-2 rounded-xl shadow-lg text-sm font-medium
                      flex items-center gap-1.5 whitespace-nowrap
                      animate-toast-in
                      ${
                        toast.type === 'success'
                          ? 'bg-emerald-500 text-white'
                          : toast.type === 'error'
                          ? 'bg-red-500 text-white'
                          : 'bg-caramel-600 text-white'
                      }`}
        >
          {toast.type === 'error' && <AlertCircle size={14} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translate(-50%, -8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-toast-in {
          animation: toast-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
