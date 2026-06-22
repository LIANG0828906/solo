import { useState, useEffect } from 'react';
import type { Recipe, MealCategory, Ingredient } from '../types';
import { calculateNutrition } from '../../server/mealPlanner';
import './Modal.css';

interface RecipeFormModalProps {
  recipe?: Recipe | null;
  onSave: (data: Omit<Recipe, 'id' | 'nutrition'>) => void;
  onClose: () => void;
}

export default function RecipeFormModal({ recipe, onSave, onClose }: RecipeFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MealCategory>('breakfast');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', grams: 0 }]);
  const [steps, setSteps] = useState<string[]>(['']);

  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setCategory(recipe.category);
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', grams: 0 }]);
      setSteps(recipe.steps.length > 0 ? recipe.steps : ['']);
    }
  }, [recipe]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', grams: 0 }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validIngredients = ingredients.filter(i => i.name.trim() && i.grams > 0);
    const validSteps = steps.filter(s => s.trim());
    onSave({
      name: name.trim(),
      category,
      ingredients: validIngredients,
      steps: validSteps,
    });
  };

  const previewNutrition = calculateNutrition(ingredients.filter(i => i.name.trim() && i.grams > 0));

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{recipe ? '编辑食谱' : '添加食谱'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form className="modal-body recipe-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>食谱名称</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入食谱名称"
              required
            />
          </div>
          <div className="form-group">
            <label>分类</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as MealCategory)}
            >
              <option value="breakfast">早餐</option>
              <option value="lunch">午餐</option>
              <option value="dinner">晚餐</option>
              <option value="snack">加餐</option>
            </select>
          </div>
          <div className="form-group">
            <label>食材列表</label>
            {ingredients.map((ing, idx) => (
              <div key={idx} className="ingredient-row">
                <input
                  type="text"
                  className="form-control"
                  placeholder="食材名称"
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="克数"
                  value={ing.grams || ''}
                  onChange={(e) => updateIngredient(idx, 'grams', parseFloat(e.target.value) || 0)}
                  min="0"
                />
                <button type="button" className="btn-remove" onClick={() => removeIngredient(idx)}>
                  删除
                </button>
              </div>
            ))}
            <button type="button" className="btn-add" onClick={addIngredient}>
              + 添加食材
            </button>
            <div className="recipe-card-nutrition" style={{ marginTop: '10px' }}>
              <span>热量: {previewNutrition.calories} kcal</span>
              <span>蛋白: {previewNutrition.protein}g</span>
              <span>碳水: {previewNutrition.carbs}g</span>
              <span>脂肪: {previewNutrition.fat}g</span>
            </div>
          </div>
          <div className="form-group">
            <label>烹饪步骤</label>
            {steps.map((step, idx) => (
              <div key={idx} className="step-row">
                <div className="step-number">{idx + 1}</div>
                <input
                  type="text"
                  className="form-control"
                  placeholder="描述步骤"
                  value={step}
                  onChange={(e) => updateStep(idx, e.target.value)}
                />
                <button type="button" className="btn-remove" onClick={() => removeStep(idx)}>
                  删除
                </button>
              </div>
            ))}
            <button type="button" className="btn-add" onClick={addStep}>
              + 添加步骤
            </button>
          </div>
        </form>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            {recipe ? '保存修改' : '添加食谱'}
          </button>
        </div>
      </div>
    </div>
  );
}
