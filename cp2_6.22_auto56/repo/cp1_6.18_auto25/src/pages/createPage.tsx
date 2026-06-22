import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore } from '@/store/recipeStore';

interface FormErrors {
  name?: string;
  author?: string;
  ingredients?: string;
  steps?: string;
  image?: string;
}

export const CreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { createRecipe, loading } = useRecipeStore();

  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [steps, setSteps] = useState<string[]>(['', '', '']);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (name.trim().length < 2 || name.trim().length > 50) {
      newErrors.name = '食谱名称需2-50个字符';
    }
    if (author.trim().length < 2 || author.trim().length > 20) {
      newErrors.author = '作者名称需2-20个字符';
    }
    const validIngredients = ingredients.filter((i) => i.trim());
    if (validIngredients.length < 1) {
      newErrors.ingredients = '至少添加一项食材';
    }
    const validSteps = steps.filter((s) => s.trim());
    if (validSteps.length < 3) {
      newErrors.steps = '至少添加三个步骤';
    }
    if (!imageUrl && !imagePreview) {
      newErrors.image = '请上传食谱图片';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFile = (file: File) => {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setErrors({ ...errors, image: '仅支持JPG/PNG格式' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: '图片大小不能超过5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setImageUrl('');
      setErrors({ ...errors, image: undefined });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl('');
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index: number) => {
    if (steps.length > 3) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const validIngredients = ingredients.filter((i) => i.trim());
      const validSteps = steps.filter((s) => s.trim());
      const finalImageUrl = imagePreview || imageUrl;

      await createRecipe({
        name: name.trim(),
        author: author.trim(),
        imageUrl: finalImageUrl,
        ingredients: validIngredients,
        steps: validSteps,
      });

      navigate('/');
    } catch (err) {
      console.error('发布失败', err);
    }
  };

  return (
    <div className="create-page">
      <nav className="navbar">
        <div className="nav-content">
          <h1 className="nav-title" onClick={() => navigate('/')}>
            巷陌食单
          </h1>
          <div className="nav-right">
            <button className="back-btn-sm" onClick={() => navigate('/')}>
              ← 返回
            </button>
          </div>
        </div>
      </nav>

      <main className="create-main">
        <form className="create-form" onSubmit={handleSubmit}>
          <h2 className="form-title">发布新食谱</h2>

          <div className="form-item">
            <label className="form-label">
              <span className="required">*</span> 食谱名称
            </label>
            <input
              type="text"
              className={`form-input ${errors.name ? 'error' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：红烧肉"
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-item">
            <label className="form-label">
              <span className="required">*</span> 作者名称
            </label>
            <input
              type="text"
              className={`form-input ${errors.author ? 'error' : ''}`}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="您的昵称"
            />
            {errors.author && <p className="form-error">{errors.author}</p>}
          </div>

          <div className="form-item">
            <label className="form-label">
              <span className="required">*</span> 食谱图片
            </label>
            {imagePreview ? (
              <div className="image-preview-wrap">
                <img src={imagePreview} alt="预览" className="image-preview" />
                <button type="button" className="remove-image-btn" onClick={handleRemoveImage}>
                  ×
                </button>
              </div>
            ) : (
              <div
                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">📷</div>
                <p className="upload-text">点击或拖拽图片到此处上传</p>
                <p className="upload-hint">支持JPG/PNG格式，大小不超过5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            )}
            {errors.image && <p className="form-error">{errors.image}</p>}
          </div>

          <div className="form-item">
            <label className="form-label">
              <span className="required">*</span> 食材清单
            </label>
            <div className="dynamic-list">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="dynamic-item">
                  <input
                    type="text"
                    className="form-input"
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    placeholder={`食材 ${index + 1}，例如：五花肉 500g`}
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeIngredient(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addIngredient}>
                + 添加食材
              </button>
            </div>
            {errors.ingredients && <p className="form-error">{errors.ingredients}</p>}
          </div>

          <div className="form-item">
            <label className="form-label">
              <span className="required">*</span> 分步指导（至少三步）
            </label>
            <div className="dynamic-list">
              {steps.map((step, index) => (
                <div key={index} className="dynamic-item step-dynamic">
                  <span className="step-badge">{index + 1}</span>
                  <textarea
                    className="form-textarea step-textarea"
                    value={step}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`描述第 ${index + 1} 步的操作...`}
                    rows={3}
                  />
                  {steps.length > 3 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeStep(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addStep}>
                + 添加步骤
              </button>
            </div>
            {errors.steps && <p className="form-error">{errors.steps}</p>}
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? '发布中...' : '发布食谱'}
          </button>
        </form>
      </main>
    </div>
  );
};
