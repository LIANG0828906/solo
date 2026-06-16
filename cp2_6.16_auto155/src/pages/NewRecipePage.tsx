import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore } from '@/store/recipeStore';
import { CATEGORIES } from '@/types';
import type { Ingredient } from '@/types';

const containerStyle: React.CSSProperties = {
  maxWidth: 800,
  margin: '0 auto',
  padding: '32px 24px'
};

const formCardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 'var(--radius-lg)',
  border: '2px solid var(--border-color)',
  padding: 32
};

const fieldStyle: React.CSSProperties = {
  marginBottom: 20
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: 8
};

const inputRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 8
};

export default function NewRecipePage() {
  const navigate = useNavigate();
  const addRecipe = useRecipeStore(state => state.addRecipe);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [estimatedTime, setEstimatedTime] = useState('30');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: 0, unit: '克' }
  ]);
  const [steps, setSteps] = useState<string[]>(['', '']);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 0, unit: '克' }]);
  };

  const updateIngredient = (idx: number, field: keyof Ingredient, value: string | number) => {
    setIngredients(ingredients.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const removeIngredient = (idx: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== idx));
    }
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const updateStep = (idx: number, value: string) => {
    setSteps(steps.map((s, i) => i === idx ? value : s));
  };

  const removeStep = (idx: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== idx));
    }
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[idx], newSteps[newIdx]] = [newSteps[newIdx], newSteps[idx]];
    setSteps(newSteps);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const validIngredients = ingredients.filter(i => i.name.trim() && i.quantity > 0);
    const validSteps = steps.filter(s => s.trim());
    if (validIngredients.length === 0 || validSteps.length === 0) return;

    addRecipe({
      name: name.trim(),
      category,
      photoUrl: photoUrl.trim() || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
      difficulty,
      estimatedTime: parseInt(estimatedTime) || 30,
      ingredients: validIngredients,
      steps: validSteps
    });

    navigate('/');
  };

  const renderStars = () => {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setDifficulty(n)}
            style={{
              fontSize: 24,
              color: difficulty >= n ? '#F4A261' : '#E0D5C7',
              background: 'none',
              padding: 0,
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={containerStyle} className="page-enter">
      <button
        onClick={() => navigate(-1)}
        style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        ← 返回
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
        ✨ 创建新食谱
      </h1>

      <form onSubmit={handleSubmit} style={formCardStyle}>
        <div style={fieldStyle}>
          <label style={labelStyle}>食谱名称 *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例如：经典巧克力蛋糕"
            style={{ width: '100%' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>分类</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%' }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>预估时间（分钟）</label>
            <input
              type="number"
              min="1"
              value={estimatedTime}
              onChange={e => setEstimatedTime(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>难度等级</label>
            {renderStars()}
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>封面照片 URL</label>
            <input
              type="url"
              value={photoUrl}
              onChange={e => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={fieldStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>食材清单 *</label>
            <button
              type="button"
              onClick={addIngredient}
              style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}
            >
              + 添加食材
            </button>
          </div>
          {ingredients.map((ing, idx) => (
            <div key={idx} style={inputRowStyle}>
              <input
                type="text"
                placeholder="食材名称"
                value={ing.name}
                onChange={e => updateIngredient(idx, 'name', e.target.value)}
                style={{ flex: 2 }}
              />
              <input
                type="number"
                placeholder="数量"
                value={ing.quantity || ''}
                onChange={e => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                style={{ flex: 1, minWidth: 80 }}
              />
              <select
                value={ing.unit}
                onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                style={{ width: 90 }}
              >
                <option value="克">克</option>
                <option value="毫升">毫升</option>
                <option value="个">个</option>
                <option value="勺">勺</option>
                <option value="杯">杯</option>
              </select>
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  style={{ color: 'var(--text-muted)', fontSize: 18, padding: '0 8px' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={fieldStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>制作步骤 *</label>
            <button
              type="button"
              onClick={addStep}
              style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}
            >
              + 添加步骤
            </button>
          </div>
          {steps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, flexShrink: 0
              }}>
                {idx + 1}
              </div>
              <textarea
                placeholder={`步骤 ${idx + 1} 的描述...`}
                value={step}
                onChange={e => updateStep(idx, e.target.value)}
                style={{ flex: 1, minHeight: 60 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => moveStep(idx, -1)}
                  disabled={idx === 0}
                  style={{
                    color: idx === 0 ? '#CCC' : 'var(--text-secondary)',
                    fontSize: 14, cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(idx, 1)}
                  disabled={idx === steps.length - 1}
                  style={{
                    color: idx === steps.length - 1 ? '#CCC' : 'var(--text-secondary)',
                    fontSize: 14, cursor: idx === steps.length - 1 ? 'not-allowed' : 'pointer',
                    padding: '2px 6px'
                  }}
                >
                  ↓
                </button>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    style={{ color: 'var(--text-muted)', fontSize: 14, padding: '2px 6px' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 32 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-sm)',
              background: '#fff',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            取消
          </button>
          <button
            type="submit"
            style={{
              padding: '10px 28px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
          >
            保存食谱
          </button>
        </div>
      </form>
    </div>
  );
}
