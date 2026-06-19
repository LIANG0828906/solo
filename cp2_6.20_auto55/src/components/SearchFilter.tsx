import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKanbanStore } from '@/store/kanbanStore';
import { COLORS, VOTE_TYPE_LABELS, STATUS_LABELS, SORT_OPTIONS } from '@/utils/constants';
import type { VoteType, VoteStatus } from '@/types';

// SearchFilter 组件
export default function SearchFilter() {
  const { filters, setFilters } = useKanbanStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const typeRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 防抖搜索输入
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setFilters({ search: searchInput });
      setFadeKey((k) => k + 1);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchInput, setFilters]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 清除搜索
  const handleClearSearch = () => {
    setSearchInput('');
  };

  // 设置类型筛选
  const handleTypeSelect = (type: VoteType | null) => {
    setFilters({ type });
    setShowTypeDropdown(false);
    setFadeKey((k) => k + 1);
  };

  // 设置状态筛选
  const handleStatusSelect = (status: VoteStatus | null) => {
    setFilters({ status });
    setShowStatusDropdown(false);
    setFadeKey((k) => k + 1);
  };

  // 设置排序
  const handleSortSelect = (sortBy: string) => {
    setFilters({ sortBy });
    setShowSortDropdown(false);
    setFadeKey((k) => k + 1);
  };

  // 获取类型显示文本
  const getTypeLabel = () => {
    if (!filters.type) return '全部类型';
    return VOTE_TYPE_LABELS[filters.type];
  };

  // 获取状态显示文本
  const getStatusLabel = () => {
    if (!filters.status) return '全部状态';
    return STATUS_LABELS[filters.status];
  };

  // 获取排序显示文本
  const getSortLabel = () => {
    const option = SORT_OPTIONS.find((o) => o.value === filters.sortBy);
    return option ? option.label : '排序';
  };

  return (
    <div
      key={fadeKey}
      className={cn(
        'w-full rounded-2xl p-5 mb-6 shadow-lg',
        'animate-fadeIn'
      )}
      style={{
        backgroundColor: COLORS.card,
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .search-underline::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background-color: ${COLORS.primary};
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }
        .search-underline:focus-within::after,
        .search-underline:focus::after {
          width: 100%;
        }
        .search-underline:focus-within input {
          border-color: ${COLORS.primary} !important;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="relative flex-1">
          <div
            className={cn(
              'search-underline relative flex items-center rounded-xl overflow-hidden transition-all duration-300 border-2 h-11'
            )}
            style={{
              backgroundColor: COLORS.background,
              borderColor: 'rgba(160, 165, 192, 0.3)',
            }}
          >
            <Search
              size={18}
              className="ml-4 flex-shrink-0"
              style={{ color: 'rgba(160, 165, 192, 0.8)' }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索投票标题或描述..."
              className={cn(
                'flex-1 h-full bg-transparent text-white text-sm px-3 outline-none transition-all duration-300 placeholder:text-sm'
              )}
              style={{ color: '#ffffff', caretColor: COLORS.primary }}
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="mr-3 p-1 rounded-md transition-all duration-300 hover:scale-110"
              >
                <X
                  size={16}
                  style={{ color: 'rgba(160, 165, 192, 0.8)' }}
                />
              </button>
            )}
          </div>
        </div>

        {/* 筛选器组 */}
        <div className="flex flex-wrap gap-3">
          {/* 类型筛选 */}
          <div ref={typeRef} className="relative">
            <button
              onClick={() => {
                setShowTypeDropdown(!showTypeDropdown);
                setShowStatusDropdown(false);
                setShowSortDropdown(false);
              }}
              className={cn(
                'flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105',
                filters.type ? 'text-white' : ''
              )}
              style={{
                backgroundColor: filters.type ? COLORS.primary : COLORS.background,
                color: filters.type ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                border: `1px solid ${filters.type ? COLORS.primary : 'rgba(160, 165, 192, 0.3)'}`,
              }}
            >
              <span>{getTypeLabel()}</span>
            </button>

            {showTypeDropdown && (
              <div
                className={cn(
                  'absolute top-full left-0 mt-2 w-36 rounded-xl shadow-xl z-40 overflow-hidden',
                  'animate-dropdown'
                )}
                style={{
                  backgroundColor: COLORS.card,
                  border: '1px solid rgba(74, 144, 217, 0.2)',
                  animation: 'fadeIn 0.2s ease-out',
                }}
              >
                <button
                  onClick={() => handleTypeSelect(null)}
                  className={cn(
                  'w-full px-4 py-2.5 text-left text-sm transition-all duration-300 hover:bg-white/10',
                  !filters.type && 'bg-white/5'
                )}
                style={{
                  color: !filters.type ? COLORS.primary : '#ffffff'
                }}
                >
                  全部
                </button>
                {(Object.keys(VOTE_TYPE_LABELS) as VoteType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-all duration-300 hover:bg-white/10',
                      filters.type === type && 'bg-white/5'
                    )}
                    style={{
                      color: filters.type === type ? COLORS.primary : '#ffffff'
                    }}
                  >
                    {VOTE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 状态筛选 */}
          <div ref={statusRef} className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowTypeDropdown(false);
                setShowSortDropdown(false);
              }}
              className={cn(
                'flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105',
                filters.status ? 'text-white' : ''
              )}
              style={{
                backgroundColor: filters.status ? COLORS.primary : COLORS.background,
                color: filters.status ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                border: `1px solid ${filters.status ? COLORS.primary : 'rgba(160, 165, 192, 0.3)'}`,
              }}
            >
              <span>{getStatusLabel()}</span>
            </button>

            {showStatusDropdown && (
              <div
                className={cn(
                  'absolute top-full left-0 mt-2 w-36 rounded-xl shadow-xl z-40 overflow-hidden'
                )}
                style={{
                  backgroundColor: COLORS.card,
                  border: '1px solid rgba(74, 144, 217, 0.2)',
                  animation: 'fadeIn 0.2s ease-out',
                }}
              >
                <button
                  onClick={() => handleStatusSelect(null)}
                  className={cn(
                    'w-full px-4 py-2.5 text-left text-sm transition-all duration-300 hover:bg-white/10',
                    !filters.status && 'bg-white/5'
                  )}
                  style={{
                    color: !filters.status ? COLORS.primary : '#ffffff'
                  }}
                >
                  全部
                </button>
                {(Object.keys(STATUS_LABELS) as VoteStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusSelect(status)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-all duration-300 hover:bg-white/10',
                      filters.status === status && 'bg-white/5'
                    )}
                    style={{
                      color: filters.status === status ? COLORS.primary : '#ffffff'
                    }}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 排序筛选 */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown);
                setShowTypeDropdown(false);
                setShowStatusDropdown(false);
              }}
              className={cn(
                'flex items-center gap-2 px-4 h-11 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105'
              )}
              style={{
                backgroundColor: COLORS.background,
                color: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(160, 165, 192, 0.3)',
              }}
            >
              <span>{getSortLabel()}</span>
            </button>

            {showSortDropdown && (
              <div
                className={cn(
                  'absolute top-full right-0 mt-2 w-44 rounded-xl shadow-xl z-40 overflow-hidden'
                )}
                style={{
                  backgroundColor: COLORS.card,
                  border: '1px solid rgba(74, 144, 217, 0.2)',
                  animation: 'fadeIn 0.2s ease-out',
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortSelect(option.value)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm transition-all duration-300 hover:bg-white/10',
                      filters.sortBy === option.value && 'bg-white/5'
                    )}
                    style={{
                      color: filters.sortBy === option.value ? COLORS.primary : '#ffffff'
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
