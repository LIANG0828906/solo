import React, { useEffect } from 'react';
import { X, Clock, Flame, Zap, Droplets, Wheat } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { presetIngredients } from '@/data/presetIngredients';

const getIngredientIcon = (name: string): string => {
  const preset = presetIngredients.find(
    ing => ing.name === name || name.includes(ing.name) || ing.name.includes(name)
  );
  return preset?.icon || '🥘';
};

export const RecipeModal: React.FC = () => {
  const { selectedRecipe, selectRecipe } = useAppStore();

  useEffect(() => {
    if (selectedRecipe) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedRecipe]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectRecipe(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectRecipe]);

  if (!selectedRecipe) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectRecipe(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => selectRecipe(null)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-all duration-200 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <h2 
            className="text-xl font-bold mb-2 pr-10"
            style={{ fontSize: '20px', color: '#222222' }}
          >
            {selectedRecipe.name}
          </h2>

          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <span style={{ fontSize: '15px', color: '#757575' }}>
              烹饪时间：{selectedRecipe.cookingTime}分钟
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-6">
            {selectedRecipe.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm rounded-full bg-green-50 text-green-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">所需食材</h3>
            <div className="flex flex-wrap gap-2">
              {selectedRecipe.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100"
                >
                  <span>{getIngredientIcon(ingredient)}</span>
                  <span className="text-sm text-gray-700">{ingredient}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">烹饪步骤</h3>
            <div className="space-y-2">
              {selectedRecipe.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-3"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-600 leading-relaxed pt-0.5">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">营养信息</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <p 
                  className="font-bold"
                  style={{ fontSize: '14px', color: '#333333' }}
                >
                  {selectedRecipe.calories}
                </p>
                <p style={{ fontSize: '12px', color: '#888888' }}>热量(kcal)</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
                <p 
                  className="font-bold"
                  style={{ fontSize: '14px', color: '#333333' }}
                >
                  {selectedRecipe.protein}g
                </p>
                <p style={{ fontSize: '12px', color: '#888888' }}>蛋白质</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Droplets className="w-4 h-4 text-blue-500" />
                </div>
                <p 
                  className="font-bold"
                  style={{ fontSize: '14px', color: '#333333' }}
                >
                  {selectedRecipe.fat}g
                </p>
                <p style={{ fontSize: '12px', color: '#888888' }}>脂肪</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Wheat className="w-4 h-4 text-amber-500" />
                </div>
                <p 
                  className="font-bold"
                  style={{ fontSize: '14px', color: '#333333' }}
                >
                  {selectedRecipe.carbs}g
                </p>
                <p style={{ fontSize: '12px', color: '#888888' }}>碳水</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
