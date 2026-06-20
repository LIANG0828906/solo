import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore } from '../stores/recipeStore';

const categoryIcons: Record<string, string> = {
  '肉类': '🥩',
  '水产': '🐟',
  '蛋类': '🥚',
  '豆制品': '🧈',
  '蔬菜': '🥬',
  '主食': '🍚',
  '干货': '🌾',
  '调料': '🧂'
};

export function ShoppingList() {
  const navigate = useNavigate();
  const { mergedIngredients, checkedItems, toggleIngredient, getTotalPrice, selectedRecipeIds } = useRecipeStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const total = getTotalPrice();

  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 200);
    return () => clearTimeout(timer);
  }, [total]);

  const handleToggle = (key: string) => {
    toggleIngredient(key);
  };

  const hasIngredients = mergedIngredients.length > 0 && 
    mergedIngredients.some(group => group.ingredients.length > 0);

  return (
    <div className="page-enter">
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontWeight: 500
        }}
      >
        ← 返回列表
      </button>

      <div className="shopping-list">
        <div className="shopping-list-header">
          <h1 className="shopping-list-title">🛒 购物清单</h1>
          <p className="shopping-list-subtitle">
            已选择 {selectedRecipeIds.length} 个食谱，共 {mergedIngredients.reduce((acc, g) => acc + g.ingredients.length, 0)} 项食材
          </p>
        </div>

        <div className="shopping-list-body">
          {!hasIngredients ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">还没有添加任何食谱到购物清单</p>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>
                点击食谱卡片上的"加入购物清单"按钮开始吧
              </p>
            </div>
          ) : (
            mergedIngredients.map((group) => (
              <div key={group.category} className="category-section">
                <h3 className="category-title">
                  <span className="category-icon">
                    {categoryIcons[group.category] || '🍽️'}
                  </span>
                  {group.category}
                </h3>
                {group.ingredients.map((ing) => {
                  const isChecked = checkedItems[ing.key] || false;
                  return (
                    <div
                      key={ing.key}
                      className={`shopping-item ${isChecked ? 'checked' : ''}`}
                      onClick={() => handleToggle(ing.key)}
                    >
                      <input
                        type="checkbox"
                        className="ingredient-checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(ing.key)}
                      />
                      <span className="shopping-item-name">{ing.name}</span>
                      <span className="shopping-item-quantity">
                        {ing.totalQuantity} {ing.unit}
                      </span>
                      <span className="shopping-item-price">
                        ¥{ing.subtotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {hasIngredients && (
        <div className="total-bar">
          <span className="total-label">待采购总价</span>
          <span className={`total-price ${isUpdating ? 'updating' : ''}`}>
            ¥{total.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
