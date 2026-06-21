import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Ingredient, isNumericQuantity, toNumericQuantity } from '../types';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#F5E6CC',
  padding: '24px',
  fontFamily: "'Quicksand', sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
};

const backButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#FFFFFF',
  color: '#4A2F1A',
  border: '2px solid #D4C4B0',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'all 0.2s ease',
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '32px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const imageContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '300px',
  borderRadius: '12px',
  overflow: 'hidden',
  background: '#F5E6CC',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const placeholderStyle: React.CSSProperties = {
  fontSize: '120px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 700,
  color: '#4A2F1A',
  margin: '0 0 16px 0',
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  marginBottom: '32px',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const metaItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '16px',
  color: '#6B5344',
  fontWeight: 500,
};

const servingsControlStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginLeft: 'auto',
  background: '#FFFBF5',
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid #E8D5BC',
};

const servingsLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B5344',
  fontWeight: 600,
};

const servingsButtonStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: 'none',
  background: '#D4A574',
  color: '#FFFFFF',
  fontSize: '18px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s ease',
};

const servingsInputStyle: React.CSSProperties = {
  width: '50px',
  padding: '6px 8px',
  borderRadius: '6px',
  border: '2px solid #D4C4B0',
  fontSize: '16px',
  fontWeight: 700,
  textAlign: 'center',
  outline: 'none',
  fontFamily: "'Quicksand', sans-serif",
  color: '#4A2F1A',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#4A2F1A',
  margin: '0 0 20px 0',
  paddingBottom: '12px',
  borderBottom: '2px solid #E8D5BC',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
};

const ingredientGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: '12px',
};

const ingredientItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  background: '#FFFBF5',
  borderRadius: '8px',
  border: '1px solid #E8D5BC',
};

const ingredientNameStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#4A2F1A',
};

const ingredientQtyStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 700,
  color: '#D4A574',
  background: '#FFFFFF',
  padding: '4px 12px',
  borderRadius: '6px',
};

const stepsListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const stepItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  padding: '16px',
  background: '#FFFBF5',
  borderRadius: '10px',
  border: '1px solid #E8D5BC',
  marginBottom: '12px',
};

const stepNumberStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: '#D4A574',
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '16px',
  flexShrink: 0,
};

const stepTextStyle: React.CSSProperties = {
  fontSize: '15px',
  color: '#4A2F1A',
  lineHeight: 1.6,
  flex: 1,
};

const notFoundStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '64px 24px',
  color: '#6B5344',
};

const notFoundIconStyle: React.CSSProperties = {
  fontSize: '80px',
  marginBottom: '16px',
};

const notFoundTextStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 500,
};

const addToListButtonStyle: React.CSSProperties = {
  padding: '14px 32px',
  background: '#D4A574',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'background 0.2s ease',
  marginTop: '16px',
  display: 'block',
  marginLeft: 'auto',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '32px',
  paddingTop: '24px',
  borderTop: '2px solid #E8D5BC',
};

export const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecipeById, toggleRecipeSelection, selectedRecipeIds, generateShoppingList } = useAppStore();

  const recipe = id ? getRecipeById(id) : undefined;
  const [servings, setServings] = useState(2);

  const baseServings = recipe?.servings || 2;
  const scaleFactor = servings / baseServings;

  const scaledIngredients = useMemo<Ingredient[]>(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) => ({
      ...ing,
      quantity: isNumericQuantity(ing.quantity)
        ? Math.round(toNumericQuantity(ing.quantity) * scaleFactor * 100) / 100
        : ing.quantity,
    }));
  }, [recipe, scaleFactor]);

  const handleServingsChange = (value: number) => {
    const clamped = Math.max(1, Math.min(20, value));
    setServings(clamped);
  };

  const handleAddToShoppingList = () => {
    if (recipe) {
      if (!selectedRecipeIds.includes(recipe.id)) {
        toggleRecipeSelection(recipe.id);
      }
      const scaledMap = new Map<string, { quantity: number; unit: string; name: string }[]>();
      scaledMap.set(recipe.id, scaledIngredients
        .filter(ing => isNumericQuantity(ing.quantity))
        .map(ing => ({
          name: ing.name,
          quantity: toNumericQuantity(ing.quantity),
          unit: ing.unit,
        }))
      );
      generateShoppingList(scaledMap);
      navigate('/shopping');
    }
  };

  if (!recipe) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={headerStyle}>
            <button
              onClick={() => navigate('/')}
              style={backButtonStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F5E6CC';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
              }}
            >
              ← 返回首页
            </button>
          </div>
          <div style={cardStyle}>
            <div style={notFoundStyle}>
              <div style={notFoundIconStyle}>😕</div>
              <div style={notFoundTextStyle}>菜谱不存在</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSelected = selectedRecipeIds.includes(recipe.id);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button
            onClick={() => navigate('/')}
            style={backButtonStyle}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F5E6CC';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
            }}
          >
            ← 返回首页
          </button>
        </div>

        <div style={cardStyle}>
          <div style={imageContainerStyle}>
            {recipe.image_data ? (
              <img src={recipe.image_data} alt={recipe.name} style={imageStyle} />
            ) : (
              <span style={placeholderStyle}>🍳</span>
            )}
          </div>

          <h1 style={titleStyle}>{recipe.name}</h1>

          <div style={metaRowStyle}>
            <div style={metaItemStyle}>
              <span>⏱️</span>
              <span>{recipe.cooking_time} 分钟</span>
            </div>
            <div style={metaItemStyle}>
              <span>🥗</span>
              <span>{recipe.ingredients.length} 种食材</span>
            </div>
            <div style={metaItemStyle}>
              <span>📝</span>
              <span>{recipe.steps.length} 个步骤</span>
            </div>
            <div style={servingsControlStyle}>
              <span style={servingsLabelStyle}>就餐人数：</span>
              <button
                onClick={() => handleServingsChange(servings - 1)}
                style={{
                  ...servingsButtonStyle,
                  opacity: servings <= 1 ? 0.5 : 1,
                  cursor: servings <= 1 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (servings > 1) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#C49464';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#D4A574';
                }}
                disabled={servings <= 1}
              >
                −
              </button>
              <input
                type="number"
                value={servings}
                onChange={(e) => handleServingsChange(Number(e.target.value))}
                min={1}
                max={20}
                style={servingsInputStyle}
              />
              <button
                onClick={() => handleServingsChange(servings + 1)}
                style={{
                  ...servingsButtonStyle,
                  opacity: servings >= 20 ? 0.5 : 1,
                  cursor: servings >= 20 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (servings < 20) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#C49464';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#D4A574';
                }}
                disabled={servings >= 20}
              >
                +
              </button>
              <span style={servingsLabelStyle}>人份</span>
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>🥕 食材清单</h2>
            <div style={ingredientGridStyle}>
              {scaledIngredients.map((ing, index) => (
                <div key={index} style={ingredientItemStyle}>
                  <span style={ingredientNameStyle}>{ing.name}</span>
                  <span style={ingredientQtyStyle}>
                    {ing.quantity} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>👨‍🍳 制作步骤</h2>
            <ol style={stepsListStyle}>
              {recipe.steps.map((step, index) => (
                <li key={index} style={stepItemStyle}>
                  <div style={stepNumberStyle}>{index + 1}</div>
                  <div style={stepTextStyle}>{step}</div>
                </li>
              ))}
            </ol>
          </div>

          <div style={buttonRowStyle}>
            <button
              onClick={handleAddToShoppingList}
              style={{
                ...addToListButtonStyle,
                marginTop: 0,
                marginLeft: 0,
                background: isSelected ? '#8B7355' : '#D4A574',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#C49464';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isSelected
                  ? '#8B7355'
                  : '#D4A574';
              }}
            >
              {isSelected ? '✓ 已加入购物清单' : '🛒 加入购物清单'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailPage;
