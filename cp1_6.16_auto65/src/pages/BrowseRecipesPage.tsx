import { useState, useMemo } from 'react';
import { recipes, Recipe } from '../data/recipesData';
import RecipeCard from '../components/RecipeCard';
import SearchBar from '../components/SearchBar';
import RecipeDetailModal from '../components/RecipeDetailModal';
import { useMealPlan } from '../context/MealPlanContext';

export default function BrowseRecipesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddToPlanToast, setShowAddToPlanToast] = useState(false);
  const { mealPlan, addRecipeToDay } = useMealPlan();

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;

    const query = searchQuery.toLowerCase();
    return recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(query) ||
        recipe.cuisine.toLowerCase().includes(query) ||
        recipe.ingredients.some((ing) =>
          ing.toLowerCase().includes(query)
        )
    );
  }, [searchQuery]);

  const handleAddToPlan = () => {
    if (!selectedRecipe) return;

    const todayIndex = new Date().getDay();
    const dayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
    const todayKey = `day-${dayIndex}`;

    addRecipeToDay(todayKey, {
      recipeId: selectedRecipe.id,
      name: selectedRecipe.name,
      image: selectedRecipe.image,
      cookTime: selectedRecipe.cookTime,
    });

    setShowAddToPlanToast(true);
    setTimeout(() => setShowAddToPlanToast(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              发现美味食谱
            </h1>
            <p className="text-gray-500">
              浏览 {recipes.length} 道精选食谱，规划你的一周美食
            </p>
          </div>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <p className="text-center text-sm text-gray-400 mt-3">
            找到 {filteredRecipes.length} 个结果
          </p>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500">没有找到匹配的食谱</p>
            <p className="text-gray-400 text-sm mt-2">试试其他关键词吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onAddToPlan={handleAddToPlan}
        />
      )}

      {showAddToPlanToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg animate-slide-up">
          ✓ 已添加到今日计划
        </div>
      )}
    </div>
  );
}
