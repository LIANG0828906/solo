import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useRecipeStore } from '@/store/recipeStore';
import { Ingredient } from '@/types';

interface StepInput {
  id: string;
  text: string;
}

interface IngredientInput {
  id: string;
  name: string;
  quantity: string;
  category: string;
}

const CATEGORIES = ['蔬菜', '肉类', '调味品', '其他'];

export const AddRecipePage: React.FC = () => {
  const navigate = useNavigate();
  const addRecipe = useRecipeStore((state) => state.addRecipe);

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [difficulty, setDifficulty] = useState('简单');
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { id: uuidv4(), name: '', quantity: '', category: '其他' },
  ]);
  const [steps, setSteps] = useState<StepInput[]>([{ id: uuidv4(), text: '' }]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = '食谱名称不能为空';
    const validIngredients = ingredients.filter((i) => i.name.trim() && i.quantity.trim());
    if (validIngredients.length === 0) newErrors.ingredients = '至少需要一项食材';
    const validSteps = steps.filter((s) => s.text.trim());
    if (validSteps.length === 0) newErrors.steps = '至少需要一个步骤';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid =
    name.trim() &&
    ingredients.some((i) => i.name.trim() && i.quantity.trim()) &&
    steps.some((s) => s.text.trim());

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { id: uuidv4(), name: '', quantity: '', category: '其他' }]);
  };

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((i) => i.id !== id));
    }
  };

  const handleIngredientChange = (
    id: string,
    field: keyof IngredientInput,
    value: string
  ) => {
    setIngredients(
      ingredients.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handleAddStep = () => {
    setSteps([...steps, { id: uuidv4(), text: '' }]);
  };

  const handleRemoveStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter((s) => s.id !== id));
    }
  };

  const handleStepChange = (id: string, text: string) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, text } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const validIngredients: Ingredient[] = ingredients
      .filter((i) => i.name.trim() && i.quantity.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity.trim(),
        category: i.category,
      }));

    const validSteps = steps
      .filter((s) => s.text.trim())
      .map((s) => s.text.trim());

    try {
      const newRecipe = await addRecipe({
        name: name.trim(),
        duration: parseInt(duration) || 30,
        difficulty,
        image_url: '',
        steps: JSON.stringify(validSteps),
        ingredients: validIngredients,
      });
      navigate(`/recipe/${newRecipe.id}`);
    } catch (error) {
      console.error('Failed to create recipe:', error);
    }
  };

  return (
    <div className="container page-wrapper">
      <h1 className="page-title">📝 添加新食谱</h1>
      <div className="detail-content">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">食谱名称 *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：番茄炒蛋"
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">制作时长（分钟）</label>
              <input
                type="number"
                className="form-input"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                min="1"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">难度</label>
              <select
                className="form-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="简单">简单</option>
                <option value="中等">中等</option>
                <option value="困难">困难</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              食材清单 *
              <button
                type="button"
                className="btn-icon btn-icon-success"
                style={{ marginLeft: '8px' }}
                onClick={handleAddIngredient}
              >
                +
              </button>
            </label>
            {ingredients.map((ing, index) => (
              <div key={ing.id} className="ingredient-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="食材名称"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(ing.id, 'name', e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="数量"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(ing.id, 'quantity', e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  className="form-select"
                  value={ing.category}
                  onChange={(e) => handleIngredientChange(ing.id, 'category', e.target.value)}
                  style={{ width: '120px' }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-icon btn-icon-danger"
                  onClick={() => handleRemoveIngredient(ing.id)}
                  disabled={ingredients.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            {errors.ingredients && <div className="form-error">{errors.ingredients}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">
              制作步骤 *
              <button
                type="button"
                className="btn-icon btn-icon-success"
                style={{ marginLeft: '8px' }}
                onClick={handleAddStep}
              >
                +
              </button>
            </label>
            {steps.map((step, index) => (
              <div key={step.id} className="step-row">
                <div
                  className="step-number"
                  style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                >
                  {index + 1}
                </div>
                <textarea
                  className="form-textarea"
                  placeholder={`步骤 ${index + 1} 的描述`}
                  value={step.text}
                  onChange={(e) => handleStepChange(step.id, e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-icon btn-icon-danger"
                  onClick={() => handleRemoveStep(step.id)}
                  disabled={steps.length === 1}
                  style={{ alignSelf: 'flex-start', marginTop: '4px' }}
                >
                  ×
                </button>
              </div>
            ))}
            {errors.steps && <div className="form-error">{errors.steps}</div>}
          </div>

          <div className="action-bar">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isFormValid}
            >
              保存食谱
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
