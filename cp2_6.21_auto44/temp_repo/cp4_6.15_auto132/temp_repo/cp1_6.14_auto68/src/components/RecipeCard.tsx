import { useNavigate } from 'react-router-dom';
import { Star, ChefHat } from 'lucide-react';
import type { Recipe } from '../types';
import { CATEGORY_COLORS } from '../types';
import { AnimatedNumber } from './AnimatedNumber';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

export function RecipeCard({ recipe, index }: RecipeCardProps) {
  const navigate = useNavigate();
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    delay: index * 100,
  });

  const categoryColor = CATEGORY_COLORS[recipe.category];

  const handleClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        background: 'linear-gradient(135deg, #fffaf0 0%, #fff8e1 100%)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = isVisible ? 'translateY(0)' : 'translateY(20px)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: categoryColor.ribbon }}
      />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between mb-3">
          <div
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: categoryColor.bg,
              color: categoryColor.text,
            }}
          >
            {categoryColor.label}
          </div>
          {recipe.latestRating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={16} fill="#e67e22" color="#e67e22" />
              <AnimatedNumber
                value={recipe.latestRating}
                className="text-sm font-semibold"
                style={{ color: '#e67e22' }}
              />
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
          {recipe.name}
        </h3>

        <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
          <ChefHat size={14} />
          {recipe.ovenModel || '未指定烤箱'}
        </p>

        {recipe.finalProduct.images.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {recipe.finalProduct.images.slice(0, 3).map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`成品 ${i + 1}`}
                className="w-full h-16 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{recipe.ingredients.length} 种原料</span>
          <span>{recipe.steps.length} 个步骤</span>
        </div>
      </div>
    </div>
  );
}
