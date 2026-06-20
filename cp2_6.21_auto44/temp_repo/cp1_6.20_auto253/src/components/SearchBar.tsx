import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ingredient } from '../types';

interface SearchBarProps {
  onAddIngredient: (ingredient: Ingredient) => void;
  selectedIds: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({ onAddIngredient, selectedIds }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchIngredients = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/ingredients');
        const data = await response.json();
        setAllIngredients(data);
      } catch (error) {
        console.error('Failed to fetch ingredients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchIngredients();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchIngredients = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = allIngredients.filter(
      ing => 
        ing.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedIds.includes(ing.id)
    );
    setSuggestions(filtered);
  }, [allIngredients, selectedIds]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchIngredients(value);
    }, 500);
  }, [searchIngredients]);

  const handleSelectIngredient = useCallback((ingredient: Ingredient) => {
    onAddIngredient(ingredient);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.blur();
  }, [onAddIngredient]);

  const handleFocus = useCallback(() => {
    if (query.trim()) {
      searchIngredients(query);
    }
    setShowSuggestions(true);
  }, [query, searchIngredients]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSelectIngredient(suggestions[0]);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }, [suggestions, handleSelectIngredient]);

  return (
    <div className="search-section" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        placeholder="🔍 搜索食材，如：番茄、鸡蛋、土豆..."
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      
      {showSuggestions && (
        <div className="search-suggestions">
          {isLoading ? (
            <div className="suggestion-item" style={{ justifyContent: 'center', color: '#9e9e9e' }}>
              加载中...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map(ingredient => (
              <div
                key={ingredient.id}
                className="suggestion-item"
                onClick={() => handleSelectIngredient(ingredient)}
              >
                <span className="suggestion-emoji">{ingredient.emoji}</span>
                <span className="suggestion-name">{ingredient.name}</span>
              </div>
            ))
          ) : query.trim() ? (
            <div className="suggestion-item" style={{ justifyContent: 'center', color: '#9e9e9e' }}>
              没有找到匹配的食材
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
