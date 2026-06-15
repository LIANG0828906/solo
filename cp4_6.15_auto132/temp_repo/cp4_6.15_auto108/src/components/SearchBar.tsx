import { useState, useRef, useCallback } from 'react';
import { useRecipeStore } from '../store/recipeStore';

export default function SearchBar() {
  const [inputValue, setInputValue] = useState('');
  const [removingTags, setRemovingTags] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIngredients = useRecipeStore((s) => s.selectedIngredients);
  const addIngredient = useRecipeStore((s) => s.addIngredient);
  const removeIngredient = useRecipeStore((s) => s.removeIngredient);
  const clearIngredients = useRecipeStore((s) => s.clearIngredients);
  const recommendRecipes = useRecipeStore((s) => s.recommendRecipes);
  const randomRecipes = useRecipeStore((s) => s.randomRecipes);

  const handleAddIngredient = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      addIngredient(trimmed);
      setInputValue('');
      inputRef.current?.focus();
    }
  }, [inputValue, addIngredient]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddIngredient();
      }
    },
    [handleAddIngredient]
  );

  const handleRemoveTag = useCallback(
    (name: string) => {
      setRemovingTags((prev) => new Set(prev).add(name));
      setTimeout(() => {
        removeIngredient(name);
        setRemovingTags((prev) => {
          const next = new Set(prev);
          next.delete(name);
          return next;
        });
      }, 300);
    },
    [removeIngredient]
  );

  const showActions = selectedIngredients.length >= 2;

  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <i className="fa-solid fa-magnifying-glass search-input-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="输入你冰箱里的食材，按回车添加..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {selectedIngredients.length > 0 && (
        <div className="ingredient-tags">
          {selectedIngredients.map((name) => (
            <span
              key={name}
              className={`ingredient-tag ${removingTags.has(name) ? 'removing' : ''}`}
            >
              {name}
              <button
                className="tag-delete"
                onClick={() => handleRemoveTag(name)}
                aria-label={`删除${name}`}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </span>
          ))}
        </div>
      )}

      {showActions && (
        <div className="action-buttons">
          <button className="action-btn action-btn-recommend" onClick={recommendRecipes}>
            <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 6 }} />
            推荐菜谱
          </button>
          <button className="action-btn action-btn-random" onClick={randomRecipes}>
            <i className="fa-solid fa-shuffle" style={{ marginRight: 6 }} />
            随机搭配
          </button>
          <button className="action-btn action-btn-clear" onClick={clearIngredients}>
            <i className="fa-solid fa-trash-can" style={{ marginRight: 6 }} />
            清空所有
          </button>
        </div>
      )}
    </div>
  );
}
