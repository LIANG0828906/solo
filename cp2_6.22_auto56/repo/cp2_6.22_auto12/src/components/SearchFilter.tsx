import { Search, Calendar, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTripStore } from '../store/useTripStore';
import { useDebounce } from '../hooks/useDebounce';

export const SearchFilter = () => {
  const { filters, setFilters } = useTripStore();
  const [localKeyword, setLocalKeyword] = useState(filters.keyword);
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  const debouncedKeyword = useDebounce(localKeyword, 300);
  
  useEffect(() => {
    setFilters({ keyword: debouncedKeyword });
  }, [debouncedKeyword, setFilters]);
  
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalKeyword(e.target.value);
    if (debouncedKeyword) {
      useTripStore.getState().setHighlightedTrip(null);
    }
  };
  
  const handleClearFilters = () => {
    setLocalKeyword('');
    setFilters({ keyword: '', startDate: undefined, endDate: undefined });
  };
  
  const hasFilters = filters.keyword || filters.startDate || filters.endDate;
  
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 mb-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
          <input
            type="text"
            placeholder="搜索目的地..."
            value={localKeyword}
            onChange={handleKeywordChange}
            className="input-field pl-12 pr-10"
          />
          {localKeyword && (
            <button
              onClick={() => setLocalKeyword('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-warm-100 text-warm-400 hover:text-warm-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`btn-secondary flex items-center gap-2 ${
              filters.startDate || filters.endDate ? 'bg-primary-50' : ''
            }`}
          >
            <Calendar className="w-4 h-4" />
            日期筛选
          </button>
          
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="btn-ghost flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              清除
            </button>
          )}
        </div>
      </div>
      
      {showDateFilter && (
        <div className="mt-4 pt-4 border-t border-warm-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          <div>
            <label className="input-label">开始日期</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ startDate: e.target.value || undefined })}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">结束日期</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ endDate: e.target.value || undefined })}
              className="input-field"
            />
          </div>
        </div>
      )}
    </div>
  );
};
