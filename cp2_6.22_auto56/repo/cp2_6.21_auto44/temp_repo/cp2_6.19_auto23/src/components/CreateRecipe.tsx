import { useState, useEffect, useRef, type DragEvent, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Ingredient, RecipeStep } from '@/models/recipeTypes';
import { useRecipeStore } from '@/store/recipeStore';

interface CreateRecipeProps {
  recipeId?: string;
}

const CATEGORIES = ['早餐', '午餐', '晚餐', '甜点', '家常菜', '日料', '其他'];

const ACCENT = '#E88D3E';

const keyframesStyle = `
@keyframes slideInRight {
  from { transform: translateX(60px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
`;

export default function CreateRecipe({ recipeId }: CreateRecipeProps) {
  const navigate = useNavigate();
  const { recipes, addRecipe, updateRecipe, currentUser } = useRecipeStore();

  const isEdit = Boolean(recipeId);
  const existing = isEdit ? recipes.find((r) => r.id === recipeId) : null;

  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', quantity: '' }]);
  const [steps, setSteps] = useState<RecipeStep[]>([{ order: 1, content: '', image: '' }]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [cookTime, setCookTime] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setCoverImage(existing.coverImage);
      setDescription(existing.description);
      setIngredients(
        existing.ingredients.length > 0
          ? existing.ingredients.map((i) => ({ ...i }))
          : [{ name: '', quantity: '' }]
      );
      setSteps(
        existing.steps.length > 0
          ? existing.steps.map((s) => ({ ...s }))
          : [{ order: 1, content: '', image: '' }]
      );
      setCategory(existing.category);
      setCookTime(existing.cookTime);
    }
  }, [existing]);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: '' }]);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addStep() {
    setSteps((prev) => [...prev, { order: prev.length + 1, content: '', image: '' }]);
  }

  function removeStep(index: number) {
    setSteps((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, i) => ({ ...s, order: i + 1 }));
    });
  }

  function updateStep(index: number, field: keyof RecipeStep, value: string | number) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function handleStepDragStart(index: number, e: DragEvent<HTMLDivElement>) {
    dragItem.current = index;
    const el = e.currentTarget as HTMLElement;
    setPlaceholderHeight(el.offsetHeight);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleStepDragOver(index: number, e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverItem.current = index;
    setDragOverIndex(index);
  }

  function handleStepDragLeave() {
    setDragOverIndex(null);
  }

  function handleStepDrop() {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === null || to === null || from === to) {
      resetDragState();
      return;
    }
    setSteps((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated.map((s, i) => ({ ...s, order: i + 1 }));
    });
    resetDragState();
  }

  function handleStepDragEnd() {
    resetDragState();
  }

  function resetDragState() {
    dragItem.current = null;
    dragOverItem.current = null;
    setDragOverIndex(null);
    setPlaceholderHeight(0);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = '食谱名称不能为空';
    if (ingredients.length === 0 || ingredients.every((i) => !i.name.trim())) {
      newErrors.ingredients = '至少需要1个食材';
    }
    if (steps.length === 0 || steps.every((s) => !s.content.trim())) {
      newErrors.steps = '至少需要1个步骤';
    }
    if (!cookTime || cookTime <= 0) newErrors.cookTime = '烹饪时长必须大于0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const recipeData = {
      title: title.trim(),
      coverImage: coverImage.trim(),
      description: description.trim(),
      ingredients: ingredients.filter((i) => i.name.trim()),
      steps: steps
        .filter((s) => s.content.trim())
        .map((s, i) => ({ ...s, order: i + 1 })),
      category,
      cookTime,
      authorId: currentUser.id,
      authorName: currentUser.name,
    };

    if (isEdit && recipeId) {
      updateRecipe(recipeId, recipeData);
    } else {
      addRecipe(recipeData);
    }
    navigate('/');
  }

  function s(label: string, extra?: CSSProperties): CSSProperties {
    return { ...baseStyles[label], ...extra };
  }

  const baseStyles: Record<string, CSSProperties> = {
    container: {
      maxWidth: 800,
      margin: '0 auto',
      padding: '24px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    title: {
      fontSize: 24,
      fontWeight: 700,
      marginBottom: 24,
      color: '#333',
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      display: 'block',
      marginBottom: 6,
      fontSize: 14,
      fontWeight: 600,
      color: '#555',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      fontSize: 14,
      border: '1.5px solid #ddd',
      borderRadius: 6,
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      padding: '10px 12px',
      fontSize: 14,
      border: '1.5px solid #ddd',
      borderRadius: 6,
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box',
      resize: 'vertical',
      minHeight: 80,
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      fontSize: 14,
      border: '1.5px solid #ddd',
      borderRadius: 6,
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box',
      backgroundColor: '#fff',
    },
    error: {
      color: '#e53e3e',
      fontSize: 12,
      marginTop: 4,
    },
    btn: {
      padding: '10px 20px',
      fontSize: 14,
      fontWeight: 600,
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      transition: 'transform 0.1s, box-shadow 0.1s',
    },
    btnPrimary: {
      backgroundColor: ACCENT,
      color: '#fff',
    },
    btnSecondary: {
      backgroundColor: '#f0f0f0',
      color: '#555',
    },
    btnDanger: {
      background: 'none',
      border: 'none',
      color: '#e53e3e',
      cursor: 'pointer',
      fontSize: 18,
      padding: '4px 8px',
      lineHeight: 1,
    },
    ingredientRow: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginBottom: 8,
      animation: 'slideInRight 0.3s ease',
    },
    stepCard: {
      border: '1.5px solid #e2e2e2',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      backgroundColor: '#fafafa',
      cursor: 'grab',
      transition: 'transform 0.15s, opacity 0.15s, box-shadow 0.15s',
    },
    stepCardDragging: {
      transform: 'scale(1.1)',
      opacity: 0.8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      cursor: 'grabbing',
    },
    placeholder: {
      border: '2px dashed #ccc',
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: '#f5f5f5',
      transition: 'height 0.2s',
    },
    stepHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: 700,
      color: ACCENT,
    },
    inlineInput: {
      flex: 1,
      padding: '8px 10px',
      fontSize: 14,
      border: '1.5px solid #ddd',
      borderRadius: 6,
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box',
    },
    submitRow: {
      display: 'flex',
      gap: 12,
      marginTop: 28,
    },
  };

  return (
    <>
      <style>{keyframesStyle}</style>
      <div style={s('container')}>
        <h2 style={s('title')}>{isEdit ? '编辑食谱' : '创建食谱'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={s('formGroup')}>
            <label style={s('label')}>食谱名称 *</label>
            <input
              style={s('input')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入食谱名称"
              onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
            />
            {errors.title && <div style={s('error')}>{errors.title}</div>}
          </div>

          <div style={s('formGroup')}>
            <label style={s('label')}>封面图URL</label>
            <input
              style={s('input')}
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="请输入封面图片链接"
              onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
            />
          </div>

          <div style={s('formGroup')}>
            <label style={s('label')}>食谱简介</label>
            <textarea
              style={s('textarea')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入食谱简介"
              onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
            />
          </div>

          <div style={s('formGroup')}>
            <label style={s('label')}>食材</label>
            {ingredients.map((ing, i) => (
              <div key={i} style={s('ingredientRow')}>
                <input
                  style={s('inlineInput')}
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                  placeholder="食材名称"
                  onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
                />
                <input
                  style={s('inlineInput')}
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(i, 'quantity', e.target.value)}
                  placeholder="用量"
                  onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
                />
                {ingredients.length > 1 && (
                  <button type="button" style={s('btnDanger')} onClick={() => removeIngredient(i)}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              style={{
                ...s('btn'),
                ...s('btnSecondary'),
              }}
              onClick={addIngredient}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              + 添加食材
            </button>
            {errors.ingredients && <div style={s('error')}>{errors.ingredients}</div>}
          </div>

          <div style={s('formGroup')}>
            <label style={s('label')}>烹饪步骤</label>
            {steps.map((step, i) => (
              <div key={i}>
                {dragOverIndex === i && dragItem.current !== null && dragItem.current !== i && (
                  <div style={{ ...s('placeholder'), height: placeholderHeight }} />
                )}
                <div
                  ref={(el) => { stepRefs.current[i] = el; }}
                  style={{
                    ...s('stepCard'),
                    ...(dragItem.current === i ? s('stepCardDragging') : {}),
                    animation: 'slideInRight 0.3s ease',
                  }}
                  draggable
                  onDragStart={(e) => handleStepDragStart(i, e)}
                  onDragOver={(e) => handleStepDragOver(i, e)}
                  onDragLeave={handleStepDragLeave}
                  onDrop={handleStepDrop}
                  onDragEnd={handleStepDragEnd}
                >
                  <div style={s('stepHeader')}>
                    <span style={s('stepNumber')}>步骤 {step.order}</span>
                    {steps.length > 1 && (
                      <button type="button" style={s('btnDanger')} onClick={() => removeStep(i)}>
                        ✕
                      </button>
                    )}
                  </div>
                  <textarea
                    style={{
                      ...s('textarea'),
                      minHeight: 60,
                      marginBottom: 8,
                      cursor: 'text',
                    }}
                    value={step.content}
                    onChange={(e) => updateStep(i, 'content', e.target.value)}
                    placeholder="请输入步骤内容"
                    onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
                  />
                  <input
                    style={s('input')}
                    value={step.image || ''}
                    onChange={(e) => updateStep(i, 'image', e.target.value)}
                    placeholder="步骤图片URL（可选）"
                    onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              style={{
                ...s('btn'),
                ...s('btnSecondary'),
              }}
              onClick={addStep}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              + 添加步骤
            </button>
            {errors.steps && <div style={s('error')}>{errors.steps}</div>}
          </div>

          <div style={s('formGroup')}>
            <label style={s('label')}>类别</label>
            <select
              style={s('select')}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={s('formGroup')}>
            <label style={s('label')}>烹饪时长（分钟）</label>
            <input
              type="number"
              style={s('input')}
              value={cookTime || ''}
              onChange={(e) => setCookTime(Number(e.target.value))}
              placeholder="请输入烹饪时长"
              min={1}
              onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#ddd')}
            />
            {errors.cookTime && <div style={s('error')}>{errors.cookTime}</div>}
          </div>

          <div style={s('submitRow')}>
            <button
              type="submit"
              style={{
                ...s('btn'),
                ...s('btnPrimary'),
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {isEdit ? '保存修改' : '创建食谱'}
            </button>
            <button
              type="button"
              style={{
                ...s('btn'),
                ...s('btnSecondary'),
              }}
              onClick={() => navigate('/')}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(2px)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
