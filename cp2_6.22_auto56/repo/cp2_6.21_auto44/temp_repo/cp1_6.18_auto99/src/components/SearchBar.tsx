import { useMemo, useRef, useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { foods, type Food, type Nutrients } from '../data/foods';
import {
  NUTRIENT_ORDER,
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
  NUTRIENT_COLORS,
  getMaxNutrients,
} from '../utils/nutrition';

export function SearchBar() {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const searchResults = useAppStore((s) => s.searchResults);
  const selectedFood = useAppStore((s) => s.selectedFood);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const selectFood = useAppStore((s) => s.selectFood);
  const addFoodToMeal = useAppStore((s) => s.addFoodToMeal);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxNutrients = useMemo(() => getMaxNutrients(foods), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);
    setDropdownOpen(value.trim().length > 0);
  }

  function handleSelectFood(food: Food) {
    selectFood(food);
    setDropdownOpen(false);
  }

  function handleAddToMeal(food: Food) {
    addFoodToMeal(food);
  }

  return (
    <div className="search-section">
      <div className="search-container" ref={containerRef}>
        <div className="search-bar">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="搜索食物名称或类别"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setDropdownOpen(true);
            }}
          />
        </div>

        {dropdownOpen && searchResults.length > 0 && (
          <div className="search-dropdown">
            {searchResults.map((food) => (
              <div
                key={food.id}
                className="search-dropdown-item"
                onClick={() => handleSelectFood(food)}
              >
                <span className="dropdown-food-name">{food.name}</span>
                <span className="dropdown-food-category">{food.category}</span>
              </div>
            ))}
          </div>
        )}

        {dropdownOpen && searchQuery.trim().length > 0 && searchResults.length === 0 && (
          <div className="search-dropdown">
            <div className="search-empty">未找到匹配的食物</div>
          </div>
        )}
      </div>

      <div className="cards-container">
        {selectedFood && <NutrientCard food={selectedFood} onAdd={() => handleAddToMeal(selectedFood)} maxNutrients={maxNutrients} />}
      </div>
    </div>
  );
}

interface NutrientCardProps {
  food: Food;
  onAdd: () => void;
  maxNutrients: Nutrients;
}

function NutrientCard({ food, onAdd, maxNutrients }: NutrientCardProps) {
  return (
    <div className="nutrient-card">
      <div className="nutrient-card-header">
        <div>
          <h3 className="nutrient-card-title">{food.name}</h3>
          <span className="nutrient-card-category">{food.category} · 每100g</span>
        </div>
        <button className="add-btn" onClick={onAdd}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>添加</span>
        </button>
      </div>

      <div className="nutrient-list">
        {NUTRIENT_ORDER.map((key) => {
          const value = food.nutrients[key];
          const max = maxNutrients[key];
          const ratio = max > 0 ? Math.min(1, value / max) : 0;
          return (
            <div key={key} className="nutrient-row">
              <div className="nutrient-row-label">
                <span className="nutrient-dot" style={{ backgroundColor: NUTRIENT_COLORS[key] }} />
                <span className="nutrient-name">{NUTRIENT_LABELS[key]}</span>
              </div>
              <div className="nutrient-bar-wrap">
                <div className="nutrient-bar-bg">
                  <div
                    className="nutrient-bar-fill"
                    style={{
                      width: `${ratio * 100}%`,
                      backgroundColor: NUTRIENT_COLORS[key],
                    }}
                  />
                </div>
                <span className="nutrient-value">
                  {value}
                  {NUTRIENT_UNITS[key]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
