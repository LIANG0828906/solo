import { useEffect } from 'react';
import useRecipeStore from '../store/recipeStore';
import RecipeCard from '../components/RecipeCard';
import './RecipeList.css';

function RecipeList() {
  const { recipes, fetchRecipes, getFilteredRecipes, searchKeyword, loading } = useRecipeStore();
  const filteredRecipes = getFilteredRecipes();

  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [recipes.length, fetchRecipes]);

  return (
    <div className="recipe-list-page">
      <div className="list-hero">
        <h1 className="list-title">
          <i className="fa-solid fa-book-open"></i>
          我的食谱收藏
        </h1>
        <p className="list-subtitle">
          {searchKeyword
            ? `找到 ${filteredRecipes.length} 个与"${searchKeyword}"相关的食谱`
            : `共收藏 ${recipes.length} 道美味食谱，探索你的下一道拿手好菜`}
        </p>
      </div>

      {loading && recipes.length === 0 ? (
        <div className="list-loading">
          <div className="loading-spinner">
            <i className="fa-solid fa-spinner fa-spin"></i>
          </div>
          <p>正在加载食谱...</p>
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="recipe-grid" key={searchKeyword}>
          {filteredRecipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <i className="fa-solid fa-magnifying-glass"></i>
          <p>没有找到匹配的食谱</p>
          <p className="no-results-hint">试试搜索其他食材或菜名吧</p>
        </div>
      )}
    </div>
  );
}

export default RecipeList;
