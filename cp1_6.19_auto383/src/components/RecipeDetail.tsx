import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRecipe, loading, error, fetchRecipeById, addToShoppingList, isRecipeSelected, removeFromShoppingList } = useRecipeStore();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [activeStep, setActiveStep] = useState(0);
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRecipeById(id);
    }
    return () => {
      setCheckedIngredients(new Set());
      setActiveStep(0);
    };
  }, [id, fetchRecipeById]);

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(index.toString())) {
        next.delete(index.toString());
      } else {
        next.add(index.toString());
      }
      return next;
    });
  };

  const handleAddToList = () => {
    if (!id) return;
    if (isRecipeSelected(id)) {
      removeFromShoppingList(id);
    } else {
      addToShoppingList(id);
      setShowCheckmark(true);
      setTimeout(() => setShowCheckmark(false), 1000);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="loading">{error}</div>;
  }

  if (!currentRecipe) {
    return <div className="loading">未找到食谱</div>;
  }

  const isSelected = isRecipeSelected(currentRecipe.id);

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

      <div className="recipe-detail">
        <div className="recipe-detail-header">
          <img
            src={currentRecipe.imageUrl}
            alt={currentRecipe.name}
            className="recipe-detail-image"
          />
          <div className="recipe-detail-overlay">
            <h1 className="recipe-detail-title">{currentRecipe.name}</h1>
            <p className="recipe-detail-author">作者：{currentRecipe.author}</p>
          </div>
        </div>

        <div className="recipe-detail-body">
          <button
            onClick={handleAddToList}
            style={{
              width: '100%',
              background: isSelected ? '#888' : 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '32px',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={e => {
              if (!isSelected) e.currentTarget.style.background = 'var(--color-primary-dark)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isSelected ? '#888' : 'var(--color-primary)';
            }}
          >
            {showCheckmark ? '✓ 已添加' : (isSelected ? '✕ 移出购物清单' : '+ 加入购物清单')}
          </button>

          <div className="recipe-detail-section">
            <h2 className="recipe-detail-section-title">
              <span>🥗</span> 食材清单
            </h2>
            <ul className="ingredient-list">
              {currentRecipe.ingredients.map((ing, index) => {
                const isChecked = checkedIngredients.has(index.toString());
                return (
                  <li
                    key={index}
                    className={`ingredient-item ${isChecked ? 'checked' : ''}`}
                    onClick={() => toggleIngredient(index)}
                  >
                    <input
                      type="checkbox"
                      className="ingredient-checkbox"
                      checked={isChecked}
                      onChange={() => toggleIngredient(index)}
                    />
                    <span className="ingredient-name">
                      {categoryIcons[ing.category] || '🍽️'} {ing.name}
                    </span>
                    <span className="ingredient-quantity">
                      {ing.quantity} {ing.unit}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="recipe-detail-section">
            <h2 className="recipe-detail-section-title">
              <span>📝</span> 烹饪步骤
            </h2>
            <ol className="step-list">
              {currentRecipe.steps.map((step, index) => (
                <li
                  key={index}
                  className={`step-item ${index === activeStep ? 'active' : ''}`}
                  onClick={() => setActiveStep(index)}
                >
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">{step.description}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
