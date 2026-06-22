import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import { useKanbanStore, TEAM_MEMBERS } from './store';
import type { Priority, TaskStatus } from './types';

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

const STATUS_OPTIONS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'not_started', label: '未开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

const FilterBar = React.memo(function FilterBar() {
  const filters = useKanbanStore((s) => s.filters);
  const setFilters = useKanbanStore((s) => s.setFilters);
  const collapsed = useKanbanStore((s) => s.filterBarCollapsed);
  const toggleFilterBar = useKanbanStore((s) => s.toggleFilterBar);

  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const hasActiveFilters = useMemo(() => {
    return (
      filters.assignees.length > 0 ||
      filters.priorities.length > 0 ||
      filters.status !== 'all' ||
      filters.keyword !== ''
    );
  }, [filters]);

  const filteredMembers = useMemo(() => {
    if (!assigneeSearch) return TEAM_MEMBERS;
    const kw = assigneeSearch.toLowerCase();
    return TEAM_MEMBERS.filter((m) => m.name.toLowerCase().includes(kw));
  }, [assigneeSearch]);

  const handleAssigneeToggle = useCallback((name: string) => {
    const current = filters.assignees;
    const next = current.includes(name)
      ? current.filter((a) => a !== name)
      : [...current, name];
    setFilters({ assignees: next });
  }, [filters.assignees, setFilters]);

  const handlePriorityToggle = useCallback((p: Priority) => {
    const current = filters.priorities;
    const next = current.includes(p)
      ? current.filter((x) => x !== p)
      : [...current, p];
    setFilters({ priorities: next });
  }, [filters.priorities, setFilters]);

  const handleStatusChange = useCallback((status: TaskStatus | 'all') => {
    setFilters({ status });
  }, [setFilters]);

  const handleKeywordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ keyword: e.target.value });
  }, [setFilters]);

  const clearKeyword = useCallback(() => {
    setFilters({ keyword: '' });
  }, [setFilters]);

  const clearAll = useCallback(() => {
    setFilters({ assignees: [], priorities: [], status: 'all', keyword: '' });
  }, [setFilters]);

  const toggleAssigneeDropdown = useCallback(() => {
    setAssigneeDropdownOpen((prev) => !prev);
    if (assigneeDropdownOpen) {
      setAssigneeSearch('');
    }
  }, [assigneeDropdownOpen]);

  const closeAssigneeDropdown = useCallback(() => {
    setAssigneeDropdownOpen(false);
    setAssigneeSearch('');
  }, []);

  const handleAssigneeSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAssigneeSearch(e.target.value);
  }, []);

  if (collapsed) {
    return (
      <button
        onClick={toggleFilterBar}
        className="filter-collapsed-btn"
      >
        <Filter size={14} />
        <span>筛选</span>
        {hasActiveFilters && <span className="filter-active-dot" />}
      </button>
    );
  }

  return (
    <div className="filter-bar">
      <div className="filter-label">
        <Filter size={12} />
        <span>筛选</span>
      </div>

      <div className="dropdown">
        <button
          onClick={toggleAssigneeDropdown}
          className="dropdown-btn"
          type="button"
        >
          <span>负责人</span>
          {filters.assignees.length > 0 && (
            <span className="badge">{filters.assignees.length}</span>
          )}
          <ChevronDown size={12} />
        </button>

        {assigneeDropdownOpen && (
          <>
            <div
              className="dropdown-backdrop"
              onClick={closeAssigneeDropdown}
            />
            <div className="dropdown-menu">
              <div className="dropdown-search">
                <input
                  type="text"
                  placeholder="搜索成员..."
                  value={assigneeSearch}
                  onChange={handleAssigneeSearchChange}
                />
              </div>
              <div className="dropdown-list">
                {filteredMembers.map((member) => (
                  <label
                    key={member.id}
                    className="dropdown-item"
                  >
                    <input
                      type="checkbox"
                      checked={filters.assignees.includes(member.name)}
                      onChange={() => handleAssigneeToggle(member.name)}
                    />
                    <span>{member.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="filter-chips">
        <span className="filter-label">优先级：</span>
        {PRIORITY_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="filter-chip"
          >
            <input
              type="checkbox"
              checked={filters.priorities.includes(opt.value)}
              onChange={() => handlePriorityToggle(opt.value)}
            />
            <span className={`color-dot ${opt.value}`} />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      <div className="filter-chips">
        <span className="filter-label">状态：</span>
        {STATUS_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="filter-chip"
          >
            <input
              type="radio"
              name="status-filter"
              checked={filters.status === opt.value}
              onChange={() => handleStatusChange(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      <div className="search-input-wrapper">
        <Search size={12} />
        <input
          type="text"
          placeholder="搜索任务或负责人..."
          value={filters.keyword}
          onChange={handleKeywordChange}
        />
        {filters.keyword && (
          <button
            type="button"
            onClick={clearKeyword}
            className="clear-btn"
            style={{ marginLeft: 0 }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="clear-btn"
        >
          清除筛选
        </button>
      )}

      <button
        type="button"
        onClick={toggleFilterBar}
        className="hamburger-btn"
      >
        <X size={14} />
      </button>
    </div>
  );
});

export default FilterBar;
