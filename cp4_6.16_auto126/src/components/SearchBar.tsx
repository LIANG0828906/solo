import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ingredients, cuisines, difficultyLabels } from '@/data/ingredients';
import { SearchSuggestion } from '@/types';
import './SearchBar.css';

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, toggleIngredientFilter, selectedIngredients } = useAppStore();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo<SearchSuggestion[]>(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const result: SearchSuggestion[] = [];

    ingredients
      .filter((i) => i.name.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach((i) => {
        result.push({ id: `ing-${i.id}`, text: i.name, category: 'ingredient' });
      });

    cuisines
      .filter((c) => c.toLowerCase().includes(query))
      .slice(0, 2)
      .forEach((c) => {
        result.push({ id: `cui-${c}`, text: c, category: 'cuisine' });
      });

    Object.entries(difficultyLabels)
      .filter(([_, label]) => label.includes(query))
      .slice(0, 2)
      .forEach(([level, label]) => {
        result.push({ id: `diff-${level}`, text: `${label}难度`, category: 'difficulty' });
      });

    return result.slice(0, 6);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.category === 'ingredient') {
      const ingredientId = suggestion.id.replace('ing-', '');
      toggleIngredientFilter(ingredientId);
    }
    setSearchQuery(suggestion.text);
    setIsFocused(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      ingredient: '食材',
      cuisine: '菜系',
      difficulty: '难度',
    };
    return labels[category] || category;
  };

  return (
    <div className="search-bar-container" ref={containerRef}>
      <div className={`search-bar ${isFocused ? 'focused' : ''}`}>
        <Search size={20} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="搜索菜谱、食材、菜系..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-btn" onClick={handleClear}>
            <X size={18} />
          </button>
        )}
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="suggestion-text">{suggestion.text}</span>
              <span className={`suggestion-tag tag-${suggestion.category}`}>
                {getCategoryLabel(suggestion.category)}
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedIngredients.length > 0 && (
        <div className="filter-tags">
          <span className="filter-label">已选食材：</span>
          {selectedIngredients.map((id) => {
            const ing = ingredients.find((i) => i.id === id);
            if (!ing) return null;
            return (
              <span key={id} className="filter-tag">
                {ing.icon} {ing.name}
                <button onClick={() => toggleIngredientFilter(id)}>
                  <X size={14} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
