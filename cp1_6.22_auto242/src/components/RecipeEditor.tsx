import React, { useState, useMemo, useEffect } from 'react';
import type { Ingredient, RecipeIngredient } from '../types';
import { calculateCost, validatePercentageSum, getPercentageSum } from '../modules/CostCalculator';

interface RecipeEditorProps {
  ingredients: Ingredient[];
  initialIngredients?: RecipeIngredient[];
  onChange?: (ingredients: RecipeIngredient[]) => void;
}

const RecipeEditor: React.FC<RecipeEditorProps> = ({ 
  ingredients, 
  initialIngredients = [],
  onChange 
}) => {
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>(initialIngredients);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setRecipeIngredients(initialIngredients);
  }, [initialIngredients]);

  const costReport = useMemo(() => 
    calculateCost(ingredients, recipeIngredients),
    [ingredients, recipeIngredients]
  );

  const percentageSum = useMemo(() => 
    getPercentageSum(recipeIngredients),
    [recipeIngredients]
  );

  const isValid = validatePercentageSum(recipeIngredients);

  const filteredIngredients = ingredients.filter(i => 
    !recipeIngredients.some(ri => ri.ingredientId === i.id) &&
    (i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     i.family.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 10);

  const handleAddIngredient = (ingredient: Ingredient) => {
    const newIngredients = [...recipeIngredients, { 
      ingredientId: ingredient.id, 
      percentage: 10 
    }];
    setRecipeIngredients(newIngredients);
    onChange?.(newIngredients);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = recipeIngredients.filter((_, i) => i !== index);
    setRecipeIngredients(newIngredients);
    onChange?.(newIngredients);
  };

  const handlePercentageChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newIngredients = [...recipeIngredients];
    newIngredients[index] = { ...newIngredients[index], percentage: numValue };
    setRecipeIngredients(newIngredients);
    onChange?.(newIngredients);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newIngredients = [...recipeIngredients];
    const [draggedItem] = newIngredients.splice(draggedIndex, 1);
    newIngredients.splice(dropIndex, 0, draggedItem);
    
    setRecipeIngredients(newIngredients);
    onChange?.(newIngredients);
    setDraggedIndex(null);
  };

  const getIngredientById = (id: string) => ingredients.find(i => i.id === id);

  return (
    <div className="recipe-editor">
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          position: 'relative',
          marginBottom: '16px',
        }}>
          <input
            type="text"
            placeholder="搜索并添加原料..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #D4C5A9',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              backgroundColor: '#FDFBF7',
              color: '#3C2415',
              outline: 'none',
              transition: 'box-shadow 0.2s, border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocusCapture={(e) => {
              e.target.style.boxShadow = '0 0 0 3px rgba(201,169,110,0.3)';
              e.target.style.borderColor = '#C9A96E';
            }}
            onBlurCapture={(e) => {
              e.target.style.boxShadow = 'none';
              e.target.style.borderColor = '#D4C5A9';
            }}
          />
          
          {showDropdown && searchQuery && filteredIngredients.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: '#FDFBF7',
              border: '1px solid #E0D6C8',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(60,36,21,0.1)',
              zIndex: 100,
              maxHeight: '240px',
              overflowY: 'auto',
            }}>
              {filteredIngredients.map(ing => (
                <div
                  key={ing.id}
                  onMouseDown={() => handleAddIngredient(ing)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    borderBottom: '1px solid #F0EBE0',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9F5EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#3C2415',
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {ing.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#8B7355',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {ing.family} · ¥{ing.cost}/{ing.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <span style={{ 
            fontSize: '14px', 
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
          }}>
            总计：{percentageSum.toFixed(1)}%
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: isValid ? '#7C9A73' : '#C47A7A',
            fontFamily: "'Inter', sans-serif",
          }}>
            {isValid ? '✓ 配比正确' : `还差 ${(100 - percentageSum).toFixed(1)}%`}
          </span>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        marginBottom: '20px',
      }}>
        {recipeIngredients.map((ri, index) => {
          const ing = getIngredientById(ri.ingredientId);
          const costItem = costReport.ingredientCosts.find(c => c.id === ri.ingredientId);
          
          return (
            <div
              key={ri.ingredientId}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: '#FDFBF7',
                border: '1px solid #E0D6C8',
                borderRadius: '6px',
                cursor: 'move',
                opacity: draggedIndex === index ? 0.5 : 1,
                transition: 'box-shadow 0.2s',
              }}
            >
              <div style={{
                cursor: 'grab',
                color: '#A6967C',
                fontSize: '18px',
                userSelect: 'none',
              }}>
                ⋮⋮
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#3C2415',
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: '2px',
                }}>
                  {ing?.name || '未知原料'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#8B7355',
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {ing?.family} · 成本 ¥{costItem?.cost?.toFixed(2) || '0.00'}
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
              }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={ri.percentage}
                  onChange={(e) => handlePercentageChange(index, e.target.value)}
                  style={{
                    width: '70px',
                    padding: '6px 8px',
                    border: '1px solid #D4C5A9',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: "'Inter', sans-serif",
                    backgroundColor: '#FDFBF7',
                    color: '#3C2415',
                    textAlign: 'right',
                    outline: 'none',
                  }}
                />
                <span style={{ 
                  fontSize: '13px', 
                  color: '#8B7355',
                  fontFamily: "'Inter', sans-serif",
                }}>%</span>
              </div>
              
              <button
                onClick={() => handleRemoveIngredient(index)}
                style={{
                  width: '28px',
                  height: '28px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  color: '#C47A7A',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FAEBEB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ×
              </button>
            </div>
          );
        })}
        
        {recipeIngredients.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#A6967C',
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
            border: '1px dashed #D4C5A9',
            borderRadius: '6px',
          }}>
            暂无原料，从上方搜索框添加
          </div>
        )}
      </div>

      <div style={{
        padding: '16px',
        backgroundColor: '#F9F5EB',
        borderRadius: '6px',
        border: '1px solid #E0D6C8',
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#3C2415',
          fontFamily: "'Inter', sans-serif",
          marginBottom: '12px',
        }}>
          成本估算（每10ml）
        </div>
        <div style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#C9A96E',
          fontFamily: "'Playfair Display', serif",
        }}>
          ¥{costReport.totalCostPer10ml.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default RecipeEditor;
