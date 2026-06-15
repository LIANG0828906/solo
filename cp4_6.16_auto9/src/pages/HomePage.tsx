import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Clock, PlusCircle, Tag, Search as SearchIcon, Sparkles, Filter, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore, resolveImage } from '@/modules/recipes/RecipeStore';
import { searchByIngredients, runSearchTests } from '@/modules/recipes/SearchEngine';
import type { TimeFilter } from '@/types';
import SearchBar from '@/components/SearchBar';
import RecipeCard from '@/components/RecipeCard';
import { CardSkeleton } from '@/components/Skeleton';

const TIME_FILTERS: { key: TimeFilter; label: string; range: string }[] = [
  { key: 'all', label: '全部', range: '' },
  { key: 'quick', label: '快手', range: '≤15分' },
  { key: 'medium', label: '适中', range: '15-40分' },
  { key: 'slow', label: '慢炖', range: '>40分' },
];

const SUGGEST_INGREDIENTS = [
  '鸡蛋', '番茄', '洋葱', '土豆', '牛肉', '猪肉', '鸡肉',
  '豆腐', '青椒', '葱', '蒜', '姜', '面粉', '大米',
];

const HomePage: React.FC = () => {
  const init = useRecipeStore((s) => s.init);
  const loading = useRecipeStore((s) => s.loading);
  const recipes = useRecipeStore((s) => s.recipes);
  const updateRecipe = useRecipeStore((s) => s.updateRecipe);
  const filters = useRecipeStore((s) => s.filters);
  const setTimeFilter = useRecipeStore((s) => s.setTimeFilter);
  const toggleTagFilter = useRecipeStore((s) => s.toggleTagFilter);
  const getAllTags = useRecipeStore((s) => s.getAllTags);
  const getFilteredMyRecipes = useRecipeStore((s) => s.getFilteredMyRecipes);

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [searchTouched, setSearchTouched] = useState(false);
  const [perfTime, setPerfTime] = useState<number | null>(null);
  const testsRanRef = useRef(false);
  const imagesResolvedRef = useRef(false);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    init().then(() => {
      if (cancelled) return;
      if (!testsRanRef.current) {
        testsRanRef.current = true;
        try {
          setTimeout(() => {
            const rs = useRecipeStore.getState().recipes;
            const reports = runSearchTests(rs);
            const failed = reports.filter((r) => !r.passed);
            if (failed.length > 0) {
              console.warn(`[SearchEngine] ⚠️ ${failed.length} 项边界测试未通过:`, failed);
            } else {
              console.info(`[SearchEngine] ✅ 全部 ${reports.length} 项边界测试通过！`);
            }
          }, 50);
        } catch (e) {
          console.warn('[SearchEngine] 边界测试执行出错', e);
        }
      }
      if (!imagesResolvedRef.current) {
        imagesResolvedRef.current = true;
        const current = useRecipeStore.getState().recipes;
        current.forEach((r) => {
          if (r.image.startsWith('img_')) {
            resolveImage(r.image).then((url) => {
              if (url && url !== r.image) updateRecipe(r.id, { image: url });
            });
          }
        });
      }
    });
    return () => { cancelled = true; };
  }, [init, updateRecipe]);

  const searchResults = useMemo(() => {
    if (ingredients.length === 0 || !searchTouched) return [];
    const t0 = performance.now();
    const res = searchByIngredients(ingredients, recipes, 20);
    setPerfTime(performance.now() - t0);
    return res;
  }, [ingredients, searchTouched, recipes]);

  const myRecipes = useMemo(() => getFilteredMyRecipes(), [getFilteredMyRecipes, recipes, filters]);
  const allTags = useMemo(() => getAllTags(), [getAllTags, recipes]);

  const hasActiveFilters = filters.tags.length > 0 || filters.timeRange !== 'all';

  return (
    <div className="container py-6 md:py-8 space-y-8 max-w-6xl">
      <section>
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-cocoa-400 mb-2">
            冰箱里有什么，今晚就做什么 🥘
          </h1>
          <p className="text-cocoa-200 text-sm md:text-base max-w-xl mx-auto">
            输入冰箱里剩余的食材，AI 智能为你匹配最合适的私房菜谱，不再为吃什么发愁！
          </p>
        </div>

        <SearchBar
          value={ingredients}
          onChange={(v) => {
            setIngredients(v);
            if (v.length === 0) setSearchTouched(false);
          }}
          onSearch={() => setSearchTouched(true)}
          suggestions={SUGGEST_INGREDIENTS}
        />

        {ingredients.length > 0 && !searchTouched && (
          <div className="text-center mt-3">
            <p className="text-xs text-cocoa-200">
              已添加 {ingredients.length} 种食材，按 <kbd className="px-1.5 py-0.5 bg-cream-200 rounded text-warm-500 text-[10px]">回车</kbd> 或点击推荐按钮开始匹配
            </p>
          </div>
        )}
      </section>

      {searchTouched && ingredients.length > 0 && (
        <section
          className="rounded-card bg-white shadow-card p-5 md:p-6 border border-cream-200"
          style={{ animation: 'fadeInUp 300ms ease' }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="text-warm-400" size={22} />
              <h2 className="font-serif text-xl md:text-2xl font-bold text-cocoa-400">
                智能匹配结果
              </h2>
              <span className="text-xs bg-warm-50 text-warm-500 px-2.5 py-1 rounded-full font-medium">
                {searchResults.length} 道菜谱
              </span>
            </div>
            {perfTime !== null && (
              <span className="text-xs text-cocoa-200 flex items-center gap-1">
                <SearchIcon size={12} />
                搜索耗时 {perfTime.toFixed(0)}ms
              </span>
            )}
          </div>

          {searchResults.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3 opacity-60">🤷‍♀️</div>
              <p className="text-cocoa-300 font-medium mb-1">暂时没有匹配的菜谱</p>
              <p className="text-sm text-cocoa-200 mb-4">
                试试添加更多常用食材，比如：鸡蛋、葱、蒜
              </p>
              <button
                onClick={() => {
                  setIngredients(['鸡蛋', '葱']);
                  setSearchTouched(true);
                }}
                className="btn-secondary"
              >
                试试推荐组合
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {searchResults.map((sr, i) => (
                <RecipeCard
                  key={sr.recipe.id}
                  recipe={sr.recipe}
                  searchResult={sr}
                  showProgress
                  staggerDelay={i * 40}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2">
            <PlusCircle className="text-warm-400" size={22} />
            <h2 className="font-serif text-xl md:text-2xl font-bold text-cocoa-400">
              我的私房菜谱
            </h2>
            <span className="text-xs bg-cream-200 text-cocoa-300 px-2.5 py-1 rounded-full font-medium">
              {myRecipes.length} 道
            </span>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="btn-primary"
          >
            <PlusCircle size={16} />
            创建新菜谱
          </button>
        </div>

        {(allTags.length > 0 || hasActiveFilters) && (
          <div className="space-y-3 mb-5 p-4 rounded-xl bg-cream-50 border border-cream-200">
            <div className="flex items-center gap-2 text-xs text-cocoa-200">
              <Filter size={14} />
              筛选
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    filters.tags.forEach((t) => toggleTagFilter(t));
                    setTimeFilter('all');
                  }}
                  className="ml-auto text-warm-500 hover:underline"
                >
                  清除全部
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-1.5 items-center">
                <Clock size={13} className="text-warm-400" />
                {TIME_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTimeFilter(f.key)}
                    className={`tag-chip ${
                      filters.timeRange === f.key ? 'tag-chip-active' : ''
                    }`}
                  >
                    {f.label}
                    {f.range && <span className="opacity-70 ml-1 text-[9px]">{f.range}</span>}
                  </button>
                ))}
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-start">
                <Tag size={13} className="text-warm-400 mt-1 flex-shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTagFilter(t)}
                      className={`tag-chip ${
                        filters.tags.includes(t) ? 'tag-chip-active' : ''
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : myRecipes.length === 0 ? (
          <div className="py-16 text-center rounded-card bg-white border-2 border-dashed border-warm-100">
            <div className="text-5xl mb-3 opacity-60">📖</div>
            <p className="text-cocoa-300 font-medium mb-1">
              {hasActiveFilters ? '没有符合筛选条件的菜谱' : '还没有创建自己的菜谱'}
            </p>
            <p className="text-sm text-cocoa-200 mb-4">
              {hasActiveFilters ? '试试调整筛选条件吧' : '记录下第一道祖传秘方吧！'}
            </p>
            <button
              onClick={() => navigate('/create')}
              className="btn-primary"
            >
              <PlusCircle size={16} />
              创建菜谱
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {myRecipes.map((r, i) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                staggerDelay={i * 35}
                showAuthor={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
