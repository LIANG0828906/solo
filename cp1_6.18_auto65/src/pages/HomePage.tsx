import { useEffect } from 'react';
import { Shuffle, TrendingUp } from 'lucide-react';
import useStore from '../store/useStore';
import RecipeCard from '../components/RecipeCard';
import SearchBar from '../components/SearchBar';
import './HomePage.css';

function HomePage() {
  const recipes = useStore(state => state.recipes);
  const isLoading = useStore(state => state.isLoading);
  const fetchRecipes = useStore(state => state.fetchRecipes as () => Promise<void>);

  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [recipes.length, fetchRecipes]);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              发现美食<span className="accent">灵感</span>
            </h1>
            <p className="hero-subtitle">
              分享你的创意菜品，发现数千种搭配灵感，让每一餐都充满惊喜
            </p>
          </div>

          <div className="hero-search-wrapper">
            <SearchBar />
          </div>

          <div className="hero-tags">
            <span className="tag-item">🍅 家常菜</span>
            <span className="tag-item">🥩 快手菜</span>
            <span className="tag-item">🥗 减脂餐</span>
            <span className="tag-item">🍰 烘焙</span>
            <span className="tag-item">🌶️ 川菜</span>
          </div>
        </div>

        <div className="hero-decoration">
          <div className="hero-circle circle-1" />
          <div className="hero-circle circle-2" />
          <div className="hero-emoji" aria-hidden>🍳</div>
        </div>
      </section>

      <section className="recipes-section">
        <div className="section-header">
          <div className="section-title-wrapper">
            <TrendingUp size={24} className="section-icon" />
            <h2 className="section-title">精选推荐</h2>
          </div>
          <button className="refresh-btn" onClick={() => fetchRecipes()}>
            <Shuffle size={16} />
            换一批
          </button>
        </div>

        {isLoading && recipes.length === 0 ? (
          <div className="loading-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-image" />
                <div className="skeleton-content">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line medium" />
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🥘</span>
            <p>还没有菜谱，快去发布第一个吧！</p>
          </div>
        ) : (
          <div className="recipe-grid">
            {recipes.map((recipe, index) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                lazy={index >= 6}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;
