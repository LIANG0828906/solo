import React, { useState, useRef, useEffect } from 'react';

export interface IngredientInputProps {
  ingredients: string[];
  onChange: (ingredients: string[]) => void;
  maxIngredients?: number;
  placeholder?: string;
}

const PRESET_INGREDIENTS: string[] = [
  '番茄', '鸡蛋', '土豆', '猪肉', '牛肉', '鸡肉', '鱼', '虾', '豆腐', '米饭',
  '面条', '洋葱', '大蒜', '生姜', '青椒', '白菜', '胡萝卜', '黄瓜', '茄子', '辣椒',
  '豆角', '蘑菇', '木耳', '西兰花', '生菜', '鸡蛋', '面粉', '牛奶', '黄油', '奶酪'
];

const IngredientInput: React.FC<IngredientInputProps> = ({
  ingredients,
  onChange,
  maxIngredients = 10,
  placeholder = '输入食材后按回车添加'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length === 0) {
      setSuggestions([]);
      return;
    }
    const lower = trimmed.toLowerCase();
    const matched = PRESET_INGREDIENTS.filter(
      (item) =>
        item.toLowerCase().includes(lower) && !ingredients.includes(item)
    );
    const unique = Array.from(new Set(matched));
    setSuggestions(unique.slice(0, 5));
  }, [inputValue, ingredients]);

  const addIngredients = (raw: string) => {
    const parts = raw.split(/[,，]/).map((s) => s.trim()).filter((s) => s.length > 0);
    if (parts.length === 0) return;
    const newIngredients = [...ingredients];
    for (const part of parts) {
      if (newIngredients.length >= maxIngredients) break;
      if (!newIngredients.includes(part)) {
        newIngredients.push(part);
      }
    }
    onChange(newIngredients);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredients(inputValue);
    }
  };

  const handleAddClick = () => {
    addIngredients(inputValue);
  };

  const handleSuggestionClick = (item: string) => {
    if (ingredients.length >= maxIngredients) return;
    if (ingredients.includes(item)) return;
    onChange([...ingredients, item]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    onChange(newIngredients);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    if (inputValue.trim().length > 0) {
      setShowSuggestions(true);
    }
  };

  const isMax = ingredients.length >= maxIngredients;

  return (
    <div className="ingredient-input-wrapper" ref={wrapperRef}>
      <div className="ingredient-input-row">
        <input
          type="text"
          className="ingredient-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={isMax ? `已达最大数量 ${maxIngredients}` : placeholder}
          disabled={isMax}
        />
        <button
          type="button"
          onClick={handleAddClick}
          disabled={isMax || inputValue.trim().length === 0}
        >
          添加
        </button>
        <span className="ingredient-count">
          {ingredients.length}/{maxIngredients}
        </span>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="ingredient-suggestions">
          {suggestions.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="ingredient-suggestion-item"
              onClick={() => handleSuggestionClick(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="ingredient-tags">
        {ingredients.map((ing, index) => (
          <span key={`${ing}-${index}`} className="ingredient-tag" style={{ backgroundColor: '#d4e8dc' }}>
            {ing}
            <button
              type="button"
              className="ingredient-tag-remove"
              onClick={() => removeIngredient(index)}
              aria-label={`删除${ing}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <style>{`
        .ingredient-input-wrapper {
          position: relative;
          width: 100%;
        }
        .ingredient-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .ingredient-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        .ingredient-input:focus {
          border-color: #4a9e7e;
        }
        .ingredient-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        .ingredient-input-row button {
          padding: 8px 16px;
          background-color: #4a9e7e;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .ingredient-input-row button:hover:not(:disabled) {
          background-color: #3d8569;
        }
        .ingredient-input-row button:disabled {
          background-color: #a5c9b8;
          cursor: not-allowed;
        }
        .ingredient-count {
          font-size: 13px;
          color: #666;
          white-space: nowrap;
          min-width: 40px;
        }
        .ingredient-suggestions {
          position: absolute;
          top: calc(100% - 12px);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          list-style: none;
          padding: 4px 0;
          margin: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-width: calc(100% - 80px);
        }
        .ingredient-suggestion-item {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.15s;
        }
        .ingredient-suggestion-item:hover {
          background-color: #f0f7f3;
        }
        .ingredient-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .ingredient-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 13px;
          color: #2d5a46;
        }
        .ingredient-tag-remove {
          background: none;
          border: none;
          color: #6b8a7b;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }
        .ingredient-tag-remove:hover {
          color: #c0392b;
        }
      `}</style>
    </div>
  );
};

export default IngredientInput;
