import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecipeStore, SearchFilters } from '@/store/recipeStore';
import RecipeCard from '@/components/RecipeCard';
import type { Recipe } from '@/models/recipeTypes';

const fadeStyleId = 'homepage-fadein-keyframes';

function injectFadeInKeyframes() {
  if (document.getElementById(fadeStyleId)) return;
  const style = document.createElement('style');
  style.id = fadeStyleId;
  style.textContent = `
    @keyframes fadeInItem {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

type TabType = 'all' | 'favorites';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { searchRecipesWithFilters, getAllCategories, favorites, recipes } = useRecipeStore();

  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [minCookTime, setMinCookTime] = useState<number | ''>('');
  const [maxCookTime, setMaxCookTime] = useState<number | ''>('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const categories = useMemo(() => getAllCategories(), [recipes]);

  useEffect(() => {
    injectFadeInKeyframes();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const searchResults: Recipe[] = useMemo(() => {
    const filters: SearchFilters = {
      keyword: debouncedKeyword,
      category,
      minCookTime: minCookTime === '' ? null : minCookTime,
      maxCookTime: maxCookTime === '' ? null : maxCookTime,
    };
    return searchRecipesWithFilters(filters);
  }, [debouncedKeyword, category, minCookTime, maxCookTime, searchRecipesWithFilters]);

  const displayedRecipes = useMemo(() => {
    if (activeTab === 'favorites') {
      return searchResults.filter((r) => favorites.includes(r.id));
    }
    return searchResults;
  }, [searchResults, activeTab, favorites]);

  const navbarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #D4A574, #F5E6D3)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: '#5D3A1A',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  };

  const searchBoxStyle: React.CSSProperties = {
    flex: '0 1 360px',
    margin: '0 24px',
    position: 'relative',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 16px 8px 36px',
    borderRadius: 20,
    border: '1px solid rgba(93, 58, 26, 0.2)',
    fontSize: 14,
    outline: 'none',
    backgroundColor: 'rgba(255,255,255,0.85)',
    boxSizing: 'border-box',
  };

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 14,
    color: '#999',
    pointerEvents: 'none',
  };

  const navRightStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  };

  const navBtnStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s',
  };

  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 24px',
    backgroundColor: '#FAF5EF',
    flexWrap: 'nowrap',
  };

  const filterControlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #D4A574',
    fontSize: 13,
    outline: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
  };

  const timeInputStyle: React.CSSProperties = {
    width: 110,
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #D4A574',
    fontSize: 13,
    outline: 'none',
  };

  const resultTextStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#888',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  const tabBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: 0,
    padding: '0 24px',
    borderBottom: '2px solid #F0E4D7',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? '#D4A574' : '#888',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    borderBottom: isActive ? '2px solid #D4A574' : '2px solid transparent',
    marginBottom: -2,
    transition: 'color 0.2s, border-color 0.2s',
  });

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    padding: '20px 24px',
  };

  return (
    <div>
      <nav style={navbarStyle}>
        <Link to="/" style={logoStyle}>
          食谱分享社区
        </Link>

        <div style={searchBoxStyle}>
          <span style={searchIconStyle}>🔍</span>
          <input
            type="text"
            placeholder="搜索食谱名称或食材..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        <div style={navRightStyle}>
          <button
            style={{ ...navBtnStyle, backgroundColor: '#D4A574', color: '#fff' }}
            onClick={() => navigate('/create')}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            创建食谱
          </button>
          <button
            style={{ ...navBtnStyle, backgroundColor: '#fff', color: '#D4A574', border: '1px solid #D4A574' }}
            onClick={() => navigate('/favorites')}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            我的收藏
          </button>
        </div>
      </nav>

      <div style={filterBarStyle}>
        <div style={filterControlsStyle}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={selectStyle}
          >
            <option value="">全部类别</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="最短(分钟)"
            value={minCookTime}
            onChange={(e) => setMinCookTime(e.target.value === '' ? '' : Number(e.target.value))}
            style={timeInputStyle}
            min={0}
          />
          <span style={{ color: '#999' }}>—</span>
          <input
            type="number"
            placeholder="最长(分钟)"
            value={maxCookTime}
            onChange={(e) => setMaxCookTime(e.target.value === '' ? '' : Number(e.target.value))}
            style={timeInputStyle}
            min={0}
          />
        </div>

        <span style={resultTextStyle}>共找到{displayedRecipes.length}个食谱</span>
      </div>

      <div style={tabBarStyle}>
        <button style={tabStyle(activeTab === 'all')} onClick={() => setActiveTab('all')}>
          全部
        </button>
        <button style={tabStyle(activeTab === 'favorites')} onClick={() => setActiveTab('favorites')}>
          收藏
        </button>
      </div>

      <div style={gridStyle} className="home-recipe-grid" key={`grid-${activeTab}-${displayedRecipes.length}`}>
        {displayedRecipes.map((recipe, index) => (
          <div
            key={`${recipe.id}-${activeTab}-${index}`}
            style={{
              animation: `fadeInItem 0.4s ease-out ${index * 0.06}s both`,
            }}
          >
            <RecipeCard recipe={recipe} />
          </div>
        ))}
      </div>

      {displayedRecipes.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            color: '#aaa',
            fontSize: 15,
          }}
        >
          暂无符合条件的食谱
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .home-recipe-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .home-recipe-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
