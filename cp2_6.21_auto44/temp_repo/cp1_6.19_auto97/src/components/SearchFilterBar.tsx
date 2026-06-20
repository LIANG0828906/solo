import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaHeart } from 'react-icons/fa';
import { useRecipeStore } from '../store/useRecipeStore';
import type { CuisineType, DifficultyType } from '../types/recipe';

export function SearchFilterBar() {
  const {
    searchQuery,
    setSearchQuery,
    cuisineFilter,
    setCuisineFilter,
    difficultyFilter,
    setDifficultyFilter,
    toggleShowFavorites,
    favorites,
  } = useRecipeStore();

  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue, setSearchQuery]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap items-center gap-3 p-4 bg-white/80 backdrop-blur-sm border-b border-[#E0E0E0]"
    >
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDC3C7]" size={16} />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="搜索菜名或标签..."
          className="w-full pl-10 pr-4 py-2.5 rounded-[8px] border border-[#D5D8DC] text-[#2C3E50] placeholder-[#BDC3C7] focus:outline-none focus:border-[#E67E22] transition-colors bg-white"
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={cuisineFilter}
          onChange={(e) => setCuisineFilter(e.target.value as CuisineType | 'all')}
          className="px-4 py-2.5 rounded-[8px] border border-[#D5D8DC] text-[#2C3E50] bg-white focus:outline-none focus:border-[#E67E22] transition-colors cursor-pointer"
        >
          <option value="all">全部菜系</option>
          <option value="chinese">中餐</option>
          <option value="western">西餐</option>
          <option value="japanese">日料</option>
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as DifficultyType | 'all')}
          className="px-4 py-2.5 rounded-[8px] border border-[#D5D8DC] text-[#2C3E50] bg-white focus:outline-none focus:border-[#E67E22] transition-colors cursor-pointer"
        >
          <option value="all">全部难度</option>
          <option value="easy">简单</option>
          <option value="medium">中等</option>
          <option value="hard">困难</option>
        </select>

        <button
          onClick={toggleShowFavorites}
          className="relative flex items-center gap-2 px-4 py-2.5 rounded-[8px] border transition-all hover:scale-105"
          style={{
            borderColor: favorites.length > 0 ? '#E74C3C' : '#D5D8DC',
            color: favorites.length > 0 ? '#E74C3C' : '#7F8C8D',
            backgroundColor: favorites.length > 0 ? '#FDF0EF' : 'white',
          }}
        >
          <FaHeart size={16} />
          <span className="text-sm font-medium">收藏</span>
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E74C3C] text-white text-xs rounded-full flex items-center justify-center">
              {favorites.length}
            </span>
          )}
        </button>
      </div>
    </motion.div>
  );
}
