import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRecipe } from '../api/recipes';
import { calculateNutrition, calculateTotalCost } from '../utils/nutrition';
import { CATEGORIES } from '../../types';
import type { Ingredient, CreateRecipeRequest } from '../../types';

interface FormErrors {
  name?: string;
  author?: string;
  ingredients?: string;
  steps?: string;
  category?: string;
}

function CreateRecipe() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: 0, unit: 'g', price: 0 },
    { name: '', quantity: 0, unit: 'g', price: 0 },
    { name: '', quantity: 0, unit: 'g', price: 0 },
  ]);
  const [steps, setSteps] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    setIngredients(prev => {
      const newIngredients = [...prev];
      newIngredients[index] = { ...newIngredients[index], [field]: value };
      return newIngredients;
    });
  };

  const addIngredient = () => {
    setIngredients(prev => [...prev, { name: '', quantity: 0, unit: 'g', price: 0 }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = '请输入食谱名称';
    } else if (name.length > 50) {
      newErrors.name = '食谱名称最多50字';
    }

    if (!author.trim()) {
      newErrors.author = '请输入作者昵称';
    } else if (author.length > 20) {
      newErrors.author = '作者昵称最多20字';
    }

    const validIngredients = ingredients.filter(ing => ing.name.trim() && ing.quantity > 0);
    if (validIngredients.length === 0) {
      newErrors.ingredients = '请至少填写一个有效食材';
    }

    if (!steps.trim()) {
      newErrors.steps = '请输入烹饪步骤';
    } else if (steps.length > 500) {
      newErrors.steps = '烹饪步骤最多500字';
    }

    if (!category) {
      newErrors.category = '请选择食谱类别';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      const validIngredients = ingredients
        .filter(ing => ing.name.trim() && ing.quantity > 0)
        .map(ing => ({
          ...ing,
          name: ing.name.trim(),
        }));

      const nutrition = calculateNutrition(validIngredients);
      const totalCost = calculateTotalCost(validIngredients);

      const requestData: CreateRecipeRequest = {
        name: name.trim(),
        author: author.trim(),
        ingredients: validIngredients,
        steps: steps.trim(),
        category,
        imageUrl: imageUrl || '',
      };

      const result = await createRecipe({
        ...requestData,
        ingredients: validIngredients.map(ing => ({
          ...ing,
          name: ing.name,
          quantity: Number(ing.quantity),
          price: Number(ing.price),
        })),
      });

      navigate('/');
    } catch (err) {
      setErrors({ ingredients: err instanceof Error ? err.message : '提交失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h1 className="form-title">发布新食谱</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">食谱名称 *</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入食谱名称（最多50字）"
            maxLength={50}
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">作者昵称 *</label>
          <input
            type="text"
            className="form-input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="请输入您的昵称（最多20字）"
            maxLength={20}
          />
          {errors.author && <div className="form-error">{errors.author}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">食材清单 *</label>
          <div className="ingredients-section">
            {ingredients.map((ing, index) => (
              <div key={index} className="ingredient-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="食材名"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="数量"
                  value={ing.quantity || ''}
                  onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="单位"
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="单价/元"
                  value={ing.price || ''}
                  onChange={(e) => handleIngredientChange(index, 'price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeIngredient(index)}
                  disabled={ingredients.length <= 1}
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="add-btn" onClick={addIngredient}>
              + 添加食材
            </button>
          </div>
          {errors.ingredients && <div className="form-error">{errors.ingredients}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">烹饪步骤 *</label>
          <textarea
            className="form-textarea"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="请输入烹饪步骤，支持换行（最多500字）"
            maxLength={500}
            rows={6}
          />
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#999', marginTop: '4px' }}>
            {steps.length}/500
          </div>
          {errors.steps && <div className="form-error">{errors.steps}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">类别 *</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">请选择类别</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <div className="form-error">{errors.category}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">封面图片</label>
          <div className="upload-area" onClick={triggerFileInput}>
            {imageUrl ? (
              <img src={imageUrl} alt="预览" className="upload-preview" />
            ) : (
              <>
                <div className="upload-icon">+</div>
                <div className="upload-text">点击上传封面图片</div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? '提交中...' : '发布食谱'}
        </button>
      </form>
    </div>
  );
}

export default CreateRecipe;
