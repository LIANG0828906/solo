import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { WorkCard } from '@/curation/WorkCard';
import { WorkDetailModal } from '@/curation/WorkDetailModal';
import { WorkEditor } from '@/curation/WorkEditor';
import { TagChip } from '@/components/TagChip';
import { useStore } from '@/store/useStore';
import type { Work } from '@/types';

export function FilteredGallery() {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const works = useStore((state) => state.works);
  const selectedTag = useStore((state) => state.selectedTag);
  const setSelectedTag = useStore((state) => state.setSelectedTag);
  
  const [detailWork, setDetailWork] = useState<Work | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | undefined>();

  const decodedTag = tag ? decodeURIComponent(tag) : '';

  useEffect(() => {
    if (decodedTag && decodedTag !== selectedTag) {
      setSelectedTag(decodedTag);
    }
  }, [decodedTag, selectedTag, setSelectedTag]);

  const filteredWorks = works.filter((w) => w.tags.includes(decodedTag));

  const handleCardClick = (work: Work) => {
    setDetailWork(work);
  };

  const handleEdit = (work: Work) => {
    setDetailWork(null);
    setEditingWork(work);
    setShowEditor(true);
  };

  const handleBack = () => {
    navigate('/emotion');
  };

  const leftColumn = filteredWorks.filter((_, i) => i % 2 === 0);
  const rightColumn = filteredWorks.filter((_, i) => i % 2 === 1);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="mb-4 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回情绪网络
          </button>
          
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-[#FF6B6B]" />
            <h1 className="text-2xl font-bold text-white">筛选结果</h1>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-gray-400">当前标签：</span>
            <TagChip tag={decodedTag} selected />
            <span className="text-sm text-gray-400">
              共 {filteredWorks.length} 件作品
            </span>
          </div>
        </div>

        {filteredWorks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#2D2D44]">
              <Filter className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">没有匹配的作品</h3>
            <p className="text-sm text-gray-400">
              没有找到包含「{decodedTag}」标签的作品
            </p>
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="flex-1 flex flex-col gap-6">
              {leftColumn.map((work, idx) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  index={idx * 2}
                  highlighted
                  onClick={() => handleCardClick(work)}
                />
              ))}
            </div>
            <div className="flex-1 flex flex-col gap-6">
              {rightColumn.map((work, idx) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  index={idx * 2 + 1}
                  highlighted
                  onClick={() => handleCardClick(work)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showEditor && (
        <WorkEditor 
          work={editingWork} 
          onClose={() => {
            setShowEditor(false);
            setEditingWork(undefined);
          }} 
        />
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
