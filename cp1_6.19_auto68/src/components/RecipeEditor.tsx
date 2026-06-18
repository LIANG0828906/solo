import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { CookingMethod, IngredientEntry } from '../types';
import { searchFood, getFoodData } from '../utils/nutritionCalc';

interface RecipeEditorProps {
  recipeName: string;
  cookingMethod: CookingMethod | null;
  ingredients: IngredientEntry[];
  onRecipeNameChange: (name: string) => void;
  onCookingMethodChange: (method: CookingMethod) => void;
  onAddIngredient: (ingredient: IngredientEntry) => void;
  onRemoveIngredient: (id: string) => void;
  onUpdateGrams: (id: string, grams: number) => void;
  onReorderIngredients: (fromIndex: number, toIndex: number) => void;
}

const COOKING_METHODS: { key: CookingMethod; label: string; className: string }[] = [
  { key: 'fry', label: '煎', className: 'method-fry' },
  { key: 'stir-fry', label: '炒', className: 'method-stir-fry' },
  { key: 'steam', label: '蒸', className: 'method-steam' },
  { key: 'roast', label: '烤', className: 'method-roast' },
  { key: 'stew', label: '炖', className: 'method-stew' },
  { key: 'cold', label: '凉拌', className: 'method-cold' },
];

let idCounter = 0;
function generateId(): string {
  return `ing_${Date.now()}_${++idCounter}`;
}

export default function RecipeEditor({
  recipeName,
  cookingMethod,
  ingredients,
  onRecipeNameChange,
  onCookingMethodChange,
  onAddIngredient,
  onRemoveIngredient,
  onUpdateGrams,
  onReorderIngredients,
}: RecipeEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const filteredFoods = searchFood(searchQuery);
  const existingNames = new Set(ingredients.map(i => i.name));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFood = useCallback(
    (name: string) => {
      const food = getFoodData(name);
      if (!food || existingNames.has(name)) return;
      onAddIngredient({
        id: generateId(),
        name,
        emoji: food.emoji,
        color: food.color,
        grams: 100,
      });
      setSearchQuery('');
      setShowDropdown(false);
    },
    [onAddIngredient, existingNames]
  );

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (index: number) => {
      if (dragIndex !== null && dragIndex !== index) {
        onReorderIngredients(dragIndex, index);
      }
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, onReorderIngredients]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="recipe-editor">
      <div className="editor-section">
        <label className="editor-label">菜品名称</label>
        <input
          type="text"
          className="recipe-name-input"
          placeholder="输入菜名，如：秘制红烧肉..."
          value={recipeName}
          onChange={e => onRecipeNameChange(e.target.value)}
        />
      </div>

      <div className="editor-section">
        <label className="editor-label">烹饪方式</label>
        <div className="method-tags">
          {COOKING_METHODS.map(m => (
            <button
              key={m.key}
              className={`method-tag ${m.className} ${cookingMethod === m.key ? 'active' : ''}`}
              onClick={() => onCookingMethodChange(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-section">
        <label className="editor-label">食材配料</label>
        <div className="ingredient-search" ref={searchRef}>
          <input
            type="text"
            className="ingredient-search-input"
            placeholder="搜索食材，如：鸡胸肉、西兰花..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && filteredFoods.length > 0 && (
            <ul className="ingredient-dropdown" ref={dropdownRef}>
              {filteredFoods
                .filter(name => !existingNames.has(name))
                .map(name => {
                  const food = getFoodData(name)!;
                  return (
                    <li key={name} className="dropdown-item" onClick={() => handleSelectFood(name)}>
                      <span className="dropdown-emoji">{food.emoji}</span>
                      <span className="dropdown-name">{name}</span>
                      <span className="dropdown-cal">{food.calories} kcal/100g</span>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>

      <div className="editor-section">
        <div className="ingredient-chips">
          {ingredients.map((ing, index) => (
            <div
              key={ing.id}
              className={`ingredient-chip ${dragIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              style={{ '--chip-color': ing.color } as React.CSSProperties}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
            >
              <span className="chip-drag-handle">⠿</span>
              <span className="chip-emoji">{ing.emoji}</span>
              <span className="chip-name">{ing.name}</span>
              <div className="chip-grams">
                <input
                  type="number"
                  className="chip-grams-input"
                  value={ing.grams}
                  min={0}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) onUpdateGrams(ing.id, val);
                  }}
                />
                <span className="chip-grams-unit">g</span>
              </div>
              <button className="chip-remove" onClick={() => onRemoveIngredient(ing.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
