import { useState, useEffect, useCallback } from 'react';
import RecipeCard from '@/components/RecipeCard';
import SearchBox from '@/components/SearchBox';
import { ChefHat, Sparkles } from 'lucide-react';

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

const TAGS = ['全部', '中餐', '甜点', '低卡', '家常菜', '烘焙', '快手菜', '海鲜'];

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState('全部');
  const [favoritesMap, setFavoritesMap] = useState<Record<number, boolean>>({});

  const fetchRecipes = useCallback(async (tag?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '12');
      if (tag && tag !== '全部') {
        params.set('tag', tag);
      }
      const res = await fetch(`/api/recipes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.recipes);
      }
    } catch (err) {
      console.error('获取食谱失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes(activeTag);
  }, [activeTag, fetchRecipes]);

  const handleFavoriteChange = (recipeId: number, favorited: boolean) => {
    setFavoritesMap((prev) => ({ ...prev, [recipeId]: favorited }));
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      fetchRecipes(activeTag);
      return;
    }
    setLoading(true);
    fetch(`/api/recipes/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        setRecipes(data.recipes);
      })
      .finally(() => setLoading(false));
  };

  const handleIngredientMatch = (ingredients: string[]) => {
    if (ingredients.length === 0) {
      fetchRecipes(activeTag);
      return;
    }
    setLoading(true);
    fetch(`/api/recipes/match?ingredients=${encodeURIComponent(ingredients.join(','))}`)
      .then((res) => res.json())
      .then((data) => {
        setRecipes(data.recipes);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 flex items-center justify-center shadow-lg shadow-terracotta-500/20">
                <ChefHat size={22} className="text-white" />
              </div>
              <span className="text-xl font-display font-bold text-caramel-700">美味厨房</span>
            </div>

            <div className="flex-1 max-w-xl mx-8 hidden md:block">
              <SearchBox onSearch={handleSearch} onIngredientMatch={handleIngredientMatch} />
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded-full text-sm font-medium text-caramel-700 hover:bg-cream-100 transition-colors">
                登录
              </button>
              <button className="px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 shadow-md hover:shadow-lg transition-all">
                注册
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-terracotta-50 text-terracotta-600 text-sm font-medium mb-4">
            <Sparkles size={16} />
            <span>发现美食灵感</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-caramel-700 mb-3">
            今天想做什么菜？
          </h1>
          <p className="text-caramel-600/70 text-lg">
            输入你冰箱里的食材，让我们为你推荐美味食谱
          </p>
        </div>

        <div className="md:hidden mb-6">
          <SearchBox onSearch={handleSearch} onIngredientMatch={handleIngredientMatch} />
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTag === tag
                  ? 'bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white shadow-md shadow-terracotta-500/25'
                  : 'bg-white text-caramel-600 border border-cream-300 hover:border-terracotta-200 hover:bg-terracotta-50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-card animate-pulse">
                <div className="aspect-[4/3] bg-cream-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-cream-200 rounded w-3/4" />
                  <div className="h-4 bg-cream-200 rounded w-full" />
                  <div className="h-4 bg-cream-200 rounded w-5/6" />
                  <div className="flex gap-1.5">
                    <div className="h-5 w-12 bg-cream-200 rounded-full" />
                    <div className="h-5 w-16 bg-cream-200 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                initialFavorited={favoritesMap[recipe.id] ?? false}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        )}

        {!loading && recipes.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍳</div>
            <p className="text-caramel-600/70 text-lg">没有找到相关食谱</p>
            <p className="text-caramel-600/50 text-sm mt-2">换个关键词或食材试试吧</p>
          </div>
        )}
      </div>
    </div>
  );
}
