import React, { useEffect, useMemo } from 'react';
import { Spin, Empty, Tag } from 'antd';
import { useRecipeStore } from '../stores/recipeStore';
import IngredientSelector from '../components/IngredientSelector';
import type { SearchResult } from '../utils/api';

const RecipeSearchPage: React.FC = React.memo(() => {
  const { ingredients, searchResults, loadIngredients, loading } = useRecipeStore();

  useEffect(() => {
    if (ingredients.length === 0) {
      loadIngredients();
    }
  }, [ingredients.length, loadIngredients]);

  const ingredientMap = useMemo(() => {
    const map = new Map<string, string>();
    ingredients.forEach(i => map.set(i.id, i.name));
    return map;
  }, [ingredients]);

  const navigateToDetail = (id: string) => {
    window.location.hash = `#/recipe/${id}`;
  };

  return (
    <div>
      <IngredientSelector />

      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" tip="搜索食谱中..." />
        </div>
      )}

      {!loading && searchResults.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          <Empty description="选择食材后点击搜索，发现美味食谱" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )}

      {!loading && searchResults.length > 0 && (
        <div>
          <div style={{ marginBottom: 16, fontSize: 16, color: '#333' }}>
            找到 <span style={{ color: '#1890FF', fontWeight: 600 }}>{searchResults.length}</span> 个相关食谱
          </div>
          <div
            className="recipe-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 20,
            }}
          >
            {searchResults.map((recipe: SearchResult) => (
              <div
                key={recipe.id}
                onClick={() => navigateToDetail(recipe.id)}
                className="recipe-card"
                style={{
                  width: '100%',
                  maxWidth: 400,
                  height: 320,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
                  el.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ width: '100%', height: 180, overflow: 'hidden' }}>
                  <img
                    src={recipe.cover}
                    alt={recipe.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 17, fontWeight: 600, color: '#333' }}>{recipe.name}</span>
                    <Tag
                      color={recipe.cuisine === '中餐' ? 'red' : recipe.cuisine === '西餐' ? 'blue' : 'geekblue'}
                      style={{ marginLeft: 8, borderRadius: 4 }}
                    >
                      {recipe.cuisine}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>
                    所需食材 {recipe.ingredients.length} 种 · 已匹配 {recipe.matchedIngredients.length} 种
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {recipe.ingredients.map(ingId => {
                      const isMatched = recipe.matchedIngredients.includes(ingId);
                      const name = ingredientMap.get(ingId) || ingId;
                      return (
                        <span
                          key={ingId}
                          style={{
                            fontSize: 12,
                            padding: '1px 6px',
                            borderRadius: 3,
                            background: isMatched ? '#F6FFED' : '#FFF1F0',
                            color: isMatched ? '#52C41A' : '#FF4D4F',
                            border: isMatched ? '1px solid #B7EB8F' : '1px solid #FFA39E',
                          }}
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  匹配度 {Math.round(recipe.matchRate * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .recipe-grid {
            grid-template-columns: 1fr !important;
          }
          .recipe-card {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
});

RecipeSearchPage.displayName = 'RecipeSearchPage';

export default RecipeSearchPage;
