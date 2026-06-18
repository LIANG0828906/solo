import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecipeCard } from '@/components/RecipeCard';
import { useRecipesStore } from '@/store/recipesStore';
import { recipesApi } from '@/api/recipesApi';
import { Search, Sparkles } from 'lucide-react';

const PRESET_TAGS = ['家常', '快手', '甜点', '辣', '清淡', '早餐', '下饭菜'];

export default function Home() {
  const navigate = useNavigate();
  const {
    recipes,
    loading,
    searchQuery,
    currentTags,
    hasMore,
    fetchRecipes,
    setSearchQuery,
    addTag,
    removeTag,
    clearTags,
    loadMoreRecipes,
    fetchFavorites,
  } = useRecipesStore();

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRecipes(true);
    fetchFavorites();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipes(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchRecipes(true);
  }, [currentTags]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          loadMoreRecipes();
        }
      },
      { rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const handleExploreRandom = useCallback(async () => {
    const recipe = await recipesApi.getRandomRecipe();
    if (recipe) {
      navigate(`/recipe/${recipe.id}`);
    }
  }, [navigate]);

  const handleTagClick = (tag: string) => {
    if (currentTags.includes(tag)) {
      removeTag(tag);
    } else {
      addTag(tag);
    }
  };

  const handleClearAll = () => {
    clearTags();
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8E1' }}>
      <header className="pt-10 pb-8 px-4">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#E64A19' }}>
            <span className="text-5xl">🍳</span> 食谱交换站
          </h1>
          <p className="text-lg mt-4" style={{ color: '#666' }}>
            分享你的拿手好菜，发现更多美味灵感
          </p>
        </div>

        <div
          className="mx-auto flex items-center rounded-xl shadow-sm focus-within:shadow-md transition-shadow"
          style={{
            width: '60%',
            minWidth: '280px',
            borderRadius: '12px',
            backgroundColor: '#F5F0E8',
          }}
        >
          <Search className="ml-5 w-5 h-5" style={{ color: '#999' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索菜名、食材或口味..."
            className="flex-1 bg-transparent border-none outline-none py-4 px-4 text-base"
            style={{ color: '#333' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mr-4 text-sm transition-colors"
              style={{ color: '#999' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FF7043')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
            >
              清除
            </button>
          )}
        </div>

        <div className="max-w-4xl mx-auto mt-6 flex flex-wrap justify-center gap-2 px-4">
          <span className="text-sm mr-1 self-center" style={{ color: '#666' }}>热门标签:</span>
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="text-sm rounded-full transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                padding: '6px 14px',
                backgroundColor: currentTags.includes(tag) ? '#FF7043' : '#FFE0B2',
                color: currentTags.includes(tag) ? 'white' : '#666',
                fontWeight: currentTags.includes(tag) ? 600 : 400,
              }}
            >
              {tag}
            </button>
          ))}
          {currentTags.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm rounded-full transition-all duration-200 hover:brightness-110 active:scale-95 ml-2"
              style={{
                padding: '6px 14px',
                backgroundColor: '#FFF',
                color: '#FF7043',
                border: '1px solid #FF7043',
              }}
            >
              清空筛选
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        {recipes.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-xl" style={{ color: '#666' }}>
              没有找到匹配的食谱
            </p>
            <button
              onClick={handleClearAll}
              className="mt-4 text-base rounded-full transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{
                padding: '10px 24px',
                backgroundColor: '#FF8A65',
                color: 'white',
              }}
            >
              清空筛选
            </button>
          </div>
        )}

        <div className="recipe-masonry w-full" style={{ width: '100%' }}>
          {recipes.map((recipe, idx) => (
            <div key={recipe.id} className="w-full flex justify-center">
              <RecipeCard recipe={recipe} index={idx} />
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div
              className="animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: '#FFCC80', borderTopColor: '#FF7043', width: '40px', height: '40px' }}
            />
          </div>
        )}

        <div ref={sentinelRef} style={{ height: '20px' }} />

        {!hasMore && recipes.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: '#999' }}>—— 已显示全部食谱 ——</p>
          </div>
        )}

        <div className="text-center py-10 mt-8">
          <button
            onClick={handleExploreRandom}
            className="inline-flex items-center gap-2 text-lg font-medium rounded-full transition-all duration-200 hover:brightness-110 active:scale-95 shadow-lg hover:shadow-xl"
            style={{
              padding: '14px 36px',
              borderRadius: '24px',
              backgroundColor: '#FF8A65',
              color: 'white',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FF7043')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF8A65')}
          >
            <Sparkles className="w-5 h-5" />
            探索随机
          </button>
          <p className="text-sm mt-3" style={{ color: '#999' }}>
            不知道吃什么？试试手气吧！
          </p>
        </div>
      </main>
    </div>
  );
}
