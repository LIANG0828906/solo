import { useState } from 'react';
import { Plus } from 'lucide-react';
import { WorkCard } from './WorkCard';
import { WorkEditor } from './WorkEditor';
import { WorkDetailModal } from './WorkDetailModal';
import { useStore } from '@/store/useStore';
import type { Work } from '@/types';

export function Curator() {
  const works = useStore((state) => state.works);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | undefined>();
  const [detailWork, setDetailWork] = useState<Work | null>(null);

  const handleCardClick = (work: Work) => {
    setDetailWork(work);
  };

  const handleEdit = (work: Work) => {
    setDetailWork(null);
    setEditingWork(work);
    setShowEditor(true);
  };

  const handleAddNew = () => {
    setEditingWork(undefined);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingWork(undefined);
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">策展画廊</h1>
            <p className="mt-1 text-sm text-gray-400">
              共 {works.length} 件作品
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 rounded-xl bg-[#FF6B6B] px-5 py-3 font-medium text-white shadow-lg shadow-[#FF6B6B]/20 transition-all hover:bg-[#ff5555] hover:shadow-[#FF6B6B]/30"
          >
            <Plus className="h-5 w-5" />
            添加作品
          </button>
        </div>

        {works.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#2D2D44]">
              <Plus className="h-10 w-10 text-gray-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">还没有作品</h3>
            <p className="mb-6 text-sm text-gray-400">
              点击上方按钮，添加你的第一件艺术作品
            </p>
            <button
              onClick={handleAddNew}
              className="rounded-lg bg-[#FF6B6B] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff5555]"
            >
              立即添加
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {works.map((work, index) => (
              <WorkCard
                key={work.id}
                work={work}
                index={index}
                onClick={() => handleCardClick(work)}
              />
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <WorkEditor work={editingWork} onClose={handleCloseEditor} />
      )}

      {detailWork && (
        <WorkDetailModal
          work={detailWork}
          onClose={() => setDetailWork(null)}
          onEdit={() => handleEdit(detailWork)}
        />
      )}
    </div>
  );
}
