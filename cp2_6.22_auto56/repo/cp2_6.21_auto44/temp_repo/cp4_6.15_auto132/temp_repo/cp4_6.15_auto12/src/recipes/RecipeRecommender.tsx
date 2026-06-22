import { useState, useMemo, useEffect } from 'react';
import type { Ingredient, RecipeDifficulty, RecipeScore } from '@/shared/types';
import { DIFFICULTY_LABELS } from '@/shared/types';
import { useAppStore } from '@/shared/store';
import { scoreRecipes } from '@/shared/utils';
import { Search, ChefHat, Clock, Flame, Star, ShoppingCart, ChevronDown, ChevronUp, UtensilsCrossed } from 'lucide-react';

function useDebounce<T>(value: T, delay: number = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function RecipeRecommender() {
  const ingredients = useAppStore((s) => s.ingredients);
  const recipes = useAppStore((s) => s.recipes);
  const setCookingRecipe = useAppStore((s) => s.setCookingRecipe);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const addToShoppingList = useAppStore((s) => s.addToShoppingList);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>('easy');
  const [results, setResults] = useState<RecipeScore[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const filteredIngredients: Ingredient[] = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [ingredients, debouncedSearch]);

  const toggleIngredient = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const selectedIngredients: Ingredient[] = useMemo(
    () => ingredients.filter((i) => selectedIds.includes(i.id)),
    [ingredients, selectedIds]
  );

  const handleRecommend = () => {
    if (selectedIngredients.length < 2) return;
    const start = performance.now();
    const scored = scoreRecipes(selectedIngredients, recipes, difficulty);
    const top5 = scored.slice(0, 5);
    setResults(top5);
    setHasSearched(true);
    setExpandedIds([]);
    console.log(`推荐计算耗时: ${(performance.now() - start).toFixed(2)}ms`);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const matchRateColor = (rate: number) => {
    if (rate > 0.8) return 'bg-green-500';
    if (rate > 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const difficultyColor = (d: RecipeDifficulty) => {
    if (d === 'easy') return 'bg-green-100 text-green-700';
    if (d === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const difficulties: RecipeDifficulty[] = ['easy', 'medium', 'hard'];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-serif font-bold text-wood-800 flex items-center justify-center gap-2">
          <Search className="w-8 h-8 text-olive-500" />
          菜谱推荐
        </h1>
        <p className="text-wood-600">选择你现有的食材，发现美味菜谱</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-wood-700">选择食材</h2>
          <span className="text-sm text-wood-500">已选择 {selectedIds.length}/5</span>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wood-400" />
          <input
            type="text"
            placeholder="搜索食材..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-wood-200 bg-white py-2.5 pl-10 pr-4 text-sm text-wood-800 placeholder-wood-300 outline-none transition-shadow focus:border-olive-400 focus:shadow-md"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredIngredients.map((ing) => {
            const isSelected = selectedIds.includes(ing.id);
            return (
              <button
                key={ing.id}
                onClick={() => toggleIngredient(ing.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? 'bg-olive-500 text-white shadow-md'
                    : 'bg-cream-200 text-wood-700 border border-cream-300 hover:bg-cream-300'
                }`}
              >
                {ing.name}
              </button>
            );
          })}
          {filteredIngredients.length === 0 && (
            <div className="w-full py-4 text-center text-wood-400 text-sm">没有找到匹配的食材</div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-wood-700">难度偏好</h2>
        <div className="flex gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                difficulty === d
                  ? 'bg-olive-500 text-white shadow-md'
                  : 'bg-cream-200 text-wood-700 border border-cream-300 hover:bg-cream-300'
              }`}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleRecommend}
        disabled={selectedIds.length < 2}
        className={`w-full py-3 rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
          selectedIds.length >= 2
            ? 'bg-olive-500 hover:bg-olive-600 shadow-lg hover:shadow-xl'
            : 'bg-wood-300 cursor-not-allowed'
        }`}
      >
        <ChefHat className="w-5 h-5" />
        推荐菜谱
      </button>

      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-16 text-wood-400 space-y-4">
          <UtensilsCrossed className="w-16 h-16" />
          <p className="text-lg">选择食材开始推荐</p>
        </div>
      )}

      {hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-wood-400">
          <p className="text-lg">没有找到匹配的菜谱</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-wood-700 flex items-center gap-2">
            <Star className="w-5 h-5 text-olive-500" />
            推荐结果
          </h2>
          {results.map((scored) => {
            const { recipe, matchScore, matchedIngredients, missingIngredients } = scored;
            const isExpanded = expandedIds.includes(recipe.id);
            const matchPercent = Math.round(matchScore * 100);

            return (
              <div
                key={recipe.id}
                className="card-recipe overflow-hidden"
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => toggleExpanded(recipe.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl font-serif font-bold text-wood-800">
                        {recipe.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-wood-600">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(recipe.difficulty)}`}>
                          {DIFFICULTY_LABELS[recipe.difficulty]}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-4 h-4" />
                          {recipe.calories} 千卡
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {recipe.cookTime} 分钟
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-cream-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${matchRateColor(matchScore)} transition-all duration-500`}
                            style={{ width: `${matchPercent}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-wood-600">{matchPercent}%</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-cream-200 text-wood-600 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-wood-400 ml-3 mt-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-cream-200 pt-4 space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-wood-700">食材清单</h4>
                      <div className="space-y-1.5">
                        {matchedIngredients.map((ing) => (
                          <div key={ing.name} className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-green-700">{ing.name}</span>
                            <span className="text-wood-400">
                              {ing.amount} {ing.unit}
                            </span>
                          </div>
                        ))}
                        {missingIngredients.map((ing) => (
                          <div key={ing.name} className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="text-red-600">{ing.name}</span>
                            <span className="text-wood-400">
                              {ing.amount} {ing.unit}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToShoppingList(`${ing.name} ${ing.amount}${ing.unit}`);
                              }}
                              className="ml-auto p-1 text-wood-400 hover:text-olive-500 transition-colors"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-wood-500">
                        共 {recipe.steps.length} 个步骤
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCookingRecipe(recipe);
                          setCurrentPage('cooking');
                        }}
                        className="px-4 py-2 bg-olive-500 text-white rounded-lg font-medium hover:bg-olive-600 transition-colors"
                      >
                        开始烹饪
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
