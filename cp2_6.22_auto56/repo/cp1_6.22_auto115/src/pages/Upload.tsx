import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { recipeApi } from '../api';

interface IngredientInput {
  id: string;
  name: string;
  amount: string;
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '32px auto',
    padding: '0 24px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '32px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '24px',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '24px',
    background: 'white',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '24px',
    height: '120px',
    resize: 'vertical' as const,
  },
  hint: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '-16px',
    marginBottom: '24px',
  },
  ingredientsTitle: {
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '12px',
  },
  ingredientRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  ingredientNameInput: {
    flex: 2,
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '16px',
  },
  ingredientAmountInput: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '16px',
  },
  deleteButton: {
    background: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    padding: '0 16px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  addButton: {
    marginTop: '8px',
    background: 'transparent',
    color: 'var(--primary)',
    border: '1px solid var(--primary)',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    background: 'var(--primary)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    marginTop: '24px',
    border: 'none',
    cursor: 'pointer',
  },
  submitButtonDisabled: {
    width: '100%',
    padding: '14px',
    background: '#9CA3AF',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    marginTop: '24px',
    border: 'none',
    cursor: 'not-allowed',
  },
} as const;

function Upload() {
  const navigate = useNavigate();
  const { user } = useAppStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('中餐');
  const [cookTime, setCookTime] = useState('');
  const [steps, setSteps] = useState('');
  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { id: '1', name: '', amount: '' },
  ]);

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: '', amount: '' },
    ]);
  };

  const handleDeleteIngredient = (id: string) => {
    setIngredients(ingredients.filter((item) => item.id !== id));
  };

  const handleIngredientChange = (id: string, field: 'name' | 'amount', value: string) => {
    setIngredients(
      ingredients.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }

    const stepsArray = steps
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const validIngredients = ingredients.filter(
      (item) => item.name.trim().length > 0
    );

    try {
      const recipe = await recipeApi.uploadRecipe({
        name,
        category,
        cookTime: parseInt(cookTime) || 0,
        steps: stepsArray,
        ingredients: validIngredients.map((item) => ({
          name: item.name.trim(),
          amount: item.amount.trim(),
        })),
        authorId: user.id,
      });
      navigate(`/recipe/${recipe.id}`);
    } catch (error) {
      alert('上传失败，请重试');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>上传菜谱</h1>

        <label style={styles.label}>菜名</label>
        <input
          style={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入菜名"
        />

        <label style={styles.label}>分类</label>
        <select
          style={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="中餐">中餐</option>
          <option value="西餐">西餐</option>
          <option value="甜品">甜品</option>
          <option value="其他">其他</option>
        </select>

        <label style={styles.label}>烹饪时间</label>
        <input
          style={styles.input}
          type="number"
          value={cookTime}
          onChange={(e) => setCookTime(e.target.value)}
          placeholder="分钟"
        />

        <label style={styles.label}>步骤描述</label>
        <textarea
          style={styles.textarea}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="请输入步骤，每行一个步骤"
        />
        <div style={styles.hint}>每行一个步骤，系统自动识别</div>

        <div style={styles.ingredientsTitle}>
          食材清单（每行一个，格式：食材名 用量，例如：鸡胸肉 200g）
        </div>

        {ingredients.map((item) => (
          <div key={item.id} style={styles.ingredientRow}>
            <input
              style={styles.ingredientNameInput}
              type="text"
              value={item.name}
              onChange={(e) => handleIngredientChange(item.id, 'name', e.target.value)}
              placeholder="食材名"
            />
            <input
              style={styles.ingredientAmountInput}
              type="text"
              value={item.amount}
              onChange={(e) => handleIngredientChange(item.id, 'amount', e.target.value)}
              placeholder="用量"
            />
            <button
              style={styles.deleteButton}
              onClick={() => handleDeleteIngredient(item.id)}
            >
              删除
            </button>
          </div>
        ))}

        <button style={styles.addButton} onClick={handleAddIngredient}>
          + 添加食材
        </button>

        <button
          style={user ? styles.submitButton : styles.submitButtonDisabled}
          onClick={handleSubmit}
          disabled={!user}
        >
          {user ? '提交菜谱' : '请先登录'}
        </button>
      </div>
    </div>
  );
}

export default Upload;
