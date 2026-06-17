import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ChefHat, ListChecks, Image as ImageIcon, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import useStore from '../store/useStore';
import { parseIngredients, parseSteps } from '../shared/recipeUtils';
import { Ingredient } from '../shared/types';
import './PublishPage.css';

interface FormState {
  title: string;
  description: string;
  ingredients: string;
  steps: string;
  image: string;
}

const initialForm: FormState = {
  title: '',
  description: '',
  ingredients: '',
  steps: '',
  image: ''
};

function PublishPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const publishRecipe = useStore(state => state.publishRecipe as (input: {
    title: string;
    description: string;
    image: string;
    ingredients: Ingredient[];
    steps: string[];
  }) => Promise<{ id: string }>);
  const isLoading = useStore(state => state.isLoading);

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [previewIngredients, setPreviewIngredients] = useState<Ingredient[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (field === 'ingredients') {
      setPreviewIngredients(parseIngredients(value));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) newErrors.title = '请填写菜品名称';
    if (!form.description.trim()) newErrors.description = '请填写菜品描述';
    if (!form.ingredients.trim()) newErrors.ingredients = '请填写食材列表';
    if (!form.steps.trim()) newErrors.steps = '请填写制作步骤';
    if (!form.image.trim()) newErrors.image = '请上传菜品图片';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: '请上传 PNG 或 JPG 格式的图片' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: '图片大小不能超过 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      handleChange('image', result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const ingredients = parseIngredients(form.ingredients);
    const steps = parseSteps(form.steps);

    if (ingredients.length === 0) {
      setErrors(prev => ({ ...prev, ingredients: '请填写有效的食材' }));
      return;
    }
    if (steps.length === 0) {
      setErrors(prev => ({ ...prev, steps: '请填写有效的步骤' }));
      return;
    }

    try {
      const result = await publishRecipe({
        title: form.title.trim(),
        description: form.description.trim(),
        image: form.image,
        ingredients,
        steps
      });
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/recipe/${result.id}`);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const parsedSteps = parseSteps(form.steps);

  return (
    <div className="publish-page">
      <div className="publish-container">
        <header className="publish-header">
          <div className="publish-title-wrap">
            <ChefHat size={28} className="publish-icon" />
            <div>
              <h1 className="publish-title">发布新菜谱</h1>
              <p className="publish-subtitle">分享你的创意菜品，让更多人尝到美味</p>
            </div>
          </div>
        </header>

        {showSuccess && (
          <div className="success-toast">
            <CheckCircle2 size={20} />
            <span>发布成功！正在跳转到详情页...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="publish-form">
          <section className="form-section">
            <div className="section-title">
              <ImageIcon size={20} />
              <h2>菜品图片</h2>
            </div>

            <div className="image-upload-area">
              {form.image ? (
                <div className="image-preview">
                  <img src={form.image} alt="菜品预览" />
                  <button
                    type="button"
                    className="image-remove"
                    onClick={() => handleChange('image', '')}
                  >
                    更换图片
                  </button>
                </div>
              ) : (
                <div
                  className={`upload-zone ${errors.image ? 'error' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={48} className="upload-icon" />
                  <p className="upload-title">点击上传菜品图片</p>
                  <p className="upload-hint">支持 PNG / JPG 格式，最大 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              {errors.image && (
                <p className="error-text">
                  <AlertCircle size={14} />
                  {errors.image}
                </p>
              )}
            </div>
          </section>

          <section className="form-section">
            <div className="section-title">
              <ListChecks size={20} />
              <h2>基本信息</h2>
            </div>

            <div className="form-group">
              <label className="form-label">
                菜品名称 <span className="required">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="例如：番茄炒蛋、红烧肉..."
                className={`form-input ${errors.title ? 'error' : ''}`}
                maxLength={50}
              />
              <div className="input-footer">
                {errors.title ? (
                  <p className="error-text">
                    <AlertCircle size={14} />
                    {errors.title}
                  </p>
                ) : (
                  <span className="char-count">{form.title.length}/50</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                菜品描述 <span className="required">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="简要描述这道菜的特色、口感、适合场景..."
                className={`form-textarea description ${errors.description ? 'error' : ''}`}
                rows={3}
                maxLength={200}
              />
              <div className="input-footer">
                {errors.description ? (
                  <p className="error-text">
                    <AlertCircle size={14} />
                    {errors.description}
                  </p>
                ) : (
                  <span className="char-count">{form.description.length}/200</span>
                )}
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-title">
              <ChefHat size={20} />
              <h2>食材清单</h2>
            </div>

            <div className="form-group">
              <label className="form-label">
                食材列表 <span className="required">*</span>
              </label>
              <p className="field-hint">使用逗号分隔每项，可带用量（如：牛肉 500g，土豆 2个，生抽 2勺）</p>
              <textarea
                value={form.ingredients}
                onChange={(e) => handleChange('ingredients', e.target.value)}
                placeholder={"牛肉 500g，土豆 2个，胡萝卜 1根，生抽 2勺，老抽 1勺"}
                className={`form-textarea ingredients ${errors.ingredients ? 'error' : ''}`}
                rows={4}
              />
              {previewIngredients.length > 0 && (
                <div className="ingredients-preview">
                  <p className="preview-title">识别到 {previewIngredients.length} 种食材：</p>
                  <div className="ingredient-tags">
                    {previewIngredients.map((ing, idx) => (
                      <span key={idx} className={`ing-tag ${ing.category}`}>
                        {ing.name}
                        {ing.amount !== '适量' && <em>{ing.amount}</em>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {errors.ingredients && (
                <p className="error-text">
                  <AlertCircle size={14} />
                  {errors.ingredients}
                </p>
              )}
            </div>
          </section>

          <section className="form-section">
            <div className="section-title">
              <ListChecks size={20} />
              <h2>制作步骤</h2>
            </div>

            <div className="form-group">
              <label className="form-label">
                步骤说明 <span className="required">*</span>
              </label>
              <p className="field-hint">每行一个步骤，支持带有序号（如：1. 第一步... 或直接换行）</p>
              <textarea
                value={form.steps}
                onChange={(e) => handleChange('steps', e.target.value)}
                placeholder={"1. 牛肉切块焯水\n2. 锅中热油爆香葱姜\n3. 放入牛肉翻炒上色\n..."}
                className={`form-textarea steps ${errors.steps ? 'error' : ''}`}
                rows={8}
              />
              {parsedSteps.length > 0 && (
                <div className="steps-preview">
                  <p className="preview-title">识别到 {parsedSteps.length} 个步骤：</p>
                  <ol className="steps-preview-list">
                    {parsedSteps.map((step, idx) => (
                      <li key={idx}>
                        <span className="step-num">{idx + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {errors.steps && (
                <p className="error-text">
                  <AlertCircle size={14} />
                  {errors.steps}
                </p>
              )}
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  发布中...
                </>
              ) : (
                <>
                  <Send size={18} />
                  发布菜谱
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PublishPage;
