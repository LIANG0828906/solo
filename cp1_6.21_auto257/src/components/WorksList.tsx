import { useMemo } from 'react';
import type { Work } from '../types';

interface WorksListProps {
  works: Work[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  searchKeyword: string;
  onSearchChange: (kw: string) => void;
}

export default function WorksList({
  works,
  selectedId,
  onSelect,
  onCreateNew,
  searchKeyword,
  onSearchChange,
}: WorksListProps) {
  const mainImages = useMemo(() => {
    const map: Record<string, string> = {};
    works.forEach((w) => {
      const img = w.images?.[0];
      if (img) map[w.id] = img.url;
    });
    return map;
  }, [works]);

  return (
    <div className="h-full flex flex-col bg-[#0F172A]">
      <div className="px-5 py-4 flex flex-col gap-3 border-b border-[#1E293B]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#F1F5F9]">
            作品列表
            <span className="ml-2 text-xs text-[#94A3B8] font-normal">
              共 {works.length} 件
            </span>
          </h2>
          <button
            type="button"
            className="btn-primary !px-3 !py-1.5 text-sm flex items-center gap-1"
            onClick={onCreateNew}
          >
            <span className="text-lg leading-none">+</span>
            新建
          </button>
        </div>
        <input
          type="text"
          className="input-field"
          placeholder="搜索作品名称或分类..."
          value={searchKeyword}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar px-5 py-4">
        {works.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#64748B] text-sm fade-in">
            <div className="text-4xl mb-3 opacity-50">🎨</div>
            <div>{searchKeyword ? '未找到匹配的作品' : '暂无作品，点击右上角新建'}</div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 justify-center">
            {works.map((w) => {
              const mainImg = mainImages[w.id];
              const isActive = w.id === selectedId;
              return (
                <div
                  key={w.id}
                  onClick={() => onSelect(w.id)}
                  className={`card-hover cursor-pointer relative overflow-hidden rounded-xl flex flex-col ${
                    isActive
                      ? 'ring-2 ring-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/20'
                      : ''
                  }`}
                  style={{
                    width: 280,
                    height: 360,
                    background: '#1E293B',
                    flexShrink: 0,
                  }}
                >
                  <div
                    className="w-full relative overflow-hidden"
                    style={{ height: 240, background: '#334155' }}
                  >
                    {mainImg ? (
                      <img
                        src={mainImg}
                        alt={w.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#64748B]">
                        <div className="text-5xl opacity-40">🖼️</div>
                      </div>
                    )}
                    {w.category && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/50 text-xs text-[#E2E8F0] backdrop-blur-sm">
                        {w.category}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#F1F5F9] truncate mb-1">
                        {w.name || '未命名作品'}
                      </div>
                      {w.remark && (
                        <div className="text-xs text-[#94A3B8] line-clamp-2">
                          {w.remark}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="mono-font text-[#10B981] text-lg font-semibold">
                        ¥{Number(w.price || 0).toFixed(0)}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        {w.materials?.length || 0} 项物料
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
