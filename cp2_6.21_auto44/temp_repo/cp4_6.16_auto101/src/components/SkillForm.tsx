import { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SkillCategory } from '../types';
import { SKILL_CATEGORIES } from '../types';

export interface SkillFormData {
  name: string;
  category: SkillCategory;
  description: string;
  tags: string[];
}

export interface SkillFormProps {
  onSubmit: (data: SkillFormData) => void;
  onCancel: () => void;
  initialData?: Partial<SkillFormData>;
  isLoading?: boolean;
}

export default function SkillForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: SkillFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<SkillCategory>(
    initialData?.category || 'programming'
  );
  const [description, setDescription] = useState(
    initialData?.description || ''
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = '技能名称不能为空';
    } else if (name.trim().length > 50) {
      newErrors.name = '技能名称不能超过50个字符';
    }

    if (!description.trim()) {
      newErrors.description = '技能描述不能为空';
    } else if (description.trim().length > 500) {
      newErrors.description = '技能描述不能超过500个字符';
    }

    if (tags.length > 5) {
      newErrors.tags = '标签最多5个';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag) return;

    if (tags.length >= 5) {
      setErrors((prev) => ({ ...prev, tags: '标签最多5个' }));
      return;
    }

    if (tags.includes(trimmedTag)) {
      setErrors((prev) => ({ ...prev, tags: '标签已存在' }));
      return;
    }

    setTags([...tags, trimmedTag]);
    setTagInput('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next.tags;
      return next;
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.tags;
      return next;
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: name.trim(),
        category,
        description: description.trim(),
        tags,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          技能名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入技能名称"
          className={cn(
            'w-full px-4 py-2.5 text-sm',
            'border rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'transition-all duration-200',
            errors.name ? 'border-red-400' : 'border-gray-200'
          )}
          maxLength={50}
        />
        {errors.name && (
          <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          技能类别 <span className="text-red-500">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as SkillCategory)}
          className={cn(
            'w-full px-4 py-2.5 text-sm',
            'border border-gray-200 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'transition-all duration-200',
            'bg-white'
          )}
        >
          {SKILL_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          技能描述 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="请描述你的技能，包括你擅长的领域、教学方式等..."
          rows={4}
          className={cn(
            'w-full px-4 py-2.5 text-sm resize-none',
            'border rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'transition-all duration-200',
            errors.description ? 'border-red-400' : 'border-gray-200'
          )}
          maxLength={500}
        />
        <div className="flex justify-between mt-1.5">
          {errors.description ? (
            <p className="text-xs text-red-500">{errors.description}</p>
          ) : (
            <span></span>
          )}
          <span className="text-xs text-gray-400">
            {description.length}/500
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-1.5">
            <Tag size={14} />
            <span>技能标签</span>
            <span className="text-gray-400 font-normal">（最多5个）</span>
          </div>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="输入标签后按回车添加"
            className={cn(
              'flex-1 px-4 py-2 text-sm',
              'border border-gray-200 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
              'transition-all duration-200'
            )}
            disabled={tags.length >= 5}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={tags.length >= 5 || !tagInput.trim()}
            className={cn(
              'flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg',
              'transition-all duration-200',
              tags.length >= 5 || !tagInput.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
            )}
          >
            <Plus size={16} />
            添加
          </button>
        </div>
        {errors.tags && (
          <p className="text-xs text-red-500 mb-2">{errors.tags}</p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 text-blue-600 rounded-md"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'px-5 py-2.5 text-sm font-medium text-gray-600',
            'bg-gray-100 hover:bg-gray-200 rounded-lg',
            'transition-colors duration-200'
          )}
          disabled={isLoading}
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'px-5 py-2.5 text-sm font-medium text-white',
            'bg-blue-500 hover:bg-blue-600 rounded-lg',
            'transition-all duration-200',
            'active:scale-95',
            isLoading && 'opacity-60 cursor-not-allowed'
          )}
        >
          {isLoading ? '发布中...' : '发布技能'}
        </button>
      </div>
    </form>
  );
}
