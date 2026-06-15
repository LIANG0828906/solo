import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import RecipeList from './modules/recipes/RecipeList';
import RecipeDetail from './modules/recipes/RecipeDetail';
import CommunityPanel from './modules/community/CommunityPanel';
import UserProfile from './modules/profile/UserProfile';
import { useRecipeStore } from './stores/recipeStore';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useRecipeStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isDetailPage = location.pathname.startsWith('/recipe/');

  if (!hydrated) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">🍳</div>
        <p className="retro-font">正在翻开食谱卡片...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {!isDetailPage && (
        <header className="app-header">
          <div className="header-content">
            <Link to="/" className="logo">
              <span className="logo-icon">📜</span>
              <span className="logo-text retro-font">RetroRecipe</span>
            </Link>
            <nav className="nav-links">
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                食谱卡片
              </Link>
              <Link
                to="/community"
                className={location.pathname === '/community' ? 'active' : ''}
              >
                味蕾社区
              </Link>
              <Link
                to="/profile"
                className={location.pathname === '/profile' ? 'active' : ''}
              >
                {userProfile ? '我的口味' : '注册'}
              </Link>
            </nav>
          </div>
        </header>
      )}

      <main className={`app-main ${isDetailPage ? 'detail-page' : ''}`}>
        <Routes>
          <Route path="/" element={<RecipeList />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/community" element={<CommunityPanel />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </main>

      {!isDetailPage && (
        <footer className="app-footer">
          <p className="retro-font">用爱烹饪，用心分享 ✨</p>
        </footer>
      )}
    </div>
  );
}

export default App;
