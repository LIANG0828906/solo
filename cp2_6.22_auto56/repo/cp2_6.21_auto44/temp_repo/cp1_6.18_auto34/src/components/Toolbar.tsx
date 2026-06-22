import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Download, Search, X } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import { exportAsPNG } from '../utils/exportImage';

interface ToolbarProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const Toolbar: React.FC<ToolbarProps> = ({ canvasRef }) => {
  const {
    searchKeyword,
    isLayoutAnimating,
    actions: { autoLayout, setSearchKeyword },
  } = useGraphStore();

  const [showSearch, setShowSearch] = useState(!!searchKeyword);
  const [localSearch, setLocalSearch] = useState(searchKeyword);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    setLocalSearch(searchKeyword);
  }, [searchKeyword]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    setSearchKeyword(value);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    setSearchKeyword('');
    setShowSearch(false);
  };

  const handleExport = () => {
    if (canvasRef.current) {
      exportAsPNG(canvasRef.current);
    }
  };

  return (
    <div
      className="
        absolute top-4 left-1/2 transform -translate-x-1/2
        flex items-center gap-2 px-3 py-2
        bg-[#1E1E2E]/90 backdrop-blur-md
        rounded-xl border border-[#2A2A44]
        shadow-lg z-40
      "
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <button
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          text-sm font-medium transition-all duration-200
          ${isLayoutAnimating
            ? 'bg-[#6C63FF]/30 text-[#6C63FF] cursor-not-allowed'
            : 'text-[#E0E0E0] hover:bg-[#2A2A44] hover:text-white'
          }
        `}
        onClick={autoLayout}
        disabled={isLayoutAnimating}
      >
        <LayoutGrid size={18} className={isLayoutAnimating ? 'animate-spin' : ''} />
        <span>{isLayoutAnimating ? '布局中...' : '自动布局'}</span>
      </button>

      <div className="w-px h-6 bg-[#2A2A44]" />

      <button
        className="
          flex items-center gap-2 px-4 py-2 rounded-lg
          text-[#E0E0E0] text-sm font-medium
          hover:bg-[#2A2A44] hover:text-white
          transition-all duration-200
        "
        onClick={handleExport}
      >
        <Download size={18} />
        <span>导出PNG</span>
      </button>

      <div className="w-px h-6 bg-[#2A2A44]" />

      {showSearch ? (
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C6C8A]"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={localSearch}
              onChange={handleSearchChange}
              placeholder="搜索灵感..."
              className="
                w-64 pl-9 pr-9 py-2
                bg-[#16162A] border border-[#2A2A44] rounded-lg
                text-[#E0E0E0] text-sm placeholder-[#6C6C8A]
                focus:outline-none focus:border-[#6C63FF] focus:ring-1 focus:ring-[#6C63FF]/30
                transition-all duration-200
              "
            />
            {localSearch && (
              <button
                className="
                  absolute right-2 top-1/2 -translate-y-1/2
                  w-5 h-5 flex items-center justify-center rounded
                  text-[#6C6C8A] hover:text-[#E0E0E0] hover:bg-[#3A3A5C]
                  transition-colors
                "
                onClick={handleClearSearch}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          className="
            flex items-center gap-2 px-4 py-2 rounded-lg
            text-[#E0E0E0] text-sm font-medium
            hover:bg-[#2A2A44] hover:text-white
            transition-all duration-200
          "
          onClick={() => setShowSearch(true)}
        >
          <Search size={18} />
          <span>搜索</span>
        </button>
      )}
    </div>
  );
};
