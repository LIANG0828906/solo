import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, UserPlus, X, History } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import useRecipeStore from '@/store/recipeStore';
import { recipeApi, nutritionApi } from '@/services/api';
import socketService from '@/services/socket';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import ImageCarousel from '@/components/ImageCarousel';
import IngredientItem from '@/components/IngredientItem';
import StepItem from '@/components/StepItem';
import NutritionRadar from '@/components/NutritionRadar';
import StarRating from '@/components/StarRating';
import type { Recipe, ReplacementSuggestion } from '@/types';

const mockRecipe: Recipe = {
  id: '1',
  title: '宫保鸡丁',
  description: '经典川菜，花生与鸡丁的完美搭配，麻辣鲜香，回味无穷',
  thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Kung%20Pao%20Chicken%20dish%20on%20white%20plate%20food%20photography&image_size=square',
  images: [
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Kung%20Pao%20Chicken%20dish%20on%20white%20plate%20food%20photography&image_size=landscape_16_9',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Kung%20Pao%20Chicken%20cooking%20wok%20fire%20food%20photography&image_size=landscape_16_9',
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Kung%20Pao%20Chicken%20ingredients%20chili%20peanuts%20food%20photography&image_size=landscape_16_9',
  ],
  prepTime: 15,
  cookTime: 20,
  difficulty: 'medium',
  ingredients: [
    { id: 'i1', name: '鸡胸肉', amount: 300, unit: 'g', order: 0 },
    { id: 'i2', name: '花生米', amount: 50, unit: 'g', order: 1 },
    { id: 'i3', name: '干辣椒', amount: 8, unit: '个', order: 2 },
    { id: 'i4', name: '花椒', amount: 5, unit: 'g', order: 3 },
    { id: 'i5', name: '葱姜蒜', amount: 30, unit: 'g', order: 4 },
    { id: 'i6', name: '酱油', amount: 2, unit: '汤匙', order: 5 },
    { id: 'i7', name: '淀粉', amount: 1, unit: '汤匙', order: 6 },
  ],
  steps: [
    { id: 's1', title: '处理鸡肉', content: '鸡胸肉切丁，加入料酒、盐、淀粉腌制15分钟', images: [], timerSeconds: 900, order: 0 },
    { id: 's2', title: '炒花生', content: '小火炒花生米至金黄捞出备用', images: [], timerSeconds: 180, order: 1 },
    { id: 's3', title: '爆香辅料', content: '锅中放油，爆香干辣椒、花椒、葱姜蒜', images: [], timerSeconds: 60, order: 2 },
    { id: 's4', title: '炒鸡丁', content: '放入鸡丁大火翻炒至变色', images: [], timerSeconds: 180, order: 3 },
    { id: 's5', title: '调味收汁', content: '加入宫保汁翻炒均匀，撒花生出锅', images: [], timerSeconds: 120, order: 4 },
  ],
  nutrition: { calories: 380, protein: 35, fat: 18, carbs: 15, fiber: 3 },
  avgRating: 4.5,
  ratingCount: 128,
  ratingDistribution: [5, 8, 15, 35, 65],
  createdAt: '2024-01-01',
  updatedAt: '2024-06-01',
  collaborators: [],
};

const difficultyLabel = { easy: '简单', medium: '中等', hard: '困难' } as const;
const difficultyColor = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' } as const;

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentRecipe, setCurrentRecipe,
    ingredientsLoading, setIngredientsLoading,
    stepsLoading, setStepsLoading,
    collaborators, setCollaborators, addCollaborator, removeCollaborator,
    versionHistory, setVersionHistory, selectedVersionId, setSelectedVersionId,
    conflictData, setConflictData,
  } = useRecipeStore();

  const [ingredientRef, ingredientVisible] = useIntersectionObserver();
  const [stepRef, stepVisible] = useIntersectionObserver();
  const ingredientRefCallback = (el: HTMLDivElement | null) => { (ingredientRef as React.MutableRefObject<HTMLDivElement | null>).current = el; };
  const stepRefCallback = (el: HTMLDivElement | null) => { (stepRef as React.MutableRefObject<HTMLDivElement | null>).current = el; };
  const [replacements, setReplacements] = useState<Record<string, ReplacementSuggestion[]>>({});
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      setIngredientsLoading(true);
      setStepsLoading(true);
      try {
        const res = await recipeApi.get(id!);
        setCurrentRecipe(res.data);
      } catch {
        setCurrentRecipe(mockRecipe);
      } finally {
        setIngredientsLoading(false);
        setStepsLoading(false);
      }
    };
    fetchRecipe();

    const fetchVersions = async () => {
      try {
        const res = await recipeApi.getVersions(id!);
        setVersionHistory(res.data.versions);
      } catch {}
    };
    fetchVersions();
  }, [id]);

  useEffect(() => {
    socketService.connect();
    socketService.joinRoom(id!);

    const unsubJoin = socketService.onUserJoin((user) => addCollaborator(user));
    const unsubLeave = socketService.onUserLeave((userId) => removeCollaborator(userId));
    const unsubConflict = socketService.onConflict((localOp, remoteOp) => {
      setConflictData({ localOp, remoteOp });
    });
    const unsubVersion = socketService.onVersion((snapshot) => {
      setVersionHistory([...versionHistory, snapshot]);
    });

    return () => {
      unsubJoin();
      unsubLeave();
      unsubConflict();
      unsubVersion();
      socketService.leaveRoom(id!);
      socketService.disconnect();
    };
  }, [id]);

  const handleIngredientCheck = async (ingredientId: string, ingredientName: string) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(ingredientId)) {
      newChecked.delete(ingredientId);
    } else {
      newChecked.add(ingredientId);
      if (!replacements[ingredientId]) {
        try {
          const res = await nutritionApi.getReplacements(ingredientName);
          setReplacements((prev) => ({ ...prev, [ingredientId]: res.data.replacements }));
        } catch {}
      }
    }
    setCheckedIngredients(newChecked);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await recipeApi.inviteCollaborator(id!, inviteEmail);
      setInviteEmail('');
      setShowInvite(false);
    } catch {}
  };

  const handleRate = async (rating: number) => {
    try {
      await recipeApi.rate(id!, rating);
    } catch {}
  };

  const handleResolveConflict = (resolution: 'accept_ours' | 'accept_theirs' | 'merge') => {
    socketService.resolveConflict(id!, resolution);
    setConflictData(null);
  };

  const recipe = currentRecipe || mockRecipe;
  const versions = versionHistory.length > 0 ? versionHistory : [];

  return (
    <div className="min-h-screen bg-cream">
      <ImageCarousel images={recipe.images.length > 0 ? recipe.images : [recipe.thumbnail]} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {conflictData && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center justify-between">
            <span className="text-sm text-yellow-800">检测到编辑冲突，请选择解决方案</span>
            <div className="flex gap-2">
              <button onClick={() => handleResolveConflict('accept_ours')} className="px-3 py-1 text-xs rounded-lg bg-warm-orange text-white">保留我的</button>
              <button onClick={() => handleResolveConflict('accept_theirs')} className="px-3 py-1 text-xs rounded-lg bg-warm-brown-light text-white">采用对方</button>
              <button onClick={() => handleResolveConflict('merge')} className="px-3 py-1 text-xs rounded-lg bg-warm-gold text-warm-brown">合并</button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <div className="bg-warm-card rounded-2xl p-6 shadow-sm border border-warm-border mb-6">
              <h1 className="font-serif text-3xl text-warm-brown mb-2">{recipe.title}</h1>
              <p className="text-warm-brown-light mb-4 leading-relaxed">{recipe.description}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-warm-brown-light">
                  <Clock size={16} className="text-warm-orange-deep" /> 准备 {recipe.prepTime}分钟
                </span>
                <span className="flex items-center gap-1.5 text-warm-brown-light">
                  <Clock size={16} className="text-warm-orange-deep" /> 烹饪 {recipe.cookTime}分钟
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColor[recipe.difficulty]}`}>
                  {difficultyLabel[recipe.difficulty]}
                </span>
              </div>
            </div>

            <div ref={ingredientRefCallback} className={`section-fade-in ${ingredientVisible ? 'visible' : ''} bg-warm-card rounded-2xl p-6 shadow-sm border border-warm-border mb-6`}>
              <h2 className="font-serif text-2xl text-warm-brown mb-4">食材</h2>
              {ingredientsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} height={44} borderRadius={12} />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {recipe.ingredients.map((ing) => (
                    <div key={ing.id}>
                      <IngredientItem
                        ingredient={ing}
                        checked={checkedIngredients.has(ing.id)}
                        onCheck={() => handleIngredientCheck(ing.id, ing.name)}
                        onDelete={() => {}}
                      />
                      {checkedIngredients.has(ing.id) && replacements[ing.id] && (
                        <div className="ml-8 mt-1 mb-2 p-3 bg-cream rounded-xl border border-warm-border animate-slide-in-right">
                          <p className="text-xs text-warm-brown-light mb-1.5">替代建议：</p>
                          {replacements[ing.id].map((r) => (
                            <div key={r.name} className="text-sm text-warm-brown flex items-center justify-between">
                              <span>{r.name}</span>
                              <span className="text-xs text-warm-gray">{r.unit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div ref={stepRefCallback} className="bg-warm-card rounded-2xl p-6 shadow-sm border border-warm-border mb-6">
              <h2 className="font-serif text-2xl text-warm-brown mb-4">步骤</h2>
              {stepsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton circle width={40} height={40} />
                      <div className="flex-1 space-y-2">
                        <Skeleton height={20} width="40%" />
                        <Skeleton height={16} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-0">
                  {recipe.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`section-fade-in ${stepVisible ? 'visible' : ''}`}
                      style={{ transitionDelay: stepVisible ? `${index * 80}ms` : '0ms' }}
                    >
                      <StepItem step={step} index={index} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-80 space-y-6">
            <NutritionRadar data={recipe.nutrition} />

            <StarRating
              rating={recipe.avgRating}
              count={recipe.ratingCount}
              distribution={recipe.ratingDistribution}
              onRate={handleRate}
            />

            <div className="bg-warm-card rounded-2xl p-6 shadow-sm border border-warm-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg text-warm-brown flex items-center gap-2">
                  <UserPlus size={18} className="text-warm-orange-deep" /> 协作者
                </h3>
                <button
                  onClick={() => setShowInvite(!showInvite)}
                  className="text-sm text-warm-orange-deep hover:text-warm-orange transition-colors"
                >
                  邀请
                </button>
              </div>
              {showInvite && (
                <div className="flex gap-2 mb-3 animate-slide-in-right">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    placeholder="输入邮箱或用户名"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-warm-border bg-cream focus:outline-none focus:border-warm-orange"
                  />
                  <button onClick={handleInvite} className="px-3 py-2 text-sm rounded-lg bg-warm-orange text-white hover:bg-warm-orange-deep transition-colors">
                    邀请
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {collaborators.map((c) => (
                  <div key={c.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream transition-colors">
                    <div className="relative">
                      <img src={c.avatar} alt={c.username} className="w-8 h-8 rounded-full object-cover" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-warm-card" />
                    </div>
                    <span className="text-sm text-warm-brown flex-1">{c.username}</span>
                    <button
                      onClick={() => removeCollaborator(c.userId)}
                      className="btn-ripple active:scale-95 transition-transform p-1 text-warm-gray hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {collaborators.length === 0 && (
                  <p className="text-sm text-warm-gray text-center py-3">暂无协作者</p>
                )}
              </div>
            </div>

            <div className="bg-warm-card rounded-2xl p-6 shadow-sm border border-warm-border">
              <h3 className="font-serif text-lg text-warm-brown flex items-center gap-2 mb-4">
                <History size={18} className="text-warm-orange-deep" /> 版本历史
              </h3>
              {versions.length > 0 ? (
                <>
                  <input
                    type="range"
                    min={0}
                    max={versions.length - 1}
                    value={selectedVersionId ? versions.findIndex((v) => v.id === selectedVersionId) : versions.length - 1}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSelectedVersionId(versions[idx]?.id ?? null);
                    }}
                    className="w-full accent-warm-orange-deep"
                  />
                  <div className="flex justify-between text-xs text-warm-gray mt-1">
                    <span>初始版本</span>
                    <span>当前版本</span>
                  </div>
                  {selectedVersionId && (
                    <div className="mt-3 p-3 bg-cream rounded-lg border border-warm-border">
                      <p className="text-xs text-warm-brown-light">
                        版本 {versions.findIndex((v) => v.id === selectedVersionId) + 1} / {versions.length}
                      </p>
                      <p className="text-xs text-warm-gray mt-1">
                        {versions.find((v) => v.id === selectedVersionId)?.createdAt}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-warm-gray text-center py-3">暂无版本记录</p>
              )}
            </div>

            <button
              onClick={() => navigate(`/editor/${id}`)}
              className="w-full py-3 rounded-xl bg-warm-card border border-warm-border text-warm-brown hover:border-warm-orange hover:text-warm-orange-deep transition-all duration-200 font-medium text-sm"
            >
              编辑食谱
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
