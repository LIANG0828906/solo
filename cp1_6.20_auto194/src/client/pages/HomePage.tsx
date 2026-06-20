import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { RecipeCard } from '../components/RecipeCard';
import { FloatingToolbar } from '../components/FloatingToolbar';
import type { Recipe } from '../../shared/types';
import { CUISINE_TYPES } from '../../shared/types';
import { recipeService } from '../services/recipeService';

interface HomePageProps {
  selectedRecipes: string[];
  onToggleSelect: (id: string) => void;
  onClearSelected: () => void;
}

export const HomePage = ({ selectedRecipes, onToggleSelect, onClearSelected }: HomePageProps) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const [listKey, setListKey] = useState(0);

  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      try {
        const data = await recipeService.loadRecipes();
        setRecipes(data);
        setFilteredRecipes(data);
      } catch (error) {
        console.error('Failed to load recipes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRecipes();
  }, []);

  useEffect(() => {
    const filtered = recipeService.searchRecipes(searchKeyword, selectedCuisine);
    setFilteredRecipes(filtered);
    setListKey(prev => prev + 1);
  }, [searchKeyword, selectedCuisine, recipes]);

  const handleToggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    await recipeService.toggleFavorite(id, isFavorite);
    setRecipes([...recipeService.getCachedRecipes()]);
    setFilteredRecipes(recipeService.searchRecipes(searchKeyword, selectedCuisine));
  }, [searchKeyword, selectedCuisine]);

  const handleImageLoad = (id: string) => {
    setImageLoaded(prev => ({ ...prev, [id]: true }));
  };

  const handleCuisineChange = (cuisine: string) => {
    setSelectedCuisine(cuisine);
    setImageLoaded({});
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
    setImageLoaded({});
  };

  return (
    <div className="min-h-screen pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            探索美食
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-light)' }}>
            发现美味食谱，轻松生成购物清单
          </p>
        </div>

        <div className="mb-6">
          <div className="relative mb-4">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2"
              size={20}
              style={{ color: 'var(--text-light)' }}
            />
            <input
              type="text"
              placeholder="搜索食谱名称或描述..."
              value={searchKeyword}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-none outline-none transition-all focus:ring-2"
              style={{
                backgroundColor: 'white',
                boxShadow: 'var(--card-shadow)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {CUISINE_TYPES.map(cuisine => (
              <button
                key={cuisine.id}
                className={`btn whitespace-nowrap text-sm ${
                  selectedCuisine === cuisine.id ? 'btn-primary' : ''
                }`}
                style={{
                  backgroundColor: selectedCuisine === cuisine.id ? 'var(--primary)' : 'white',
                  color: selectedCuisine === cuisine.id ? 'var(--text)' : 'var(--text-light)',
                  boxShadow: selectedCuisine === cuisine.id ? 'none' : 'var(--card-shadow)',
                }}
                onClick={() => handleCuisineChange(cuisine.id)}
              >
                {cuisine.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="recipe-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="animate-pulse bg-gray-200" style={{ height: '200px' }} />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="flex justify-between">
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--text-light)' }}>
            <p className="text-xl">没有找到符合条件的食谱</p>
            <p className="mt-2">试试其他关键词或分类吧</p>
          </div>
        ) : (
          <div key={listKey} className="recipe-grid">
            {filteredRecipes.map((recipe, index) => (
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
