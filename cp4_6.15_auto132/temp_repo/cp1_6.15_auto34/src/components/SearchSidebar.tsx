import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Smile, MapPin, RotateCcw } from 'lucide-react';
import type { Diary, SearchFilters } from '@/types';
import { MOOD_OPTIONS } from '@/types';
import { useDiaryStore } from '@/data/DiaryStore';
import { formatDate } from '@/utils/dateUtils';

interface SearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDiaryClick: (diary: Diary) => void;
}

export const SearchSidebar: React.FC<SearchSidebarProps> = ({
  isOpen,
  onClose,
  onDiaryClick,
}) => {
  const searchDiaries = useDiaryStore((s) => s.searchDiaries);
  const clearSearch = useDiaryStore((s) => s.clearSearch);
  const searchResults = useDiaryStore((s) => s.searchResults);
  const searchFilters = useDiaryStore((s) => s.searchFilters);
  
  const [keyword, setKeyword] = useState(searchFilters.keyword || '');
  const [startDate, setStartDate] = useState(searchFilters.startDate || '');
  const [endDate, setEndDate] = useState(searchFilters.endDate || '');
  const [selectedMood, setSelectedMood] = useState(searchFilters.mood || '');

  useEffect(() => {
    if (isOpen) {
      const f = searchFilters;
      setKeyword(f.keyword || '');
      setStartDate(f.startDate || '');
      setEndDate(f.endDate || '');
      setSelectedMood(f.mood || '');
    }
  }, [isOpen, searchFilters]);

  const handleSearch = () => {
    const filters: SearchFilters = {};
    if (keyword.trim()) filters.keyword = keyword.trim();
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (selectedMood) filters.mood = selectedMood;
    
    searchDiaries(filters);
  };

  const handleClear = () => {
    setKeyword('');
    setStartDate('');
    setEndDate('');
    setSelectedMood('');
    clearSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      <aside
        className={`fixed top-0 right-0 h-full w-96 bg-sand-50/95 backdrop-blur-xl z-50 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-sand-200/50">
            <h2 className="font-display text-xl font-semibold text-sand-800">
              搜索日记
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-sand-200/50 transition-colors"
            >
              <X className="w-5 h-5 text-sand-600" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-sand-700">
                <Search className="w-4 h-4" />
                关键词
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索标题、内容或地点..."
                className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-sand-400 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-sand-700">
                <Calendar className="w-4 h-4" />
                日期范围
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-sand-500 mb-1 block">开始日期</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-sand-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-sand-400 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-sand-500 mb-1 block">结束日期</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-sand-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-sand-400 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-sand-700">
                <Smile className="w-4 h-4" />
                心情标签
              </label>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(selectedMood === mood ? '' : mood)}
                    className={`px-3 py-2 rounded-full text-xl transition-all ${
                      selectedMood === mood
                        ? 'bg-sand-400 shadow-md scale-110'
                        : 'bg-white/70 hover:bg-sand-100'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                className="flex-1 py-3 rounded-xl bg-sand-600 text-white font-medium hover:bg-sand-700 hover-lift transition-colors"
              >
                搜索
              </button>
              <button
                onClick={handleClear}
                className="px-5 py-3 rounded-xl border border-sand-300 text-sand-600 font-medium hover:bg-sand-100 transition-colors"
              >
                清空
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-sand-600">
                    找到 {searchResults.length} 篇日记
                  </span>
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 rounded-lg bg-white/80 border border-sand-200 text-xs text-sand-600 hover:bg-sand-100 transition-colors flex items-center gap-1"
                  >
                    重置筛选条件
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {searchResults.map((diary) => (
                    <div
                      key={diary.id}
                      onClick={() => onDiaryClick(diary)}
                      className="flex gap-3 p-3 rounded-xl glass-card hover-lift cursor-pointer"
                    >
                      <img
                        src={diary.images[0]}
                        alt={diary.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sand-800 text-sm truncate">
                          {diary.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-sand-500">
                          <span>{diary.mood}</span>
                          <span>·</span>
                          <span>{formatDate(diary.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-sand-400 truncate">
                          <MapPin className="w-3 h-3" />
                          <span>{diary.locationName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
