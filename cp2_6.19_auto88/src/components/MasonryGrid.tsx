import type { Recipe } from '../types';
import RecipeCard from './RecipeCard';
import EmptyState from './EmptyState';
import { ChefHat } from 'lucide-react';

interface MasonryGridProps {
  recipes: Recipe[];
  loading?: boolean;
  onRecipeClick?: (recipeId: string) => void;
  onFavoriteToggle?: (recipeId: string) => void;
  favoritedMap?: Record<string, boolean>;
}

export default function MasonryGrid({
  recipes,
  loading,
  onRecipeClick,
  onFavoriteToggle,
  favoritedMap = {},
}: MasonryGridProps) {
  if (loading) {
    return (
      <div className="masonry-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="recipe-card animate-pulse">
            <div className="recipe-card-image bg-gray-200" />
            <div className="recipe-card-content">
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded mb-1" />
              <div className="h-4 bg-gray-200 rounded mb-1" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <EmptyState
        icon={<ChefHat className="empty-state-icon" />}
        title="暂无食谱"
        description="还没有任何食谱，快去创建第一个美食食谱吧！"
      />
    );
  }

  return (
    <div className="masonry-grid">
      {recipes.map((recipe, index) => (
        <div
          key={recipe.id}
          style={{
            animation: `fadeIn 300ms ease-out ${index * 50}ms both`,
          }}
        >
          <RecipeCard
            recipe={recipe}
            isFavorited={!!favoritedMap[recipe.id]}
            onFavoriteToggle={onFavoriteToggle}
            onClick={onRecipeClick}
          />
        </div>
      ))}
    </div>
  );
}
