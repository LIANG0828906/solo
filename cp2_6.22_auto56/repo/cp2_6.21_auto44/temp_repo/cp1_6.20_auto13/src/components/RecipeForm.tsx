import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Recipe,
  RecipeFormData,
  Ingredient,
  Difficulty,
  createRecipe,
  updateRecipe,
  uploadImage,
  compressImage,
} from '../utils/api';

const PRESET_TAGS = ['早餐', '午餐', '晚餐', '甜点', '素食', '汤品', '小食', '快手菜'];
const DIFFICULTIES: Difficulty[] = ['简单', '中等', '困难'];

interface FormState {
  name: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  cookingTime: number;
  difficulty: Difficulty;
  coverImage: string;
  coverImagePreview: string;
  tags: string[];
  customTagInput: string;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  ingredients: [{ name: '', amount: '' }],
  steps: [''],
  cookingTime: 30,
  difficulty: '简单',
  coverImage: '',
  coverImagePreview: '',
  tags: [],
  customTagInput: '',
};

export default function RecipeForm({
  recipes,
  editId,
  onSaved,
  onCancel,
}: {
  recipes: Recipe[];
  editId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editId) {
      const recipe = recipes.find((r) => r.id === editId);
      if (recipe) {
        setForm({
          name: recipe.name,
          description: recipe.description,
          ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', amount: '' }],
          steps: recipe.steps.length > 0 ? recipe.steps : [''],
          cookingTime: recipe.cookingTime,
          difficulty: recipe.difficulty,
          coverImage: recipe.coverImage,
          coverImagePreview: recipe.coverImage,
          tags: recipe.tags,
          customTagInput: '',
        });
      }
    }
  }, [editId, recipes]);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleIngredientChange = useCallback(
    (index: number, field: keyof Ingredient, value: string) => {
      setForm((prev) => {
        const ingredients = [...prev.ingredients];
        ingredients[index] = { ...ingredients[index], [field]: value };
        return { ...prev, ingredients };
      });
    },
    []
  );

  const addIngredient = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '' }],
    }));
  }, []);

  const removeIngredient = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  }, []);

  const handleStepChange = useCallback((index: number, value: string) => {
    setForm((prev) => {
      const steps = [...prev.steps];
      steps[index] = value;
      return { ...prev, steps };
    });
  }, []);

  const addStep = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      steps: [...prev.steps, ''],
    }));
  }, []);

  const removeStep = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  }, []);

  const handleImageSelect = useCallback(async (file: File) => {
    try {
      const compressed = await compressImage(file, 800);
      setForm((prev) => ({
        ...prev,
        coverImage: compressed,
        coverImagePreview: compressed,
      }));
    } catch (err) {
      console.error('图片压缩失败:', err);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageSelect(file);
    },
    [handleImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        handleImageSelect(file);
      }
    },
    [handleImageSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  }, []);

  const addCustomTag = useCallback(() => {
    const tag = form.customTagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
        customTagInput: '',
      }));
    }
  }, [form.customTagInput, form.tags]);

  const removeImage = useCallback(() => {
    setForm((prev) => ({ ...prev, coverImage: '', coverImagePreview: '' }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name.trim()) return;
      setSaving(true);
      try {
        let coverImageUrl = form.coverImage;
        if (coverImageUrl && coverImageUrl.startsWith('data:')) {
          coverImageUrl = await uploadImage(coverImageUrl);
        }
        const data: RecipeFormData = {
          name: form.name.trim(),
          description: form.description.trim(),
          ingredients: form.ingredients.filter((i) => i.name.trim()),
          steps: form.steps.filter((s) => s.trim()),
          cookingTime: form.cookingTime,
          difficulty: form.difficulty,
          coverImage: coverImageUrl,
          tags: form.tags,
        };
        if (editId) {
          await updateRecipe(editId, data);
        } else {
          await createRecipe(data);
        }
        onSaved();
      } catch (err) {
        console.error('保存失败:', err);
        setSaving(false);
      }
    },
    [form, editId, onSaved]
  );

  return (
    <div className="form-page">
      <h2>{editId ? '编辑食谱' : '添加食谱'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>食谱名称 *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="请输入食谱名称"
            required
          />
        </div>

        <div className="form-group">
          <label>简介</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="简要描述这道菜..."
          />
        </div>

        <div className="form-group">
          <label>食材</label>
          {form.ingredients.map((ing, index) => (
            <div key={index} className="ingredient-row">
              <input
                type="text"
                placeholder="食材名称"
                value={ing.name}
                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
              />
              <input
                type="text"
                placeholder="用量"
                value={ing.amount}
                onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                style={{ maxWidth: 140 }}
              />
              {form.ingredients.length > 1 && (
                <button type="button" className="btn-remove" onClick={() => removeIngredient(index)}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn-add-row" onClick={addIngredient}>
            ＋ 添加食材
          </button>
        </div>

        <div className="form-group">
          <label>步骤</label>
          {form.steps.map((step, index) => (
            <div key={index} className="step-row">
              <span className="step-number-label">{index + 1}</span>
              <textarea
                value={step}
                onChange={(e) => handleStepChange(index, e.target.value)}
                placeholder={`步骤 ${index + 1}...`}
              />
              {form.steps.length > 1 && (
                <button type="button" className="btn-remove" onClick={() => removeStep(index)}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn-add-row" onClick={addStep}>
            ＋ 添加步骤
          </button>
        </div>

        <div className="form-group">
          <label>烹饪时间（分钟）</label>
          <input
            type="number"
            min={0}
            max={600}
            value={form.cookingTime}
            onChange={(e) => updateField('cookingTime', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="form-group">
          <label>难度等级</label>
          <select
            value={form.difficulty}
            onChange={(e) => updateField('difficulty', e.target.value as Difficulty)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>封面图</label>
          <div
            className={`image-upload ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <div className="image-upload-icon">📷</div>
            <div className="image-upload-text">点击或拖拽上传图片</div>
          </div>
          {form.coverImagePreview && (
            <div className="image-preview">
              <img src={form.coverImagePreview} alt="预览" />
              <button type="button" className="image-preview-remove" onClick={removeImage}>
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>标签</label>
          <div className="tag-selector">
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-option ${form.tags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="custom-tag-input">
            <input
              type="text"
              placeholder="自定义标签..."
              value={form.customTagInput}
              onChange={(e) => updateField('customTagInput', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
            />
            <button type="button" onClick={addCustomTag}>
              添加
            </button>
          </div>
          {form.tags.filter((t) => !PRESET_TAGS.includes(t)).length > 0 && (
            <div className="tag-selector" style={{ marginTop: 8 }}>
              {form.tags
                .filter((t) => !PRESET_TAGS.includes(t))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="tag-option selected"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag} ✕
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : editId ? '更新食谱' : '创建食谱'}
          </button>
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
