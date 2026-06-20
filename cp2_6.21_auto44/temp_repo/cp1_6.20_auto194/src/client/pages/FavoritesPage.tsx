import { useState, useEffect, useCallback } from 'react';
import { RecipeCard } from '../components/RecipeCard';
import { FloatingToolbar } from '../components/FloatingToolbar';
import type { Recipe } from '../../shared/types';
import { recipeService } from '../services/recipeService';
import { Heart } from 'lucide-react';

interface FavoritesPageProps {
  selectedRecipes: string[];
  onToggleSelect: (id: string) => void;
  onClearSelected: () => void;
}

export const FavoritesPage = ({ selectedRecipes, onToggleSelect, onClearSelected }: FavoritesPageProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      try {
        await recipeService.loadRecipes();
        const favorites = recipeService.getFavoriteRecipes();
        setRecipes(favorites);
        setListKey(prev => prev + 1);
      } catch (error) {
        console.error('Failed to load favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const handleToggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    await recipeService.toggleFavorite(id, isFavorite);
    const favorites = recipeService.getFavoriteRecipes();
    setRecipes(favorites);
    setListKey(prev => prev + 1);
    setImageLoaded({});
  }, []);

  const handleImageLoad = (id: string) => {
    setImageLoaded(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="min-h-screen pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--text)' }}>
            <Heart size={32} fill="#e74c3c" color="#e74c3c" />
            我的收藏
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-light)' }}>
            已收藏 {recipes.length} 个食谱
          </p>
        </div>

        {loading ? (
          <div className="recipe-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="animate-pulse bg-gray-200" style={{ height: '200px' }} />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16">
            <Heart size={64} className="mx-auto mb-4" style={{ color: 'var(--primary)' }} />
            <p className="text-xl mb-2" style={{ color: 'var(--text)' }}>
              还没有收藏任何食谱
            </p>
            <p className="mb-6" style={{ color: 'var(--text-light)' }}>
              去首页发现美味的食谱吧
            </p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = '/'}
            >
              浏览食谱
            </button>
          </div>
        ) : (
          <div key={listKey} className="recipe-grid">
            {recipes.map((recipe, index) => (
              <div key={recipe.id} className="relative">
                <RecipeCard
                  recipe={recipe}
                  onToggleFavorite={handleToggleFavorite}
                  delay={index * 50}
                  imageLoaded={imageLoaded}
                  onImageLoad={handleImageLoad}
                />
                <button
                  className={`absolute bottom-4 left-4 btn text-sm ${
                    selectedRecipes.includes(recipe.id) ? 'btn-secondary' : 'btn-outline'
                  }`}
                  style={{
                    padding: '6px 12px',
                    minHeight: '36px',
                    minWidth: 'auto',
                    zIndex: 10,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(recipe.id);
                  }}
                >
                  {selectedRecipes.includes(recipe.id) ? '已添加' : '加入清单'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingToolbar
        selectedCount={selectedRecipes.length}
        onClear={onClearSelected}
      />
    </div>
  );
};
