import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Project } from '@/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
  editingProject?: Project | null;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  editingProject,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(editingProject?.title || '');
      setDescription(editingProject?.description || '');
      setTitleError('');
    }
  }, [isOpen, editingProject]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitleError('请输入项目名称');
      return;
    }
    if (trimmedTitle.length > 30) {
      setTitleError('项目名称不能超过30个字');
      return;
    }
    onSubmit(trimmedTitle, description.trim().slice(0, 200));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md flex flex-col"
        style={{
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'modalIn 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {editingProject ? '编辑项目' : '新建项目'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-[0.96]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              项目名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError('');
              }}
              placeholder="请输入项目名称（最多30字）"
              maxLength={30}
              className={`w-full px-4 py-2.5 text-sm rounded-lg border outline-none transition-all ${
                titleError
                  ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                  : 'border-gray-200 focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10'
              }`}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-red-400">{titleError}</span>
              <span className="text-xs text-gray-400">{title.length}/30</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              项目简介
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="简单描述一下这个项目（最多200字）"
              rows={4}
              maxLength={200}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 outline-none transition-all focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 resize-none"
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-400">{description.length}/200</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.96]"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all active:scale-[0.96]"
              style={{ background: '#6366F1' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#4F46E5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#6366F1')}
            >
              {editingProject ? '保存修改' : '创建项目'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
