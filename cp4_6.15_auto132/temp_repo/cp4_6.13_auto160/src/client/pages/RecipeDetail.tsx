import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipe } from '../api/recipes';
import type { Recipe } from '../../types';

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [barWidth, setBarWidth] = useState({ protein: 0, fat: 0, carbs: 0 });

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getRecipe(id);
        setRecipe(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  useEffect(() => {
    if (recipe) {
      const timer = setTimeout(() => {
        const totalMacro = recipe.nutrition.protein + recipe.nutrition.fat + recipe.nutrition.carbs;
        if (totalMacro > 0) {
          setBarWidth({
            protein: (recipe.nutrition.protein / totalMacro) * 100,
            fat: (recipe.nutrition.fat / totalMacro) * 100,
            carbs: (recipe.nutrition.carbs / totalMacro) * 100,
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [recipe]);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!recipe) {
    return <div className="error-message">食谱不存在</div>;
  }

  const steps = recipe.steps.split('\n').filter(s => s.trim());

  return (
    <div className="detail-container">
      <img
        src={recipe.imageUrl}
        alt={recipe.name}
        className="detail-image"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '';
          (e.target as HTMLImageElement).style.backgroundColor = '#e0f2f1';
          (e.target as HTMLImageElement).style.display = 'flex';
          (e.target as HTMLImageElement).style.alignItems = 'center';
          (e.target as HTMLImageElement).style.justifyContent = 'center';
          (e.target as HTMLImageElement).style.fontSize = '80px';
        }}
      />
      <div className="detail-content">
        <h1 className="detail-title">{recipe.name}</h1>
        <p className="detail-author">作者：{recipe.author}</p>
        <span className="category-tag">{recipe.category}</span>

        <div className="nutrition-section">
          <h2 className="nutrition-title">营养成分</h2>
          <p className="total-calories">
            总卡路里：{recipe.nutrition.calories} 千卡
          </p>

          <div className="nutrition-bar-container">
            <div className="nutrition-label">
              <span>蛋白质</span>
              <span>{recipe.nutrition.protein}g</span>
            </div>
            <div className="nutrition-bar">
              <div
                className="nutrition-bar-fill protein"
                style={{ width: `${barWidth.protein}%` }}
              />
            </div>
          </div>

          <div className="nutrition-bar-container">
            <div className="nutrition-label">
              <span>脂肪</span>
              <span>{recipe.nutrition.fat}g</span>
            </div>
            <div className="nutrition-bar">
              <div
                className="nutrition-bar-fill fat"
                style={{ width: `${barWidth.fat}%` }}
              />
            </div>
          </div>

          <div className="nutrition-bar-container">
            <div className="nutrition-label">
              <span>碳水化合物</span>
              <span>{recipe.nutrition.carbs}g</span>
            </div>
            <div className="nutrition-bar">
              <div
                className="nutrition-bar-fill carbs"
                style={{ width: `${barWidth.carbs}%` }}
              />
            </div>
          </div>
        </div>

        <h2 className="section-title">食材清单</h2>
        <table className="ingredients-table">
          <thead>
            <tr>
              <th>食材名</th>
              <th>数量</th>
              <th>单位</th>
              <th>小计费用</th>
            </tr>
          </thead>
          <tbody>
            {recipe.ingredients.map((ing, index) => (
              <tr key={index}>
                <td>{ing.name}</td>
                <td>{ing.quantity}</td>
                <td>{ing.unit}</td>
                <td>¥{(ing.quantity * ing.price).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan={3}>合计</td>
              <td>¥{recipe.totalCost.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="section-title">烹饪步骤</h2>
        <ol className="steps-list">
          {steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>

        <button className="back-btn" onClick={() => navigate('/')}>
          ← 返回列表
        </button>
      </div>
    </div>
  );
}

export default RecipeDetail;
