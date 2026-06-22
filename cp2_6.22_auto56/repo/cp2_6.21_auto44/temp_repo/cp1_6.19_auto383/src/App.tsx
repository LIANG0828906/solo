import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { ShoppingList } from './components/ShoppingList';
import { useRecipeStore } from './stores/recipeStore';

export function App() {
  const location = useLocation();
  const { selectedRecipeIds } = useRecipeStore();

  return (
    <div>
      <nav className="nav-bar">
        <NavLink to="/" className="nav-title">
          🍜 美食食谱
        </NavLink>
        <div className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
          >
            首页
          </NavLink>
          <NavLink
            to="/shopping-list"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            🛒 购物清单
            {selectedRecipeIds.length > 0 && (
              <span className="nav-badge">{selectedRecipeIds.length}</span>
            )}
          </NavLink>
        </div>
      </nav>

      <main className="container" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<RecipeList />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
        </Routes>
      </main>
    </div>
  );
}
