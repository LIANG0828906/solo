import React from 'react';
import { X } from 'lucide-react';
import type { Poem, ImageMatchResult } from '@/shared/types';
import ToneMarker from './ToneMarker.js';

interface DetailPanelProps {
  poem: Poem | null;
  image: ImageMatchResult | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ poem, image, isOpen, onClose }) => {
  if (!poem || !image) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div
        className={`fixed top-0 right-0 h-full w-[50%] min-w-[500px] bg-[#f5f0e8] bg-paper-texture z-50
          transition-transform duration-[300ms] ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ willChange: 'transform' }}
      >
        <div className="h-full overflow-y-auto p-8">
          <button
            onClick={onClose}
            className="btn-click absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white shadow-md"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="关闭"
          >
            <X size={20} className="text-[#2c2c2c]" />
          </button>

          <div className="mb-6">
            <h1 className="font-fangsong text-3xl font-bold text-[#2c2c2c] mb-2">
              {poem.title}
            </h1>
            <p className="text-lg text-[#5c5c5c] font-kaiti">
              [{poem.dynasty}] {poem.author}
            </p>
          </div>

          <div className="relative w-full h-[300px] rounded-lg overflow-hidden mb-6 shadow-lg">
            <img
              src={image.imageUrl}
              alt={poem.title}
              className="w-full h-full object-cover"
              style={{ background: image.gradient }}
            />
            <div
              className="absolute bottom-4 right-6 text-lg font-song italic opacity-50"
              style={{ color: '#333' }}
            >
              {poem.content[0]}
            </div>
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/80 text-xs font-medium text-[#8b6f47]">
              {image.category}
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-6 mb-6 shadow-sm">
            <h2 className="font-fangsong text-lg font-semibold text-[#2c2c2c] mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#8b6f47] rounded"></span>
              诗词原文
            </h2>
            <div className="space-y-4">
              {poem.content.map((line, lineIndex) => (
                <div key={lineIndex} className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-xl text-[#2c2c2c] font-kaiti leading-loose tracking-wider">
                      {line}
                      {poem.rhymePositions.includes(lineIndex) && (
                        <span className="rhyme-mark">◆</span>
                      )}
                    </p>
                    {poem.tones[lineIndex] && (
                      <ToneMarker tones={poem.tones[lineIndex]} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-6 mb-6 shadow-sm">
            <h2 className="font-fangsong text-lg font-semibold text-[#2c2c2c] mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#8b6f47] rounded"></span>
              韵律分析
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="tone-dot tone-level"></span>
                  <span className="text-[#5c5c5c]">平声</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tone-dot tone-oblique"></span>
                  <span className="text-[#5c5c5c]">仄声</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rhyme-mark">◆</span>
                  <span className="text-[#5c5c5c]">押韵</span>
                </div>
              </div>
              <div className="text-sm text-[#5c5c5c]">
                <p>共 {poem.content.length} 句，{poem.rhymePositions.length} 处押韵</p>
              </div>
            </div>
          </div>

          <div className="bg-white/60 rounded-lg p-6 shadow-sm">
            <h2 className="font-fangsong text-lg font-semibold text-[#2c2c2c] mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#8b6f47] rounded"></span>
              风格标签
            </h2>
            <div className="flex flex-wrap gap-2">
              {poem.style.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#8b6f47] text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#d4c9b8]">
              <h3 className="text-sm font-medium text-[#5c5c5c] mb-2">意象关键词</h3>
              <div className="flex flex-wrap gap-2">
                {poem.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs bg-[#d4c9b8] text-white"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(DetailPanel);
