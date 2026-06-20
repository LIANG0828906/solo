import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';
import type { RecommendationResult } from '@/types';
import { useAppStore } from '@/stores/appStore';

interface RecipeCardProps {
  result: RecommendationResult;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ result }) => {
  const { selectRecipe } = useAppStore();
  const { recipe, matchScore, matchedIngredients } = result;

  const matchBarGradient = useMemo(() => {
    const percentage = Math.min(matchScore, 100);
    return `linear-gradient(90deg, #4CAF50 0%, #81C784 ${percentage}%, #E0E0E0 ${percentage}%)`;
  }, [matchScore]);

  const handleViewDetails = () => {
    selectRecipe(recipe);
  };

  return (
    <div 
      className="bg-white rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group"
      style={{ 
        width: '220px', 
        height: '280px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      }}
    >
      <div className="p-4 h-full flex flex-col">
        <h3 
          className="text-base font-bold text-gray-800 mb-3 line-clamp-2 leading-tight"
          style={{ fontSize: '16px', color: '#333333' }}
        >
          {recipe.name}
        </h3>

        <div className="flex items-center gap-1.5 mb-3">
          <Clock className="w-4 h-4 text-gray-400" />
          <span style={{ fontSize: '13px', color: '#757575' }}>
            {recipe.cookingTime}分钟
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: '12px', color: '#888888' }}>匹配度</span>
          <span className="font-bold" style={{ fontSize: '14px', color: '#4CAF50' }}>
            {matchScore.toFixed(1)}%
          </span>
        </div>

        <div 
          className="h-1.5 rounded-full mb-4"
          style={{ height: '6px', background: matchBarGradient }}
        />

        <div className="flex flex-wrap gap-1 mb-4">
          {matchedIngredients.slice(0, 4).map((ing, index) => (
            <span
              key={index}
              className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700"
            >
              {ing}
            </span>
          ))}
          {matchedIngredients.length > 4 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
              +{matchedIngredients.length - 4}
            </span>
          )}
        </div>

        <div className="mt-auto">
          <button
            onClick={handleViewDetails}
            className="w-full text-center py-2 transition-all duration-200 hover:underline"
            style={{ fontSize: '14px', color: '#1976D2' }}
          >
            查看详情 →
          </button>
        </div>
      </div>
    </div>
  );
};
