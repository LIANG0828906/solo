import React, { useState, useEffect } from 'react';
import { Work, WorkFormData, WorkCategory } from '../types';

interface WorkFormProps {
  isOpen: boolean;
  work?: Work | null;
  onSubmit: (data: WorkFormData) => void;
  onClose: () => void;
}

const categoryOptions: { value: WorkCategory; label: string }[] = [
  { value: 'article', label: '文章' },
  { value: 'video', label: '视频' },
  { value: 'image', label: '图片' },
];

const initialFormData: WorkFormData = {
  title: '',
  description: '',
  category: 'article',
  coverUrl: '',
};

const WorkForm: React.FC<WorkFormProps> = ({ isOpen, work, onSubmit, onClose }) => {
  const [formData, setFormData] = useState<WorkFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof WorkFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof WorkFormData, boolean>>>({});

  const isEditMode = !!work;

  useEffect(() => {
    if (work) {
      setFormData({
        title: work.title,
        description: work.description,
        category: work.category,
        coverUrl: work.coverUrl,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setTouched({});
  }, [work, isOpen]);

  const validateField = (name: keyof WorkFormData, value: string): string | undefined => {
    switch (name) {
      case 'title':
        if (!value.trim()) return '请输入标题';
        if (value.trim().length < 2) return '标题至少2个字符';
        if (value.trim().length > 50) return '标题不能超过50个字符';
        return undefined;
      case 'description':
        if (!value.trim()) return '请输入描述';
        if (value.trim().length < 10) return '描述至少10个字符';
        return undefined;
      case 'category':
        if (!value) return '请选择分类';
        return undefined;
      case 'coverUrl':
        if (!value.trim()) return '请输入封面图URL';
        try {
          new URL(value);
        } catch {
          return '请输入有效的URL地址';
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (name: keyof WorkFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: keyof WorkFormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof WorkFormData, string>> = {};
    let isValid = true;

    (Object.keys(formData) as (keyof WorkFormData)[]).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({
      title: true,
      description: true,
      category: true,
      coverUrl: true,
    });

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? '编辑作品' : '新增作品'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              placeholder="请输入作品标题"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                errors.title && touched.title
                  ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
                  : 'border-gray-200 focus:ring-indigo-500 focus:border-transparent'
              }`}
            />
            {errors.title && touched.title && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              onBlur={() => handleBlur('description')}
              placeholder="请输入作品描述"
              rows={4}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none ${
                errors.description && touched.description
                  ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
                  : 'border-gray-200 focus:ring-indigo-500 focus:border-transparent'
              }`}
            />
            {errors.description && touched.description && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              onBlur={() => handleBlur('category')}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors appearance-none bg-white ${
                errors.category && touched.category
                  ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
                  : 'border-gray-200 focus:ring-indigo-500 focus:border-transparent'
              }`}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category && touched.category && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.category}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面图URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.coverUrl}
              onChange={(e) => handleChange('coverUrl', e.target.value)}
              onBlur={() => handleBlur('coverUrl')}
              placeholder="https://example.com/image.jpg"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                errors.coverUrl && touched.coverUrl
                  ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
                  : 'border-gray-200 focus:ring-indigo-500 focus:border-transparent'
              }`}
            />
            {errors.coverUrl && touched.coverUrl && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.coverUrl}
              </p>
            )}
            {formData.coverUrl && !errors.coverUrl && (
              <div className="mt-3">
                <img
                  src={formData.coverUrl}
                  alt="封面预览"
                  className="w-full h-32 object-cover rounded-xl border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              {isEditMode ? '保存修改' : '创建作品'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkForm;
