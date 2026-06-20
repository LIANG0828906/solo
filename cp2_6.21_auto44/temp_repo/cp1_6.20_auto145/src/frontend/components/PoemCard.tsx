import React from 'react';
import type { Poem, ImageMatchResult } from '@/shared/types';
import ToneMarker from './ToneMarker.js';

interface PoemCardProps {
  poem: Poem & { thumbnail: ImageMatchResult };
  onClick: () => void;
  isSelected: boolean;
}

const PoemCard: React.FC<PoemCardProps> = ({ poem, onClick, isSelected }) => {
  const previewLines = poem.content.slice(0, 2);

  return (
    <div
      onClick={onClick}
      className={`card-hover bg-white rounded-lg shadow-md cursor-pointer overflow-hidden fade-in
        ${isSelected ? 'ring-2 ring-[#8b6f47]' : ''}`}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
    >
      <div className="flex h-full">
        <div className="relative w-[150px] h-[100px] flex-shrink-0 overflow-hidden">
          <img
            src={poem.thumbnail.imageUrl}
            alt={poem.title}
            className="w-full h-full object-cover"
            style={{ background: poem.thumbnail.gradient }}
          />
          <div
            className="absolute bottom-1 right-2 text-[10px] font-song italic opacity-50"
            style={{ color: '#333' }}
          >
            {poem.thumbnail.watermarkText}
          </div>
        </div>
        
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="font-fangsong text-base font-semibold text-[#2c2c2c] truncate mb-1">
              {poem.title}
            </h3>
            <p className="text-xs text-[#5c5c5c] mb-2">
              [{poem.dynasty}] {poem.author}
            </p>
            <div className="text-sm text-[#2c2c2c] leading-relaxed font-kaiti line-clamp-2">
              {previewLines.map((line, idx) => (
                <span key={idx} className="block truncate">
                  {line}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1 flex-wrap">
              {poem.style.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs rounded-full bg-[#d4c9b8] text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
            {poem.tones[0] && (
              <ToneMarker tones={poem.tones[0]} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PoemCard);
