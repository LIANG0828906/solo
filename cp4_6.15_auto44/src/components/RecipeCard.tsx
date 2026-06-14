import { useState } from 'react';
import { Clock, ChefHat, Check, X, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import type { MatchedRecipe } from '@/engine/recipeEngine';

interface RecipeCardProps {
  recipe: MatchedRecipe;
  onCook: (recipe: MatchedRecipe) => void;
}

const difficultyStyle: Record<string, string> = {
  '简单': 'bg-green-100 text-green-700',
  '中等': 'bg-amber-100 text-amber-700',
  '复杂': 'bg-red-100 text-red-700',
};

export default function RecipeCard({ recipe, onCook }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false);

  const percent = Math.round(recipe.matchRate * 100);

  return (
    <div className="bg-white rounded-xl border border-cream-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif font-semibold text-gray-800 text-base leading-tight">{recipe.name}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${difficultyStyle[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Clock size={13} />
          <span>{recipe.cookTime}分钟</span>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>食材匹配度: {percent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-cream-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-category-vegetable transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="px-4 pb-3 space-y-1">
        {recipe.ingredients.map((ing) => {
          const available = recipe.availableIngredients.includes(ing.name);
          return (
            <div key={ing.name} className="flex items-center gap-1.5 text-sm">
              {available ? (
                <>
                  <Check size={14} className="shrink-0 text-green-500" />
                  <span className="text-gray-700">{ing.name}</span>
                </>
              ) : (
                <>
                  <X size={14} className="shrink-0 text-red-400" />
                  <span className="text-gray-700">{ing.name}</span>
                  <span className="text-xs text-gray-400">{ing.quantity}{ing.unit}</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 pb-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{expanded ? '收起步骤' : '查看步骤'}</span>
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-3 animate-fade-in">
          <ol className="space-y-1.5">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-cream-200 text-xs font-medium text-gray-500">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {recipe.matchRate >= 0.7 && (
        <div className="px-4 pb-4 pt-1">
          <button
            type="button"
            onClick={() => onCook(recipe)}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-category-vegetable py-2 text-sm font-medium text-white hover:scale-105 active:scale-95 transition-transform"
          >
            <Flame size={15} />
            开始烹饪
          </button>
        </div>
      )}
    </div>
  );
}
