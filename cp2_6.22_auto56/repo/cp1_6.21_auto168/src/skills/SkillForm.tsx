import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSkills, type Skill } from './SkillContext';

interface SkillFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  '前端开发',
  '后端开发',
  '数据科学',
  '人工智能',
  '设计',
  '语言学习',
  '摄影',
  '理财',
  '音乐',
  '运动健身',
];

export default function SkillForm({ isOpen, onClose }: SkillFormProps) {
  const { addSkill, loadSkills } = useSkills();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: { name?: string; description?: string } = {};
    if (!name.trim()) {
      newErrors.name = '请输入技能名称';
    } else if (name.length > 30) {
      newErrors.name = '技能名称不能超过30字';
    }
    if (!description.trim()) {
      newErrors.description = '请输入技能描述';
    } else if (description.length > 500) {
      newErrors.description = '技能描述不能超过500字';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newSkill: Skill = {
        id: Date.now().toString(),
        name: name.trim(),
        description: description.trim(),
        category,
        instructor: {
          name: '当前用户',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
        },
        rating: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };

      addSkill(newSkill);
      await loadSkills();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center px-4',
        'transition-opacity duration-300 ease',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        className={cn(
          'bg-[#1E293B] rounded-2xl border border-[#334155] w-full max-w-lg',
          'transition-all duration-300 ease',
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#334155]">
          <h2
            className="text-xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            发布新技能
          </h2>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-white transition-colors duration-300 ease"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              技能名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="请输入技能名称"
              className={cn(
                'w-full bg-[#0F172A] text-white rounded-lg px-4 py-2.5',
                'border-2 outline-none transition-all duration-300 ease',
                'placeholder:text-[#64748B]',
                errors.name ? 'border-red-500' : 'border-[#334155] focus:border-[#3B82F6]'
              )}
            />
            <div className="flex justify-between mt-1">
              {errors.name ? (
                <span className="text-red-400 text-xs">{errors.name}</span>
              ) : (
                <span />
              )}
              <span
                className={cn(
                  'text-xs',
                  name.length >= 30 ? 'text-red-400' : 'text-[#64748B]'
                )}
              >
                {name.length}/30
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              技能描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="请详细描述你的技能内容、学习目标、适合人群等"
              className={cn(
                'w-full bg-[#0F172A] text-white rounded-lg px-4 py-2.5 resize-none',
                'border-2 outline-none transition-all duration-300 ease',
                'placeholder:text-[#64748B]',
                errors.description
                  ? 'border-red-500'
                  : 'border-[#334155] focus:border-[#3B82F6]'
              )}
            />
            <div className="flex justify-between mt-1">
              {errors.description ? (
                <span className="text-red-400 text-xs">{errors.description}</span>
              ) : (
                <span />
              )}
              <span
                className={cn(
                  'text-xs',
                  description.length >= 500 ? 'text-red-400' : 'text-[#64748B]'
                )}
              >
                {description.length}/500
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              类别
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(
                'w-full bg-[#0F172A] text-white rounded-lg px-4 py-2.5',
                'border-2 border-[#334155] outline-none transition-all duration-300 ease',
                'focus:border-[#3B82F6] cursor-pointer'
              )}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex-1 bg-[#475569] text-white rounded-lg py-2.5 px-4',
                'text-sm font-medium transition-all duration-300 ease',
                'hover:bg-[#64748B] active:scale-[0.98]'
              )}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'flex-1 bg-[#3B82F6] text-white rounded-lg py-2.5 px-4',
                'text-sm font-medium transition-all duration-300 ease',
                'hover:bg-[#60A5FA] active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? '发布中...' : '发布'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
