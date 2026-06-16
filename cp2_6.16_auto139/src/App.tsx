import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import ListPage from './pages/ListPage';
import HistoryPage from './pages/HistoryPage';
import { useRecipeStore } from './store/recipeStore';
import { useListStore } from './store/listStore';

function App() {
  const initRecipeStore = useRecipeStore((state) => state.initStore);
  const initListStore = useListStore((state) => state.initStore);
  const [isLoaded, setIsLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      await Promise.all([initRecipeStore(), initListStore()]);
      setIsLoaded(true);
    };
    init();
  }, [initRecipeStore, initListStore]);

  if (!isLoaded) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--color-bg)',
          fontSize: '18px',
          color: 'var(--color-primary)',
        }}
      >
        🍳 RecipeRadar 加载中...
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </div>
  );
}

export default App;
