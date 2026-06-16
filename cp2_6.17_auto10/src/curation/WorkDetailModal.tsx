import { useEffect } from 'react';
import { X, Edit } from 'lucide-react';
import { TagChip } from '@/components/TagChip';
import type { Work } from '@/types';

interface WorkDetailModalProps {
  work: Work;
  onClose: () => void;
  onEdit: () => void;
}

export function WorkDetailModal({ work, onClose, onEdit }: WorkDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#1A1A2E] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">{work.title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Edit className="h-4 w-4" />
              编辑
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-1/2">
              <div className="aspect-square w-full bg-[#2D2D44]">
                <img 
                  src={work.cover} 
                  alt={work.title} 
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex-1 p-6 lg:w-1/2">
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-gray-400">情绪标签</h3>
                <div className="flex flex-wrap gap-2">
                  {work.tags.map((tag) => (
                    <TagChip key={tag} tag={tag} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-gray-400">幕后故事</h3>
                <div className="rounded-lg bg-[#2D2D44] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                    {work.story || '暂无幕后故事'}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  创建时间：{new Date(work.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
