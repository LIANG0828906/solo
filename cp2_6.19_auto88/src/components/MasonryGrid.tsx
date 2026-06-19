import type { Recipe } from '../types';
import RecipeCard from './RecipeCard';
import EmptyState from './EmptyState';
import { ChefHat } from 'lucide-react';

interface MasonryGridProps {
  recipes: Recipe[];
  loading?: boolean;
}

export default function MasonryGrid({
  recipes,
  loading,
}: MasonryGridProps) {
  if (loading) {
    return (
      <div className="masonry-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="recipe-card" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
            <div className="recipe-card-image" style={{ background: '#e5e7eb' }} />
            <div className="recipe-card-content">
              <div style={{ height: '1.5rem', background: '#e5e7eb', borderRadius: '0.25rem', marginBottom: '0.5rem' }} />
              <div style={{ height: '1rem', background: '#e5e7eb', borderRadius: '0.25rem', marginBottom: '0.25rem' }} />
              <div style={{ height: '1rem', background: '#e5e7eb', borderRadius: '0.25rem', marginBottom: '0.25rem' }} />
              <div style={{ height: '1rem', background: '#e5e7eb', borderRadius: '0.25rem', width: '66.666%' }} />
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
          <RecipeCard recipe={recipe} />
        </div>
      ))}
    </div>
  );
}
