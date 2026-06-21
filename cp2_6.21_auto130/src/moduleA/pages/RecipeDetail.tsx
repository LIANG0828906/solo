import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Star,
  ChefHat,
  User,
  Send,
  Plus,
  ShoppingCart,
  MessageSquare,
} from 'lucide-react';
import { useRecipesStore } from '@/stores/recipesStore';
import { useAppStore } from '@/state/appStore';
import StarRating from '@/components/StarRating';
import RoundCheckbox from '@/components/RoundCheckbox';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/stores/types';

const GRADIENT_CLASSES = [
  'recipe-gradient-1',
  'recipe-gradient-2',
  'recipe-gradient-3',
  'recipe-gradient-4',
  'recipe-gradient-5',
] as const;

export default function RecipeDetail() {
  const { id, inviteCode = 'demo' } = useParams<{ id: string; inviteCode: string }>();
  const navigate = useNavigate();
  const { selectedRecipe, loading, fetchRecipeById, addComment } = useRecipesStore();
  const currentUser = useAppStore((s) => s.currentUser);
  const addToMealPlan = useAppStore((s) => s.addRecipeToNextAvailableSlot);

  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState('');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) fetchRecipeById(id);
  }, [id, fetchRecipeById]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id || !currentUser) return;
    const result = await addComment(id, currentUser.id, newRating as 1 | 2 | 3 | 4 | 5, newComment.trim());
    if (result) {
      setNewComment('');
      setNewRating(5);
    }
  };

  const handleAddToMealPlan = (recipe: Recipe) => {
    addToMealPlan(recipe.id);
  };

  const toggleIngredient = (ingId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(ingId)) next.delete(ingId);
      else next.add(ingId);
      return next;
    });
  };

  const gradientIdx = id ? (Number(id.replace(/\D/g, '').slice(-1)) || 1) % 5 : 0;
  const gradientClass = GRADIENT_CLASSES[gradientIdx] ?? GRADIENT_CLASSES[0];

  if (loading && !selectedRecipe) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-16">
        <LoadingSpinner size="lg" label="正在加载食谱详情..." />
      </div>
    );
  }

  if (!selectedRecipe) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <div className="card p-12">
          <ChefHat className="mx-auto mb-4 h-12 w-12 text-primary/50" />
          <h2 className="title-display mb-2 text-xl text-gray-700">未找到该食谱</h2>
          <p className="mb-6 text-gray-500">食谱可能已被删除或不存在</p>
          <Link
            to={`/room/${inviteCode}/recipes`}
            className="btn-primary inline-flex"
          >
            <ArrowLeft className="h-4 w-4" />
            返回食谱列表
          </Link>
        </div>
      </div>
    );
  }

  const recipe = selectedRecipe;
  const difficultyLabel = ['简单', '中等', '困难'][recipe.difficulty - 1];
  const difficultyStars = Array.from({ length: 3 }, (_, i) => i < recipe.difficulty);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card overflow-hidden">
            <div
              className={cn(
                'relative aspect-[16/9] w-full overflow-hidden',
                !recipe.heroImage && !recipe.thumbnail && gradientClass
              )}
            >
              {recipe.heroImage || recipe.thumbnail ? (
                <img
                  src={recipe.heroImage ?? recipe.thumbnail}
                  alt={recipe.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/30 backdrop-blur-sm shadow-inner">
                      <span className="font-display text-4xl text-white drop-shadow-sm">
                        {recipe.name.slice(0, 1)}
                      </span>
                    </div>
                    <h1 className="font-display text-3xl text-white drop-shadow-sm sm:text-4xl">
                      {recipe.name}
                    </h1>
                  </div>
                </div>
              )}

              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="chip bg-white/95 text-primary-dark backdrop-blur-sm">
                  <Clock className="h-3.5 w-3.5" />
                  {recipe.cookTimeMinutes} 分钟
                </span>
                <span className="chip bg-white/95 text-amber-700 backdrop-blur-sm">
                  <span className="flex items-center gap-0.5">
                    {difficultyStars.map((filled, idx) => (
                      <Star
                        key={idx}
                        className={cn(
                          'h-3.5 w-3.5',
                          filled ? 'fill-amber-500 text-amber-500' : 'text-amber-200'
                        )}
                      />
                    ))}
                  </span>
                  {difficultyLabel}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="title-display mb-3 text-2xl text-gray-800 sm:text-3xl">
                    {recipe.name}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-primary">
                      {recipe.author?.avatarUrl ? (
                        <img
                          src={recipe.author.avatarUrl}
                          alt={recipe.author.nickname}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="font-medium text-gray-600">
                      {recipe.author?.nickname ?? '佚名厨师'}
                    </span>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-semibold text-gray-700">
                        {recipe.avgRating.toFixed(1)}
                      </span>
                      <span className="text-gray-400">({recipe.reviewCount} 条评价)</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddToMealPlan(recipe)}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4" />
                    加入本周菜单
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  食材清单
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {recipe.ingredients.map((ing) => (
                    <div
                      key={ing.id}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 transition-all',
                        checkedIngredients.has(ing.id) && 'bg-primary/5 border-primary/30'
                      )}
                    >
                      <RoundCheckbox
                        checked={checkedIngredients.has(ing.id)}
                        onChange={() => toggleIngredient(ing.id)}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'font-medium truncate',
                            checkedIngredients.has(ing.id) && 'text-gray-400 line-through'
                          )}
                        >
                          {ing.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {ing.quantity} {ing.unit}
                          {ing.estimatedPrice && ` · 约¥${ing.estimatedPrice.toFixed(0)}`}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'chip shrink-0',
                          ing.category === 'vegetable' && 'bg-vegetable/20 text-green-700',
                          ing.category === 'meat' && 'bg-meat/25 text-rose-700',
                          ing.category === 'seafood' && 'bg-seafood/25 text-sky-700',
                          ing.category === 'dairy' && 'bg-dairy/30 text-violet-700',
                          ing.category === 'grain' && 'bg-grain/35 text-amber-700',
                          ing.category === 'spice' && 'bg-spice/35 text-yellow-700',
                          ing.category === 'other' && 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {ing.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <ChefHat className="h-4 w-4" />
                  </div>
                  烹饪步骤
                </h2>
                <div className="space-y-4">
                  {recipe.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 p-5 transition hover:border-primary/20"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-white shadow-sm shadow-primary/20">
                        <span className="font-display text-lg">{idx + 1}</span>
                      </div>
                      <p className="pt-1 text-[15px] leading-relaxed text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <MessageSquare className="h-4 w-4" />
                </div>
                食客评价
                <span className="ml-1 text-sm font-normal text-gray-400">
                  ({recipe.comments.length})
                </span>
              </h2>
            </div>

            <form onSubmit={handleAddComment} className="mb-8 rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">我的评分：</span>
                  <StarRating value={newRating} onChange={setNewRating} size="md" />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="分享你的烹饪心得或对这道菜的看法..."
                  className="input-base flex-1"
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || !currentUser}
                  className="btn-primary shrink-0"
                >
                  <Send className="h-4 w-4" />
                  发布评论
                </button>
              </div>
            </form>

            {recipe.comments.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="text-gray-400">还没有评论，快来抢沙发吧~</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recipe.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="animate-fade-in rounded-2xl border border-gray-100 bg-white/80 p-5"
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-primary">
                        {comment.user?.avatarUrl ? (
                          <img
                            src={comment.user.avatarUrl}
                            alt={comment.user.nickname}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {comment.user?.nickname ?? '匿名用户'}
                          </span>
                          <StarRating value={comment.rating} size="sm" readOnly />
                          <span className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="pl-12 text-[15px] leading-relaxed text-gray-600">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
          <div className="card overflow-hidden">
            <div className={cn('h-2 w-full', gradientClass)} />
            <div className="p-6">
              <h3 className="mb-4 title-display text-lg text-gray-800">快捷操作</h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => handleAddToMealPlan(recipe)}
                  className="btn-primary w-full"
                >
                  <Plus className="h-4 w-4" />
                  加入菜单规划
                </button>
                <Link
                  to={`/room/${inviteCode}/meal-planner`}
                  className="btn-ghost w-full"
                >
                  查看本周菜单
                </Link>
                <Link
                  to={`/room/${inviteCode}/shopping-list`}
                  className="btn-ghost w-full"
                >
                  <ShoppingCart className="h-4 w-4" />
                  生成采购清单
                </Link>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 title-display text-lg text-gray-800">小贴士</h3>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                食材可勾选，方便去超市对照采购
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                加入菜单后会自动汇总到采购清单
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                房间内其他成员可实时看到你的操作
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
