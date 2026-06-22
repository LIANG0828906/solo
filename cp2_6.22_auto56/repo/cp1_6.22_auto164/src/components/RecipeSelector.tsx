import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchRecipes } from '../store/appSlice';
import type { MealCategory } from '../types';
import './Modal.css';

interface RecipeSelectorProps {
  mealCategory: MealCategory;
  onSelect: (recipeId: string | null) => void;
  onClose: () => void;
}

const categoryLabels: Record<MealCategory, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export default function RecipeSelector({ mealCategory, onSelect, onClose }: RecipeSelectorProps) {
  const dispatch = useDispatch<AppDispatch>();
  const recipes = useSelector((state: RootState) => state.app.recipes);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MealCategory | ''>(mealCategory);

  useEffect(() => {
    dispatch(fetchRecipes({ category: category || undefined, search: search || undefined }));
  }, [dispatch, category, search]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>选择食谱</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="selector-filters">
            <input
              type="text"
              placeholder="搜索食谱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MealCategory | '')}
              className="form-select"
            >
              <option value="">全部分类</option>
              <option value="breakfast">早餐</option>
              <option value="lunch">午餐</option>
              <option value="dinner">晚餐</option>
              <option value="snack">加餐</option>
            </select>
          </div>
          <div className="recipe-list">
            {recipes.length === 0 ? (
              <div className="empty-state">暂无食谱</div>
            ) : (
              recipes.map(recipe => (
                <div
                  key={recipe.id}
                  className="recipe-item"
                  onClick={() => onSelect(recipe.id)}
                >
                  <div className="recipe-item-header">
                    <span className="recipe-name">{recipe.name}</span>
                    <span className="recipe-category">{categoryLabels[recipe.category]}</span>
                  </div>
                  <div className="recipe-nutrition">
                    <span>{recipe.nutrition.calories} kcal</span>
                    <span>蛋白 {recipe.nutrition.protein}g</span>
                    <span>碳水 {recipe.nutrition.carbs}g</span>
                    <span>脂肪 {recipe.nutrition.fat}g</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => onSelect(null)}>清除选择</button>
          <button className="btn btn-outline" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
}
