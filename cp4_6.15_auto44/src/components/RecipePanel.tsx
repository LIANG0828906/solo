import { useMemo } from 'react';
import type { Ingredient } from '@/types';
import { recipes } from '@/data/recipes';
import { matchRecipes, type MatchedRecipe } from '@/engine/recipeEngine';
import RecipeCard from '@/components/RecipeCard';

interface RecipePanelProps {
  ingredients: Ingredient[];
  onCook: (recipe: MatchedRecipe) => void;
}

export default function RecipePanel({ ingredients, onCook }: RecipePanelProps) {
  const matchedRecipes = useMemo(() => matchRecipes(ingredients, recipes), [ingredients]);

  return (
    <div className="bg-cream-50 rounded-2xl border border-cream-200 p-6">
      <div className="mb-4">
        <h2 className="font-serif text-lg font-semibold text-gray-800">🍳 智能推荐</h2>
        <p className="mt-0.5 text-sm text-gray-500">根据冰箱食材为你推荐菜谱</p>
      </div>

      {ingredients.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          请先添加食材，我将为你推荐可做的菜谱
        </div>
      ) : matchedRecipes.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          暂无匹配菜谱，试试添加更多食材吧
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onCook={onCook} />
          ))}
        </div>
      )}
    </div>
  );
}
