import { useState, useCallback, useEffect, useRef } from 'react';
import { useRecipeStore } from '../store/useRecipeStore';
import type { Ingredient, Flavor, RecipeStore, SynthesisItem } from '../types';
import { FLAVOR_LABELS } from '../types';
import styles from './SynthesisZone.module.css';

const FLAVOR_ORDER: Flavor[] = ['sour', 'sweet', 'bitter', 'spicy', 'salty', 'umami'];

export const SynthesisZone = () => {
  const synthesisItems = useRecipeStore((state: RecipeStore) => state.synthesisItems);
  const selectedFlavors = useRecipeStore((state: RecipeStore) => state.selectedFlavors);
  const currentRecipeName = useRecipeStore((state: RecipeStore) => state.currentRecipeName);
  const addIngredient = useRecipeStore((state: RecipeStore) => state.addIngredient);
  const removeIngredient = useRecipeStore((state: RecipeStore) => state.removeIngredient);
  const updateQuantity = useRecipeStore((state: RecipeStore) => state.updateQuantity);
  const toggleFlavor = useRecipeStore((state: RecipeStore) => state.toggleFlavor);
  const setRecipeName = useRecipeStore((state: RecipeStore) => state.setRecipeName);
  const saveCard = useRecipeStore((state: RecipeStore) => state.saveCard);
  const clearSynthesis = useRecipeStore((state: RecipeStore) => state.clearSynthesis);
  const getMissingFlavors = useRecipeStore((state: RecipeStore) => state.getMissingFlavors);
  const getRecommendedSeasonings = useRecipeStore(
    (state: RecipeStore) => state.getRecommendedSeasonings
  );

  const [isDragOver, setIsDragOver] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const rafRef = useRef<number | null>(null);
  const itemLengthRef = useRef(synthesisItems.length);

  useEffect(() => {
    if (synthesisItems.length !== itemLengthRef.current) {
      setBounceKey((k) => k + 1);
      itemLengthRef.current = synthesisItems.length;
    }
  }, [synthesisItems.length]);

  const missingFlavors = getMissingFlavors();
  const recommendedSeasonings = getRecommendedSeasonings();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (
      x < rect.left ||
      x > rect.right ||
      y < rect.top ||
      y > rect.bottom
    ) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      try {
        const ingredientData = e.dataTransfer.getData('ingredient');
        if (ingredientData) {
          const ingredient: Ingredient = JSON.parse(ingredientData);
          addIngredient(ingredient);
        }
      } catch {
        console.warn('Failed to parse dropped ingredient');
      }
    },
    [addIngredient]
  );

  const handleQuantityChange = useCallback(
    (ingredientId: string, value: number) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        updateQuantity(ingredientId, value);
      });
    },
    [updateQuantity]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const generateRecommendationText = () => {
    if (synthesisItems.length === 0) return null;
    if (recommendedSeasonings.length === 0) return null;

    const names = recommendedSeasonings.map((s: Ingredient) => s.name).join('或');
    const flavors = missingFlavors
      .map((f: Flavor) => FLAVOR_LABELS[f])
      .join('、');

    return `建议加入${names}增加${flavors}层次`;
  };

  const recommendationText = generateRecommendationText();

  return (
    <div className={styles.zoneContainer}>
      <div
        className={`
          ${styles.zoneCard}
          ${isDragOver ? styles.dragOver : ''}
          ${bounceKey > 0 ? styles.bounce : ''}
        `}
        key={bounceKey}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.zoneHeader}>
          <h2 className={styles.zoneTitle}>
            <span className={styles.titleIcon}>🍳</span>
            合成区
          </h2>
          <input
            type="text"
            className={styles.nameInput}
            placeholder="给你的创意料理起个名字..."
            value={currentRecipeName}
            onChange={(e) => setRecipeName(e.target.value)}
          />
          <div className={styles.headerActions}>
            <button
              className={`${styles.actionBtn} ${styles.clearBtn}`}
              onClick={clearSynthesis}
              disabled={synthesisItems.length === 0}
            >
              清空
            </button>
            <button
              className={`${styles.actionBtn} ${styles.saveBtn}`}
              onClick={saveCard}
              disabled={synthesisItems.length === 0}
            >
              保存作品
            </button>
          </div>
        </div>

        {synthesisItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyEmoji}>🥘</div>
            <p className={styles.emptyText}>从左侧拖拽或点击食材添加到这里</p>
            <p className={styles.emptyHint}>开始你的烹饪实验吧！</p>
          </div>
        ) : (
          <div className={styles.ingredientList}>
            {synthesisItems.map((item: SynthesisItem) => (
              <div
                key={item.ingredient.id}
                className={styles.ingredientItem}
              >
                <span className={styles.itemEmoji}>
                  {item.ingredient.emoji}
                </span>
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>
                    {item.ingredient.name}
                  </div>
                  <div className={styles.itemNutrition}>
                    <span>🔥{(item.ingredient.nutrition.calories * item.quantity / 100).toFixed(0)} kcal</span>
                    <span>💪{(item.ingredient.nutrition.protein * item.quantity / 100).toFixed(1)}g</span>
                    <span>🍚{(item.ingredient.nutrition.carbs * item.quantity / 100).toFixed(1)}g</span>
                  </div>
                </div>
                <div className={styles.itemControls}>
                  <input
                    type="range"
                    className={styles.quantitySlider}
                    min={item.ingredient.category === 'seasoning' ? 1 : 10}
                    max={500}
                    step={item.ingredient.category === 'seasoning' ? 1 : 10}
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(
                        item.ingredient.id,
                        parseInt(e.target.value, 10)
                      )
                    }
                  />
                  <span className={styles.quantityValue}>
                    {item.quantity}g
                  </span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeIngredient(item.ingredient.id)}
                    aria-label="删除食材"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.flavorSection}>
          <h3 className={styles.flavorTitle}>
            <span>🏷️</span>
            风味标签
          </h3>
          <div className={styles.flavorButtons}>
            {FLAVOR_ORDER.map((flavor: Flavor) => (
              <button
                key={flavor}
                className={`
                  ${styles.flavorBtn}
                  ${selectedFlavors.includes(flavor) ? styles.active : ''}
                `}
                onClick={() => toggleFlavor(flavor)}
              >
                {FLAVOR_LABELS[flavor]}
              </button>
            ))}
          </div>
        </div>

        {recommendationText && (
          <div className={styles.recommendationBox}>
            <p className={styles.recommendationText}>
              💡 <strong>风味提示：</strong>{recommendationText}
            </p>
            <div className={styles.recommendationItems}>
              {recommendedSeasonings.map((seasoning: Ingredient) => (
                <div
                  key={seasoning.id}
                  className={styles.recommendationItem}
                  onClick={() => addIngredient(seasoning)}
                >
                  <span className={styles.emoji}>{seasoning.emoji}</span>
                  <span>{seasoning.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
