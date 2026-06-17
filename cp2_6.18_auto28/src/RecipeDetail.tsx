import { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { getAverageRating } from './engine';

export default function RecipeDetail() {
  const { detailRecipe, setDetailRecipe, rateRecipe, generateShoppingList, shoppingList, ingredients } =
    useAppStore();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [rippleKey, setRippleKey] = useState(0);
  const [showShopping, setShowShopping] = useState(false);
  const [currentAvgRating, setCurrentAvgRating] = useState(0);

  useEffect(() => {
    if (detailRecipe) {
      setCurrentAvgRating(getAverageRating(detailRecipe.id));
    }
  }, [detailRecipe]);

  if (!detailRecipe) return null;

  const handleRate = (score: number) => {
    setSelectedStar(score);
    setRippleKey((k) => k + 1);
    rateRecipe(detailRecipe.id, score);
    setTimeout(() => {
      setCurrentAvgRating(getAverageRating(detailRecipe.id));
    }, 50);
  };

  const handleShoppingList = () => {
    generateShoppingList(detailRecipe.id);
    setShowShopping(true);
  };

  const currentShopping = shoppingList.find((s) => s.recipeId === detailRecipe.id);
  const normalizedInput = ingredients.map((i) => i.toLowerCase());
  const missingIngredients = detailRecipe.ingredients.filter(
    (ing) =>
      !normalizedInput.some(
        (input) => ing.toLowerCase().includes(input) || input.includes(ing.toLowerCase())
      )
  );

  return (
    <div className="modal-overlay" onClick={() => setDetailRecipe(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{detailRecipe.name}</div>
          <button className="modal-close" onClick={() => setDetailRecipe(null)}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="section-title">烹饪步骤</div>
          <ol className="steps-list">
            {detailRecipe.steps.map((step, idx) => (
              <li key={idx} className="step-item">
                <div className="step-number">{idx + 1}</div>
                <div className="step-content">{step}</div>
              </li>
            ))}
          </ol>

          <div className="rating-section">
            <div className="section-title">给这道菜评分</div>
            <div className="average-rating">
              当前平均分：<strong>{currentAvgRating > 0 ? `${currentAvgRating}` : '暂无评分'}</strong>
              {currentAvgRating > 0 && ' 分'}
            </div>
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = (hoveredStar || selectedStar) >= star;
                const isRipple = selectedStar === star;
                return (
                  <button
                    key={`${star}-${rippleKey}`}
                    className={`star-btn ${isRipple ? 'ripple' : ''}`}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => handleRate(star)}
                  >
                    <span className={isActive ? 'star-gold' : 'star-gray'}>★</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shopping-section">
            <button className="shopping-btn" onClick={handleShoppingList}>
              生成购物清单
            </button>
            {(showShopping || currentShopping) && missingIngredients.length > 0 && (
              <div className="shopping-list">
                <div className="shopping-list-title">需要购买的食材（{missingIngredients.length}种）：</div>
                <ul className="shopping-items">
                  {missingIngredients.map((ing, idx) => (
                    <li key={idx} className="shopping-item">
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(showShopping || currentShopping) && missingIngredients.length === 0 && (
              <div className="shopping-list">
                <div className="shopping-list-title">太棒了！所有食材都已齐全 🎉</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
