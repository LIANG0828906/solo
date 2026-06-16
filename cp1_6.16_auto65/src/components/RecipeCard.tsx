import { Heart } from 'lucide-react';
import { Recipe } from '../data/recipesData';
import { useFavorites } from '../context/FavoritesContext';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  compact?: boolean;
}

const difficultyColors = {
  初级: 'bg-difficulty-easy text-white',
  中级: 'bg-difficulty-medium text-white',
  高级: 'bg-difficulty-hard text-white',
};

export default function RecipeCard({ recipe, onClick, compact = false }: RecipeCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(recipe.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(recipe.id);
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={onClick}
      >
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{recipe.name}</p>
          <p className="text-xs text-gray-500">{recipe.cookTime}分钟</p>
        </div>
        <button
          onClick={handleFavoriteClick}
          className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
        >
          <Heart
            size={16}
            className={`transition-colors duration-200 ${
              favorited ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-card shadow-card hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-200 ease cursor-pointer overflow-hidden flex flex-col"
      onClick={onClick}
    >
      <div className="p-4 flex flex-col items-center">
        <div className="relative mb-3">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-[120px] h-[120px] rounded-full object-cover"
          />
          <button
            onClick={handleFavoriteClick}
            className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
          >
            <Heart
              size={16}
              className={`transition-all duration-200 ${
                favorited
                  ? 'fill-red-500 text-red-500 scale-110'
                  : 'text-gray-400'
              }`}
            />
          </button>
        </div>

        <h3 className="text-base font-bold text-gray-800 mb-2 text-center line-clamp-1">
          {recipe.name}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[recipe.difficulty]}`}
          >
            {recipe.difficulty}
          </span>
          <span className="text-xs text-gray-500">{recipe.cookTime}分钟</span>
        </div>

        <p className="text-xs text-gray-400">{recipe.cuisine}</p>
      </div>

      {favorited && (
        <div className="h-1 bg-gradient-to-r from-primary to-secondary w-full" />
      )}
    </div>
  );
}
