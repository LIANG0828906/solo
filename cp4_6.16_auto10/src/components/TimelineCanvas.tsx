import React, { useState } from 'react';
import { Play, Download, Share2, Check } from 'lucide-react';
import { useStoryStore } from '@/store/useStoryStore';
import type { ChartType } from '@/types';
import SlideCard from './SlideCard';

const TimelineCanvas: React.FC = () => {
  const { story, addSlide, setPlayMode, exportHTML, generateShareLink } = useStoryStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [newSlideId, setNewSlideId] = useState<string | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const chartType = e.dataTransfer.getData('chartType') as ChartType;
    if (chartType) {
      const currentLength = story.slides.length;
      addSlide(chartType);
      setTimeout(() => {
        const state = useStoryStore.getState();
        const newId = state.story.slides[currentLength]?.id;
        if (newId) {
          setNewSlideId(newId);
          setTimeout(() => setNewSlideId(null), 600);
        }
      }, 10);
    }
  };

  const handlePlay = () => {
    setPlayMode(true);
  };

  const handleExport = () => {
    const html = exportHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title || '数据故事'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const link = generateShareLink();
    setShareLink(link);
    navigator.clipboard.writeText(link).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    }).catch(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 5000);
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{story.title}</h1>
          <p className="text-sm text-gray-500">{story.slides.length} 张幻灯片</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Share2 size={18} />
            分享
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download size={18} />
            导出
          </button>
          <button
            onClick={handlePlay}
            disabled={story.slides.length === 0}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[#1A237E] rounded-lg hover:bg-[#3949AB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play size={18} />
            播放
          </button>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 p-6 overflow-y-auto transition-all duration-300 ${isDragOver ? 'bg-[#1A237E]/5' : ''}`}
      >
        <div
          className={`grid gap-6 transition-all duration-300 ${isDragOver ? 'scale-[1.01]' : ''}`}
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {story.slides.map((slide, index) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              index={index}
              isNew={slide.id === newSlideId}
            />
          ))}
        </div>

        {story.slides.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <p className="text-lg mb-2">暂无幻灯片</p>
          <p className="text-sm">从左侧拖拽图表组件到此处创建幻灯片</p>
        </div>
        )}

        {isDragOver && (
          <div
            className="fixed inset-0 pointer-events-none flex items-center justify-center"
            style={{
              background: 'rgba(26, 35, 126, 0.1)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <div
              className="px-8 py-4 rounded-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                animation: 'dropBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite alternate',
              }}
            >
              <p className="text-[#1A237E] font-semibold text-lg">释放以创建新幻灯片</p>
            </div>
            <style>{`
              @keyframes dropBounce {
                from { transform: scale(1); }
                to { transform: scale(1.05); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineCanvas;
