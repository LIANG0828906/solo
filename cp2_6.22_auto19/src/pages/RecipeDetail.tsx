import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Clock, ChefHat, ArrowLeft, Share2, Check, X, User } from 'lucide-react';
import { RecipeDetail as RecipeDetailType, Recipe } from '@/types';
import { StarRating } from '@/components/StarRating';
import { CommentSection } from '@/components/CommentSection';
import { RecipeCard } from '@/RecipeCard';
import { api } from '@/utils/api';
import { useAuthStore } from '@/store/useAuthStore';

export const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [recipe, setRecipe] = useState<RecipeDetailType | null>(null);
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    loadRecipe(parseInt(id));
    loadRelated(parseInt(id));
    if (isAuthenticated) {
      checkFavorite(parseInt(id));
    }
  }, [id, isAuthenticated]);

  const loadRecipe = async (recipeId: number) => {
    try {
      const data = await api.recipes.getById(recipeId);
      setRecipe(data);
      setRating(data.rating);
      setRatingCount(data.ratingCount);
      setFavoriteCount(data.favoriteCount);
    } catch (err) {
      console.error('加载食谱失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRelated = async (recipeId: number) => {
    try {
      const res = await api.recipes.getRelated(recipeId);
      setRelatedRecipes(res.recipes);
    } catch (err) {
      console.error('加载相关食谱失败:', err);
    }
  };

  const checkFavorite = async (recipeId: number) => {
    try {
      const res = await api.recipes.isFavorited(recipeId);
      setIsFavorited(res.isFavorited);
    } catch (err) {
      console.error('检查收藏状态失败:', err);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated || !id) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.recipes.toggleFavorite(parseInt(id));
      setIsFavorited(res.isFavorited);
      setFavoriteCount(res.favoriteCount);
    } catch (err) {
      console.error('收藏失败:', err);
    }
  };

  const handleRate = async (newRating: number) => {
    if (!isAuthenticated || !id) {
      navigate('/login');
      return;
    }
    try {
      setUserRating(newRating);
      const res = await api.recipes.rate(parseInt(id), newRating);
      setRating(res.newRating);
      setRatingCount(res.ratingCount);
    } catch (err) {
      console.error('评分失败:', err);
    }
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="aspect-video bg-stone-200 rounded-2xl mb-8" />
            <div className="h-10 bg-stone-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-stone-100 rounded w-full mb-2" />
            <div className="h-4 bg-stone-100 rounded w-2/3 mb-8" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-32 bg-stone-100 rounded-xl" />
              <div className="h-32 bg-stone-100 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50">
        <div className="text-center">
          <p className="text-xl text-stone-500 mb-4">食谱不存在或已被删除</p>
          <button
            onClick={() => navigate('/')}
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-500 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        <div className="relative rounded-3xl overflow-hidden mb-8 shadow-xl">
          <img
            src={recipe.coverImage}
            alt={recipe.title}
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              {recipe.title}
            </h1>
            <p className="text-white/80 text-lg mb-4">{recipe.description}</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {recipe.authorAvatar ? (
                  <img
                    src={recipe.authorAvatar}
                    alt={recipe.authorName}
                    className="w-10 h-10 rounded-full border-2 border-white/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="font-medium">{recipe.authorName}</span>
              </div>
              <div className="h-6 w-px bg-white/30" />
              <StarRating rating={rating} ratingCount={ratingCount} size="sm" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[200px] bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <StarRating rating={userRating || rating} size="sm" />
              </div>
              <div>
                <p className="text-sm text-stone-500">综合评分</p>
                <p className="text-xl font-bold text-stone-800">{rating.toFixed(1)}</p>
              </div>
            </div>
            <StarRating
              rating={userRating || rating}
              interactive
              onRate={handleRate}
              size="lg"
            />
          </div>

          <button
            onClick={handleFavorite}
            className={`flex-1 min-w-[200px] flex items-center justify-center gap-3 rounded-2xl shadow-md p-5 transition-all ${isFavorited ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : 'bg-white text-stone-700 hover:bg-orange-50'}`}
          >
            <Heart className={`w-6 h-6 ${isFavorited ? 'fill-white' : ''}`} />
            <div className="text-left">
              <p className="text-sm opacity-80">{isFavorited ? '已收藏' : '收藏食谱'}</p>
              <p className="text-xl font-bold">{favoriteCount} 人收藏</p>
            </div>
          </button>

          <button className="flex items-center justify-center gap-2 px-6 bg-white rounded-2xl shadow-md text-stone-600 hover:bg-orange-50 hover:text-orange-600 transition-all">
            <Share2 className="w-5 h-5" />
            <span className="hidden sm:inline">分享</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                配料清单
              </h2>
              <span className="ml-auto text-sm text-stone-500">
                {checkedIngredients.size}/{recipe.ingredients.length}
              </span>
            </div>
            <ul className="space-y-3">
              {recipe.ingredients.map((ing, idx) => (
                <li
                  key={idx}
                  onClick={() => toggleIngredient(idx)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${checkedIngredients.has(idx) ? 'bg-green-50' : 'bg-stone-50 hover:bg-orange-50'}`}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checkedIngredients.has(idx) ? 'bg-green-500 border-green-500' : 'border-stone-300'}`}>
                    {checkedIngredients.has(idx) && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`flex-1 ${checkedIngredients.has(idx) ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                    {ing.name}
                  </span>
                  <span className="text-stone-500 text-sm">{ing.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                  烹饪步骤
                </h2>
                <p className="text-sm text-stone-500">共 {recipe.steps.length} 步</p>
              </div>
            </div>
            <ol className="space-y-4">
              {recipe.steps.map((step, idx) => (
                <li key={idx} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {step.order}
                  </div>
                  <p className="text-stone-600 leading-relaxed pt-1">{step.content}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {id && <CommentSection recipeId={parseInt(id)} />}

        {relatedRecipes.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-stone-800 mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              相关推荐
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedRecipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
