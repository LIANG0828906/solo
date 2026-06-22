import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChefHat, TrendingUp, Filter, Sparkles } from 'lucide-react';
import { SearchBox } from '@/SearchBox';
import { MasonryGrid } from '@/components/MasonryGrid';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { api } from '@/utils/api';
import { Recipe, MatchResult } from '@/types';

const TAGS = ['全部', '中餐', '西餐', '甜点', '烘焙', '低卡', '家常菜', '快手菜', '辣', '健身', '沙拉', '肉类'];

export const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const ingredientsParam = searchParams.get('items');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[] | undefined>();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('全部');
  const [mode, setMode] = useState<'browse' | 'search' | 'ingredients'>('browse');
  const [searchTitle, setSearchTitle] = useState('');
  const [ingredientList, setIngredientList] = useState<string[]>([]);

  useEffect(() => {
    if (searchQuery) {
      setMode('search');
      setSearchTitle(`"${searchQuery}" 的搜索结果`);
      doSearch(searchQuery);
    } else if (ingredientsParam) {
      const items = ingredientsParam.split(',').filter(Boolean);
      setIngredientList(items);
      setMode('ingredients');
      setSearchTitle(`用 ${items.join('、')} 能做什么`);
      doMatchByIngredients(items);
    } else {
      setMode('browse');
      setSearchTitle('');
      setIngredientList([]);
      loadRecipes(1, true);
    }
  }, [searchQuery, ingredientsParam]);

  useEffect(() => {
    if (mode === 'browse') {
      loadRecipes(1, true);
    }
  }, [selectedTag, mode]);

  const loadRecipes = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setRecipes([]);
      setMatchResults(undefined);
    }
    try {
      const tag = selectedTag === '全部' ? undefined : selectedTag;
      const res = await api.recipes.getList(pageNum, 12, tag);
      setRecipes(prev => reset ? res.recipes : [...prev, ...res.recipes]);
      setHasMore(res.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('加载食谱失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const doSearch = async (query: string) => {
    setLoading(true);
    setRecipes([]);
    setMatchResults(undefined);
    try {
      const res = await api.recipes.search(query);
      setRecipes(res.recipes);
      setHasMore(false);
    } catch (err) {
      console.error('搜索失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const doMatchByIngredients = async (ingredients: string[]) => {
    setLoading(true);
    setRecipes([]);
    setMatchResults(undefined);
    try {
      const res = await api.recipes.matchByIngredients(ingredients);
      setMatchResults(res.results);
      setRecipes(res.results.map(r => r.recipe));
      setHasMore(false);
    } catch (err) {
      console.error('食材匹配失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (mode === 'browse' && hasMore && !loading) {
      loadRecipes(page + 1);
    }
  }, [mode, hasMore, loading, page]);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: mode === 'browse' && hasMore,
    rootMargin: '200px',
  });

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50">
      {mode === 'browse' && (
        <div className="relative pt-24 pb-12 px-4 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
            <div className="absolute top-20 -left-20 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              发现美食的无限可能
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-stone-800 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              今天想做什么菜？
            </h1>
            <p className="text-lg text-stone-600 mb-8 max-w-2xl mx-auto">
              输入你冰箱里的食材，我们帮你找到最合适的食谱。或者探索社区分享的美食灵感。
            </p>
            <div className="flex justify-center">
              <SearchBox variant="hero" />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {(mode === 'search' || mode === 'ingredients') && (
          <div className="pt-24 mb-8">
            <button
              onClick={() => setSearchParams({})}
              className="text-orange-600 hover:text-orange-700 mb-4 inline-flex items-center gap-1"
            >
              ← 返回首页
            </button>
            <h2 className="text-3xl font-bold text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              {searchTitle}
            </h2>
            {mode === 'ingredients' && (
              <div className="flex flex-wrap gap-2 mt-3">
                {ingredientList.map((ing, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            )}
            {matchResults && matchResults.length > 0 && (
              <p className="text-stone-500 mt-2">
                找到 {matchResults.length} 个匹配的食谱，按匹配度排序
              </p>
            )}
          </div>
        )}

        {mode === 'browse' && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-stone-800">热门分类</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedTag === tag ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-stone-600 hover:bg-orange-50 hover:text-orange-600 shadow-sm'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'browse' && (
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-stone-800">
              {selectedTag === '全部' ? '精选食谱' : `${selectedTag}食谱`}
            </h3>
          </div>
        )}

        <MasonryGrid
          recipes={recipes}
          matchResults={matchResults || undefined}
          loading={loading}
        />

        {mode === 'browse' && hasMore && !loading && (
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      <footer className="bg-white/50 border-t border-orange-100 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <ChefHat className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-bold text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
              美食工坊
            </span>
          </div>
          <p className="text-stone-500 text-sm">
            让每一餐都充满创意与温暖 🍳
          </p>
        </div>
      </footer>
    </div>
  );
};
