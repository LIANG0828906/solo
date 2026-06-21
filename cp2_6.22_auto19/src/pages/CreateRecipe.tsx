import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Plus, X, ChefHat, ListOrdered, Tag, Image, FileText, ArrowLeft } from 'lucide-react';
import { api } from '@/utils/api';
import { useAuthStore } from '@/store/useAuthStore';

const PRESET_TAGS = ['中餐', '西餐', '甜点', '烘焙', '低卡', '家常菜', '快手菜', '辣', '健身', '沙拉', '肉类', '意式', '港式', '川菜'];

export const CreateRecipe: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<'basic' | 'ingredients' | 'steps' | 'tags'>('basic');
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string }[]>([{ name: '', quantity: '' }]);
  const [steps, setSteps] = useState<{ order: number; content: string; image?: string }[]>([{ order: 1, content: '' }]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const next = [...ingredients];
    next[index][field] = value;
    setIngredients(next);
  };

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, content: '' }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const next = steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }));
      setSteps(next);
    }
  };

  const updateStep = (index: number, content: string) => {
    const next = [...steps];
    next[index].content = content;
    setSteps(next);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 'basic') {
      if (!title.trim()) newErrors.title = '请输入食谱名称';
      if (!coverImage.trim()) newErrors.coverImage = '请上传封面图片';
    } else if (step === 'ingredients') {
      const hasValid = ingredients.some(i => i.name.trim());
      if (!hasValid) newErrors.ingredients = '请至少添加一种配料';
    } else if (step === 'steps') {
      const hasValid = steps.some(s => s.content.trim());
      if (!hasValid) newErrors.steps = '请至少添加一个步骤';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    try {
      const validIngredients = ingredients.filter(i => i.name.trim());
      const validSteps = steps.filter(s => s.content.trim()).map((s, i) => ({ ...s, order: i + 1 }));

      const recipe = await api.recipes.create({
        title: title.trim(),
        description: description.trim(),
        coverImage,
        ingredients: validIngredients,
        steps: validSteps,
        tags: selectedTags,
      });

      navigate(`/recipe/${recipe.id}`);
    } catch (err) {
      console.error('创建食谱失败:', err);
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (step === 'basic') setStep('ingredients');
      else if (step === 'ingredients') setStep('steps');
      else if (step === 'steps') setStep('tags');
      else handleSubmit();
    }
  };

  const prevStep = () => {
    if (step === 'ingredients') setStep('basic');
    else if (step === 'steps') setStep('ingredients');
    else if (step === 'tags') setStep('steps');
  };

  const stepsConfig = [
    { key: 'basic', label: '基本信息', icon: FileText },
    { key: 'ingredients', label: '配料', icon: ChefHat },
    { key: 'steps', label: '步骤', icon: ListOrdered },
    { key: 'tags', label: '标签', icon: Tag },
  ];

  const currentStepIndex = stepsConfig.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-500 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          取消
        </button>

        <h1 className="text-3xl font-bold text-stone-800 mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          发布新食谱
        </h1>

        <div className="flex items-center justify-between mb-8">
          {stepsConfig.map((s, idx) => {
            const Icon = s.icon;
            const isActive = s.key === step;
            const isDone = idx < currentStepIndex;
            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200' : isDone ? 'bg-green-500 text-white' : 'bg-stone-200 text-stone-400'}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`mt-2 text-sm font-medium ${isActive ? 'text-orange-600' : isDone ? 'text-green-600' : 'text-stone-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < stepsConfig.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${isDone ? 'bg-green-500' : 'bg-stone-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {step === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  食谱名称 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：番茄炒蛋"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${errors.title ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-orange-400'}`}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  简介
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简单描述这道菜的特点..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-orange-400 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  封面图片 *
                </label>
                {coverImage ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={coverImage}
                      alt="封面预览"
                      className="w-full aspect-video object-cover"
                    />
                    <button
                      onClick={() => setCoverImage('')}
                      className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className={`block border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${errors.coverImage ? 'border-red-300 hover:border-red-400' : 'border-stone-300 hover:border-orange-400'}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Image className={`w-12 h-12 mx-auto mb-3 ${errors.coverImage ? 'text-red-400' : 'text-stone-400'}`} />
                    <p className={`font-medium ${errors.coverImage ? 'text-red-600' : 'text-stone-600'}`}>
                      点击上传封面图片
                    </p>
                    <p className="text-sm text-stone-400 mt-1">支持 JPG、PNG 格式</p>
                    {errors.coverImage && <p className="text-red-500 text-sm mt-1">{errors.coverImage}</p>}
                  </label>
                )}
              </div>
            </div>
          )}

          {step === 'ingredients' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-stone-800">配料清单</h3>
                <button
                  onClick={addIngredient}
                  className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加配料
                </button>
              </div>
              {errors.ingredients && <p className="text-red-500 text-sm">{errors.ingredients}</p>}
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-3">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    placeholder="食材名称"
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-orange-400 outline-none transition-all"
                  />
                  <input
                    type="text"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                    placeholder="用量"
                    className="w-32 px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-orange-400 outline-none transition-all"
                  />
                  {ingredients.length > 1 && (
                    <button
                      onClick={() => removeIngredient(idx)}
                      className="w-12 h-12 flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 'steps' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-stone-800">烹饪步骤</h3>
                <button
                  onClick={addStep}
                  className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  添加步骤
                </button>
              </div>
              {errors.steps && <p className="text-red-500 text-sm">{errors.steps}</p>}
              {steps.map((stepItem, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {stepItem.order}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={stepItem.content}
                      onChange={(e) => updateStep(idx, e.target.value)}
                      placeholder="描述这一步怎么做..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-orange-400 outline-none transition-all resize-none"
                    />
                  </div>
                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(idx)}
                      className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 'tags' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-stone-800 mb-4">选择标签</h3>
                <p className="text-stone-500 text-sm mb-4">选择合适的标签，让更多人发现你的食谱</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedTags.includes(tag) ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200' : 'bg-stone-100 text-stone-600 hover:bg-orange-50 hover:text-orange-600'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50 rounded-xl p-4">
                <h4 className="font-medium text-orange-800 mb-2">预览</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.length === 0 ? (
                    <span className="text-orange-400 text-sm">还没有选择标签</span>
                  ) : (
                    selectedTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-white text-orange-600 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {currentStepIndex > 0 && (
            <button
              onClick={prevStep}
              className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-xl font-medium hover:bg-stone-200 transition-all"
            >
              上一步
            </button>
          )}
          <button
            onClick={nextStep}
            disabled={loading}
            className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 shadow-lg shadow-orange-200"
          >
            {loading ? '发布中...' : currentStepIndex === stepsConfig.length - 1 ? '发布食谱' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
};
