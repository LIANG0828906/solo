import { useState, useRef } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useStore } from '@/store';
import { BG_SECONDARY, BG_INPUT, BORDER_COLOR } from '@/shared/types';
import type { NodeType, NodeStatus } from '@/shared/types';

const TYPE_OPTIONS: { value: NodeType | null; label: string; color: string }[] = [
  { value: null, label: '全部类型', color: '#fff' },
  { value: 'goal', label: '目标', color: '#4ECDC4' },
  { value: 'subtask', label: '子任务', color: '#FFE66D' },
  { value: 'milestone', label: '里程碑', color: '#FF6B6B' },
];

const STATUS_OPTIONS: { value: NodeStatus | null; label: string }[] = [
  { value: null, label: '全部状态' },
  { value: 'not_started', label: '未开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'overdue', label: '已延期' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const filter = useStore((s) => s.filter);
  const setFilter = useStore((s) => s.setFilter);
  const clearFilter = useStore((s) => s.clearFilter);
  const [keyword, setKeyword] = useState(filter.keyword);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleKeywordChange = (val: string) => {
    setKeyword(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFilter({ keyword: val });
    }, 200);
  };

  const hasActiveFilter = filter.typeFilter || filter.statusFilter || filter.keyword;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed md:relative z-50 top-0 left-0 h-full
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ width: 240 }}
      >
        <div
          className="h-full p-4 flex flex-col gap-5 overflow-y-auto"
          style={{
            background: BG_SECONDARY,
            borderRadius: 12,
            border: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Filter size={16} />
              筛选面板
            </div>
            <button
              className="md:hidden text-white/60 hover:text-white transition-colors"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">按类型</span>
            <div className="flex flex-col gap-1">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setFilter({ typeFilter: opt.value })}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left
                    transition-all duration-200
                    ${filter.typeFilter === opt.value
                      ? 'text-white'
                      : 'text-white/60 hover:text-white/80'}
                  `}
                  style={{
                    background: filter.typeFilter === opt.value ? 'rgba(108,99,255,0.25)' : 'transparent',
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: opt.color }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">按状态</span>
            <div className="flex flex-col gap-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setFilter({ statusFilter: opt.value })}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left
                    transition-all duration-200
                    ${filter.statusFilter === opt.value
                      ? 'text-white'
                      : 'text-white/60 hover:text-white/80'}
                  `}
                  style={{
                    background: filter.statusFilter === opt.value ? 'rgba(108,99,255,0.25)' : 'transparent',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-white/50 uppercase tracking-wider">关键词搜索</span>
            <div
              className="relative flex items-center"
            >
              <Search size={14} className="absolute left-3 text-white/40" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                placeholder="搜索节点..."
                className="w-full pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none"
                style={{
                  background: BG_INPUT,
                  borderRadius: 8,
                  border: '1px solid transparent',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6C63FF';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              />
            </div>
          </div>

          {hasActiveFilter && (
            <button
              onClick={clearFilter}
              className="mt-2 px-3 py-2 text-xs text-white/70 hover:text-white rounded-lg transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              清除所有筛选
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
