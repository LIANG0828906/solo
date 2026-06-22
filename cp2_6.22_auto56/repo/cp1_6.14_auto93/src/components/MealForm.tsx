import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, UtensilsCrossed } from 'lucide-react';
import type { Food } from '../../shared/types';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface MealFormProps {
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealLabel: string;
  onAdded?: () => void;
}

export default function MealForm({ date, mealType, mealLabel, onAdded }: MealFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [isAdding, setIsAdding] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 200);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const searchFoods = async () => {
      try {
        const response = await axios.get('/api/foods/search', {
          params: { q: debouncedSearch }
        });
        if (response.data.success) {
          setSearchResults(response.data.data || []);
          setShowDropdown(true);
        }
      } catch {
        setSearchResults([]);
      }
    };

    searchFoods();
  }, [debouncedSearch]);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setQuantity(100);
    setShowDropdown(false);
    setSearchTerm(food.name);
  };

  const scaleFactor = selectedFood ? quantity / selectedFood.servingSize : 1;
  const scaledCalories = selectedFood ? Math.round(selectedFood.calories * scaleFactor) : 0;
  const scaledProtein = selectedFood ? +(selectedFood.protein * scaleFactor).toFixed(1) : 0;
  const scaledCarbs = selectedFood ? +(selectedFood.carbs * scaleFactor).toFixed(1) : 0;
  const scaledFat = selectedFood ? +(selectedFood.fat * scaleFactor).toFixed(1) : 0;

  const totalMacros = scaledProtein + scaledCarbs + scaledFat || 1;
  const proteinPercent = (scaledProtein / totalMacros) * 100;
  const carbsPercent = (scaledCarbs / totalMacros) * 100;
  const fatPercent = (scaledFat / totalMacros) * 100;

  const handleAdd = async () => {
    if (!selectedFood || isAdding) return;

    setIsAdding(true);
    try {
      await axios.post('/api/meals', {
        date,
        mealType,
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        quantity,
        calories: scaledCalories,
        protein: scaledProtein,
        carbs: scaledCarbs,
        fat: scaledFat,
      });
      setSelectedFood(null);
      setSearchTerm('');
      setQuantity(100);
      onAdded?.();
    } catch {
      // ignore
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={cn('rounded-2xl bg-white p-5 shadow-sm border border-[#E8F5E9]')}
      style={{ borderRadius: '12px' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-full bg-[#8BC34A] bg-opacity-15 flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5" style={{ color: '#689F38' }} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{mealLabel}</h3>
          <p className="text-xs text-gray-400">记录饮食，保持健康</p>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedFood(null);
            }}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="搜索食物，如：鸡胸肉、米饭..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5 bg-[#F8FFF0] border border-[#C5E1A5] rounded-xl text-sm text-gray-700 placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-[#8BC34A] focus:ring-opacity-40 transition-all'
            )}
            style={{ borderRadius: '12px' }}
          />
        </div>

        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-[#E8F5E9] rounded-xl shadow-lg overflow-hidden"
            style={{ borderRadius: '12px' }}>
            {searchResults.map((food) => (
              <div
                key={food.id}
                onMouseDown={() => handleSelectFood(food)}
                className="px-4 py-3 cursor-pointer hover:bg-[#F1F8E9] transition-colors border-b border-gray-50 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{food.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{food.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: '#689F38' }}>{food.calories} kcal</p>
                    <p className="text-xs text-gray-400">/ {food.servingSize}{food.servingUnit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">份量</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 10))}
            className="w-9 h-9 rounded-xl bg-[#F1F8E9] text-[#689F38] font-bold hover:bg-[#E8F5E9] transition-colors flex items-center justify-center"
            style={{ borderRadius: '12px' }}
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
            className={cn(
              'flex-1 text-center py-2.5 bg-[#F8FFF0] border border-[#C5E1A5] rounded-xl text-sm font-semibold text-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-[#8BC34A] focus:ring-opacity-40 transition-all'
            )}
            style={{ borderRadius: '12px' }}
          />
          <button
            onClick={() => setQuantity((q) => q + 10)}
            className="w-9 h-9 rounded-xl bg-[#F1F8E9] text-[#689F38] font-bold hover:bg-[#E8F5E9] transition-colors flex items-center justify-center"
            style={{ borderRadius: '12px' }}
          >
            +
          </button>
          <span className="text-sm text-gray-500 min-w-[40px]">{selectedFood?.servingUnit || 'g'}</span>
        </div>
      </div>

      {selectedFood && (
        <div className="mb-4 p-4 bg-gradient-to-br from-[#F1F8E9] to-[#E8F5E9] rounded-xl" style={{ borderRadius: '12px' }}>
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs text-gray-500">预估热量</p>
              <p className="text-2xl font-bold" style={{ color: '#558B2F' }}>
                {scaledCalories}
                <span className="text-sm font-medium ml-1" style={{ color: '#8BC34A' }}>kcal</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">蛋白质</span>
              <span className="font-semibold" style={{ color: '#FF6B9D' }}>{scaledProtein}g</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">碳水化合物</span>
              <span className="font-semibold" style={{ color: '#FFB74D' }}>{scaledCarbs}g</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">脂肪</span>
              <span className="font-semibold" style={{ color: '#64B5F6' }}>{scaledFat}g</span>
            </div>
          </div>

          <div className="flex h-2 rounded-full overflow-hidden bg-white bg-opacity-60">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${proteinPercent}%`, backgroundColor: '#FF6B9D' }}
            />
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${carbsPercent}%`, backgroundColor: '#FFB74D' }}
            />
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${fatPercent}%`, backgroundColor: '#64B5F6' }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!selectedFood || isAdding}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all',
          selectedFood && !isAdding
            ? 'shadow-md hover:shadow-lg active:scale-[0.98]'
            : 'opacity-50 cursor-not-allowed'
        )}
        style={{
          backgroundColor: selectedFood && !isAdding ? '#8BC34A' : '#BDBDBD',
          borderRadius: '12px',
        }}
      >
        <Plus className="w-5 h-5" />
        {isAdding ? '添加中...' : '添加到饮食记录'}
      </button>
    </div>
  );
}
