import React, { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { Slide } from '@/types';
import { useStoryStore } from '@/store/useStoryStore';
import ChartPreview from './ChartPreview';

interface SlideCardProps {
  slide: Slide;
  index: number;
  isNew?: boolean;
}

const SlideCard: React.FC<SlideCardProps> = ({ slide, index, isNew }) => {
  const { selectedSlideId, selectSlide, removeSlide, reorderSlides, story } = useStoryStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isSelected = selectedSlideId === slide.id;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(fromIndex) && fromIndex !== index) {
      reorderSlides(fromIndex, index);
    }
    setDragOverIndex(null);
  };

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) {
      reorderSlides(index, index - 1);
    }
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (index < story.slides.length - 1) {
      reorderSlides(index, index + 1);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个幻灯片吗？')) {
      removeSlide(slide.id);
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => selectSlide(slide.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        slide-card relative rounded-lg overflow-hidden cursor-pointer
        transition-all duration-300
        ${isSelected ? 'ring-2 ring-[#1A237E]' : 'border border-gray-200'}
        ${isDragging ? 'opacity-50' : ''}
        ${dragOverIndex === index && !isDragging ? 'border-t-4 border-t-primary' : ''}
      `}
      style={{
        animation: isNew ? 'slideCardBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
      }}
    >
      <style>{`
        @keyframes slideCardBounce {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {index + 1}
      </div>

      {(isHovered || isSelected) && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <button
            onClick={handleMoveUp}
            disabled={index === 0}
            className="p-1 bg-white rounded shadow hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={handleMoveDown}
            disabled={index === story.slides.length - 1}
            className="p-1 bg-white rounded shadow hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 bg-white rounded shadow hover:bg-red-50 text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div className="aspect-video bg-white">
        <ChartPreview config={slide.chartConfig} />
      </div>
    </div>
  );
};

export default SlideCard;
