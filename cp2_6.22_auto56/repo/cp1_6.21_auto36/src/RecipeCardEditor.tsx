import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Recipe, Ingredient, RecipeStep, InventoryItem } from './types';
import { api } from './api';
import './RecipeCardEditor.css';

interface Props {
  recipe?: Recipe;
  onClose: () => void;
  onSaved: () => void;
  inventory: InventoryItem[];
}

export default function RecipeCardEditor({ recipe, onClose, onSaved, inventory }: Props) {
  const [name, setName] = useState(recipe?.name || '');
  const [coverImage, setCoverImage] = useState(recipe?.coverImage || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [prepTime, setPrepTime] = useState(recipe?.prepTime || 10);
  const [cookTime, setCookTime] = useState(recipe?.cookTime || 15);
  const [difficulty, setDifficulty] = useState<Recipe['difficulty']>(recipe?.difficulty || 'easy');
  const [servings, setServings] = useState(recipe?.servings || 2);
  const [tags, setTags] = useState<string>(recipe?.tags?.join(', ') || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients?.length
      ? recipe.ingredients
      : [{ id: uuidv4(), name: '', quantity: 0, unit: '个' }]
  );
  const [steps, setSteps] = useState<RecipeStep[]>(
    recipe?.steps?.length
      ? recipe.steps
      : [{ id: uuidv4(), order: 1, description: '' }]
  );
  const [saving, setSaving] = useState(false);
  const [dragStepId, setDragStepId] = useState<string | null>(null);
  const [showInvPicker, setShowInvPicker] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addIngredient = () => {
    setIngredients([...ingredients, { id: uuidv4(), name: '', quantity: 0, unit: '个' }]);
  };
  const updateIngredient = (idx: number, patch: Partial<Ingredient>) => {
    setIngredients(ingredients.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing)));
  };
  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };
  const pickFromInventory = (invName: string, idx: number) => {
    const item = inventory.find(i => i.name === invName);
    updateIngredient(idx, { name: invName, unit: item?.unit || '个', quantity: item?.quantity ? Math.min(1, item.quantity) : 1 });
    setShowInvPicker(null);
  };

  const addStep = () => {
    setSteps([...steps, { id: uuidv4(), order: steps.length + 1, description: '' }]);
  };
  const updateStep = (idx: number, patch: Partial<RecipeStep>) => {
    setSteps(steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };
  const removeStep = (idx: number) => {
    const filtered = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    setSteps(filtered);
  };
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragStepId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (!dragStepId) return;
    const fromIdx = steps.findIndex(s => s.id === dragStepId);
    if (fromIdx === -1 || fromIdx === targetIdx) {
      setDragStepId(null);
      return;
    }
    const arr = [...steps];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(targetIdx, 0, moved);
    setSteps(arr.map((s, i) => ({ ...s, order: i + 1 })));
    setDragStepId(null);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('请输入食谱名称');
      return;
    }
    setSaving(true);
    try {
      const cleanIngredients = ingredients.filter(i => i.name.trim());
      const cleanSteps = steps.filter(s => s.description.trim()).map((s, i) => ({ ...s, order: i + 1 }));
      const data = {
        name,
        coverImage,
        description,
        prepTime: Number(prepTime),
        cookTime: Number(cookTime),
        difficulty,
        servings: Number(servings),
        ingredients: cleanIngredients,
        steps: cleanSteps,
        author: recipe?.author || '我',
        tags: tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      };
      if (recipe) {
        await api.updateRecipe(recipe.id, data);
      } else {
        await api.createRecipe(data);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const previewRecipe: Recipe = {
    id: 'preview',
    name: name || '食谱名称',
    coverImage: coverImage || 'https://via.placeholder.com/400x300?text=Recipe',
    description: description || '美味食谱的简要描述...',
    prepTime: Number(prepTime) || 0,
    cookTime: Number(cookTime) || 0,
    totalTime: (Number(prepTime) || 0) + (Number(cookTime) || 0),
    difficulty,
    servings: Number(servings) || 1,
    ingredients: ingredients.filter(i => i.name.trim()),
    steps: steps.filter(s => s.description.trim()),
    author: recipe?.author || '我',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    averageRating: 0,
    totalRatings: 0,
    tags: tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
    comments: [],
  };

  return (
    <div className="editor-overlay fade-in" onClick={onClose}>
      <div className="editor-panel" onClick={e => e.stopPropagation()}>
        <div className="editor-header">
          <h2>{recipe ? '编辑食谱' : '创建新食谱'}</h2>
          <button className="btn-secondary" onClick={onClose}>关闭</button>
        </div>
        <div className="editor-body">
          <div className="editor-form">
            <div className="form-row">
              <label>食谱名称</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="例如：番茄炒蛋" />
            </div>
            <div className="form-row">
              <label>封面图片</label>
              <div className="cover-uploader">
                {coverImage ? (
                  <img src={coverImage} alt="cover" className="cover-preview" />
                ) : (
                  <div className="cover-placeholder" onClick={() => fileInputRef.current?.click()}>
                    点击上传封面
                  </div>
                )}
                <div className="cover-actions">
                  <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>选择图片</button>
                  <input
                    type="url"
                    placeholder="或输入图片URL"
                    value={coverImage.startsWith('http') || coverImage.startsWith('data:') ? coverImage : ''}
                    onChange={e => setCoverImage(e.target.value)}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleCoverUpload}
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <label>描述</label>
              <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="描述这道菜的特点" />
            </div>
            <div className="form-grid-3">
              <div className="form-row">
                <label>准备(分钟)</label>
                <input type="number" min={0} value={prepTime} onChange={e => setPrepTime(Number(e.target.value))} />
              </div>
              <div className="form-row">
                <label>烹饪(分钟)</label>
                <input type="number" min={0} value={cookTime} onChange={e => setCookTime(Number(e.target.value))} />
              </div>
              <div className="form-row">
                <label>难度</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="form-row">
                <label>份量(人份)</label>
                <input type="number" min={1} value={servings} onChange={e => setServings(Number(e.target.value))} />
              </div>
              <div className="form-row">
                <label>标签(逗号分隔)</label>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="家常菜,快手菜" />
              </div>
            </div>

            <div className="section-title">
              <h3>食材列表</h3>
              <button className="btn-secondary" onClick={addIngredient}>+ 添加食材</button>
            </div>
            <div className="ingredients-list">
              {ingredients.map((ing, idx) => (
                <div key={ing.id} className="ingredient-row">
                  <div className="ingredient-input name" style={{ position: 'relative' }}>
                    <input
                      placeholder="食材名称"
                      value={ing.name}
                      onFocus={() => setShowInvPicker(idx)}
                      onBlur={() => setTimeout(() => setShowInvPicker(null), 200)}
                      onChange={e => updateIngredient(idx, { name: e.target.value })}
                    />
                    {showInvPicker === idx && inventory.length > 0 && (
                      <div className="inventory-picker">
                        <div className="picker-title">从库存快速选择</div>
                        {inventory.slice(0, 15).map(item => (
                          <div
                            key={item.id}
                            className="picker-item"
                            onMouseDown={() => pickFromInventory(item.name, idx)}
                          >
                            {item.name} ({item.quantity} {item.unit})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    className="ingredient-input qty"
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="数量"
                    value={ing.quantity}
                    onChange={e => updateIngredient(idx, { quantity: Number(e.target.value) })}
                  />
                  <input
                    className="ingredient-input unit"
                    placeholder="单位"
                    value={ing.unit}
                    onChange={e => updateIngredient(idx, { unit: e.target.value })}
                  />
                  <button className="btn-danger" onClick={() => removeIngredient(idx)}>×</button>
                </div>
              ))}
            </div>

            <div className="section-title">
              <h3>制作步骤 (可拖拽排序)</h3>
              <button className="btn-secondary" onClick={addStep}>+ 添加步骤</button>
            </div>
            <div className="steps-list">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`step-row ${dragStepId === step.id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={e => onDragStart(e, step.id)}
                  onDragOver={onDragOver}
                  onDrop={e => onDrop(e, idx)}
                >
                  <div className="step-handle">⋮⋮</div>
                  <div className="step-order">{step.order}.</div>
                  <textarea
                    rows={2}
                    placeholder={`第 ${step.order} 步...`}
                    value={step.description}
                    onChange={e => updateStep(idx, { description: e.target.value })}
                  />
                  <button className="btn-danger" onClick={() => removeStep(idx)}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="editor-preview">
            <div className="preview-title">实时预览</div>
            <RecipePreview recipe={previewRecipe} />
          </div>
        </div>
        <div className="editor-footer">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : (recipe ? '更新食谱' : '保存食谱')}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipePreview({ recipe }: { recipe: Recipe }) {
  return (
    <div className="recipe-preview-card">
      <div className="preview-cover">
        <img src={recipe.coverImage} alt={recipe.name} onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250?text=No+Image'; }} />
      </div>
      <div className="preview-content">
        <h3 className="preview-name">{recipe.name}</h3>
        <div className="preview-meta">
          <span>⏱ {recipe.totalTime}分钟</span>
          <span>👥 {recipe.servings}人份</span>
          <span className={`diff-${recipe.difficulty}`}>
            {recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难'}
          </span>
        </div>
        <p className="preview-desc">{recipe.description}</p>
        {recipe.tags.length > 0 && (
          <div className="preview-tags">
            {recipe.tags.map(t => <span key={t} className="tag">#{t}</span>)}
          </div>
        )}
        <div className="preview-section">
          <h4>🥕 食材</h4>
          {recipe.ingredients.length === 0 ? (
            <p className="empty-tip">暂无食材</p>
          ) : (
            <ul className="preview-ingredients">
              {recipe.ingredients.map(i => (
                <li key={i.id}><span className="ing-name">{i.name}</span><span className="ing-qty">{i.quantity}{i.unit}</span></li>
              ))}
            </ul>
          )}
        </div>
        <div className="preview-section">
          <h4>👨‍🍳 步骤</h4>
          {recipe.steps.length === 0 ? (
            <p className="empty-tip">暂无步骤</p>
          ) : (
            <ol className="preview-steps">
              {recipe.steps.map(s => <li key={s.id}>{s.description}</li>)}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
