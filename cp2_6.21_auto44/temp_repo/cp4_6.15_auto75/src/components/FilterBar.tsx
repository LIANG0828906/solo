import { MapPin, Clock, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TimeRange = 'all' | '1d' | '7d' | '30d';

interface FilterBarProps {
  location: string;
  timeRange: TimeRange;
  onLocationChange: (v: string) => void;
  onTimeRangeChange: (v: TimeRange) => void;
  totalCount: number;
  filteredCount: number;
}

const LOCATIONS = [
  { value: '', label: '全部地点' },
  { value: '图书馆', label: '图书馆' },
  { value: '教学楼', label: '教学楼' },
  { value: '食堂', label: '食堂' },
  { value: '操场', label: '操场' },
  { value: '宿舍', label: '宿舍楼' },
  { value: '咖啡厅', label: '咖啡厅' },
  { value: '公园', label: '公园' },
  { value: '地铁', label: '地铁站' },
];

const TIME_RANGES: { value: TimeRange; label: string; days?: number }[] = [
  { value: 'all', label: '全部时间' },
  { value: '1d', label: '近一天', days: 1 },
  { value: '7d', label: '近一周', days: 7 },
  { value: '30d', label: '近一月', days: 30 },
];

export function timeRangeToDate(tr: TimeRange): number | undefined {
  const found = TIME_RANGES.find(t => t.value === tr);
  if (!found?.days) return undefined;
  return Date.now() - found.days * 24 * 60 * 60 * 1000;
}

export default function FilterBar({
  location,
  timeRange,
  onLocationChange,
  onTimeRangeChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const hasFilters = location !== '' || timeRange !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <SlidersHorizontal className="w-4 h-4 text-[#FFA726]" />
          <span>筛选结果</span>
          <span className="text-gray-400">
            共 <span className="font-semibold text-gray-700">{filteredCount}</span> / {totalCount} 条
          </span>
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              onLocationChange('');
              onTimeRangeChange('all');
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            清除筛选
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#FFA726]" />
            丢失地点
          </label>
          <div className="flex flex-wrap gap-1.5">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.value || 'all'}
                onClick={() => onLocationChange(loc.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm transition-all duration-200',
                  location === loc.value
                    ? 'bg-[#FFA726] text-white shadow-md scale-105'
                    : 'bg-white border border-orange-100 text-gray-600 hover:border-orange-300 hover:bg-orange-50'
                )}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-[#FFA726]" />
          发布时间
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.value}
              onClick={() => onTimeRangeChange(tr.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm transition-all duration-200',
                timeRange === tr.value
                  ? 'bg-[#FFA726] text-white shadow-md scale-105'
                  : 'bg-white border border-orange-100 text-gray-600 hover:border-orange-300 hover:bg-orange-50'
              )}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
