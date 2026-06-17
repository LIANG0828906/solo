import { useAppStore } from './store';
import RecipePage from './RecipePage';
import FavoritesPage from './FavoritesPage';
import RecipeDetail from './RecipeDetail';

export default function App() {
  const { currentPage, setCurrentPage, detailRecipe } = useAppStore();

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-title">RecipeCraft</div>
        <div className="navbar-nav">
          <button
            className={`nav-item ${currentPage === 'recommend' ? 'active' : ''}`}
            onClick={() => setCurrentPage('recommend')}
          >
            <span className="nav-icon">🍳</span>
            <span className="nav-text">菜谱推荐</span>
          </button>
          <button
            className={`nav-item ${currentPage === 'favorites' ? 'active' : ''}`}
            onClick={() => setCurrentPage('favorites')}
          >
            <span className="nav-icon">❤</span>
            <span className="nav-text">我收藏的菜谱</span>
          </button>
        </div>
      </nav>

      <div className="app-container">
        {currentPage === 'recommend' ? <RecipePage /> : <FavoritesPage />}
      </div>

      {detailRecipe && <RecipeDetail />}
    </div>
  );
}
