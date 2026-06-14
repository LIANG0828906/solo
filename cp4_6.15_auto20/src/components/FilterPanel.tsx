import React, { useState, useEffect } from 'react';
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

const FilterTag: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => {
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    if (active) {
      setAnimateKey((k) => k + 1);
    }
  }, [active]);

  return (
    <button
      onClick={onClick}
      key={animateKey}
      className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ease-out ${
        active
          ? 'bg-green-500 text-white border-green-500 shadow-sm tag-pop ring-2 ring-green-200'
          : 'bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600 hover:bg-green-50/50'
      }`}
    >
      {label}
    </button>
  );
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  isOpen,
  onClose,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  const toggleBreed = (breed: string) => {
    const exists = filters.breeds.includes(breed);
    onChange({
      ...filters,
      breeds: exists
        ? filters.breeds.filter((b) => b !== breed)
        : [...filters.breeds, breed],
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
    <div className="p-5 space-y-6 h-full overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <SlidersHorizontal size={18} />
          筛选条件
          {activeCount > 0 && (
            <span className="ml-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {activeCount}
            </span>
          )}
        </h3>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors lg:hidden"
        >
          <X size={18} />
        </button>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="hidden lg:flex text-xs text-gray-500 hover:text-red-500 items-center gap-1 transition-colors"
          >
            <X size={14} />
            清除全部
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-green-400 rounded-full" />
          品种
        </h4>
        <div className="flex flex-wrap gap-2">
          {BREEDS.map((breed) => (
            <FilterTag
              key={breed}
              label={breed}
              active={filters.breeds.includes(breed)}
              onClick={() => toggleBreed(breed)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-green-400 rounded-full" />
          年龄
        </h4>
        <div className="flex flex-wrap gap-2">
          {ageRanges.map(({ label, value }) => (
            <FilterTag
              key={label}
              label={label}
              active={
                !!filters.ageRange &&
                filters.ageRange[0] === value[0] &&
                filters.ageRange[1] === value[1]
              }
              onClick={() => toggleAgeRange(value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-green-400 rounded-full" />
          性格标签
        </h4>
        <div className="flex flex-wrap gap-2">
          {PERSONALITY_TAGS.map((tag) => (
            <FilterTag
              key={tag}
              label={tag}
              active={filters.personalityTags.includes(tag)}
              onClick={() => toggleTag(tag)}
            />
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <div className="pt-4 border-t border-gray-100 lg:hidden sticky bottom-0 bg-white -mx-5 px-5 pb-2 mt-auto">
          <button
            onClick={clearAll}
            className="w-full py-2.5 text-sm text-gray-500 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50 border border-gray-200"
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
        className="hidden lg:flex w-72 flex-shrink-0 h-[calc(100vh-64px)] sticky top-16
          bg-white/80 backdrop-blur-sm border-r border-green-50
          overflow-hidden flex-col"
      >
        {panelContent}
      </aside>

      {(isOpen || isClosing) && (
        <>
          <div
            onClick={handleClose}
            className={`fixed inset-0 z-40 lg:hidden ${
              isClosing ? 'fade-out' : 'fade-in'
            }`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
          />
          <aside
            className={`fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50
              shadow-2xl flex flex-col lg:hidden ${
                isClosing ? 'slide-out-to-left' : 'slide-in-from-left'
              }`}
          >
            {panelContent}
          </aside>
        </>
      )}
    </>
  );
};

export default FilterPanel;
