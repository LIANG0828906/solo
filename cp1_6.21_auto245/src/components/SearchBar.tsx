import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, Check, Loader2 } from 'lucide-react';
import { useWatchContext } from '../context/WatchContext';
import type { SearchResult } from '../types';

const SearchBar: React.FC = () => {
  const { searchShows, addShow, isShowAdded, searchResults, isSearching, searchKeyword, setSearchKeyword } = useWatchContext();
  const [showDropdown, setShowDropdown] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchShows(query);
    }, 300);
  }, [searchShows]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);
    setShowDropdown(true);
    debouncedSearch(value);
  };

  const handleAddShow = async (result: SearchResult) => {
    if (isShowAdded(result.tmdbId) || addingId !== null) return;
    setAddingId(result.tmdbId);
    await addShow(result);
    setAddingId(null);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatYear = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).getFullYear();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
        />
        <input
          ref={inputRef}
          type="text"
          value={searchKeyword}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder="搜索剧集..."
          className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-800 text-white placeholder-gray-400 border-2 border-transparent focus:border-blue-500 outline-none transition-all duration-200 text-base"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
        )}
      </div>

      {showDropdown && searchKeyword.trim() && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700 max-h-96 overflow-y-auto z-50"
        >
          {isSearching && searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>搜索中...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>未找到相关剧集</p>
            </div>
          ) : (
            searchResults.map((result) => {
              const added = isShowAdded(result.tmdbId);
              const isAdding = addingId === result.tmdbId;
              return (
                <div
                  key={result.tmdbId}
                  className="flex items-center gap-4 p-3 hover:bg-slate-700 transition-colors duration-150 cursor-pointer"
                  onClick={() => !added && handleAddShow(result)}
                >
                  {result.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${result.posterPath}`}
                      alt={result.name}
                      className="w-12 h-18 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-18 bg-slate-700 rounded flex items-center justify-center">
                      <Search className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{result.name}</p>
                    <p className="text-gray-400 text-sm">
                      {formatYear(result.firstAirDate)}
                    </p>
                  </div>
                  <button
                    disabled={added || isAdding}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                      added
                        ? 'bg-green-500/20 text-green-400 cursor-default'
                        : isAdding
                        ? 'bg-blue-500/20 text-blue-400 cursor-wait'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isAdding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : added ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {added ? '已添加' : '添加'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
