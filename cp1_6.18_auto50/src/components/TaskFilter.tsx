import { TaskFilter as TaskFilterType } from '@/types';
import { Calendar, Clock } from 'lucide-react';

interface TaskFilterProps {
  filters: TaskFilterType;
  onFilterChange: (filters: TaskFilterType) => void;
}

export default function TaskFilter({ filters, onFilterChange }: TaskFilterProps) {
  return (
    <div className="bg-base-card border border-base-border rounded-2xl p-5">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs text-text-secondary mb-1.5">开始日期</label>
          <div className="flex items-center gap-2 bg-base border border-base-border rounded-xl px-3 py-2">
            <Calendar size={14} className="text-text-secondary" />
            <input
              type="date"
              className="bg-transparent outline-none text-text-primary text-sm w-full"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="text-xs text-text-secondary mb-1.5">结束日期</label>
          <div className="flex items-center gap-2 bg-base border border-base-border rounded-xl px-3 py-2">
            <Calendar size={14} className="text-text-secondary" />
            <input
              type="date"
              className="bg-transparent outline-none text-text-primary text-sm w-full"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="text-xs text-text-secondary mb-1.5">最长照料时长（小时）</label>
          <div className="flex items-center gap-3">
            <Clock size={14} className="text-text-secondary" />
            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={filters.durationHours || 24}
              className="w-32 accent-[#4ECDC4]"
              onChange={(e) => onFilterChange({ ...filters, durationHours: Number(e.target.value) })}
            />
            <span className="text-sm text-accent font-medium w-8">
              {filters.durationHours || 24}h
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
