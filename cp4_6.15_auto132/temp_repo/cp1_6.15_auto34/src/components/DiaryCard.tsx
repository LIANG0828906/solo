import React from 'react';
import type { Diary } from '@/types';
import { formatDate } from '@/utils/dateUtils';

interface DiaryCardProps {
  diary: Diary;
  index?: number;
  onClick: (diary: Diary) => void;
}

export const DiaryCard: React.FC<DiaryCardProps> = ({ diary, index = 0, onClick }) => {
  const animationDelay = `${index * 0.15}s`;
  
  const getSummary = (content: string) => {
    const text = content.replace(/#/g, '').replace(/---/g, '').trim();
    return text.length > 60 ? text.slice(0, 60) + '...' : text;
  };

  return (
    <div
      className="group cursor-pointer hover-lift rounded-2xl overflow-hidden glass-card opacity-0"
      style={{
        animation: `fadeInUp 0.6s ease-out ${animationDelay} forwards`,
        willChange: 'transform, opacity',
      }}
      onClick={() => onClick(diary)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={diary.images[0]}
          alt={diary.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <span className="text-3xl drop-shadow-lg">{diary.mood}</span>
          <span className="text-xs text-white/90 font-medium drop-shadow">
            {formatDate(diary.createdAt)}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-sand-800 mb-2 line-clamp-2 leading-tight">
          {diary.title}
        </h3>
        <p className="text-sm text-sand-600 line-clamp-2 leading-relaxed">
          {getSummary(diary.content)}
        </p>
        <div className="mt-3 pt-3 border-t border-sand-200/50 flex items-center gap-2">
          <span className="text-xs text-sand-500">📍</span>
          <span className="text-xs text-sand-500 truncate">
            {diary.locationName}
          </span>
        </div>
      </div>
    </div>
  );
};
