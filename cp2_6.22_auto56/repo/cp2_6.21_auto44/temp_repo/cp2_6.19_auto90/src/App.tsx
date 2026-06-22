import React, { useState, useEffect, useMemo } from 'react';
import {
  Ingredient,
  Recipe,
  MatchResult,
  getAllIngredients,
  getAllRecipes,
  calculateMatch,
} from './data';
import RecipeList from './RecipeList';
import IngredientManager from './IngredientManager';
import RecipeDetail from './RecipeDetail';

type Page = 'recipes' | 'ingredients';

const styles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
      'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    background: #FFF8F0;
    color: #3E2723;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
  }

  .app-container {
    min-height: 100vh;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px 40px;
  }

  @media (max-width: 768px) {
    .app-container {
      padding: 0 12px 30px;
    }
  }

  .nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 0;
    position: sticky;
    top: 0;
    background: linear-gradient(to bottom, #FFF8F0 85%, rgba(255,248,240,0.85) 100%);
    backdrop-filter: blur(10px);
    z-index: 50;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 24px;
    font-weight: 700;
    color: #8B4513;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #F97316 0%, #D97706 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 22px;
  }

  .nav-tabs {
    display: flex;
    gap: 8px;
    background: rgba(139, 69, 19, 0.08);
    padding: 6px;
    border-radius: 14px;
  }

  @media (max-width: 768px) {
    .nav-tabs {
      display: none;
    }
    .nav-tabs.mobile-open {
      display: flex;
      position: absolute;
      top: 100%;
      right: 0;
      flex-direction: column;
      width: 180px;
      padding: 10px;
      background: #FFF8F0;
      border: 1px solid rgba(139, 69, 19, 0.15);
      border-radius: 14px;
      box-shadow: 0 8px 30px rgba(139, 69, 19, 0.12);
      margin-top: 6px;
    }
  }

  .nav-tab {
    padding: 8px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    color: #8B4513;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border: none;
    background: transparent;
    user-select: none;
    font-family: inherit;
  }

  .nav-tab:hover {
    background: rgba(249, 115, 22, 0.08);
  }

  .nav-tab.active {
    background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
  }

  .hamburger-btn {
    display: none;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    border: none;
    background: rgba(139, 69, 19, 0.08);
    cursor: pointer;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: all 0.2s ease;
  }

  .hamburger-btn:hover {
    background: rgba(139, 69, 19, 0.15);
    transform: scale(1.05);
  }

  .hamburger-btn:active {
    transform: scale(0.97);
  }

  .hamburger-line {
    width: 20px;
    height: 2px;
    background: #8B4513;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  @media (max-width: 768px) {
    .hamburger-btn {
      display: flex;
    }
  }

  .mobile-menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(0,0,0,0.2);
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .page-header {
    margin: 10px 0 24px;
  }

  .page-title {
    font-size: 28px;
    font-weight: 800;
    color: #3E2723;
    margin-bottom: 6px;
  }

  @media (max-width: 768px) {
    .page-title {
      font-size: 22px;
    }
  }

  .page-subtitle {
    font-size: 14px;
    color: #A1887F;
  }
`;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('recipes');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const [ings, recs] = await Promise.all([
        getAllIngredients(),
        getAllRecipes(),
      ]);
      setIngredients(ings);
      setRecipes(recs);
    };
    loadData();
  }, []);

  const matches: MatchResult[] = useMemo(() => {
    return recipes
      .map((r) => calculateMatch(r, ingredients))
      .sort((a, b) => {
        const ar = a.totalCount > 0 ? a.matchedCount / a.totalCount : 0;
        const br = b.totalCount > 0 ? b.matchedCount / b.totalCount : 0;
        if (br !== ar) return br - ar;
        return a.recipe.cookTime - b.recipe.cookTime;
      });
  }, [recipes, ingredients]);

  const refreshIngredients = async () => {
    const ings = await getAllIngredients();
    setIngredients(ings);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleCloseDetail = () => {
    setSelectedRecipe(null);
  };

  const switchPage = (page: Page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <style>{styles}</style>

      <div className="app-container">
        <nav className="nav-header">
          <div className="logo">
            <div className="logo-icon">🍳</div>
            <span>家味</span>
          </div>

          <div className={`nav-tabs ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <button
              className={`nav-tab ${currentPage === 'recipes' ? 'active' : ''}`}
              onClick={() => switchPage('recipes')}
            >
              🥘 菜谱推荐
            </button>
            <button
              className={`nav-tab ${currentPage === 'ingredients' ? 'active' : ''}`}
              onClick={() => switchPage('ingredients')}
            >
              🥬 食材管理
            </button>
          </div>

          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="菜单"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </nav>

        {mobileMenuOpen && (
          <div
            className="mobile-menu-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {currentPage === 'recipes' && (
          <>
            <div className="page-header">
              <h1 className="page-title">智能菜谱推荐</h1>
              <p className="page-subtitle">
                根据您库存的 {ingredients.length} 种食材，为您精选 {recipes.length} 道美味菜谱
              </p>
            </div>
            <RecipeList
              matches={matches}
              onSelectRecipe={handleSelectRecipe}
            />
          </>
        )}

        {currentPage === 'ingredients' && (
          <>
            <div className="page-header">
              <h1 className="page-title">食材库存管理</h1>
              <p className="page-subtitle">
                添加、编辑或删除您家中的食材，保持库存更新，助力智能推荐
              </p>
            </div>
            <IngredientManager
              ingredients={ingredients}
              onChanged={refreshIngredients}
            />
          </>
        )}
      </div>

      {selectedRecipe && (
        <RecipeDetail
          recipe={selectedRecipe}
          allMatches={matches}
          ingredients={ingredients}
          onClose={handleCloseDetail}
          onSelectOther={handleSelectRecipe}
        />
      )}
    </>
  );
};

export default App;
