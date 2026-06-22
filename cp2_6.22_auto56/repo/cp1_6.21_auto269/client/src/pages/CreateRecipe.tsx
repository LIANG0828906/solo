import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, Trash2, Bold, Italic, List, Image as ImageIcon, X, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import { recipeApi } from '../api';
import { ALL_TAGS, type Ingredient } from '../types';
import './CreateRecipe.css';

const CreateRecipe: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = React.useState('');
  const [coverImage, setCoverImage] = React.useState<string>('');
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([
    { name: '', amount: '' }
  ]);
  const [steps, setSteps] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [cookTime, setCookTime] = React.useState<number>(30);
  const [submitting, setSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const stepsRef = React.useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCoverImage('');
    setCoverFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    stepsRef.current?.focus();
  };

  const handleStepsInput = () => {
    if (stepsRef.current) {
      setSteps(stepsRef.current.innerHTML);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('请输入食谱名称');
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.name.trim());
    if (validIngredients.length === 0) {
      alert('请至少添加一种食材');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('ingredients', JSON.stringify(validIngredients));
      formData.append('steps', steps || '<ol><li>第一步</li></ol>');
      formData.append('tags', JSON.stringify(selectedTags));
      formData.append('cookTime', String(cookTime));

      if (coverFile) {
        formData.append('coverImage', coverFile);
      }

      const recipe = await recipeApi.createRecipe(formData);
      navigate(`/recipes/${recipe.id}`);
    } catch (err) {
      console.error('创建食谱失败:', err);
      alert('创建食谱失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <Navbar />

      <div className="create-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>

        <h1 className="create-title">创建新食谱</h1>

        <form className="create-form" onSubmit={handleSubmit}>
          <div className="form-section animate-fade-in-up">
            <h2 className="form-section-title">基本信息</h2>

            <div className="form-group">
              <label className="form-label">食谱名称 *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例如：番茄炒蛋"
                className="form-input"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label className="form-label">封面图片</label>
              {coverImage ? (
                <div className="image-preview">
                  <img src={coverImage} alt="封面预览" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={handleRemoveImage}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  className="upload-placeholder"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={32} />
                  <span>点击上传封面图片</span>
                  <p className="upload-hint">支持 JPG、PNG 格式</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Clock size={16} style={{ marginRight: 6 }} />
                烹饪时间（分钟）
              </label>
              <input
                type="number"
                value={cookTime}
                onChange={e => setCookTime(Math.max(1, parseInt(e.target.value) || 0))}
                className="form-input form-input-small"
                min={1}
                max={600}
              />
            </div>
          </div>

          <div className="form-section animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h2 className="form-section-title">食材清单</h2>

            <div className="ingredients-form">
              {ingredients.map((ing, index) => (
                <div key={index} className="ingredient-row">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={e => updateIngredient(index, 'name', e.target.value)}
                    placeholder="食材名称"
                    className="form-input ingredient-name-input"
                  />
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={e => updateIngredient(index, 'amount', e.target.value)}
                    placeholder="用量"
                    className="form-input ingredient-amount-input"
                  />
                  <button
                    type="button"
                    className="icon-btn remove-btn"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length <= 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-ingredient-btn"
              onClick={addIngredient}
            >
              <Plus size={18} />
              <span>添加食材</span>
            </button>
          </div>

          <div className="form-section animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <h2 className="form-section-title">制作步骤</h2>

            <div className="steps-editor">
              <div className="editor-toolbar">
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => execCommand('bold')}
                  title="粗体"
                >
                  <Bold size={16} />
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => execCommand('italic')}
                  title="斜体"
                >
                  <Italic size={16} />
                </button>
                <div className="toolbar-divider" />
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => execCommand('insertOrderedList')}
                  title="有序列表"
                >
                  <List size={16} />
                </button>
              </div>
              <div
                ref={stepsRef}
                className="editor-content"
                contentEditable
                onInput={handleStepsInput}
                suppressContentEditableWarning
                placeholder="请输入制作步骤..."
              />
            </div>
            <p className="form-hint">
              支持粗体、斜体和有序列表格式
            </p>
          </div>

          <div className="form-section animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <h2 className="form-section-title">标签分类</h2>
            <div className="tags-selector">
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-option ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <Link to="/" className="btn btn-secondary">
              取消
            </Link>
            <button
              type="submit"
              className="btn btn-primary submit-btn"
              disabled={submitting}
            >
              {submitting ? '创建中...' : '创建食谱'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRecipe;
