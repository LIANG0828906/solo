import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore } from '../stores/recipeStore';
import { Recipe } from '../types';

const RecipeList: React.FC = () => {
  const { getRecommendedRecipes, setCurrentRecipe } = useRecipeStore();
  const navigate = useNavigate();
  const recipes = getRecommendedRecipes();

  const handleClick = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    navigate(`/recipe/${recipe.id}`);
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单';
      case 'medium':
        return '中等';
      case 'hard':
        return '困难';
      default:
        return difficulty;
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  return (
    <div
      className="recipe-list"
      style={{
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#333' }}>
          🍳 推荐菜谱
        </h2>
        <span style={{ fontSize: '14px', color: '#888' }}>
          共 {recipes.length} 道菜谱
        </span>
      </div>

      <div
        className="recipe-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '20px',
        }}
      >
        {recipes.map((recipe, index) => (
          <div
            key={recipe.id}
            className="card recipe-card"
            onClick={() => handleClick(recipe)}
            style={{
              backgroundColor: '#fff8e1',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              animation: `fadeIn 0.4s ease-out ${index * 0.08}s both`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '60%',
                overflow: 'hidden',
              }}
            >
              <img
                src={recipe.image}
                alt={recipe.name}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: getMatchColor(recipe.matchScore),
                }}
              >
                匹配度 {recipe.matchScore}%
              </div>
            </div>

            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '10px',
                }}
              >
                {recipe.name}
              </h3>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  fontSize: '13px',
                  color: '#666',
                }}
              >
                <span>⏱ {recipe.cookTime}分钟</span>
                <span>👥 {recipe.servings}人份</span>
                <span
                  style={{
                    color: '#ff8f00',
                    fontWeight: 500,
                  }}
                >
                  {getDifficultyText(recipe.difficulty)}
                </span>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div
                  style={{
                    height: '6px',
                    backgroundColor: '#ffe0b2',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${recipe.matchScore}%`,
                      backgroundColor: getMatchColor(recipe.matchScore),
                      borderRadius: '3px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeList;
