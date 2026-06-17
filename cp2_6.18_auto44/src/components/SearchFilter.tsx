import React from 'react';
import { Search } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import type { Priority } from '@/types';

const SearchFilter: React.FC = () => {
  const { searchQuery, filterPriority, setSearchQuery, setFilterPriority } = useTaskStore();

  return (
    <>
      <div className="search-box">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="搜索任务标题..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <select
        className="filter-select"
        value={filterPriority}
        onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
      >
        <option value="all">全部优先级</option>
        <option value="high">高优先级</option>
        <option value="medium">中优先级</option>
        <option value="low">低优先级</option>
      </select>
    </>
  );
};

export default React.memo(SearchFilter);
