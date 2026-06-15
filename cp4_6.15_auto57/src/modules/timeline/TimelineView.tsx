import { useState, useRef, useEffect } from 'react';
import { Circle } from 'lucide-react';
import type { Material } from '@/utils/helpers';

interface TimelineViewProps {
  materials: Material[];
  onSelectMaterial: (id: string) => void;
  selectedId: string | null;
  readOnly?: boolean;
}

export default function TimelineView({ materials, onSelectMaterial, selectedId, readOnly }: TimelineViewProps) {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isVertical, setIsVertical] = useState(false);

  useEffect(() => {
    const check = () => setIsVertical(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleNodeClick = (id: string) => {
    onSelectMaterial(id);
    setActiveNote(activeNote === id ? null : id);
  };

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Circle size={40} className="mb-3 opacity-30" />
        <p className="text-sm">添加素材后将在此展示时间轴</p>
      </div>
    );
  }

  const gradientColors = [
    '#667eea', '#7c6fe0', '#9160d5', '#a650ca', '#bb41bf',
    '#d035b3', '#e029a0', '#f02090', '#f5576c', '#fa709a',
  ];

  if (isVertical) {
    return (
      <div className="relative px-6 py-4" ref={scrollRef}>
        <div className="relative ml-6">
          <div
            className="absolute left-0 top-0 bottom-0 w-0.5"
            style={{
              backgroundImage: `linear-gradient(to bottom, ${gradientColors.join(', ')})`,
            }}
          />
          {materials.map((mat, idx) => {
            const color = gradientColors[idx % gradientColors.length];
            const isSelected = selectedId === mat.id;
            return (
              <div key={mat.id} className="relative flex items-start mb-8 last:mb-0">
                <div
                  className="absolute left-0 -translate-x-1/2 z-10"
                  style={{ top: '20px' }}
                >
                  <button
                    onClick={() => handleNodeClick(mat.id)}
                    className={`relative flex items-center justify-center transition-all duration-300 ${
                      isSelected ? 'scale-125' : 'hover:scale-110'
                    }`}
                  >
                    {isSelected && (
                      <span
                        className="absolute w-8 h-8 rounded-full animate-ping opacity-40"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    <span
                      className="w-4 h-4 rounded-full border-2 border-white/60 shadow-lg"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                </div>
                <div className="ml-8 w-full">
                  <div
                    className={`rounded-xl overflow-hidden bg-[#1a1a2e] shadow-lg transition-all duration-300 cursor-pointer ${
                      isSelected ? 'ring-2 ring-purple-400/60 shadow-xl' : 'hover:-translate-y-1'
                    }`}
                    onClick={() => handleNodeClick(mat.id)}
                  >
                    <img src={mat.imageUrl} alt="" className="w-full h-32 object-cover" />
                    {mat.note && (
                      <div className="px-3 py-2">
                        <p className="text-xs text-gray-400">{mat.note}</p>
                      </div>
                    )}
                  </div>
                  {activeNote === mat.id && mat.note && (
                    <div className="mt-2 p-3 rounded-lg bg-[#1a1a2e]/90 border border-white/10 animate-slideUp text-sm text-gray-300">
                      {mat.note}
                    </div>
                  )}
                </div>
                {idx < materials.length - 1 && (
                  <div
                    className="absolute left-0 border-l-2 border-dashed opacity-30"
                    style={{
                      borderColor: color,
                      top: '28px',
                      bottom: '-32px',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-8 overflow-x-auto" ref={scrollRef}>
      <div className="relative inline-flex items-center min-w-full px-8" style={{ minWidth: `${Math.max(materials.length * 200, 600)}px` }}>
        <div
          className="absolute h-0.5 top-[38px] left-8 right-8"
          style={{
            backgroundImage: `linear-gradient(to right, ${gradientColors.join(', ')})`,
          }}
        />
        {materials.map((mat, idx) => {
          const color = gradientColors[idx % gradientColors.length];
          const isSelected = selectedId === mat.id;
          return (
            <div key={mat.id} className="relative flex flex-col items-center mx-4" style={{ minWidth: '160px' }}>
              <button
                onClick={() => handleNodeClick(mat.id)}
                className={`relative z-10 mb-3 flex items-center justify-center transition-all duration-300 ${
                  isSelected ? 'scale-125' : 'hover:scale-110'
                }`}
              >
                {isSelected && (
                  <span
                    className="absolute w-8 h-8 rounded-full animate-ping opacity-40"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span
                  className="w-4 h-4 rounded-full border-2 border-white/60 shadow-lg"
                  style={{ backgroundColor: color }}
                />
              </button>
              <div
                className={`rounded-xl overflow-hidden bg-[#1a1a2e] shadow-lg transition-all duration-300 cursor-pointer w-40 ${
                  isSelected ? 'ring-2 ring-purple-400/60 shadow-xl -translate-y-1' : 'hover:-translate-y-1'
                }`}
                onClick={() => handleNodeClick(mat.id)}
              >
                <img src={mat.imageUrl} alt="" className="w-full h-24 object-cover" />
                <div className="px-2 py-1">
                  <p className="text-[10px] text-gray-500">#{idx + 1}</p>
                </div>
              </div>
              {activeNote === mat.id && (
                <div className="mt-2 p-3 rounded-lg bg-[#1a1a2e]/90 border border-white/10 animate-slideUp text-xs text-gray-300 max-w-[160px]">
                  {mat.note || '暂无备注'}
                </div>
              )}
              {idx < materials.length - 1 && (
                <div
                  className="absolute border-t-2 border-dashed opacity-30"
                  style={{
                    borderColor: color,
                    top: '38px',
                    left: '50%',
                    width: `calc(100% + 32px)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
