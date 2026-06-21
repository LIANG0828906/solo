import React from 'react';
import { Recipe, MatchResult } from '@/types';
import { RecipeCard } from '@/RecipeCard';

interface MasonryGridProps {
  recipes: Recipe[];
  matchResults?: MatchResult[];
  loading?: boolean;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({ recipes, matchResults, loading }) => {
  const getMatchScore = (recipeId: number): number | undefined => {
    if (!matchResults) return undefined;
    const match = matchResults.find(m => m.recipe.id === recipeId);
    return match?.matchScore;
  };

  if (loading) {
    return (
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="break-inside-avoid mb-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
              <div className="aspect-[4/3] bg-gradient-to-br from-orange-100 to-amber-50" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-stone-200 rounded w-3/4" />
                <div className="h-4 bg-stone-100 rounded w-full" />
                <div className="h-4 bg-stone-100 rounded w-2/3" />
                <div className="flex justify-between pt-2">
                  <div className="h-6 bg-stone-100 rounded-full w-24" />
                  <div className="h-6 bg-stone-100 rounded-full w-12" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🍳</div>
        <p className="text-xl text-stone-500 mb-2">暂无匹配的食谱</p>
        <p className="text-stone-400">试试其他关键词或食材吧~</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
      {recipes.map((recipe, idx) => (
        <div
          key={recipe.id}
          className="animate-fadeInUp"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <RecipeCard recipe={recipe} matchScore={getMatchScore(recipe.id)} />
        </div>
      ))}
    </div>
  );
};
