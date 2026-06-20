import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Recipe, createRecipe, updateRecipe, fetchRecipeById, fetchIngredientSuggestions } from '../api';
import { useAuth } from '../store/AuthContext';

interface RecipeFormProps {
  mode: 'create' | 'edit';
}

export default function RecipeForm({ mode }: RecipeFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [description, setDescription] = useState('');
  const [cookTime, setCookTime] = useState(30);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [cuisine, setCuisine] = useState('中餐');
  const [isPublic, setIsPublic] = useState(true);
  const [ingredients, setIngredients] = useState<{ name: string; amount: string }[]>([
    { name: '', amount: '' }
  ]);
  const [steps, setSteps] = useState<{ description: string; images: string[] }[]>([
    { description: '', images: [] }
  ]);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (mode === 'edit' && id) {
      loadRecipe();
    }
  }, [mode, id]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const recipe = await fetchRecipeById(id!);
      setName(recipe.name);
      setImage(recipe.image);
      setImagePreview(recipe.image);
      setDescription(recipe.description);
      setCookTime(recipe.cookTime);
      setDifficulty(recipe.difficulty);
      setCuisine(recipe.cuisine);
      setIsPublic(recipe.isPublic);
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', amount: '' }]);
      setSteps(recipe.steps.length > 0 ? recipe.steps : [{ description: '', images: [] }]);
    } catch (error) {
      console.error('加载菜谱失败:', error);
      alert('加载菜谱失败');
      navigate('/my-recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImage('');
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImage(url);
    setImagePreview(url);
    setImageFile(null);
  };

  const removeImage = () => {
    setImage('');
    setImageFile(null);
    setImagePreview('');
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: 'name' | 'amount', value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);

    if (field === 'name') {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
      if (value.length > 0) {
        suggestionTimeoutRef.current = setTimeout(async () => {
          try {
            const results = await fetchIngredientSuggestions(value);
            setSuggestions(results);
            setActiveSuggestionIndex(null);
          } catch (error) {
            console.error('获取建议失败:', error);
          }
        }, 300);
      } else {
        setSuggestions([]);
      }
    }
  };

  const selectSuggestion = (suggestion: string, ingredientIndex: number) => {
    const newIngredients = [...ingredients];
    newIngredients[ingredientIndex].name = suggestion;
    setIngredients(newIngredients);
    setSuggestions([]);
  };

  const addStep = () => {
    setSteps([...steps, { description: '', images: [] }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, description: string) => {
    const newSteps = [...steps];
    newSteps[index].description = description;
    setSteps(newSteps);
  };

  const addStepImage = (stepIndex: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newSteps = [...steps];
          if (newSteps[stepIndex].images.length < 3) {
            newSteps[stepIndex].images.push(event.target?.result as string);
            setSteps(newSteps);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removeStepImage = (stepIndex: number, imageIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex].images.splice(imageIndex, 1);
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/login');
      return;
    }

    if (!name.trim()) {
      alert('请输入菜谱名称');
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.name.trim());
    if (validIngredients.length === 0) {
      alert('请至少添加一种食材');
      return;
    }

    const validSteps = steps.filter(step => step.description.trim());
    if (validSteps.length === 0) {
      alert('请至少添加一个步骤');
      return;
    }

    try {
      setSubmitLoading(true);

      const recipeData = {
        name: name.trim(),
        image: image || (imageFile ? '' : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80'),
        description: description.trim(),
        cookTime: Number(cookTime),
        difficulty,
        cuisine,
        ingredients: validIngredients,
        steps: validSteps,
        authorId: user.id,
        authorName: user.username,
        authorAvatar: user.avatar,
        isPublic
      };

      if (mode === 'create') {
        await createRecipe(recipeData, imageFile || undefined);
        alert('菜谱创建成功！');
        navigate('/my-recipes');
      } else {
        await updateRecipe(id!, recipeData, imageFile || undefined);
        alert('菜谱更新成功！');
        navigate(`/recipe/${id}`);
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      alert(error.message || '保存失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="recipe-form-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-form-page">
      <h2>{mode === 'create' ? '创建新菜谱' : '编辑菜谱'}</h2>

      <form onSubmit={handleSubmit}>
        <div className="recipe-form-section">
          <h3>📋 基本信息</h3>

          <div className="form-group">
            <label>菜谱名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给你的菜谱起个名字"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label>封面图片</label>
            {imagePreview ? (
              <div className="image-upload-preview">
                <img src={imagePreview} alt="封面预览" />
                <span className="image-upload-remove" onClick={removeImage}>
                  ✕
                </span>
              </div>
            ) : (
              <div className="image-upload" onClick={() => document.getElementById('image-upload')?.click()}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
                <p style={{ color: 'var(--color-text-light)', marginBottom: '8px' }}>点击上传封面图片</p>
                <p style={{ fontSize: '12px', color: '#999' }}>支持 JPG、PNG 格式</p>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>或输入图片URL</label>
              <input
                type="text"
                value={image}
                onChange={handleImageUrlChange}
                placeholder="https://example.com/image.jpg"
                style={{ marginTop: '6px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>简介</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单介绍一下这道菜..."
              maxLength={200}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>烹饪时间（分钟）</label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(Number(e.target.value))}
                min={1}
                max={999}
              />
            </div>
            <div className="form-group">
              <label>难度等级</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                <option value="easy">初级</option>
                <option value="medium">中级</option>
                <option value="hard">高级</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>菜系</label>
              <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
                <option value="中餐">中餐</option>
                <option value="西餐">西餐</option>
                <option value="日料">日料</option>
                <option value="韩餐">韩餐</option>
                <option value="甜品">甜品</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label>公开设置</label>
              <select value={isPublic ? 'public' : 'private'} onChange={(e) => setIsPublic(e.target.value === 'public')}>
                <option value="public">公开</option>
                <option value="private">私密</option>
              </select>
            </div>
          </div>
        </div>

        <div className="recipe-form-section">
          <h3>🥗 食材清单</h3>

          {ingredients.map((ingredient, index) => (
            <div key={index} className="ingredient-row">
              <div className="ingredient-name">
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  placeholder="食材名称"
                  onFocus={() => {
                    if (ingredient.name && suggestions.length === 0) {
                      fetchIngredientSuggestions(ingredient.name).then(setSuggestions);
                    }
                  }}
                />
                {suggestions.length > 0 && activeSuggestionIndex === null && (
                  <div className="ingredient-suggestions">
                    {suggestions.map((suggestion, sIndex) => (
                      <div
                        key={sIndex}
                        className="ingredient-suggestion-item"
                        onClick={() => selectSuggestion(suggestion, index)}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="ingredient-amount">
                <input
                  type="text"
                  value={ingredient.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                  placeholder="用量"
                />
              </div>
              <button
                type="button"
                className="ingredient-remove"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length === 1}
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" className="add-ingredient-btn" onClick={addIngredient}>
            + 添加食材
          </button>
        </div>

        <div className="recipe-form-section">
          <h3>📝 烹饪步骤</h3>

          {steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-header">
                <span className="step-number-badge">{index + 1}</span>
                <button
                  type="button"
                  className="step-remove-btn"
                  onClick={() => removeStep(index)}
                  disabled={steps.length === 1}
                >
                  删除
                </button>
              </div>

              <textarea
                value={step.description}
                onChange={(e) => updateStep(index, e.target.value)}
                placeholder="描述这一步的操作..."
                style={{ width: '100%', minHeight: '80px' }}
              />

              <div className="step-images">
                {step.images.map((img, imgIndex) => (
                  <div key={imgIndex} className="step-image-item">
                    <img src={img} alt={`步骤${index + 1}-${imgIndex + 1}`} />
                    <span
                      className="step-image-remove"
                      onClick={() => removeStepImage(index, imgIndex)}
                    >
                      ✕
                    </span>
                  </div>
                ))}
                {step.images.length < 3 && (
                  <div className="step-image-add" onClick={() => addStepImage(index)}>
                    +
                  </div>
                )}
              </div>
            </div>
          ))}

          <button type="button" className="add-step-btn" onClick={addStep}>
            + 添加步骤
          </button>
        </div>

        <div className="form-submit-buttons">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(-1)}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitLoading}
          >
            {submitLoading ? '保存中...' : (mode === 'create' ? '发布菜谱' : '保存修改')}
          </button>
        </div>
      </form>
    </div>
  );
}
