import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import RecipeCard from './components/RecipeCard';
import RecipeDetail from './components/RecipeDetail';
import { recipeApi } from './api/recipeApi';
import type { RecipeSummary, Recipe } from './types';

const App = () => {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const data = await recipeApi.getRecipes();
        setRecipes(data);
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();
  }, []);

  const handleCardClick = useCallback((recipe: RecipeSummary) => {
    navigate(`/recipe/${recipe.id}`);
  }, [navigate]);

  const handleRecipeUpdate = useCallback((updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(r => 
      r.id === updatedRecipe.id 
        ? { 
            ...r, 
            improveCount: updatedRecipe.improveCount, 
            updatedAt: updatedRecipe.updatedAt 
          }
        : r
    ));
  }, []);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo} onClick={handleBack}>
            <span style={styles.logoIcon}>🍳</span>
            社区食谱众创
          </h1>
          <p style={styles.subtitle}>发现美食，共创美味</p>
        </div>
      </header>

      <main style={styles.main}>
        <Routes>
          <Route 
            path="/" 
            element={
              loading ? (
                <div style={styles.loadingContainer}>
                  <div style={styles.spinner}></div>
                  <p style={styles.loadingText}>加载中...</p>
                </div>
              ) : (
                <div className="masonry-container" style={styles.masonryContainer}>
                  {recipes.map((recipe, index) => (
                    <div 
                      key={recipe.id}
                      className="masonry-item"
                      style={{
                        ...styles.masonryItem,
                        animationDelay: `${index * 0.05}s`,
                        opacity: 0,
                        animation: `fadeIn 0.5s ease-out ${index * 0.05}s forwards`
                      }}
                    >
                      <RecipeCard 
                        recipe={recipe} 
                        onClick={() => handleCardClick(recipe)}
                      />
                    </div>
                  ))}
                </div>
              )
            } 
          />
          <Route 
            path="/recipe/:id" 
            element={
              <RecipeDetail 
                onRecipeUpdate={handleRecipeUpdate}
                onBack={handleBack}
              />
            } 
          />
        </Routes>
      </main>

      <footer style={styles.footer}>
        <p>© 2024 社区食谱众创 - 让美味不断进化</p>
      </footer>
    </div>
  );
};

const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#0F172A',
    color: '#E2E8F0',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    backgroundColor: '#1E293B',
    borderBottom: '1px solid #334155',
    padding: '20px 0',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
  },
  logo: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#F59E0B',
    margin: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: '4px 0 0 0',
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
    width: '100%',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #334155',
    borderTopColor: '#F59E0B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: '14px',
  },
  masonryContainer: {
  },
  masonryItem: {
  },
  footer: {
    backgroundColor: '#1E293B',
    borderTop: '1px solid #334155',
    padding: '20px 0',
    textAlign: 'center' as const,
    color: '#64748B',
    fontSize: '14px',
  },
};

const globalStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

if (!document.querySelector('#app-global-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'app-global-styles';
  styleSheet.textContent = globalStyles;
  document.head.appendChild(styleSheet);
}

export default App;
