import { useState, useTransition, useMemo } from 'react';
import { Music2, Filter, Calendar } from 'lucide-react';
import type { Work, WorkStatus } from '../types';
import { SongCard } from './SongCard';
import { worksManager } from '../modules/works/WorksManager';

interface SidebarProps {
  works: Work[];
  selectedWorkId: string | null;
  filterStatus: WorkStatus | 'all';
  dateRange: { start: string | null; end: string | null };
  currentWorkId: string | null;
  isPlaying: boolean;
  onSelectWork: (id: string) => void;
  onFilterStatusChange: (status: WorkStatus | 'all') => void;
  onDateRangeChange: (range: { start: string | null; end: string | null }) => void;
  onPlayToggle: (workId: string) => void;
}

export function Sidebar({
  works,
  selectedWorkId,
  filterStatus,
  dateRange,
  currentWorkId,
  isPlaying,
  onSelectWork,
  onFilterStatusChange,
  onDateRangeChange,
  onPlayToggle,
}: SidebarProps) {
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  const filteredWorks = useMemo(() => {
    return worksManager.filterWorks(filterStatus, dateRange);
  }, [works, filterStatus, dateRange]);

  return (
    <aside className="h-full flex flex-col glass-card border-r border-white/5 md:rounded-none md:border-r md:border-l-0 md:border-t-0 md:border-b-0 rounded-r-card">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">TrackTales</h1>
            <p className="text-xs text-text-secondary">创作历程追踪</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-white/5">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="
            w-full flex items-center justify-between
            px-3 py-2 rounded-lg
            hover:bg-white/5 transition-colors duration-200
          "
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-primary">筛选</span>
          </div>
          <span className="text-xs text-accent">
            {filterStatus === 'all' ? '全部' : filterStatus === 'published' ? '已发布' : '草稿'}
          </span>
        </button>

        {showFilters && (
          <div className="mt-3 space-y-3 animate-fade-in">
            <div>
              <p className="text-xs text-text-secondary mb-2">作品状态</p>
              <div className="flex gap-2">
                {(['all', 'published', 'draft'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      startTransition(() => onFilterStatusChange(status))
                    }
                    className={`
                      flex-1 px-3 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-200
                      ${filterStatus === status
                        ? 'bg-accent text-white shadow-glow'
                        : 'bg-white/5 text-text-secondary hover:bg-white/10'}
                    `}
                  >
                    {status === 'all' ? '全部' : status === 'published' ? '已发布' : '草稿'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-text-secondary mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                日期范围
              </p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start || ''}
                  onChange={(e) =>
                    startTransition(() =>
                      onDateRangeChange({ ...dateRange, start: e.target.value || null })
                    )
                  }
                  className="
                    flex-1 px-2 py-1.5 rounded-lg text-xs
                    bg-white/5 border border-white/10
                    text-text-primary
                    focus:outline-none focus:border-accent/50
                    [color-scheme:dark]
                  "
                />
                <input
                  type="date"
                  value={dateRange.end || ''}
                  onChange={(e) =>
                    startTransition(() =>
                      onDateRangeChange({ ...dateRange, end: e.target.value || null })
                    )
                  }
                  className="
                    flex-1 px-2 py-1.5 rounded-lg text-xs
                    bg-white/5 border border-white/10
                    text-text-primary
                    focus:outline-none focus:border-accent/50
                    [color-scheme:dark]
                  "
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <p className="text-xs text-text-secondary mb-3">
          共 {filteredWorks.length} 首作品
        </p>

        <div
          className={`
            grid grid-cols-2 gap-3
            transition-opacity duration-300
            ${isPending ? 'opacity-50' : 'opacity-100'}
          `}
        >
          {filteredWorks.map((work, index) => (
            <div
              key={work.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <SongCard
                work={work}
                isSelected={selectedWorkId === work.id}
                isPlaying={isPlaying && currentWorkId === work.id}
                onClick={() => onSelectWork(work.id)}
                onPlayToggle={(e) => {
                  e.stopPropagation();
                  onPlayToggle(work.id);
                }}
              />
            </div>
          ))}
        </div>

        {filteredWorks.length === 0 && (
          <div className="text-center py-12">
            <Music2 className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-sm text-text-secondary">没有找到作品</p>
          </div>
        )}
      </div>
    </aside>
  );
}
