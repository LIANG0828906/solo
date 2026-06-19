import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Menu, User } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import useRecipeStore from '@/store/recipeStore';
import { recipeApi, favoriteApi } from '@/services/api';
import RecipeCard from '@/components/RecipeCard';
import FavoriteSidebar from '@/components/FavoriteSidebar';
import RippleButton from '@/components/RippleButton';
import QuickPreviewModal from '@/components/QuickPreviewModal';
import type { Recipe, Difficulty } from '@/types';

const mockRecipes: Recipe[] = [
  {
    id: '1', title: '宫保鸡丁', description: '经典川菜，花生与鸡丁的完美搭配，麻辣鲜香', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Kung%20Pao%20Chicken%20dish%20on%20white%20plate%20food%20photography&image_size=square',
    images: [], prepTime: 15, cookTime: 20, difficulty: 'medium',
    ingredients: [
      { id: 'i1', name: '鸡胸肉', amount: 300, unit: 'g', order: 0 },
      { id: 'i2', name: '花生米', amount: 50, unit: 'g', order: 1 },
      { id: 'i3', name: '干辣椒', amount: 8, unit: '个', order: 2 },
      { id: 'i4', name: '花椒', amount: 5, unit: 'g', order: 3 },
      { id: 'i5', name: '葱姜蒜', amount: 30, unit: 'g', order: 4 },
      { id: 'i6', name: '酱油', amount: 2, unit: '汤匙', order: 5 },
    ],
    steps: [
      { id: 's1', title: '处理鸡肉', content: '鸡胸肉切丁，加入料酒、盐、淀粉腌制15分钟', images: [], timerSeconds: 900, order: 0 },
      { id: 's2', title: '炒花生', content: '小火炒花生米至金黄捞出备用', images: [], timerSeconds: 180, order: 1 },
      { id: 's3', title: '爆香辅料', content: '锅中放油，爆香干辣椒、花椒、葱姜蒜', images: [], timerSeconds: 60, order: 2 },
      { id: 's4', title: '炒鸡丁', content: '放入鸡丁大火翻炒至变色', images: [], timerSeconds: 180, order: 3 },
      { id: 's5', title: '调味收汁', content: '加入宫保汁翻炒均匀，撒花生出锅', images: [], timerSeconds: 120, order: 4 },
    ],
    nutrition: { calories: 380, protein: 35, fat: 18, carbs: 15, fiber: 3 },
    avgRating: 4.5, ratingCount: 128, ratingDistribution: [5, 8, 15, 35, 65],
    createdAt: '2024-01-01', updatedAt: '2024-06-01', collaborators: [],
  },
  {
    id: '2', title: '红烧肉', description: '入口即化的经典红烧肉，浓油赤酱，肥而不腻', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Braised%20pork%20belly%20Chinese%20style%20food%20photography&image_size=square',
    images: [], prepTime: 20, cookTime: 90, difficulty: 'hard',
    ingredients: [
      { id: 'i1', name: '五花肉', amount: 500, unit: 'g', order: 0 },
      { id: 'i2', name: '冰糖', amount: 30, unit: 'g', order: 1 },
      { id: 'i3', name: '老抽', amount: 2, unit: '汤匙', order: 2 },
      { id: 'i4', name: '料酒', amount: 3, unit: '汤匙', order: 3 },
      { id: 'i5', name: '八角', amount: 2, unit: '个', order: 4 },
      { id: 'i6', name: '桂皮', amount: 1, unit: '小块', order: 5 },
    ],
    steps: [
      { id: 's1', title: '焯水', content: '五花肉切块，冷水下锅焯水去血沫', images: [], timerSeconds: 600, order: 0 },
      { id: 's2', title: '炒糖色', content: '小火将冰糖炒至枣红色', images: [], timerSeconds: 180, order: 1 },
      { id: 's3', title: '上色', content: '放入肉块翻炒上色', images: [], timerSeconds: 120, order: 2 },
      { id: 's4', title: '炖煮', content: '加开水没过肉块，放调料大火烧开后小火炖60分钟', images: [], timerSeconds: 3600, order: 3 },
      { id: 's5', title: '收汁', content: '大火收汁至浓稠', images: [], timerSeconds: 300, order: 4 },
    ],
    nutrition: { calories: 520, protein: 28, fat: 40, carbs: 12, fiber: 0 },
    avgRating: 4.7, ratingCount: 256, ratingDistribution: [3, 5, 12, 45, 191],
    createdAt: '2024-01-15', updatedAt: '2024-06-10', collaborators: [],
  },
  {
    id: '3', title: '麻婆豆腐', description: '麻辣鲜香的川菜经典，嫩滑豆腐配上肉末', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mapo%20Tofu%20Sichuan%20dish%20food%20photography&image_size=square',
    images: [], prepTime: 10, cookTime: 15, difficulty: 'easy',
    ingredients: [
      { id: 'i1', name: '嫩豆腐', amount: 400, unit: 'g', order: 0 },
      { id: 'i2', name: '猪肉末', amount: 100, unit: 'g', order: 1 },
      { id: 'i3', name: '豆瓣酱', amount: 2, unit: '汤匙', order: 2 },
      { id: 'i4', name: '花椒粉', amount: 3, unit: 'g', order: 3 },
      { id: 'i5', name: '淀粉', amount: 1, unit: '汤匙', order: 4 },
      { id: 'i6', name: '葱花', amount: 10, unit: 'g', order: 5 },
    ],
    steps: [
      { id: 's1', title: '切豆腐', content: '豆腐切2cm小块，入盐水焯烫后捞出', images: [], timerSeconds: 180, order: 0 },
      { id: 's2', title: '炒肉末', content: '热油炒香肉末至变色', images: [], timerSeconds: 120, order: 1 },
      { id: 's3', title: '加豆瓣酱', content: '加入豆瓣酱炒出红油', images: [], timerSeconds: 60, order: 2 },
      { id: 's4', title: '炖豆腐', content: '加水放入豆腐小火炖5分钟', images: [], timerSeconds: 300, order: 3 },
      { id: 's5', title: '勾芡出锅', content: '水淀粉勾芡，撒花椒粉和葱花', images: [], timerSeconds: 30, order: 4 },
    ],
    nutrition: { calories: 220, protein: 18, fat: 12, carbs: 10, fiber: 2 },
    avgRating: 4.3, ratingCount: 89, ratingDistribution: [4, 6, 12, 25, 42],
    createdAt: '2024-02-01', updatedAt: '2024-05-20', collaborators: [],
  },
  {
    id: '4', title: '糖醋排骨', description: '酸甜可口的经典糖醋排骨，外焦里嫩', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sweet%20and%20sour%20ribs%20Chinese%20food%20photography&image_size=square',
    images: [], prepTime: 15, cookTime: 30, difficulty: 'medium',
    ingredients: [
      { id: 'i1', name: '小排', amount: 500, unit: 'g', order: 0 },
      { id: 'i2', name: '白砂糖', amount: 3, unit: '汤匙', order: 1 },
      { id: 'i3', name: '香醋', amount: 2, unit: '汤匙', order: 2 },
      { id: 'i4', name: '番茄酱', amount: 1, unit: '汤匙', order: 3 },
      { id: 'i5', name: '姜片', amount: 3, unit: '片', order: 4 },
    ],
    steps: [
      { id: 's1', title: '焯水', content: '排骨冷水下锅焯水去血沫', images: [], timerSeconds: 300, order: 0 },
      { id: 's2', title: '炸排骨', content: '油温六成热，炸至表面金黄', images: [], timerSeconds: 480, order: 1 },
      { id: 's3', title: '调糖醋汁', content: '混合白糖、醋、番茄酱、酱油', images: [], timerSeconds: 30, order: 2 },
      { id: 's4', title: '翻炒', content: '排骨回锅倒入糖醋汁翻炒均匀', images: [], timerSeconds: 120, order: 3 },
      { id: 's5', title: '收汁', content: '大火收汁至浓稠挂满排骨', images: [], timerSeconds: 60, order: 4 },
    ],
    nutrition: { calories: 450, protein: 30, fat: 22, carbs: 28, fiber: 0 },
    avgRating: 4.6, ratingCount: 175, ratingDistribution: [2, 5, 13, 42, 113],
    createdAt: '2024-02-10', updatedAt: '2024-06-05', collaborators: [],
  },
  {
    id: '5', title: '清蒸鲈鱼', description: '鲜嫩爽滑的清蒸鲈鱼，原汁原味的鲜美', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Steamed%20sea%20bass%20Chinese%20style%20food%20photography&image_size=square',
    images: [], prepTime: 10, cookTime: 12, difficulty: 'easy',
    ingredients: [
      { id: 'i1', name: '鲈鱼', amount: 1, unit: '条', order: 0 },
      { id: 'i2', name: '姜丝', amount: 15, unit: 'g', order: 1 },
      { id: 'i3', name: '葱丝', amount: 20, unit: 'g', order: 2 },
      { id: 'i4', name: '蒸鱼豉油', amount: 3, unit: '汤匙', order: 3 },
      { id: 'i5', name: '料酒', amount: 1, unit: '汤匙', order: 4 },
    ],
    steps: [
      { id: 's1', title: '处理鱼', content: '鲈鱼洗净划刀，抹料酒和姜片去腥', images: [], timerSeconds: 600, order: 0 },
      { id: 's2', title: '蒸鱼', content: '水开后上锅大火蒸8-10分钟', images: [], timerSeconds: 600, order: 1 },
      { id: 's3', title: '去汁', content: '倒掉蒸出的汤汁，去掉旧姜葱', images: [], timerSeconds: 30, order: 2 },
      { id: 's4', title: '摆盘', content: '重新铺上新鲜姜丝葱丝', images: [], timerSeconds: 30, order: 3 },
      { id: 's5', title: '浇油', content: '淋上蒸鱼豉油，浇上滚热油', images: [], timerSeconds: 30, order: 4 },
    ],
    nutrition: { calories: 180, protein: 32, fat: 5, carbs: 2, fiber: 0 },
    avgRating: 4.4, ratingCount: 67, ratingDistribution: [2, 4, 8, 22, 31],
    createdAt: '2024-03-01', updatedAt: '2024-05-15', collaborators: [],
  },
  {
    id: '6', title: '蛋炒饭', description: '粒粒分明的黄金蛋炒饭，简单却令人满足', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Egg%20fried%20rice%20Chinese%20food%20photography&image_size=square',
    images: [], prepTime: 5, cookTime: 8, difficulty: 'easy',
    ingredients: [
      { id: 'i1', name: '隔夜米饭', amount: 300, unit: 'g', order: 0 },
      { id: 'i2', name: '鸡蛋', amount: 2, unit: '个', order: 1 },
      { id: 'i3', name: '葱花', amount: 15, unit: 'g', order: 2 },
      { id: 'i4', name: '盐', amount: 1, unit: '茶匙', order: 3 },
      { id: 'i5', name: '酱油', amount: 1, unit: '茶匙', order: 4 },
    ],
    steps: [
      { id: 's1', title: '打蛋', content: '鸡蛋打散加少许盐', images: [], timerSeconds: 30, order: 0 },
      { id: 's2', title: '炒蛋', content: '热油炒散鸡蛋盛出', images: [], timerSeconds: 60, order: 1 },
      { id: 's3', title: '炒饭', content: '锅中加少许油，放入米饭大火翻炒', images: [], timerSeconds: 180, order: 2 },
      { id: 's4', title: '混合', content: '加入炒好的鸡蛋和葱花翻炒均匀', images: [], timerSeconds: 60, order: 3 },
      { id: 's5', title: '调味', content: '淋入酱油快速翻炒出锅', images: [], timerSeconds: 30, order: 4 },
    ],
    nutrition: { calories: 350, protein: 12, fat: 10, carbs: 52, fiber: 1 },
    avgRating: 4.1, ratingCount: 45, ratingDistribution: [3, 4, 8, 15, 15],
    createdAt: '2024-03-15', updatedAt: '2024-05-01', collaborators: [],
  },
  {
    id: '7', title: '酸辣汤', description: '开胃暖身的经典汤品，酸辣适口', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Hot%20and%20sour%20soup%20Chinese%20food%20photography&image_size=square',
    images: [], prepTime: 10, cookTime: 15, difficulty: 'easy',
    ingredients: [
      { id: 'i1', name: '豆腐', amount: 200, unit: 'g', order: 0 },
      { id: 'i2', name: '木耳', amount: 30, unit: 'g', order: 1 },
      { id: 'i3', name: '鸡蛋', amount: 1, unit: '个', order: 2 },
      { id: 'i4', name: '白胡椒粉', amount: 2, unit: 'g', order: 3 },
      { id: 'i5', name: '香醋', amount: 2, unit: '汤匙', order: 4 },
    ],
    steps: [
      { id: 's1', title: '备料', content: '豆腐切丝，木耳泡发切丝', images: [], timerSeconds: 300, order: 0 },
      { id: 's2', title: '煮汤底', content: '清水烧开加入木耳煮2分钟', images: [], timerSeconds: 120, order: 1 },
      { id: 's3', title: '加豆腐', content: '放入豆腐丝煮开', images: [], timerSeconds: 120, order: 2 },
      { id: 's4', title: '调味', content: '加入盐、酱油、香醋、白胡椒粉', images: [], timerSeconds: 30, order: 3 },
      { id: 's5', title: '蛋花', content: '淋入蛋液搅散，撒葱花出锅', images: [], timerSeconds: 30, order: 4 },
    ],
    nutrition: { calories: 120, protein: 10, fat: 5, carbs: 8, fiber: 2 },
    avgRating: 4.0, ratingCount: 56, ratingDistribution: [4, 6, 10, 18, 18],
    createdAt: '2024-04-01', updatedAt: '2024-05-10', collaborators: [],
  },
  {
    id: '8', title: '小笼包', description: '皮薄馅嫩汤汁鲜美，一口一个满足感', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Soup%20dumplings%20xiaolongbao%20bamboo%20steamer%20food%20photography&image_size=square',
    images: [], prepTime: 40, cookTime: 10, difficulty: 'hard',
    ingredients: [
      { id: 'i1', name: '中筋面粉', amount: 250, unit: 'g', order: 0 },
      { id: 'i2', name: '猪肉馅', amount: 300, unit: 'g', order: 1 },
      { id: 'i3', name: '皮冻', amount: 150, unit: 'g', order: 2 },
      { id: 'i4', name: '姜末', amount: 10, unit: 'g', order: 3 },
      { id: 'i5', name: '生抽', amount: 2, unit: '汤匙', order: 4 },
      { id: 'i6', name: '白糖', amount: 1, unit: '茶匙', order: 5 },
    ],
    steps: [
      { id: 's1', title: '和面', content: '面粉加温水揉成光滑面团，醒面30分钟', images: [], timerSeconds: 1800, order: 0 },
      { id: 's2', title: '调馅', content: '肉馅加入调料和切碎的皮冻拌匀', images: [], timerSeconds: 300, order: 1 },
      { id: 's3', title: '擀皮', content: '面团分剂擀成薄皮', images: [], timerSeconds: 600, order: 2 },
      { id: 's4', title: '包馅', content: '皮中放馅，捏出18个褶子', images: [], timerSeconds: 1200, order: 3 },
      { id: 's5', title: '蒸制', content: '蒸笼垫油纸，大火蒸8分钟', images: [], timerSeconds: 480, order: 4 },
    ],
    nutrition: { calories: 420, protein: 22, fat: 18, carbs: 42, fiber: 1 },
    avgRating: 4.8, ratingCount: 312, ratingDistribution: [2, 3, 8, 38, 261],
    createdAt: '2024-04-10', updatedAt: '2024-06-15', collaborators: [],
  },
];

const difficulties: { value: Difficulty | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

export default function Home() {
  const navigate = useNavigate();
  const {
    recipes, setRecipes, searchQuery, setSearchQuery, isLoading, setLoading,
    favoriteFolders, setFavoriteFolders, favoritedRecipeIds, toggleFavorite, rateRecipe,
  } = useRecipeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const res = await recipeApi.list({ search: searchQuery, difficulty: difficulty || undefined });
        setRecipes(res.data.recipes, res.data.total);
      } catch {
        setRecipes(mockRecipes, mockRecipes.length);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, [searchQuery, difficulty]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await favoriteApi.list();
        setFavoriteFolders(res.data);
      } catch {}
    };
    fetchFavorites();
  }, []);

  const handleToggleFavorite = (recipeId: string) => {
    toggleFavorite(recipeId);
  };

  const handleRate = (recipeId: string, rating: number) => {
    rateRecipe(recipeId, rating);
    try {
      recipeApi.rate(recipeId, rating);
    } catch {}
  };

  const handleQuickPreview = (recipe: Recipe) => {
    setPreviewRecipe(recipe);
  };

  const handleOpenDetail = (recipeId: string) => {
    setPreviewRecipe(null);
    navigate(`/recipe/${recipeId}`);
  };

  const displayRecipes = recipes.length > 0 ? recipes : mockRecipes;
  const filtered = difficulty
    ? displayRecipes.filter((r) => r.difficulty === difficulty)
    : displayRecipes;
  const searched = searchQuery
    ? filtered.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filtered;

  return (
    <div className="min-h-screen bg-cream flex">
      <FavoriteSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <nav className="sticky top-0 z-20 bg-warm-card/90 backdrop-blur-md border-b border-warm-border px-4 md:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-warm-brown hover:bg-cream rounded-lg">
              <Menu size={22} />
            </button>
            <h1 className="font-serif text-2xl text-warm-brown tracking-wider">味集</h1>
            <div className="flex-1 max-w-md mx-4 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索食谱..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-cream border border-warm-border text-sm text-warm-brown placeholder-warm-gray focus:outline-none focus:border-warm-orange transition-colors"
              />
            </div>
            <RippleButton onClick={() => navigate('/editor/new')}>
              <Plus size={18} className="mr-1" />新建食谱
            </RippleButton>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-warm-orange to-warm-orange-deep flex items-center justify-center text-white cursor-pointer">
              <User size={18} />
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex gap-2 mb-6 flex-wrap">
            {difficulties.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  difficulty === d.value
                    ? 'bg-warm-orange-deep text-white shadow-md'
                    : 'bg-warm-card border border-warm-border text-warm-brown-light hover:border-warm-orange'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-warm-card rounded-2xl overflow-hidden border border-warm-border">
                  <Skeleton height={192} />
                  <div className="p-4 space-y-3">
                    <Skeleton height={24} width="70%" />
                    <Skeleton height={16} />
                    <Skeleton height={16} width="50%" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {searched.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isFavorited={favoritedRecipeIds.has(recipe.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onRate={handleRate}
                  onQuickPreview={handleQuickPreview}
                />
              ))}
            </div>
          )}

          {!isLoading && searched.length === 0 && (
            <div className="text-center py-20">
              <p className="text-warm-gray text-lg">没有找到相关食谱</p>
            </div>
          )}
        </main>
      </div>

      <QuickPreviewModal
        recipe={previewRecipe}
        isOpen={previewRecipe !== null}
        onClose={() => setPreviewRecipe(null)}
        onRate={handleRate}
        onOpenDetail={handleOpenDetail}
      />
    </div>
  );
}
