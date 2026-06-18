import React from 'react';
import { useAppStore } from '../store/useAppStore';
import RecipeCard from './RecipeCard';
import type { Recipe } from '../api/recipeApi';

const RecipePanel: React.FC = () => {
  const { recipes, favorites, showFavoritesOnly, toggleFavorite, openShoppingList, isLoading } =
    useAppStore();

  const displayedRecipes = showFavoritesOnly
    ? recipes.filter((recipe) => favorites.includes(recipe.id))
    : recipes;

  const handleViewMissing = (recipe: Recipe) => {
    openShoppingList(recipe);
  };

  const hasFavorites = favorites.length > 0;

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '2px solid rgba(224, 216, 200, 0.6)',
        padding: '24px',
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
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#333',
            margin: 0,
          }}
        >
          🍳 推荐菜谱
        </h2>

        {hasFavorites && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>只看收藏</span>
            <button
              onClick={() => useAppStore.getState().setShowFavoritesOnly(!showFavoritesOnly)}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: showFavoritesOnly ? '#6BCB77' : '#CCC',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                padding: 0,
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: '2px',
                  left: showFavoritesOnly ? '22px' : '2px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: '#999',
            fontSize: '14px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f0f0f0',
              borderTop: '3px solid #FF6B6B',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          正在为您匹配菜谱...
        </div>
      )}

      {!isLoading && recipes.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: '#999',
            fontSize: '14px',
          }}
        >
          添加食材后点击"开始推荐"获取菜谱推荐
        </div>
      )}

      {!isLoading && displayedRecipes.length === 0 && recipes.length > 0 && showFavoritesOnly && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 0',
            color: '#999',
            fontSize: '14px',
          }}
        >
          还没有收藏的菜谱
        </div>
      )}

      {!isLoading && displayedRecipes.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 300px)',
            gap: '20px',
            justifyContent: 'center',
          }}
          className="recipe-grid"
        >
          {displayedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isFavorite={favorites.includes(recipe.id)}
              onToggleFavorite={toggleFavorite}
              onViewMissing={handleViewMissing}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipePanel;
