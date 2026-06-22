import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchRecipes, addRecipe, updateRecipe, deleteRecipe } from '../store/appSlice';
import type { Recipe } from '../types';
import RecipeFormModal from './RecipeFormModal';
import ConfirmModal from './ConfirmModal';
import './Modal.css';

interface RecipeManagerProps {
  onClose: () => void;
}

export default function RecipeManager({ onClose }: RecipeManagerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const recipes = useSelector((state: RootState) => state.app.recipes);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchRecipes());
  }, [dispatch]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddClick = () => {
    setEditingRecipe(null);
    setShowForm(true);
  };

  const handleEditClick = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleSave = (data: Omit<Recipe, 'id' | 'nutrition'>) => {
    if (editingRecipe) {
      dispatch(updateRecipe({ id: editingRecipe.id, data }));
    } else {
      dispatch(addRecipe(data));
    }
    setShowForm(false);
    setEditingRecipe(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      dispatch(deleteRecipe(deleteConfirm));
      setDeleteConfirm(null);
    }
  };

  const categoryLabels: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>食谱管理</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="recipe-manager-header">
            <span style={{ color: '#6B7280', fontSize: '14px' }}>
              共 {recipes.length} 个食谱
            </span>
            <button className="btn btn-primary" onClick={handleAddClick}>
              + 添加食谱
            </button>
          </div>
          <div className="recipe-manager-list">
            {recipes.length === 0 ? (
              <div className="empty-state">暂无食谱，点击上方按钮添加</div>
            ) : (
              recipes.map(recipe => (
                <div key={recipe.id} className="recipe-card">
                  <div className="recipe-card-header">
                    <div>
                      <div className="recipe-card-name">{recipe.name}</div>
                      <div className="recipe-category" style={{ display: 'inline-block', marginTop: '4px' }}>
                        {categoryLabels[recipe.category]}
                      </div>
                    </div>
                    <div className="recipe-card-actions">
                      <button className="btn-icon" onClick={() => handleEditClick(recipe)}>编辑</button>
                      <button className="btn-icon danger" onClick={() => handleDeleteClick(recipe.id)}>删除</button>
                    </div>
                  </div>
                  <div className="recipe-card-ingredients">
                    食材：{recipe.ingredients.map(i => `${i.name}${i.grams}g`).join('、')}
                  </div>
                  <div className="recipe-card-nutrition">
                    <span>🔥 {recipe.nutrition.calories} kcal</span>
                    <span>🥩 {recipe.nutrition.protein}g 蛋白</span>
                    <span>🍚 {recipe.nutrition.carbs}g 碳水</span>
                    <span>🥑 {recipe.nutrition.fat}g 脂肪</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {showForm && (
        <RecipeFormModal
          recipe={editingRecipe}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingRecipe(null); }}
        />
      )}
      {deleteConfirm && (
        <ConfirmModal
          title="确认删除"
          description="确定要删除这个食谱吗？此操作不可撤销。"
          confirmText="删除"
          isDanger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
