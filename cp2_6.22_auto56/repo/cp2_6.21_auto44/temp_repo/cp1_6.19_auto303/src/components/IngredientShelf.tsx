import { useState, useCallback, useMemo } from 'react';
import { useRecipeStore } from '../store/useRecipeStore';
import type { Ingredient, IngredientCategory, RecipeStore } from '../types';
import { CATEGORY_LABELS } from '../types';
import styles from './IngredientShelf.module.css';

const CATEGORY_ORDER: IngredientCategory[] = ['protein', 'vegetable', 'seasoning', 'grain', 'other'];

export const IngredientShelf = () => {
  const ingredients = useRecipeStore((state: RecipeStore) => state.ingredients);
  const addIngredient = useRecipeStore((state: RecipeStore) => state.addIngredient);
  const recommendedSeasonings = useRecipeStore((state: RecipeStore) =>
    state.getRecommendedSeasonings()
  );
  const recommendedIds = useMemo(
    () => new Set(recommendedSeasonings.map((s: Ingredient) => s.id)),
    [recommendedSeasonings]
  );

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const groupedIngredients = useMemo(() => {
    const groups: Record<IngredientCategory, Ingredient[]> = {
      protein: [],
      vegetable: [],
      seasoning: [],
      grain: [],
      other: [],
    };
    ingredients.forEach((ing: Ingredient) => {
      if (groups[ing.category]) {
        groups[ing.category].push(ing);
      }
    });
    return groups;
  }, [ingredients]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, ingredient: Ingredient) => {
      setDraggingId(ingredient.id);
      e.dataTransfer.setData('ingredient', JSON.stringify(ingredient));
      e.dataTransfer.effectAllowed = 'copy';
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleClick = useCallback(
    (ingredient: Ingredient) => {
      addIngredient(ingredient);
    },
    [addIngredient]
  );

  return (
    <aside className={styles.shelfContainer}>
      <h2 className={styles.title}>
        <span className={styles.titleIcon}>🥗</span>
        食材库
      </h2>

      {CATEGORY_ORDER.map((category) => (
        <div key={category} className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>
            {CATEGORY_LABELS[category]}
          </h3>
          <div className={styles.ingredientGrid}>
            {groupedIngredients[category].length > 0 ? (
              groupedIngredients[category].map((ingredient: Ingredient) => (
                <div
                  key={ingredient.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, ingredient)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleClick(ingredient)}
                  className={`
                    ${styles.ingredientCard}
                    ${draggingId === ingredient.id ? styles.dragging : ''}
                    ${recommendedIds.has(ingredient.id) ? styles.recommended : ''}
                  `}
                >
                  <span className={styles.ingredientEmoji}>
                    {ingredient.emoji}
                  </span>
                  <span className={styles.ingredientName}>
                    {ingredient.name}
                  </span>
                  <div className={styles.nutritionMini}>
                    <span>🔥{ingredient.nutrition.calories}</span>
                    <span>💪{ingredient.nutrition.protein}</span>
                    <span>🍚{ingredient.nutrition.carbs}</span>
                  </div>
                </div>
              ))
            ) : (
              <span className={styles.emptyHint}>暂无食材</span>
            )}
          </div>
        </div>
      ))}
    </aside>
  );
};
