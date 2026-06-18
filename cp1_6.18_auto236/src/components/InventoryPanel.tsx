import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import IngredientCard from './IngredientCard';
import type { Ingredient } from '../api/recipeApi';
import { getRecommendations } from '../api/recipeApi';

const categories: { name: string; value: Ingredient['category']; color: string }[] = [
  { name: '蔬菜', value: 'vegetable', color: '#FF6B6B' },
  { name: '海鲜', value: 'seafood', color: '#4FC3F7' },
  { name: '主食', value: 'staple', color: '#FFD93D' },
  { name: '肉类', value: 'meat', color: '#6BCB77' },
];

const InventoryPanel: React.FC = () => {
  const { ingredients, addIngredient, removeIngredient, setRecipes, setIsLoading } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Ingredient['category']>('vegetable');

  const handleAddIngredient = () => {
    if (!inputValue.trim()) return;
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name: inputValue.trim(),
      category: selectedCategory,
    };
    addIngredient(newIngredient);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddIngredient();
    }
  };

  const handleRecommend = async () => {
    if (ingredients.length === 0) return;
    setIsLoading(true);
    try {
      const ingredientNames = ingredients.map((ing) => ing.name);
      const recipes = await getRecommendations(ingredientNames);
      setRecipes(recipes);
    } catch (error) {
      console.error('获取推荐失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '2px solid rgba(224, 216, 200, 0.6)',
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: '#333',
          marginBottom: '16px',
        }}
      >
        🥗 冰箱库存
      </h2>

      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '12px',
            flexWrap: 'wrap',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: `2px solid ${selectedCategory === cat.value ? cat.color : '#E0D8C8'}`,
                backgroundColor: selectedCategory === cat.value ? `${cat.color}15` : '#fff',
                color: selectedCategory === cat.value ? cat.color : '#666',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入食材名称，如：西红柿"
            style={{
              flex: 1,
              height: '44px',
              padding: '0 16px',
              borderRadius: '12px',
              border: '2px solid #E0D8C8',
              fontSize: '14px',
              color: '#333',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              backgroundColor: '#FFFCF8',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#FF6B6B';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E0D8C8';
            }}
          />
          <button
            onClick={handleAddIngredient}
            disabled={!inputValue.trim()}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: inputValue.trim() ? '#FF6B6B' : '#ccc',
              color: '#fff',
              fontSize: '24px',
              fontWeight: 'bold',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s ease, transform 0.2s ease',
            }}
            onMouseDown={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            +
          </button>
        </div>
      </div>

      {ingredients.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '20px',
          }}
          className="inventory-grid"
        >
          {ingredients.map((ingredient) => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              onRemove={removeIngredient}
            />
          ))}
        </div>
      )}

      {ingredients.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: '#999',
            fontSize: '14px',
          }}
        >
          还没有添加食材，快来添加吧~
        </div>
      )}

      <button
        onClick={handleRecommend}
        disabled={ingredients.length === 0}
        style={{
          width: '180px',
          height: '48px',
          borderRadius: '24px',
          border: 'none',
          background: ingredients.length > 0
            ? 'linear-gradient(135deg, #FF6B6B, #FF8E53)'
            : '#ccc',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 600,
          cursor: ingredients.length > 0 ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          display: 'block',
          margin: '0 auto',
        }}
        onMouseDown={(e) => {
          if (ingredients.length > 0) {
            e.currentTarget.style.transform = 'translateY(2px)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #E55A5A, #E57A43)';
          }
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B6B, #FF8E53)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = ingredients.length > 0
            ? 'linear-gradient(135deg, #FF6B6B, #FF8E53)'
            : '#ccc';
        }}
      >
        开始推荐
      </button>
    </div>
  );
};

export default InventoryPanel;
