import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useRecipeStore } from '../store/recipeStore';
import { Recipe } from '../types';
import { ingredientSuggestions } from '../data/mockRecipes';

const HomePage = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredRecipes = useRecipeStore((state) => state.filteredRecipes);
  const searchIngredients = useRecipeStore((state) => state.searchIngredients);
  const setSearchQuery = useRecipeStore((state) => state.setSearchQuery);
  const addSearchIngredient = useRecipeStore((state) => state.addSearchIngredient);
  const removeSearchIngredient = useRecipeStore((state) => state.removeSearchIngredient);
  const clearSearchIngredients = useRecipeStore((state) => state.clearSearchIngredients);
  const searchRecipes = useRecipeStore((state) => state.searchRecipes);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    searchRecipes();
  }, [searchIngredients, searchRecipes]);

  const filteredSuggestions = ingredientSuggestions.filter(
    (s) =>
      s.name.includes(inputValue) &&
      !searchIngredients.includes(s.name)
  );

  const handleAddIngredient = (name: string) => {
    addSearchIngredient(name);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    setSearchQuery(inputValue);
    searchRecipes();
    setShowSuggestions(false);
  };

  const renderStars = (difficulty: number) => {
    return '⭐'.repeat(difficulty) + '☆'.repeat(3 - difficulty);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar />

      <div
        style={{
          marginLeft: '240px',
          minHeight: '100vh',
          padding: '0',
          '@media (max-width: 1024px)': { marginLeft: 0 },
        }}
        className="page-container"
      >
        <style>{`
          @media (max-width: 1024px) {
            .page-container { margin-left: 0 !important; }
          }
        `}</style>

        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            padding: '16px 32px',
            background: 'rgba(240, 250, 248, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(46, 134, 171, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              maxWidth: '1200px',
              margin: '0 auto',
            }}
          >
            <div ref={searchRef} style={{ flex: 1, position: 'relative' }}>
              <div
                className="glass-effect"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 'var(--radius-xl)',
                  padding: '4px 8px 4px 20px',
                  border: '2px solid transparent',
                  transition: 'border-color var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '18px', marginRight: '8px' }}>🔍</span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setShowSuggestions(true);
                    setSearchQuery(e.target.value);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  placeholder="输入食材或菜名，如：西兰花、鸡胸肉..."
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    fontSize: '15px',
                    background: 'transparent',
                  }}
                />
                {searchIngredients.length > 0 && (
                  <button
                    onClick={clearSearchIngredients}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      color: 'var(--color-text-light)',
                      marginRight: '4px',
                    }}
                    className="hover-scale"
                  >
                    清空
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  className="hover-scale"
                  style={{
                    padding: '10px 24px',
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  搜索
                </button>
              </div>

              {searchIngredients.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {searchIngredients.map((ing) => {
                    const suggestion = ingredientSuggestions.find((s) => s.name === ing);
                    return (
                      <span
                        key={ing}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))',
                          color: 'white',
                          borderRadius: 'var(--radius-xl)',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      >
                        <span>{suggestion?.emoji || '🥗'}</span>
                        <span>{ing}</span>
                        <button
                          onClick={() => removeSearchIngredient(ing)}
                          style={{
                            marginLeft: '4px',
                            color: 'white',
                            opacity: 0.8,
                            fontSize: '14px',
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {showSuggestions && inputValue && filteredSuggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '8px',
                    background: 'var(--color-card)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: '8px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    zIndex: 60,
                  }}
                >
                  {filteredSuggestions.slice(0, 10).map((suggestion) => (
                    <button
                      key={suggestion.name}
                      onClick={() => handleAddIngredient(suggestion.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'left',
                        fontSize: '14px',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{suggestion.emoji}</span>
                      <span>{suggestion.name}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--color-primary)', fontSize: '12px' }}>
                        + 添加
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: 'white',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                flexShrink: 0,
              }}
              className="hover-scale"
            >
              👤
            </div>
          </div>
        </header>

        <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
              {searchIngredients.length > 0 ? '为你推荐的菜谱 🍽️' : '热门菜谱推荐 🔥'}
            </h1>
            <p style={{ color: 'var(--color-text-light)', fontSize: '14px' }}>
              {searchIngredients.length > 0
                ? `根据你选择的 ${searchIngredients.length} 种食材，为你找到 ${filteredRecipes.length} 道菜谱`
                : `共 ${filteredRecipes.length} 道精选菜谱，总有一道适合你`}
            </p>
          </div>

          {filteredRecipes.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: 'var(--color-text-light)',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤔</div>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>没有找到匹配的菜谱</p>
              <p style={{ fontSize: '14px' }}>试试输入其他食材吧</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '24px',
              }}
              className="recipe-grid"
            >
              <style>{`
                @media (max-width: 1024px) {
                  .recipe-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 640px) {
                  .recipe-grid { grid-template-columns: 1fr !important; }
                }
              `}</style>
              {filteredRecipes.map((recipe: Recipe, index: number) => (
                <div
                  key={recipe.id}
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                  className="card-fade-in hover-scale"
                  style={{
                    animationDelay: `${index * 80}ms`,
                    background: 'var(--color-card)',
                    border: '2px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div
                    style={{
                      height: '160px',
                      background: `linear-gradient(135deg, ${recipe.gradientColors[0]}, ${recipe.gradientColors[1]})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '64px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                        transform: 'scale(1.1)',
                      }}
                    >
                      {recipe.emoji}
                    </span>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        height: '50%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)',
                      }}
                    />
                  </div>
                  <div style={{ padding: '16px 20px 20px' }}>
                    <h3
                      style={{
                        fontSize: '17px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        lineHeight: 1.4,
                      }}
                    >
                      {recipe.name}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        color: 'var(--color-text-light)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⏱️ {recipe.cookTime}分钟
                      </span>
                      <span>{renderStars(recipe.difficulty)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;
