import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Search, ChefHat } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppStore } from '@/state/appStore';
import RecipeCard from '@/components/RecipeCard';
import { SkeletonCard } from '@/components/Skeleton';

export default function RecipeHome() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const { recipes, loading, init } = useAppStore();

  useEffect(() => {
    init();
  }, [init]);

  const filteredRecipes = useMemo(() => {
    if (!debouncedSearch.trim()) return recipes;
    const keyword = debouncedSearch.trim().toLowerCase();
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(keyword) ||
        r.mainIngredients.some((ing) => ing.toLowerCase().includes(keyword))
    );
  }, [recipes, debouncedSearch]);

  const isLoading = loading.init || loading.recipes;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8 animate-fade-in">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <ChefHat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="title-display text-2xl leading-none text-gray-800 sm:text-3xl">
                  家庭食谱
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  共 {filteredRecipes.length} 道菜谱，用心烹饪每一顿
                </p>
              </div>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索菜名或食材..."
              className="input-base pl-11 pr-4"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="animate-fade-in card p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
            <ChefHat className="h-8 w-8 text-primary/60" />
          </div>
          <h3 className="mb-2 title-display text-xl text-gray-700">暂无匹配的菜谱</h3>
          <p className="text-sm text-gray-500">试试搜索其他关键词，或者换个搜索方式吧~</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRecipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
