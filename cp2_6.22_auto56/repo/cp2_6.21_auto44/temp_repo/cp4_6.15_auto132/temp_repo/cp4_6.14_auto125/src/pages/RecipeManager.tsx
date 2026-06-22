import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Recipe, Ingredient } from '../types';

export default function RecipeManager() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    yieldCount: 1,
    price: 0,
    ingredients: [{ name: '', amount: 0 }],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const data = await api.getRecipes();
      setRecipes(data);
    } catch (e) {
      console.error('加载配方失败', e);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: 0 }],
    }));
  };

  const removeIngredient = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };

  const updateIngredient = (idx: number, field: keyof Ingredient, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === idx ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.yieldCount < 1 || formData.yieldCount > 100) {
      alert('请填写有效的配方名称和成品个数(1-100)');
      return;
    }
    const validIngredients = formData.ingredients.filter((i) => i.name.trim() && i.amount > 0);
    if (validIngredients.length === 0) {
      alert('请至少添加一种原料');
      return;
    }
    try {
      await api.createRecipe({
        name: formData.name.trim(),
        yieldCount: formData.yieldCount,
        price: formData.price,
        ingredients: validIngredients,
      });
      setFormData({ name: '', yieldCount: 1, price: 0, ingredients: [{ name: '', amount: 0 }] });
      setShowForm(false);
      loadRecipes();
    } catch (err) {
      alert('添加配方失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个配方吗？')) return;
    try {
      await api.deleteRecipe(id);
      loadRecipes();
    } catch (e) {
      alert('删除失败');
    }
  };

  return (
    <div className="page-content">
      <style>{`
        .recipe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .recipe-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .recipe-card {
          width: 100%;
          height: 80px;
          background: #ffffff;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: border-left-color 0.2s ease-out, box-shadow 0.2s ease-out;
        }
        .recipe-card:hover {
          border-left-color: #d97706;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .recipe-info {
          display: flex;
          align-items: center;
          gap: 20px;
          flex: 1;
        }
        .recipe-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .recipe-meta {
          font-size: 13px;
          color: #6b7280;
        }
        .recipe-ingredients {
          font-size: 12px;
          color: #6b7280;
          max-width: 600px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .recipe-actions {
          display: flex;
          gap: 8px;
        }
        .form-container {
          background: #ffffff;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          animation: fade-in 0.3s ease-out;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        .ingredient-row {
          display: grid;
          grid-template-columns: 2fr 1fr auto;
          gap: 12px;
          margin-bottom: 10px;
        }
        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 16px;
        }
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .recipe-card {
            height: auto;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .recipe-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            width: 100%;
          }
        }
      `}</style>
      <div className="recipe-header">
        <h1 className="page-title">配方管理</h1>
        <button
          className="btn ripple"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '取消' : '+ 添加配方'}
        </button>
      </div>

      {showForm && (
        <form className="form-container" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">配方名称</label>
              <input
                className="form-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：经典黄油曲奇"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">预计成品个数(1-100)</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="100"
                value={formData.yieldCount}
                onChange={(e) => setFormData({ ...formData, yieldCount: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">售价(元)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">原料清单</label>
            {formData.ingredients.map((ing, idx) => (
              <div key={idx} className="ingredient-row">
                <input
                  className="form-input"
                  type="text"
                  placeholder="原料名称"
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                />
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="用量(克)"
                  value={ing.amount || ''}
                  onChange={(e) => updateIngredient(idx, 'amount', parseFloat(e.target.value) || 0)}
                />
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeIngredient(idx)}
                  disabled={formData.ingredients.length === 1}
                >
                  删除
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addIngredient}>
              + 添加原料
            </button>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              取消
            </button>
            <button type="submit" className="btn ripple">
              保存配方
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>加载中...</p>
      ) : (
        <div className="recipe-list">
          {recipes.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>
              暂无配方，点击右上角添加
            </p>
          ) : (
            recipes.map((recipe) => (
              <div key={recipe.id} className="recipe-card">
                <div className="recipe-info">
                  <div className="recipe-name">{recipe.name}</div>
                  <div className="recipe-meta">
                    成品：{recipe.yieldCount}个 | 售价：¥{recipe.price}
                  </div>
                  <div className="recipe-ingredients">
                    原料：{recipe.ingredients.map((i) => `${i.name}${i.amount}g`).join('、')}
                  </div>
                </div>
                <div className="recipe-actions">
                  <button className="btn btn-danger" onClick={() => handleDelete(recipe.id)}>
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
