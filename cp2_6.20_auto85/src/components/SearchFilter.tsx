import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { markerIconMap } from '@/utils/markerIcons';
import { cn } from '@/lib/utils';
import type { FilterType, MarkerIconKey } from '@/types';

const filterButtons: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'harvest', label: '采摘' },
  { key: 'festival', label: '节庆' },
  { key: 'food', label: '美食' },
];

export default function SearchFilter() {
  const {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    getSearchResults,
    setSelectedMarker,
    toggleDetailPanel,
  } = useAppStore();

  const [inputValue, setInputValue] = useState(searchQuery);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 200);
    return () => clearTimeout(timer);
  }, [inputValue, setSearchQuery]);

  const searchResults = useMemo(() => {
    return getSearchResults().slice(0, 5);
  }, [getSearchResults]);

  const handleResultClick = (id: string, type: 'specialty' | 'activity') => {
    setSelectedMarker({ id, type });
    toggleDetailPanel(true);
    setShowResults(false);
  };

  return (
    <>
      <div
        className="absolute"
        style={{
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '400px',
          maxWidth: 'calc(100% - 32px)',
          zIndex: 1000,
        }}
      >
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="搜索特产或活动名称"
            className={cn(
              'w-full outline-none transition-all duration-300 glass-effect',
              'border-2 border-transparent focus:border-[#ff6b35]',
              'rounded-xl text-sm placeholder:text-gray-400'
            )}
            style={{
              padding: '12px 16px 12px 44px',
            }}
          />
          {showResults && searchResults.length > 0 && (
            <div
              className="absolute left-0 right-0 bg-white rounded-xl shadow-card-hover overflow-y-auto custom-scrollbar"
              style={{
                top: 'calc(100% + 8px)',
                maxHeight: '300px',
              }}
            >
              {searchResults.map((result) => {
                const iconConfig = markerIconMap[result.itemType as MarkerIconKey];
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onMouseDown={() => handleResultClick(result.id, result.type)}
                  >
                    <span className="text-2xl">{iconConfig?.icon || '📍'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">
                        {result.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {iconConfig?.label || result.itemType}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div
        className="absolute flex gap-2"
        style={{
          top: '16px',
          right: '16px',
          zIndex: 1000,
        }}
      >
        {filterButtons.map((button) => {
          const isActive = filterType === button.key;
          return (
            <button
              key={button.key}
              onClick={() => setFilterType(button.key)}
              className={cn(
                'rounded-full text-sm transition-all duration-300',
                'hover:-translate-y-px',
                isActive
                  ? 'bg-brand-orange text-white border-none'
                  : 'bg-white/80 border border-gray-300 text-gray-700'
              )}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
              }}
            >
              {button.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
