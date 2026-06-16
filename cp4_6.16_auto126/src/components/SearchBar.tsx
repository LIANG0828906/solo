import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ingredients, cuisines, difficultyLabels } from '@/data/ingredients';
import { SearchSuggestion } from '@/types';
import './SearchBar.css';

const CATEGORY_ICONS: Record<string, string> = {
  ingredient: '🥕',
  cuisine: '🍽️',
  difficulty: '🌶️',
};

const CATEGORY_TITLES: Record<string, string> = {
  ingredient: '食材',
  cuisine: '菜系',
  difficulty: '难度',
};

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, toggleIngredientFilter, selectedIngredients } = useAppStore();
  const [isFocused, setIsFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (value: string) => {
    setLocalQuery(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const groupedSuggestions = useMemo<Record<string, SearchSuggestion[]>>(() => {
    if (!searchQuery.trim()) return {};

    const query = searchQuery.toLowerCase();
    const groups: Record<string, SearchSuggestion[]> = {
      ingredient: [],
      cuisine: [],
      difficulty: [],
    };

    ingredients
      .filter((i) => i.name.toLowerCase().includes(query))
      .slice(0, 5)
      .forEach((i) => {
        groups.ingredient.push({ id: `ing-${i.id}`, text: i.name, category: 'ingredient' });
      });

    cuisines
      .filter((c) => c.toLowerCase().includes(query))
      .slice(0, 5)
      .forEach((c) => {
        groups.cuisine.push({ id: `cui-${c}`, text: c, category: 'cuisine' });
      });

    Object.entries(difficultyLabels)
      .filter(([_, label]) => label.includes(query))
      .slice(0, 5)
      .forEach(([level, label]) => {
        groups.difficulty.push({ id: `diff-${level}`, text: `${label}难度`, category: 'difficulty' });
      });

    return groups;
  }, [searchQuery]);

  const hasSuggestions = Object.values(groupedSuggestions).some((group) => group.length > 0);

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
    setLocalQuery(suggestion.text);
    setSearchQuery(suggestion.text);
    setIsFocused(false);
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className="search-bar-container" ref={containerRef}>
      <div className={`search-bar ${isFocused ? 'focused' : ''}`}>
        <Search size={20} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="搜索菜谱、食材、菜系..."
          value={localQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="search-input"
        />
        {localQuery && (
          <button className="clear-btn" onClick={handleClear}>
            <X size={18} />
          </button>
        )}
      </div>

      {isFocused && hasSuggestions && (
        <div className="suggestions-dropdown">
          {Object.entries(groupedSuggestions).map(([category, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={category} className="suggestion-group">
                <div className="suggestion-group-title">
                  <span className="group-icon">{CATEGORY_ICONS[category]}</span>
                  {CATEGORY_TITLES[category]}
                </div>
                {items.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    className={`suggestion-item suggestion-item-${suggestion.category}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span className="suggestion-icon">{CATEGORY_ICONS[suggestion.category]}</span>
                    <span className="suggestion-text">{suggestion.text}</span>
                    <span className={`suggestion-tag tag-${suggestion.category}`}>
                      {CATEGORY_TITLES[suggestion.category]}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
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
