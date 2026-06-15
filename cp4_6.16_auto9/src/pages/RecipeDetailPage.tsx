import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Heart,
  ChefHat,
  Share2,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRecipeStore, CURRENT_USER } from '@/modules/recipes/RecipeStore';
import { usePostStore } from '@/modules/community/PostStore';
import CommentWidget from '@/modules/community/CommentWidget';

const RecipeDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const init = useRecipeStore((s) => s.init);
  const getRecipeById = useRecipeStore((s) => s.getRecipeById);
  const removeRecipe = useRecipeStore((s) => s.removeRecipe);
  const togglePublic = useRecipeStore((s) => s.togglePublic);
  const isFav = usePostStore((s) => s.isFavorite(id));
  const toggleFav = usePostStore((s) => s.toggleFavorite);
  const initPost = usePostStore((s) => s.init);

  const recipe = getRecipeById(id);
  const isMine = recipe?.authorId === CURRENT_USER.id;
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    init();
    initPost();
  }, [init, initPost]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!recipe) {
    return (
      <div className="container py-20 text-center max-w-lg">
        <div className="text-6xl mb-4 opacity-50">🍽️</div>
        <h2 className="font-serif text-2xl font-bold text-cocoa-400 mb-2">菜谱找不到了</h2>
        <p className="text-cocoa-200 mb-6">这道菜谱可能已被删除，换一道看看吧~</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          <ArrowLeft size={16} />
          返回首页
        </button>
      </div>
    );
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast('链接已复制到剪贴板！');
    } catch {
      setToast('分享失败，手动复制链接吧~');
    }
  };

  return (
    <div className="pb-16">
      <div className="container max-w-4xl py-4">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost !px-2 !py-2 -ml-2"
        >
          <ArrowLeft size={18} />
          <span>返回</span>
        </button>
      </div>

      <div
        className="container max-w-4xl"
        style={{ animation: 'fadeInUp 400ms ease' }}
      >
        <div className="relative aspect-[16/9] sm:aspect-[2/1] rounded-card overflow-hidden shadow-card mb-6">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><rect width="800" height="400" fill="%23FFE2CC"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="80" fill="%23FF8C42">🍽️</text></svg>';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 text-white">
            <div className="flex flex-wrap gap-2 mb-3">
              {recipe.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/20 backdrop-blur border border-white/20"
                >
                  #{t}
                </span>
              ))}
              {!recipe.isPublic && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-cocoa-400/80 backdrop-blur">
                  仅自己可见
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 drop-shadow-sm">
              {recipe.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <ChefHat size={15} />
                <span>{recipe.authorName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={15} />
                <span>{recipe.cookTime} 分钟</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart size={15} fill="currentColor" />
                <span>{recipe.favorites} 收藏</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => {
              toggleFav(recipe.id);
              setToast(isFav ? '已取消收藏' : '收藏成功！');
            }}
            className={`btn-primary ${
              isFav ? '' : '!bg-gradient-to-r !from-warm-50 !to-cream-100 !text-warm-500 !border !border-warm-200 !shadow-none'
            }`}
          >
            <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
            {isFav ? '已收藏' : '收藏菜谱'}
          </button>
          <button onClick={share} className="btn-secondary">
            <Share2 size={16} />
            分享链接
          </button>
          {isMine && (
            <>
              <button
                onClick={() => navigate(`/create?edit=${recipe.id}`)}
                className="btn-secondary"
              >
                <Pencil size={16} />
                编辑
              </button>
              <button
                onClick={() => togglePublic(recipe.id)}
                className="btn-secondary"
              >
                {recipe.isPublic ? <EyeOff size={16} /> : <Eye size={16} />}
                {recipe.isPublic ? '设为私有' : '公开分享'}
              </button>
              <button
                onClick={async () => {
                  if (confirm('确定要删除这道菜谱吗？此操作不可恢复。')) {
                    await removeRecipe(recipe.id);
                    navigate('/');
                  }
                }}
                className="btn-secondary !text-red-500 !hover:bg-red-50 !border-red-100"
              >
                <Trash2 size={16} />
                删除
              </button>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-card shadow-card p-5 border border-cream-200">
              <h2 className="font-serif text-xl font-bold text-cocoa-400 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-warm-50 flex items-center justify-center text-lg">
                  🥗
                </span>
                原料清单
                <span className="text-xs font-sans text-cocoa-200 ml-auto font-normal">
                  {recipe.ingredients.length} 种
                </span>
              </h2>
              <ul className="space-y-2.5">
                {recipe.ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 py-2 border-b border-cream-100 last:border-0"
                    style={{ animation: 'fadeInUp 300ms ease', animationDelay: `${i * 30}ms`, opacity: 0, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-warm-50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={12} className="text-warm-400" />
                      </div>
                      <span className="text-sm text-cocoa-400 font-medium truncate">
                        {ing.name}
                      </span>
                    </div>
                    <span className="text-xs text-cocoa-200 font-medium bg-cream-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {ing.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-card shadow-card p-5 md:p-6 border border-cream-200">
              <h2 className="font-serif text-xl font-bold text-cocoa-400 mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-warm-50 flex items-center justify-center text-lg">
                  👨‍🍳
                </span>
                烹饪步骤
                <span className="text-xs font-sans text-cocoa-200 ml-auto font-normal">
                  {recipe.steps.length} 步
                </span>
              </h2>
              <ol className="space-y-4">
                {recipe.steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-4"
                    style={{ animation: 'fadeInUp 300ms ease', animationDelay: `${i * 60}ms`, opacity: 0, animationFillMode: 'forwards' }}
                  >
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-warm-300 to-warm-500 text-white font-bold text-sm flex items-center justify-center shadow-card">
                        {i + 1}
                      </div>
                      {i < recipe.steps.length - 1 && (
                        <div className="flex-1 w-px bg-cream-200 mt-1.5" />
                      )}
                    </div>
                    <p className="flex-1 text-sm md:text-base text-cocoa-300 leading-relaxed pt-1.5 pb-2">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t-2 border-cream-200">
          <CommentWidget recipeId={recipe.id} />
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-cocoa-400 text-white text-sm shadow-card-hover"
          style={{ animation: 'fadeInUp 200ms ease' }}
        >
          {toast}
        </div>
      )}
    </div>
  );
};

export default RecipeDetailPage;
