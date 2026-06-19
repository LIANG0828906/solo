import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ProductType, ProductFormData } from '@/types';
import { getTodayString } from '@/utils/dateUtils';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData>;
}

const productTypes: ProductType[] = ['精华', '面霜', '防晒', '洁面', '水乳', '眼霜', '面膜', '其他'];
const shelfLifeOptions = [3, 6, 12, 24, 36];

export const ProductForm = ({ isOpen, onClose, onSubmit, initialData }: ProductFormProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    brand: '',
    type: '精华',
    capacity: 50,
    openDate: getTodayString(),
    shelfLife: 12,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '请输入产品名称';
    }
    if (!formData.brand.trim()) {
      newErrors.brand = '请输入品牌名称';
    }
    if (formData.capacity <= 0) {
      newErrors.capacity = '容量必须大于0';
    }
    if (!formData.openDate) {
      newErrors.openDate = '请选择开封日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      setFormData({
        name: '',
        brand: '',
        type: '精华',
        capacity: 50,
        openDate: getTodayString(),
        shelfLife: 12,
      });
      onClose();
    }
  };

  const handleChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-scaleIn overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            {initialData ? '编辑产品' : '添加护肤品'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="例如：小棕瓶精华"
              className={`w-full px-4 py-3 rounded-input border-2 border-gray-200 focus:border-primary focus:shadow-input transition-all duration-300 outline-none ${
                errors.name ? 'border-warning' : ''
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-warning">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              品牌 *
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              placeholder="例如：雅诗兰黛"
              className={`w-full px-4 py-3 rounded-input border-2 border-gray-200 focus:border-primary focus:shadow-input transition-all duration-300 outline-none ${
                errors.brand ? 'border-warning' : ''
              }`}
            />
            {errors.brand && <p className="mt-1 text-sm text-warning">{errors.brand}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              产品类型 *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {productTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('type', type)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    formData.type === type
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                容量 (ml/g) *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-3 rounded-input border-2 border-gray-200 focus:border-primary focus:shadow-input transition-all duration-300 outline-none ${
                  errors.capacity ? 'border-warning' : ''
                }`}
              />
              {errors.capacity && <p className="mt-1 text-sm text-warning">{errors.capacity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                保质期 (月) *
              </label>
              <select
                value={formData.shelfLife}
                onChange={(e) => handleChange('shelfLife', parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-input border-2 border-gray-200 focus:border-primary focus:shadow-input transition-all duration-300 outline-none bg-white"
              >
                {shelfLifeOptions.map((months) => (
                  <option key={months} value={months}>
                    {months} 个月
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              开封日期 *
            </label>
            <input
              type="date"
              value={formData.openDate}
              onChange={(e) => handleChange('openDate', e.target.value)}
              max={getTodayString()}
              className={`w-full px-4 py-3 rounded-input border-2 border-gray-200 focus:border-primary focus:shadow-input transition-all duration-300 outline-none ${
                errors.openDate ? 'border-warning' : ''
              }`}
            />
            {errors.openDate && <p className="mt-1 text-sm text-warning">{errors.openDate}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 active:scale-95 transition-all duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {initialData ? '保存修改' : '添加产品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
