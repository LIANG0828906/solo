import { X, Clock, ChefHat, Plus } from 'lucide-react';
import { Recipe } from '../data/recipesData';
import { useFavorites } from '../context/FavoritesContext';
import { Heart } from 'lucide-react';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  onAddToPlan?: () => void;
}

const difficultyColors = {
  初级: 'bg-difficulty-easy',
  中级: 'bg-difficulty-medium',
  高级: 'bg-difficulty-hard',
};

export default function RecipeDetailModal({
  recipe,
  onClose,
  onAddToPlan,
}: RecipeDetailModalProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(recipe.id);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-bounce-in">
        <div className="relative">
          <div className="h-48 md:h-64 overflow-hidden rounded-t-2xl bg-gray-100">
            <img
              src={recipe.image}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200 shadow-md"
          >
            <X size={20} className="text-gray-700" />
          </button>

          <button
            onClick={() => toggleFavorite(recipe.id)}
            className="absolute top-4 right-14 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200 shadow-md"
          >
            <Heart
              size={20}
              className={`transition-all duration-200 ${
                favorited ? 'fill-red-500 text-red-500' : 'text-gray-700'
              }`}
            />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{recipe.name}</h2>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium text-white ${difficultyColors[recipe.difficulty]}`}
                >
                  {recipe.difficulty}
                </span>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Clock size={16} />
                  <span>{recipe.cookTime}分钟</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <ChefHat size={16} />
                  <span>{recipe.cuisine}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">食材清单</h3>
            <ul className="grid grid-cols-2 gap-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-gray-600 text-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">制作步骤</h3>
            <div className="space-y-5">
              {recipe.steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-gray-600 flex-1 pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">营养成分</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">蛋白质</span>
                  <span className="font-medium text-gray-800">
                    {recipe.nutrition.protein}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${recipe.nutrition.protein}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">碳水化合物</span>
                  <span className="font-medium text-gray-800">
                    {recipe.nutrition.carbs}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${recipe.nutrition.carbs}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">脂肪</span>
                  <span className="font-medium text-gray-800">
                    {recipe.nutrition.fat}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${recipe.nutrition.fat}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              * 以上为每日推荐摄入量百分比
            </p>
          </div>

          {onAddToPlan && (
            <button
              onClick={onAddToPlan}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              加入饮食计划
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
