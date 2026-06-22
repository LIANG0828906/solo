import { useEffect } from 'react';
import { useRecipeStore } from '../stores/recipeStore';
import { RecipeCard } from './RecipeCard';

export function RecipeList() {
  const { recipes, loading, error, fetchRecipes } = useRecipeStore();

  useEffect(() => {
    if (recipes.length === 0) {
      fetchRecipes();
    }
  }, [recipes.length, fetchRecipes]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="loading">{error}</div>;
  }

  return (
    <div className="page-enter">
      <h1 className="page-title">🍳 精选食谱</h1>
      <div className="recipe-grid">
        {recipes.map((recipe, index) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
