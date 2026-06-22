import { useState } from 'react';
import { useAppStore } from './store';
import { MatchedRecipe } from './engine';

function FavoriteCard({ recipe }: { recipe: MatchedRecipe }) {
  const { removeRecipe, setDetailRecipe } = useAppStore();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeRecipe(recipe.id);
    }, 300);
  };

  return (
    <div className={`recipe-card ${isRemoving ? 'removing' : ''}`}>
      <div className="card-header">
        <div className="recipe-name">{recipe.name}</div>
      </div>

      <div className="ingredients-list">
        {recipe.ingredients.slice(0, 6).map((ing, idx) => (
          <span key={idx} className="ingredient-chip">
            {ing}
          </span>
        ))}
        {recipe.ingredients.length > 6 && (
          <span className="ingredient-chip">+{recipe.ingredients.length - 6}</span>
        )}
      </div>

      <div className="rating-display">
        <span>评分：</span>
        <span className="rating-score">
          {recipe.averageRating > 0 ? `${recipe.averageRating} 分` : '暂无评分'}
        </span>
      </div>

      <div className="card-actions">
        <button className="detail-btn" onClick={() => setDetailRecipe(recipe)}>
          →
        </button>
      </div>

      <button className="remove-fav-btn" onClick={handleRemove}>
        移除收藏
      </button>
    </div>
  );
}

export default function FavoritesPage() {
  const { getFavoriteRecipes } = useAppStore();
  const favorites = getFavoriteRecipes();

  return (
    <div className="favorites-page">
      {favorites.length === 0 ? (
        <div className="favorites-empty">
          <div className="favorites-empty-icon">💝</div>
          <div>还没有收藏任何菜谱，快去推荐页收藏喜欢的菜谱吧</div>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((recipe) => (
            <FavoriteCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
