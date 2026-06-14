import React, { useState, useCallback } from 'react';
import { useKanbanStore, TEAM_MEMBERS } from './store';
import type { Priority, TaskStatus } from './types';
import { Search, Filter, ChevronDown, X } from 'lucide-react';

const FilterBar = React.memo(function FilterBar() {
  const filters = useKanbanStore((s) => s.filters);
  const setFilters = useKanbanStore((s) => s.setFilters);
  const collapsed = useKanbanStore((s) => s.filterBarCollapsed);
  const toggleFilterBar = useKanbanStore((s) => s.toggleFilterBar);

  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');

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

  const clearAll = useCallback(() => {
    setFilters({ assignees: [], priorities: [], status: 'all', keyword: '' });
  }, [setFilters]);

  const hasActiveFilters = filters.assignees.length > 0 || filters.priorities.length > 0 || filters.status !== 'all' || filters.keyword !== '';

  const filteredMembers = TEAM_MEMBERS.filter((m) =>
    m.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  if (collapsed) {
    return (
      <button
        onClick={toggleFilterBar}
        className="flex items-center gap-2 px-3 py-2 bg-kanban-card border border-kanban-border rounded-lg btn-hover text-kanban-text-muted hover:text-kanban-text text-sm"
      >
        <Filter size={14} />
        <span>筛选</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-kanban-accent" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap py-2 px-4 bg-kanban-card/50 border-b border-kanban-border">
      <div className="flex items-center gap-1 text-xs text-kanban-text-muted">
        <Filter size={12} />
        <span>筛选</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-kanban-bg border border-kanban-border rounded-md text-xs text-kanban-text btn-hover"
        >
          <span>负责人</span>
          {filters.assignees.length > 0 && (
            <span className="bg-kanban-accent text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {filters.assignees.length}
            </span>
          )}
          <ChevronDown size={12} />
        </button>
        {assigneeDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setAssigneeDropdownOpen(false); setAssigneeSearch(''); }} />
            <div className="absolute top-full left-0 mt-1 w-48 bg-kanban-card border border-kanban-border rounded-lg shadow-2xl z-50 animate-fade-in">
              <div className="p-2 border-b border-kanban-border">
                <input
                  type="text"
                  placeholder="搜索成员..."
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  className="w-full bg-kanban-bg border border-kanban-border rounded px-2 py-1 text-xs text-kanban-text placeholder:text-kanban-text-muted outline-none focus:border-kanban-accent"
                />
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {filteredMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-kanban-bg cursor-pointer text-xs text-kanban-text"
                  >
                    <input
                      type="checkbox"
                      checked={filters.assignees.includes(member.name)}
                      onChange={() => handleAssigneeToggle(member.name)}
                      className="rounded border-kanban-border accent-kanban-accent"
                    />
                    {member.name}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-kanban-text-muted">优先级：</span>
        {(['high', 'medium', 'low'] as Priority[]).map((p) => (
          <label key={p} className="flex items-center gap-1 text-xs text-kanban-text cursor-pointer">
            <input
              type="checkbox"
              checked={filters.priorities.includes(p)}
              onChange={() => handlePriorityToggle(p)}
              className="rounded border-kanban-border accent-kanban-accent"
            />
            <span className={`w-2 h-2 rounded-full ${p === 'high' ? 'bg-kanban-high' : p === 'medium' ? 'bg-kanban-medium' : 'bg-kanban-low'}`} />
            {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-kanban-text-muted">状态：</span>
        {(['all', 'not_started', 'in_progress', 'completed'] as const).map((s) => (
          <label key={s} className="flex items-center gap-1 text-xs text-kanban-text cursor-pointer">
            <input
              type="radio"
              name="status-filter"
              checked={filters.status === s}
              onChange={() => handleStatusChange(s)}
              className="accent-kanban-accent"
            />
            {s === 'all' ? '全部' : s === 'not_started' ? '未开始' : s === 'in_progress' ? '进行中' : '已完成'}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-1.5 bg-kanban-bg border border-kanban-border rounded-md px-2 py-1.5">
        <Search size={12} className="text-kanban-text-muted" />
        <input
          type="text"
          placeholder="搜索任务或负责人..."
          value={filters.keyword}
          onChange={handleKeywordChange}
          className="bg-transparent text-xs text-kanban-text placeholder:text-kanban-text-muted outline-none w-36"
        />
        {filters.keyword && (
          <button onClick={() => setFilters({ keyword: '' })} className="text-kanban-text-muted hover:text-kanban-text">
            <X size={12} />
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-kanban-accent hover:text-kanban-accent/80 btn-hover"
        >
          清除筛选
        </button>
      )}

      <div className="ml-auto md:hidden">
        <button onClick={toggleFilterBar} className="text-kanban-text-muted hover:text-kanban-text">
          <X size={14} />
        </button>
      </div>
    </div>
  );
});

export default FilterBar;
