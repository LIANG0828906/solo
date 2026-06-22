import React, { useState } from 'react';
import RecipeCard from '../components/RecipeCard';
import type { Recipe, Ingredient, RecipeIngredient } from '../types';

interface RecipesPageProps {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onAddRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'versions'>) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

const RecipesPage: React.FC<RecipesPageProps> = ({ 
  recipes, 
  ingredients, 
  onAddRecipe,
  onSelectRecipe,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetNote: '花香',
    description: '',
  });

  const noteOptions = ['花香', '木质', '辛香', '柑橘', '果香', '草本', '麝香', '海洋', '东方'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRecipe({
      ...formData,
      ingredients: [],
    });
    setShowAddModal(false);
    setFormData({ name: '', targetNote: '花香', description: '' });
  };

  return (
    <div className="recipes-page">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#3C2415',
            fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
            margin: '0 0 8px 0',
          }}>
            我的配方
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
            margin: 0,
          }}>
            共 {recipes.length} 个配方
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#C9A96E',
            color: '#FDFBF7',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            cursor: 'pointer',
            transition: 'background-color 0.15s, transform 0.1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#B8974E';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#C9A96E';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          + 创建配方
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
      }}>
        {recipes.map(recipe => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe}
            onClick={() => onSelectRecipe(recipe)}
          />
        ))}
      </div>

      {recipes.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#A6967C',
          fontSize: '14px',
          fontFamily: "'Inter', sans-serif",
        }}>
          还没有配方，点击上方按钮创建第一个配方吧
        </div>
      )}

      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(60, 36, 21, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
        }}
        onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FDFBF7',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '450px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(60,36,21,0.2)',
            }}
          >
            <h2 style={{
              fontSize: '22px',
              fontWeight: 600,
              color: '#3C2415',
              fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
              margin: '0 0 20px 0',
            }}>
              创建新配方
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>配方名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  placeholder="给你的配方起个名字"
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>目标香调</label>
                <select
                  value={formData.targetNote}
                  onChange={(e) => setFormData({ ...formData, targetNote: e.target.value })}
                  style={inputStyle}
                >
                  {noteOptions.map(note => (
                    <option key={note} value={note}>{note}调</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>创意说明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="描述一下这个配方的灵感..."
                  rows={3}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#8B7355',
                    border: '1px solid #D4C5A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F0EBE0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#C9A96E',
                    color: '#FDFBF7',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#B8974E';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#C9A96E';
                  }}
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#8B7355',
  marginBottom: '6px',
  fontFamily: "'Inter', sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #D4C5A9',
  borderRadius: '6px',
  fontSize: '13px',
  fontFamily: "'Inter', sans-serif",
  backgroundColor: '#FDFBF7',
  color: '#3C2415',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'box-shadow 0.2s, border-color 0.2s',
};

export default RecipesPage;
