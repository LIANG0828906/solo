import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { recipeApi } from '../api';
import { CATEGORY_OPTIONS } from '../types';
import type { RecipeCategory, Ingredient, Step } from '../types';
import { IngredientList } from '../components/IngredientList';
import { DraggableStepList } from '../components/DraggableStepList';
import { ImageUploader } from '../components/ImageUploader';

export function CreateRecipePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RecipeCategory>('bread');
  const [ovenModel, setOvenModel] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: uuidv4(), name: '', amount: 0, unit: 'g' },
  ]);
  const [steps, setSteps] = useState<Step[]>([
    { id: uuidv4(), description: '', order: 1 },
  ]);
  const [productDescription, setProductDescription] = useState('');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入配方名称');
      return;
    }

    setSubmitting(true);
    try {
      const filteredIngredients = ingredients.filter((i) => i.name.trim());
      const filteredSteps = steps
        .filter((s) => s.description.trim())
        .map((s, idx) => ({ ...s, order: idx + 1 }));

      await recipeApi.create({
        name: name.trim(),
        category,
        ovenModel: ovenModel.trim(),
        ingredients: filteredIngredients,
        steps: filteredSteps,
        finalProduct: {
          description: productDescription.trim(),
          images: productImages,
        },
      });
      navigate('/');
    } catch (error) {
      console.error('Failed to create recipe:', error);
      alert('创建配方失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          返回
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-8">创建新配方</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">基础信息</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                配方名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：北海道牛奶吐司"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                style={{ borderRadius: '10px' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                类别
              </label>
              <div className="flex flex-wrap gap-3">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    className="px-5 py-2 rounded-full font-medium transition-all duration-200"
                    style={{
                      backgroundColor: category === opt.value ? opt.color : 'transparent',
                      color: category === opt.value ? 'white' : opt.color,
                      border: `2px solid ${opt.color}`,
                      transform: category === opt.value ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: category === opt.value ? `0 4px 12px ${opt.color}40` : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                烤箱型号
              </label>
              <input
                type="text"
                value={ovenModel}
                onChange={(e) => setOvenModel(e.target.value)}
                placeholder="例如：美的T3-L326B"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                style={{ borderRadius: '10px' }}
              />
            </div>
          </div>

          <IngredientList
            ingredients={ingredients}
            onChange={setIngredients}
          />

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">制作步骤</h2>
            <p className="text-sm text-gray-500 -mt-2">
              拖拽左侧手柄调整步骤顺序
            </p>
            <DraggableStepList steps={steps} onChange={setSteps} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">成品品相</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                成品描述
              </label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="描述成品的外观、口感等..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 resize-none min-h-[100px] transition-colors"
                style={{ borderRadius: '10px' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                成品图片 (最多3张)
              </label>
              <ImageUploader
                images={productImages}
                onChange={setProductImages}
                maxImages={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              style={{ borderRadius: '10px' }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-400 text-white rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-orange-200 disabled:opacity-50 hover:shadow-xl transition-all hover:scale-[1.02] active:scale-100"
              style={{ borderRadius: '10px' }}
            >
              <Save size={20} />
              {submitting ? '保存中...' : '保存配方'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
