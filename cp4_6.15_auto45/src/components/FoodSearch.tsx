import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Food, searchFood } from '@/data/foodDatabase';

interface FoodSearchProps {
  onSelectFood: (food: Food, amount: number) => void;
  placeholder?: string;
}

const FoodSearch: React.FC<FoodSearchProps> = ({ onSelectFood, placeholder = '搜索食物...' }) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [amount, setAmount] = useState(100);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!keyword.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(() => {
      const matched = searchFood(keyword);
      setResults(matched);
      setIsLoading(false);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [keyword]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (food: Food) => {
    setSelectedFood(food);
    setAmount(food.defaultUnit === '份' ? 1 : 100);
    setIsOpen(false);
    setKeyword(food.name);
  };

  const handleConfirm = () => {
    if (selectedFood) {
      onSelectFood(selectedFood, amount);
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      setKeyword('');
      setSelectedFood(null);
      setAmount(100);
    }
  };

  const handleClear = () => {
    setKeyword('');
    setSelectedFood(null);
    setResults([]);
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setIsOpen(true);
            setSelectedFood(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-gray-100 bg-white focus:border-[#98D8C8] focus:outline-none transition-all duration-300 text-gray-700 placeholder-gray-400"
          style={{ fontFamily: "'Quicksand', sans-serif" }}
        />
        {keyword && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {isOpen && keyword && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-64 overflow-y-auto z-50 animate-fade-in">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center text-gray-400">
              <Loader2 size={20} className="animate-spin-slow mr-2" />
              搜索中...
            </div>
          ) : results.length > 0 ? (
            results.map((food) => (
              <button
                key={food.id}
                onClick={() => handleSelect(food)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F0F9F7] transition-colors duration-200 text-left border-b border-gray-50 last:border-b-0"
              >
                <span className="text-2xl">{food.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{food.name}</div>
                  <div className="text-xs text-gray-400">
                    {food.calories} kcal / 100{food.defaultUnit}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-400">未找到相关食物</div>
          )}
        </div>
      )}

      {selectedFood && (
        <div className="mt-3 p-4 bg-gradient-to-r from-[#F0F9F7] to-[#E8F4FD] rounded-xl animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{selectedFood.icon}</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">{selectedFood.name}</div>
              <div className="text-xs text-gray-500">
                热量 {selectedFood.calories} kcal · 蛋白 {selectedFood.protein}g · 脂肪 {selectedFood.fat}g · 碳水 {selectedFood.carbs}g
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              min="1"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#98D8C8] focus:outline-none text-center"
            />
            <span className="text-gray-600">{selectedFood.defaultUnit}</span>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 bg-gradient-to-r from-[#98D8C8] to-[#A8D8EA] text-white rounded-lg font-medium btn-hover"
            >
              添加
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodSearch;
