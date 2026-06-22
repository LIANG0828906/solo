import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Ingredient } from '../types';

interface IngredientListProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

const UNIT_OPTIONS = ['g', 'kg', 'ml', 'L', '个', '勺', '杯', '其他'];

export function IngredientList({ ingredients, onChange }: IngredientListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const addIngredient = () => {
    const newIngredient: Ingredient = {
      id: uuidv4(),
      name: '',
      amount: 0,
      unit: 'g',
    };
    onChange([...ingredients, newIngredient]);
    if (!isExpanded) setIsExpanded(true);
  };

  const removeIngredient = (id: string) => {
    onChange(ingredients.filter((i) => i.id !== id));
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    onChange(
      ingredients.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-pink-50 hover:from-orange-100 hover:to-pink-100 transition-colors"
      >
        <span className="font-semibold text-gray-800">原料列表 ({ingredients.length})</span>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? '2000px' : '0',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="p-5 space-y-3">
          {ingredients.map((ingredient, index) => (
            <div
              key={ingredient.id}
              className="flex items-center gap-3 animate-fadeIn"
              style={{
                animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
              }}
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(ingredient.id, 'name', e.target.value)}
                  placeholder="原料名称"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400"
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  value={ingredient.amount || ''}
                  onChange={(e) => updateIngredient(ingredient.id, 'amount', Number(e.target.value))}
                  placeholder="数量"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-center"
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div className="w-20">
                <select
                  value={ingredient.unit}
                  onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-white"
                  style={{ borderRadius: '10px' }}
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(ingredient.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addIngredient}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
            style={{ borderRadius: '10px' }}
          >
            <Plus size={20} />
            添加原料
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
