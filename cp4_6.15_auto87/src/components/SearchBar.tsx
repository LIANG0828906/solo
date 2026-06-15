import { useState, useRef, useEffect, useMemo } from 'react';
import useRecipeStore from '../store/recipeStore';
import useDebounce from '../hooks/useDebounce';
import type { Suggestion } from '../types';
import './SearchBar.css';

function SearchBar() {
  const [localInput, setLocalInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const debouncedInput = useDebounce(localInput, 300);

  const recipes = useRecipeStore((s) => s.recipes);

  useEffect(() => {
    useRecipeStore.getState().setSearchKeyword(debouncedInput);
  }, [debouncedInput]);

  const suggestions: Suggestion[] = useMemo(() => {
    if (!debouncedInput.trim()) return [];
    const keyword = debouncedInput.toLowerCase().trim();
    const result: Suggestion[] = [];
    const seen = new Set<string>();
    for (const recipe of recipes) {
      if (recipe.name.toLowerCase().includes(keyword) && !seen.has(recipe.name)) {
        result.push({ text: recipe.name, type: 'recipe' });
        seen.add(recipe.name);
      }
      for (const ing of recipe.ingredients) {
        if (ing.toLowerCase().includes(keyword) && !seen.has(ing)) {
          result.push({ text: ing, type: 'ingredient' });
          seen.add(ing);
        }
      }
      if (result.length >= 8) break;
    }
    return result;
  }, [debouncedInput, recipes]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalInput(value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (text: string) => {
    setLocalInput(text);
    useRecipeStore.getState().setSearchKeyword(text);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIndex].text);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setLocalInput('');
    useRecipeStore.getState().setSearchKeyword('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const index = lowerText.indexOf(lowerKeyword);
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <mark className="search-highlight">
          {text.slice(index, index + keyword.length)}
        </mark>
        {text.slice(index + keyword.length)}
      </>
    );
  };

  return (
    <div className="search-bar-container" ref={suggestionsRef}>
      <div className="search-bar-input-wrapper">
        <i className="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          ref={inputRef}
          type="text"
          className="search-bar-input"
          placeholder="搜索食材或菜名..."
          value={localInput}
          onChange={handleChange}
          onFocus={() => localInput && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {localInput && (
          <button
            className="search-clear-btn"
            onClick={handleClear}
            aria-label="清除搜索"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.text}`}
              className={`search-suggestion-item ${
                index === highlightedIndex ? 'highlighted' : ''
              }`}
              onClick={() => handleSelect(suggestion.text)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <i
                className={`fa-solid ${
                  suggestion.type === 'recipe' ? 'fa-bowl-food' : 'fa-carrot'
                } suggestion-icon`}
              ></i>
              <span className="suggestion-text">
                {highlightText(suggestion.text, localInput)}
              </span>
              <span className={`suggestion-type ${suggestion.type}`}>
                {suggestion.type === 'recipe' ? '菜品' : '食材'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
