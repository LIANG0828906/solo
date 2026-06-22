import React, { useState, useCallback, useEffect } from 'react';
import { Search, AlertCircle, Plus } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { FilterStatus } from '@/types';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onStatusFilter: (status: FilterStatus) => void;
  overdueCount: number;
  onAddProject: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = React.memo(
  ({ onSearch, onStatusFilter, overdueCount, onAddProject }) => {
    const [searchText, setSearchText] = useState('');
    const [status, setStatus] = useState<FilterStatus>('all');
    const debouncedSearch = useDebounce(searchText, 300);

    useEffect(() => {
      onSearch(debouncedSearch);
    }, [debouncedSearch, onSearch]);

    const handleStatusChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as FilterStatus;
        setStatus(newStatus);
        onStatusFilter(newStatus);
      },
      [onStatusFilter]
    );

    const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;

      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '20px 24px',
          backgroundColor: '#1E1E1E',
          borderRadius: '8px',
          marginBottom: '24px',
        }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9E9E9E',
            }}
          />
          <input
            type="text"
            placeholder="搜索项目名或客户名..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              backgroundColor: '#2A2A2A',
              border: '1px solid #333333',
              borderRadius: '6px',
              color: '#E0E0E0',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#2196F3')}
            onBlur={(e) => (e.target.style.borderColor = '#333333')}
          />
        </div>

        <select
          value={status}
          onChange={handleStatusChange}
          style={{
            padding: '10px 16px',
            backgroundColor: '#2A2A2A',
            border: '1px solid #333333',
            borderRadius: '6px',
            color: '#E0E0E0',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '140px',
          }}
        >
          <option value="all">全部状态</option>
          <option value="invoiced">已开票</option>
          <option value="partial">部分收款</option>
          <option value="paid">已结清</option>
        </select>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: overdueCount > 0 ? '#F4433620' : 'transparent',
            border: `1px solid ${overdueCount > 0 ? '#F4433640' : 'transparent'}`,
            borderRadius: '6px',
            transition: 'all 0.3s ease',
          }}
        >
          <AlertCircle
            size={18}
            style={{ color: overdueCount > 0 ? '#F44336' : '#9E9E9E' }}
          />
          <span
            style={{
              fontSize: '14px',
              color: overdueCount > 0 ? '#F44336' : '#9E9E9E',
              fontWeight: overdueCount > 0 ? 600 : 400,
            }}
          >
            逾期发票: {overdueCount}
          </span>
        </div>

        <button
          onClick={(e) => {
            handleRipple(e);
            onAddProject();
          }}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            overflow: 'hidden',
            transition: 'background-color 0.2s ease',
            minHeight: '44px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1976D2')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2196F3')}
        >
          <Plus size={18} />
          添加项目
        </button>
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
