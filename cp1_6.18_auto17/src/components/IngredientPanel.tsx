import React, { useState, useMemo } from 'react';
import { Plus, X, ChevronDown, ChefHat } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { presetIngredients } from '@/data/presetIngredients';
import type { Ingredient } from '@/types';

export const IngredientPanel: React.FC = () => {
  const [customIngredient, setCustomIngredient] = useState('');
  const { selectedIngredients, addIngredient, removeIngredient, isPanelCollapsed, togglePanel } = useAppStore();

  const isIngredientSelected = useMemo(() => {
    const selectedNames = selectedIngredients.map(ing => ing.name.toLowerCase());
    return (name: string) => selectedNames.includes(name.toLowerCase());
  }, [selectedIngredients]);

  const handleAddPreset = (ingredient: Ingredient) => {
    if (!isIngredientSelected(ingredient.name)) {
      addIngredient({ name: ingredient.name, icon: ingredient.icon });
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customIngredient.trim().slice(0, 15);
    if (trimmed && !isIngredientSelected(trimmed)) {
      addIngredient({ name: trimmed, icon: '🥘' });
    }
    setCustomIngredient('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddCustom(e);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer md:cursor-default md:bg-transparent bg-gray-50"
        onClick={() => window.innerWidth < 768 && togglePanel()}
      >
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-bold text-gray-800">我的冰箱</h2>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 md:hidden transition-transform duration-300 ${isPanelCollapsed ? '' : 'rotate-180'}`}
        />
      </div>

      <div className={`transition-all duration-300 overflow-hidden md:max-h-none ${isPanelCollapsed ? 'max-h-0' : 'max-h-[2000px]'}`}>
        {selectedIngredients.length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-500 mb-2">已选食材 ({selectedIngredients.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedIngredients.map(ingredient => (
                <span
                  key={ingredient.id}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all duration-200 hover:shadow-sm"
                  style={{ backgroundColor: '#E8F5E9' }}
                >
                  <span>{ingredient.icon}</span>
                  <span className="text-gray-700">{ingredient.name}</span>
                  <button
                    onClick={() => removeIngredient(ingredient.id)}
                    className="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 pb-4">
          <p className="text-sm text-gray-500 mb-2">快速添加</p>
          <div className="grid grid-cols-4 gap-2">
            {presetIngredients.map(ingredient => {
              const selected = isIngredientSelected(ingredient.name);
              return (
                <button
                  key={ingredient.id}
                  onClick={() => handleAddPreset(ingredient)}
                  disabled={selected}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all duration-200 ${
                    selected
                      ? 'border-green-300 bg-green-50 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 hover:border-green-400 hover:bg-green-50 hover:shadow-sm active:scale-95'
                  }`}
                >
                  <span className="text-xl">{ingredient.icon}</span>
                  <span className="text-xs text-gray-600 truncate w-full text-center">
                    {ingredient.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pb-4">
          <p className="text-sm text-gray-500 mb-2">自定义食材</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customIngredient}
              onChange={(e) => setCustomIngredient(e.target.value.slice(0, 15))}
              onKeyDown={handleKeyDown}
              placeholder="输入食材名称..."
              maxLength={15}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleAddCustom}
              disabled={!customIngredient.trim()}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">最多15个字符</p>
        </div>
      </div>
    </div>
  );
};
