import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Info, Image as ImageIcon, DollarSign, Sliders } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ImageUploader from '@/components/ImageUploader';
import { useTradeStore } from '../store';
import { useAuthStore } from '../../auth/store';
import { getCategories, getConditions } from '../models';
import { useToast } from '@/components/Toast';
import {
  validateTitle,
  validateDescription,
  validatePrice,
  validateImages,
} from '@/utils/validators';

export default function CreateItemPage() {
  const { currentUser } = useAuthStore();
  const { createNewItem, loading, error, clearError } = useTradeStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(getCategories()[0]);
  const [condition, setCondition] = useState(getConditions()[0]);
  const [price, setPrice] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const t = validateTitle(title);
    if (!t.valid) newErrors.title = t.message;
    const d = validateDescription(description);
    if (!d.valid) newErrors.description = d.message;
    const p = validatePrice(Number(price));
    if (!p.valid) newErrors.price = p.message;
    const i = validateImages(images);
    if (!i.valid) newErrors.images = i.message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const item = await createNewItem({
        title,
        description,
        category,
        condition,
        price: Number(price),
        images,
      });
      showToast('发布成功！', 'success');
      navigate(`/item/${item.id}`, { replace: true });
    } catch (e: any) {
      showToast(e.message || '发布失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar showSearch={false} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-secondary/70 hover:text-primary mb-5 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>返回</span>
        </button>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 fade-in">
          <h1 className="text-2xl font-bold text-secondary mb-1">发布闲置物品</h1>
          <p className="text-sm text-secondary/50 mb-7">
            填写物品信息，让更多人看到它的价值
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-secondary mb-2">
                <ImageIcon size={16} className="text-primary" />
                物品图片 <span className="text-red-500">*</span>
              </label>
              <ImageUploader value={images} onChange={setImages} maxCount={6} />
              {errors.images && (
                <p className="text-xs text-red-500 mt-1.5">{errors.images}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-secondary mb-2">
                <Tag size={16} className="text-primary" />
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value.slice(0, 30));
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                placeholder="简明扼要地描述物品名称，如：iPhone 12 Pro 128G"
                maxLength={30}
                className={`w-full px-4 py-3 rounded-xl border bg-bg focus:bg-white transition-all text-sm ${
                  errors.title ? 'border-red-300 focus:border-red-400' : 'border-secondary/10 focus:border-primary/50'
                }`}
              />
              <div className="flex justify-between mt-1.5">
                <p className={`text-xs ${errors.title ? 'text-red-500' : 'text-secondary/40'}`}>
                  {errors.title || '简短清晰的标题能吸引更多人关注'}
                </p>
                <p className="text-xs text-secondary/40">{title.length}/30</p>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-secondary mb-2">
                <Info size={16} className="text-primary" />
                详细描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value.slice(0, 200));
                  if (errors.description) setErrors({ ...errors, description: '' });
                }}
                rows={5}
                maxLength={200}
                placeholder="详细描述物品的成色、配件、使用时间、转让原因等..."
                className={`w-full px-4 py-3 rounded-xl border bg-bg focus:bg-white transition-all text-sm resize-none ${
                  errors.description ? 'border-red-300 focus:border-red-400' : 'border-secondary/10 focus:border-primary/50'
                }`}
              />
              <div className="flex justify-between mt-1.5">
                <p className={`text-xs ${errors.description ? 'text-red-500' : 'text-secondary/40'}`}>
                  {errors.description || '越详细的描述越有助于成功交易'}
                </p>
                <p className="text-xs text-secondary/40">{description.length}/200</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-secondary mb-2">
                  <Tag size={16} className="text-primary" />
                  物品分类
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border border-secondary/10 bg-bg focus:bg-white focus:border-primary/50 transition-all text-sm appearance-none pr-10"
                >
                  {getCategories().map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-secondary mb-2">
                  <Sliders size={16} className="text-primary" />
                  物品成色
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-xl border border-secondary/10 bg-bg focus:bg-white focus:border-primary/50 transition-all text-sm appearance-none pr-10"
                >
                  {getConditions().map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-secondary mb-2">
                <DollarSign size={16} className="text-primary" />
                期望价格（元） <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/40 text-sm">¥</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (errors.price) setErrors({ ...errors, price: '' });
                  }}
                  placeholder="0-9999"
                  min={0}
                  max={9999}
                  step={1}
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border bg-bg focus:bg-white transition-all text-sm ${
                    errors.price ? 'border-red-300 focus:border-red-400' : 'border-secondary/10 focus:border-primary/50'
                  }`}
                />
              </div>
              <p className={`text-xs mt-1.5 ${errors.price ? 'text-red-500' : 'text-secondary/40'}`}>
                {errors.price || '支持0-9999元范围，请输入整数'}
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 py-3.5 rounded-xl border border-secondary/10 text-sm font-medium text-secondary/70 hover:bg-bg transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting || loading}
                className="flex-1 py-3.5 rounded-xl text-white text-sm font-semibold hover:brightness-110 disabled:opacity-60 transition-all"
                style={{ backgroundColor: '#E67E22' }}
              >
                {submitting || loading ? '发布中...' : '立即发布'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
