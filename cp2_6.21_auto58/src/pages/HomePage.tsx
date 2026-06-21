import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { RecipeCard } from '../components/RecipeCard';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#F5E6CC',
  padding: '24px',
  fontFamily: "'Quicksand', sans-serif",
};

const headerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto 32px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 700,
  color: '#4A2F1A',
  margin: '0 0 24px 0',
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  flexWrap: 'wrap',
  alignItems: 'center',
  marginBottom: '24px',
};

const searchInputStyle: React.CSSProperties = {
  flex: '1',
  minWidth: '200px',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '2px solid #D4C4B0',
  fontSize: '16px',
  outline: 'none',
  fontFamily: "'Quicksand', sans-serif",
  background: '#FFFFFF',
};

const selectStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '8px',
  border: '2px solid #D4C4B0',
  fontSize: '16px',
  outline: 'none',
  fontFamily: "'Quicksand', sans-serif",
  background: '#FFFFFF',
  cursor: 'pointer',
};

const actionContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
};

const selectionInfoStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B5344',
  fontWeight: 500,
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'all 0.2s ease',
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#D4A574',
  color: '#FFFFFF',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#FFFFFF',
  color: '#4A2F1A',
  border: '2px solid #D4C4B0',
};

const favoriteToggleStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: '8px',
  border: '2px solid #8B5A2B',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'all 0.2s ease',
  background: '#FFFFFF',
  color: '#8B5A2B',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '24px',
  maxWidth: '1200px',
  margin: '0 auto',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '64px 24px',
  color: '#6B5344',
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '80px',
  marginBottom: '16px',
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 500,
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    recipes,
    selectedRecipeIds,
    searchQuery,
    sortOrder,
    showFavoritesOnly,
    toggleRecipeSelection,
    setSearchQuery,
    setSortOrder,
    setShowFavoritesOnly,
    toggleFavorite,
    clearSelection,
    generateShoppingList,
    fetchRecipes,
  } = useAppStore();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const filteredRecipes = useMemo(() => {
    let result = [...recipes];

    if (showFavoritesOnly) {
      result = result.filter((r) => r.is_favorite);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(query));
    }

    if (sortOrder) {
      result.sort((a, b) =>
        sortOrder === 'asc'
          ? a.cooking_time - b.cooking_time
          : b.cooking_time - a.cooking_time
      );
    }

    return result;
  }, [recipes, searchQuery, sortOrder, showFavoritesOnly]);

  const handleGenerateShoppingList = () => {
    generateShoppingList();
    navigate('/shopping');
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🍽️ 我的厨房</h1>

        <div style={toolbarStyle}>
          <input
            type="text"
            placeholder="🔍 搜索菜谱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              ...searchInputStyle,
              borderColor: searchQuery ? '#D4A574' : '#D4C4B0',
            }}
          />

          <select
            value={sortOrder || ''}
            onChange={(e) =>
              setSortOrder(
                e.target.value === '' ? null : (e.target.value as 'asc' | 'desc')
              )
            }
            style={selectStyle}
          >
            <option value="">按烹饪时间排序</option>
            <option value="asc">⏱️ 时间短→长</option>
            <option value="desc">⏱️ 时间长→短</option>
          </select>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{
              ...favoriteToggleStyle,
              background: showFavoritesOnly ? '#E91E63' : '#FFFFFF',
              color: showFavoritesOnly ? '#FFFFFF' : '#8B5A2B',
              borderColor: showFavoritesOnly ? '#FFFFFF' : '#8B5A2B',
            }}
            onMouseEnter={(e) => {
              if (!showFavoritesOnly) {
                (e.currentTarget as HTMLButtonElement).style.background = '#FFEBEE';
              }
            }}
            onMouseLeave={(e) => {
              if (!showFavoritesOnly) {
                (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
              }
            }}
          >
            ❤️ 只显示收藏
          </button>

          <div style={actionContainerStyle}>
            {selectedRecipeIds.length > 0 && (
              <>
                <span style={selectionInfoStyle}>
                  已选 {selectedRecipeIds.length} 个菜谱
                </span>
                <button
                  onClick={clearSelection}
                  style={secondaryButtonStyle}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      '#F5E6CC';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      '#FFFFFF';
                  }}
                >
                  清除选择
                </button>
              </>
            )}
            <button
              onClick={handleGenerateShoppingList}
              disabled={selectedRecipeIds.length === 0}
              style={{
                ...primaryButtonStyle,
                opacity: selectedRecipeIds.length === 0 ? 0.5 : 1,
                cursor:
                  selectedRecipeIds.length === 0 ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (selectedRecipeIds.length > 0) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    '#C49464';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  '#D4A574';
              }}
            >
              🛒 生成购物清单
            </button>
          </div>
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>🍳</div>
          <div style={emptyTextStyle}>
            {searchQuery ? '没有找到匹配的菜谱' : '还没有菜谱，快去创建吧！'}
          </div>
        </div>
      ) : (
        <div style={gridStyle}>
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isSelected={selectedRecipeIds.includes(recipe.id)}
              onToggleSelect={() => toggleRecipeSelection(recipe.id)}
              onClick={() => navigate(`/recipe/${recipe.id}`)}
              isFavorite={recipe.is_favorite || false}
              onToggleFavorite={() => toggleFavorite(recipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
