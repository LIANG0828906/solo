import React from 'react';
import { FilterOptions, BREEDS, PERSONALITY_TAGS } from '@/types';
import { X, SlidersHorizontal } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ageRanges: { label: string; value: [number, number] }[] = [
  { label: '幼年 (0-1岁)', value: [0, 11] },
  { label: '青年 (1-3岁)', value: [12, 35] },
  { label: '成年 (3-7岁)', value: [36, 83] },
  { label: '老年 (7岁以上)', value: [84, 300] },
];

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  isOpen,
  onClose,
}) => {
  const toggleBreed = (breed: string) => {
    const exists = filters.breeds.includes(breed);
    onChange({
      ...filters,
      breeds: exists ? filters.breeds.filter((b) => b !== breed) : [...filters.breeds, breed],
    });
  };

  const toggleTag = (tag: string) => {
    const exists = filters.personalityTags.includes(tag);
    onChange({
      ...filters,
      personalityTags: exists
        ? filters.personalityTags.filter((t) => t !== tag)
        : [...filters.personalityTags, tag],
    });
  };

  const toggleAgeRange = (range: [number, number]) => {
    const isActive =
      filters.ageRange &&
      filters.ageRange[0] === range[0] &&
      filters.ageRange[1] === range[1];
    onChange({
      ...filters,
      ageRange: isActive ? null : range,
    });
  };

  const clearAll = () => {
    onChange({ breeds: [], ageRange: null, personalityTags: [] });
  };

  const activeCount =
    filters.breeds.length +
    filters.personalityTags.length +
    (filters.ageRange ? 1 : 0);

  const panelContent = (
    <div className="p-5 space-y-6">
      <div className="flex items-center justify-between lg:hidden">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={18} />
          筛选条件
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <X size={18} />
        </button>
      </div>

      <div className="hidden lg:flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={18} />
          筛选条件
        </h3>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <X size={14} />
            清除全部
          </button>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">品种</h4>
        <div className="flex flex-wrap gap-2">
          {BREEDS.map((breed) => (
            <button
              key={breed}
              onClick={() => toggleBreed(breed)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                filters.breeds.includes(breed)
                  ? 'bg-green-500 text-white border-green-500 shadow-sm scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600'
              }`}
            >
              {breed}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">年龄</h4>
        <div className="flex flex-wrap gap-2">
          {ageRanges.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => toggleAgeRange(value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                filters.ageRange &&
                filters.ageRange[0] === value[0] &&
                filters.ageRange[1] === value[1]
                  ? 'bg-green-500 text-white border-green-500 shadow-sm scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">性格标签</h4>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                filters.personalityTags.includes(tag)
                  ? 'bg-green-500 text-white border-green-500 shadow-sm scale-105'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <div className="pt-4 border-t border-gray-100 lg:hidden">
          <button
            onClick={clearAll}
            className="w-full py-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            清除全部筛选条件 ({activeCount})
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:block w-72 flex-shrink-0 h-[calc(100vh-64px)] sticky top-16
          bg-white/80 backdrop-blur-sm border-r border-green-50
          overflow-y-auto`}
      >
        {panelContent}
      </aside>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={onClose}
          />
          <aside
            className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50
              shadow-2xl overflow-y-auto lg:hidden animate-in slide-in-from-left"
          >
            {panelContent}
          </aside>
        </>
      )}
    </>
  );
};

export default FilterPanel;
