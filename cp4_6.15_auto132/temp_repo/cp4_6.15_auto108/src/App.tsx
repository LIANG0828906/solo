import { useRecipeStore } from './store/recipeStore';
import RecipeCard from './components/RecipeCard';
import RecipeDetail from './components/RecipeDetail';
import SearchBar from './components/SearchBar';

export default function App() {
  const recipes = useRecipeStore((s) => s.recipes);
  const hasSearched = useRecipeStore((s) => s.hasSearched);
  const showDetail = useRecipeStore((s) => s.showDetail);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">配方灵感工坊</h1>
        <p className="app-subtitle">打开冰箱，发现美味可能</p>
      </header>

      <SearchBar />

      <div className="recipe-grid">
        {hasSearched && recipes.length > 0 ? (
          recipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))
        ) : hasSearched ? (
          <div className="recipe-grid-empty">
            <div className="recipe-grid-empty-icon">
              <i className="fa-solid fa-bowl-rice" />
            </div>
            <div className="recipe-grid-empty-text">暂未找到匹配菜谱</div>
            <div className="recipe-grid-empty-hint">试试添加更多食材或点击随机搭配</div>
          </div>
        ) : (
          <div className="recipe-grid-empty">
            <div className="recipe-grid-empty-icon">
              <i className="fa-solid fa-utensils" />
            </div>
            <div className="recipe-grid-empty-text">在上方输入食材开始探索</div>
            <div className="recipe-grid-empty-hint">至少选择两种食材即可推荐菜谱</div>
          </div>
        )}
      </div>

      {showDetail && <RecipeDetail />}
    </div>
  );
}
