import { Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import RecipeList from './pages/RecipeList';
import RecipeDetail from './pages/RecipeDetail';
import { mockRecipes } from './data/mockData';
import { Recipe, Menu } from './types';

interface GlobalState {
  recipes: Recipe[];
  toggleFavorite: (id: string) => void;
  updateRecipe: (recipe: Recipe) => void;
  menus: Menu[];
  addMenu: (menu: Menu) => void;
  notification: { show: boolean; message: string };
  showNotification: (message: string) => void;
}

const GlobalContext = createContext<GlobalState | null>(null);

export const useGlobalState = () => {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error('useGlobalState must be used within GlobalProvider');
  return ctx;
};

export default function App() {
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((message: string) => {
    if (hideTimer) clearTimeout(hideTimer);
    setNotification({ show: true, message });
    const timer = setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 2000);
    setHideTimer(timer);
  }, [hideTimer]);

  useEffect(() => {
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [hideTimer]);

  const toggleFavorite = useCallback((id: string) => {
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  }, []);

  const updateRecipe = useCallback((recipe: Recipe) => {
    setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
  }, []);

  const addMenu = useCallback((menu: Menu) => {
    setMenus(prev => [...prev, menu]);
  }, []);

  const value = useMemo(() => ({
    recipes,
    toggleFavorite,
    updateRecipe,
    menus,
    addMenu,
    notification,
    showNotification,
  }), [recipes, toggleFavorite, updateRecipe, menus, addMenu, notification, showNotification]);

  return (
    <GlobalContext.Provider value={value}>
      <div className="app-container">
        <div
          className="notification-bar"
          style={{ opacity: notification.show ? 1 : 0 }}
        >
          {notification.show && (
            <div className={`notification-bar ${notification.show ? 'show' : ''}`}>
              {notification.message}
            </div>
          )}
        </div>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<RecipeList />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
          </Routes>
        </div>
      </div>
    </GlobalContext.Provider>
  );
}
