import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChefHat, X, Sparkles } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/utils/api';

interface SearchBoxProps {
  variant?: 'navbar' | 'hero';
}

export const SearchBox: React.FC<SearchBoxProps> = ({ variant = 'navbar' }) => {
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [mode, setMode] = useState<'search' | 'ingredients'>('search');
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);
  const debouncedIngredient = useDebounce(ingredientInput, 200);

  useEffect(() => {
    if (mode === 'search' && debouncedQuery.length >= 1) {
      api.recipes.getSuggestions(debouncedQuery).then(res => {
        setSuggestions(res.suggestions);
        setShowSuggestions(true);
      });
    } else if (mode === 'ingredients' && debouncedIngredient.length >= 1) {
      api.recipes.getSuggestions(debouncedIngredient).then(res => {
        setSuggestions(res.suggestions.filter(s => !ingredients.includes(s)));
        setShowSuggestions(true);
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery, debouncedIngredient, mode, ingredients]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mode === 'search' && query && !isTyping) {
      let i = 0;
      setDisplayText('');
      setIsTyping(true);
      const timer = setInterval(() => {
        if (i < query.length) {
          setDisplayText(query.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
          setIsTyping(false);
        }
      }, 30);
      return () => clearInterval(timer);
    } else {
      setDisplayText(query);
    }
  }, [query, mode]);

  const handleSearch = useCallback(() => {
    if (mode === 'search' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    } else if (mode === 'ingredients' && ingredients.length > 0) {
      navigate(`/ingredients?items=${encodeURIComponent(ingredients.join(','))}`);
      setShowSuggestions(false);
    }
  }, [mode, query, ingredients, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (mode === 'ingredients' && ingredientInput.trim()) {
        e.preventDefault();
        addIngredient(ingredientInput.trim());
      } else {
        handleSearch();
      }
    }
  };

  const addIngredient = (ing: string) => {
    if (ing && !ingredients.includes(ing)) {
      setIngredients([...ingredients, ing]);
    }
    setIngredientInput('');
    setShowSuggestions(false);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const selectSuggestion = (suggestion: string) => {
    if (mode === 'search') {
      setQuery(suggestion);
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    } else {
      addIngredient(suggestion);
    }
  };

  const isHero = variant === 'hero';

  return (
    <div ref={containerRef} className={`relative ${isHero ? 'w-full max-w-3xl' : 'w-full max-w-xl'}`}>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode('search')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'search' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white/80 text-stone-600 hover:bg-white'}`}
        >
          <Search className="w-4 h-4" />
          关键词搜索
        </button>
        <button
          onClick={() => setMode('ingredients')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'ingredients' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white/80 text-stone-600 hover:bg-white'}`}
        >
          <ChefHat className="w-4 h-4" />
          食材反查
        </button>
      </div>

      <div className={`relative bg-white rounded-2xl shadow-lg ${isHero ? 'shadow-xl' : ''} transition-all duration-300 focus-within:shadow-xl focus-within:shadow-orange-100`}>
        {mode === 'ingredients' && ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-4">
            {ingredients.map((ing, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
              >
                {ing}
                <button
                  onClick={() => removeIngredient(idx)}
                  className="hover:text-orange-900 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center">
          <div className="pl-4 text-orange-400">
            {mode === 'search' ? <Search className="w-5 h-5" /> : <ChefHat className="w-5 h-5" />}
          </div>
          <input
            type="text"
            value={mode === 'search' ? displayText : ingredientInput}
            onChange={(e) => {
              if (mode === 'search') {
                setQuery(e.target.value);
              } else {
                setIngredientInput(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if ((mode === 'search' && query) || (mode === 'ingredients' && ingredientInput)) {
                setShowSuggestions(true);
              }
            }}
            placeholder={
              mode === 'search'
                ? '搜索食谱、食材或标签...'
                : '输入你冰箱里的食材，按 Enter 添加...'
            }
            className={`flex-1 px-3 py-4 bg-transparent text-stone-700 placeholder-stone-400 outline-none ${isHero ? 'text-lg' : ''}`}
          />
          <button
            onClick={handleSearch}
            disabled={mode === 'search' ? !query.trim() : ingredients.length === 0}
            className="mr-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300"
          >
            {mode === 'ingredients' && <Sparkles className="w-4 h-4" />}
            {mode === 'search' ? '搜索' : '找菜谱'}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-orange-100 overflow-hidden z-50 animate-fadeIn">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left text-stone-700 hover:bg-orange-50 transition-colors flex items-center gap-3 first:border-t-0 border-t border-stone-100"
              >
                {mode === 'search' ? (
                  <Search className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChefHat className="w-4 h-4 text-stone-400" />
                )}
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
