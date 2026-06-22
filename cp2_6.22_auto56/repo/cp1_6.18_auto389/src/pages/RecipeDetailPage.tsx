import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRecipeStore } from '@/store/recipeStore';
import { Recipe } from '@/types';

export const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToShoppingList = useRecipeStore((state) => state.addToShoppingList);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`/api/recipes/${id}`);
        setRecipe(response.data);
      } catch (error) {
        console.error('Failed to fetch recipe:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  const handleAddToShoppingList = () => {
    if (!recipe) return;
    const items = recipe.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.quantity,
      category: ing.category,
      checked: false,
    }));
    addToShoppingList(items);
    navigate('/shopping');
  };

  if (loading) {
    return <div className="container page-wrapper">加载中...</div>;
  }

  if (!recipe) {
    return <div className="container page-wrapper">食谱不存在</div>;
  }

  const steps = recipe.steps ? JSON.parse(recipe.steps) : [];

  return (
    <div className="container page-wrapper">
      <div className="detail-hero">
        <div className="detail-image">🍽️</div>
      </div>

      <div className="detail-content">
        <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>{recipe.name}</h1>
        <div style={{ display: 'flex', gap: '16px', color: '#666', marginBottom: '24px' }}>
          <span>⏱️ 制作时长：{recipe.duration}分钟</span>
          <span>📊 难度：{recipe.difficulty}</span>
        </div>

        <div>
          <h2 className="detail-section-title">🥗 食材清单</h2>
          <ul className="ingredient-list">
            {recipe.ingredients.map((ing, index) => (
              <li key={index} className="ingredient-item">
                <span className="ingredient-dot"></span>
                <div className="ingredient-text">
                  <span className="ingredient-name">{ing.name}</span>
                  <span style={{ margin: '0 8px' }}>-</span>
                  <span className="ingredient-quantity">{ing.quantity}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="detail-content">
        <h2 className="detail-section-title">👨‍🍳 制作步骤</h2>
        <ol className="steps-list">
          {steps.map((step: string, index: number) => (
            <li key={index} className="step-item">
              <div className="step-number">{index + 1}</div>
              <div className="step-text">{step}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="action-bar">
        <button className="btn btn-success" onClick={handleAddToShoppingList}>
          🛒 添加到购物清单
        </button>
      </div>
    </div>
  );
};
