import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, UtensilsCrossed } from 'lucide-react';
import { useRecipeStore } from '@/store';
import StepEditor from '@/StepEditor';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipe = useRecipeStore((s) => s.recipes.find((r) => r.id === id));

  if (!recipe) {
    return (
      <div className="page-detail">
        <div className="empty-state">
          <UtensilsCrossed size={48} />
          <p>食谱不存在</p>
          <button className="btn btn--primary" onClick={() => navigate('/')}>返回首页</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-detail">
      <div className="detail-header">
        <button className="btn btn--icon btn--back" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-header__cover">
          {recipe.coverImage ? (
            <img src={recipe.coverImage} alt={recipe.name} />
          ) : (
            <div className="detail-header__cover-placeholder">
              <UtensilsCrossed size={48} />
            </div>
          )}
        </div>
        <div className="detail-header__info">
          <h1 className="detail-header__title">{recipe.name}</h1>
          <p className="detail-header__desc">{recipe.description}</p>
          <div className="detail-header__meta">
            <span className="detail-header__meta-item">
              <Clock size={16} />
              {recipe.cookTime} 分钟
            </span>
            <span className="detail-header__meta-item detail-header__category">
              {recipe.category}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <StepEditor recipeId={recipe.id} />
      </div>
    </div>
  );
}
