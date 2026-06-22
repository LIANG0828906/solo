import React, { useState, useEffect } from 'react';
import { useRecipeStore } from '@/store/recipeStore';

interface SearchBarProps {
  onSearch?: (value: string) => void;
  recommendMode?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, recommendMode = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const recommendRecipes = useRecipeStore((state) => state.recommendRecipes);
  const fetchRecipes = useRecipeStore((state) => state.fetchRecipes);

  useEffect(() => {
    if (recommendMode || !onSearch) return;
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
      if (onSearch) onSearch(inputValue);
    }, 100);
    return () => clearTimeout(timer);
  }, [inputValue, onSearch, recommendMode]);

  const handleSearch = async () => {
    const ingredients = inputValue
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ingredients.length > 0) {
      await recommendRecipes(ingredients);
    } else {
      await fetchRecipes();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && recommendMode) {
      handleSearch();
    }
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-input"
        placeholder={
          recommendMode
            ? '输入冰箱里的食材，用逗号分隔（如：番茄,鸡蛋,青椒）'
            : '搜索食谱名称...'
        }
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {recommendMode && (
        <button className="btn btn-primary" onClick={handleSearch}>
          智能推荐
        </button>
      )}
    </div>
  );
};
