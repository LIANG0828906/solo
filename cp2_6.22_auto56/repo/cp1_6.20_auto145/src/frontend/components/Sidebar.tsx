import React from 'react';
import { SortAsc, SortDesc } from 'lucide-react';
import type { StyleCategory } from '@/shared/types';

interface SidebarProps {
  selectedStyle: StyleCategory;
  onStyleChange: (style: StyleCategory) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
}

const styles: StyleCategory[] = ['全部', '豪放', '婉约', '山水', '边塞', '咏物', '田园'];

const Sidebar: React.FC<SidebarProps> = ({
  selectedStyle,
  onStyleChange,
  sortOrder,
  onSortOrderChange,
}) => {
  return (
    <aside
      className="w-[15%] min-w-[180px] h-full bg-[#e8e0d0] sidebar-line p-6 flex flex-col gap-6 overflow-y-auto"
    >
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-[#2c2c2c] mb-4 font-fangsong flex items-center gap-2">
          <span className="w-1 h-5 bg-[#8b6f47] rounded"></span>
          风格筛选
        </h2>
        <div className="flex flex-col gap-3">
          {styles.map((style) => (
            <button
              key={style}
              onClick={() => onStyleChange(style)}
              className={`btn-click px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left
                ${selectedStyle === style
                  ? 'bg-[#8b6f47] text-white shadow-md'
                  : 'bg-[#d4c9b8] text-white hover:bg-[#c4b8a8]'
                }`}
              style={{ minHeight: '40px', minWidth: '44px' }}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[#d4c9b8] pt-6">
        <h2 className="text-lg font-semibold text-[#2c2c2c] mb-4 font-fangsong flex items-center gap-2">
          <span className="w-1 h-5 bg-[#8b6f47] rounded"></span>
          朝代排序
        </h2>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onSortOrderChange('asc')}
            className={`btn-click flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${sortOrder === 'asc'
                ? 'bg-[#8b6f47] text-white shadow-md'
                : 'bg-[#d4c9b8] text-white hover:bg-[#c4b8a8]'
              }`}
            style={{ minHeight: '40px', minWidth: '44px' }}
          >
            <SortAsc size={18} />
            由古至今
          </button>
          <button
            onClick={() => onSortOrderChange('desc')}
            className={`btn-click flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${sortOrder === 'desc'
                ? 'bg-[#8b6f47] text-white shadow-md'
                : 'bg-[#d4c9b8] text-white hover:bg-[#c4b8a8]'
              }`}
            style={{ minHeight: '40px', minWidth: '44px' }}
          >
            <SortDesc size={18} />
            由今至古
          </button>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-[#d4c9b8]">
        <div className="text-xs text-[#5c5c5c] text-center">
          <p className="font-fangsong">古诗词鉴赏</p>
          <p className="mt-1 opacity-70">意境配图生成</p>
        </div>
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);
