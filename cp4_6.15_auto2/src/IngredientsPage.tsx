import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X, Minus } from 'lucide-react';
import { useStore } from './store';
import {
  INGREDIENTS,
  fuzzyMatchIngredients,
  getIngredientById,
  CATEGORY_LABELS,
} from './data';
import type { Ingredient } from './data';

export default function IngredientsPage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const userIngredients = useStore((s) => s.userIngredients);
  const addIngredient = useStore((s) => s.addIngredient);
  const removeIngredient = useStore((s) => s.removeIngredient);
  const updateIngredientQuantity = useStore((s) => s.updateIngredientQuantity);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const results = fuzzyMatchIngredients(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 100);
  }, []);

  const handleSelectIngredient = useCallback(
    (ingredient: Ingredient) => {
      const exists = userIngredients.some(
        (ui) => ui.ingredientId === ingredient.id
      );
      if (!exists) {
        addIngredient({ ingredientId: ingredient.id, quantity: 1 });
      }
      setQuery('');
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [userIngredients, addIngredient]
  );

  const handleClickOutside = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [handleClickOutside]);

  const selectedIngredientIds = new Set(
    userIngredients.map((ui) => ui.ingredientId)
  );
  const availableSuggestions = suggestions.filter(
    (s) => !selectedIngredientIds.has(s.id)
  );

  return (
    <div className="ingredients-page">
      <div className="page-header">
        <h1 className="page-title">我的食材</h1>
        <p className="page-subtitle">添加冰箱里的现有食材</p>
      </div>

      <div
        className={`search-container ${focused ? 'search-focused' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Search className="search-icon" size={18} />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="搜索食材，如：西红柿、鸡胸肉..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            setFocused(true);
            if (query.trim()) {
              const results = fuzzyMatchIngredients(query);
              setSuggestions(results);
              setShowSuggestions(results.length > 0);
            }
          }}
          onBlur={() => setFocused(false)}
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => {
              setQuery('');
              setShowSuggestions(false);
            }}
          >
            <X size={16} />
          </button>
        )}
        {showSuggestions && availableSuggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {availableSuggestions.slice(0, 8).map((ingredient) => (
              <button
                key={ingredient.id}
                className="suggestion-item"
                onClick={() => handleSelectIngredient(ingredient)}
              >
                <span className="suggestion-name">{ingredient.name}</span>
                <span className="suggestion-category">
                  {CATEGORY_LABELS[ingredient.category]}
                </span>
                <Plus size={14} className="suggestion-plus" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ingredient-list">
        {userIngredients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🥕</div>
            <p>还没有添加食材</p>
            <p className="empty-hint">在上方搜索框中搜索并添加</p>
          </div>
        ) : (
          userIngredients.map((ui) => {
            const ingredient = getIngredientById(ui.ingredientId);
            if (!ingredient) return null;
            return (
              <div key={ui.ingredientId} className="ingredient-card">
                <div className="ingredient-info">
                  <span className="ingredient-name">{ingredient.name}</span>
                  <span className="ingredient-category-badge">
                    {CATEGORY_LABELS[ingredient.category]}
                  </span>
                </div>
                <div className="ingredient-actions">
                  <div className="quantity-control">
                    <button
                      className="qty-btn"
                      onClick={() =>
                        updateIngredientQuantity(
                          ui.ingredientId,
                          Math.max(0.5, ui.quantity - 1)
                        )
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <div className="qty-display">
                      <input
                        type="number"
                        className="qty-input"
                        value={ui.quantity}
                        min={0.5}
                        step={0.5}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val > 0) {
                            updateIngredientQuantity(ui.ingredientId, val);
                          }
                        }}
                      />
                      <span className="qty-unit">{ingredient.unit}</span>
                    </div>
                    <button
                      className="qty-btn"
                      onClick={() =>
                        updateIngredientQuantity(
                          ui.ingredientId,
                          ui.quantity + 1
                        )
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => removeIngredient(ui.ingredientId)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {userIngredients.length > 0 && (
        <div className="ingredient-summary">
          已添加 <strong>{userIngredients.length}</strong> 种食材
        </div>
      )}

      <div className="quick-add-section">
        <h3 className="section-title">常用食材快速添加</h3>
        <div className="quick-add-grid">
          {INGREDIENTS.filter((i) => !selectedIngredientIds.has(i.id))
            .slice(0, 12)
            .map((ingredient) => (
              <button
                key={ingredient.id}
                className="quick-add-btn"
                onClick={() =>
                  handleSelectIngredient(ingredient)
                }
              >
                <Plus size={12} />
                {ingredient.name}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
