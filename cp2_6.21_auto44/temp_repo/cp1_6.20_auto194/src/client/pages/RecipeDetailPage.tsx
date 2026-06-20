import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChefHat, User, Heart, ShoppingCart, ArrowLeft } from 'lucide-react';
import type { Recipe } from '../../shared/types';
import { recipeService } from '../services/recipeService';
import { apiService } from '../services/apiService';

interface RecipeDetailPageProps {
  selectedRecipes: string[];
  onToggleSelect: (id: string) => void;
}

export const RecipeDetailPage = ({ selectedRecipes, onToggleSelect }: RecipeDetailPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const loadRecipe = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await recipeService.getRecipeById(id);
        setRecipe(data || null);
      } catch (error) {
        console.error('Failed to load recipe:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRecipe();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!recipe) return;
    const updated = await recipeService.toggleFavorite(recipe.id, !recipe.isFavorite);
    if (updated) {
      setRecipe(updated);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-gray-200 rounded-xl" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: 'var(--text-light)' }}>
            食谱不存在
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const isSelected = selectedRecipes.includes(recipe.id);

  return (
    <div className="min-h-screen pt-16 pb-12">
      <div className="relative">
        <div className="relative h-96 md:h-[500px] overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
            style={{ opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
              <button
                className="btn mb-4 text-white"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={18} className="mr-2" />
                返回
              </button>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
                {recipe.name}
              </h1>
              <p className="text-white/80 text-lg">{recipe.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="card p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <User size={20} style={{ color: 'var(--secondary)' }} />
                <span>{recipe.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} style={{ color: 'var(--secondary)' }} />
                <span>{recipe.cookTime}分钟</span>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat size={20} style={{ color: 'var(--secondary)' }} />
                <div className="flex gap-1">
                  {Array.from({ length: recipe.difficulty }).map((_, i) => (
                    <span key={i}>🍳</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                className="btn"
                onClick={handleToggleFavorite}
                style={{
                  backgroundColor: recipe.isFavorite ? '#fee2e2' : 'white',
                  border: recipe.isFavorite ? '2px solid #ef4444' : 'none',
                  boxShadow: 'var(--card-shadow)',
                }}
              >
                <Heart
                  size={20}
                  className="mr-2"
                  fill={recipe.isFavorite ? '#e74c3c' : 'none'}
                  color={recipe.isFavorite ? '#e74c3c' : 'var(--text-light)'}
                />
                {recipe.isFavorite ? '已收藏' : '收藏'}
              </button>
              <button
                className={isSelected ? 'btn btn-secondary' : 'btn btn-primary'}
                onClick={() => onToggleSelect(recipe.id)}
              >
                <ShoppingCart size={20} className="mr-2" />
                {isSelected ? '已加入清单' : '加入购物清单'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              所需食材
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2" style={{ borderColor: 'var(--primary)' }}>
                    <th className="text-left py-3 px-2">名称</th>
                    <th className="text-left py-3 px-2">用量</th>
                    <th className="text-left py-3 px-2">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.ingredients.map((ing, index) => (
                    <tr
                      key={ing.id}
                      className={index % 2 === 0 ? 'bg-gray-50' : ''}
                    >
                      <td className="py-3 px-2">{ing.name}</td>
                      <td className="py-3 px-2">
                        {ing.quantity} {ing.unit}
                      </td>
                      <td className="py-3 px-2" style={{ color: 'var(--text-light)' }}>
                        {ing.note || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              烹饪步骤
            </h2>
            <ol className="space-y-4">
              {recipe.steps.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--text)' }}
                  >
                    {index + 1}
                  </span>
                  <p className="pt-1" style={{ color: 'var(--text)' }}>
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
