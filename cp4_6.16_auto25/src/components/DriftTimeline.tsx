import { useState, useEffect, useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MapPin, User, Clock, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriftStore } from '@/stores/driftStore';
import type { DriftRecord } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';

interface DriftTimelineProps {
  bookId: string;
  selectedRecordId?: string;
  onSelectRecord?: (record: DriftRecord) => void;
}

export default function DriftTimeline({
  bookId,
  selectedRecordId,
  onSelectRecord,
}: DriftTimelineProps) {
  const { getRecordsByBook, fetchRecordsForBook, loading } = useDriftStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const records = useMemo(() => getRecordsByBook(bookId), [bookId, getRecordsByBook]);

  useEffect(() => {
    void fetchRecordsForBook(bookId);
  }, [bookId, fetchRecordsForBook]);

  useEffect(() => {
    if (records.length > 0 && expandedIds.size === 0) {
      const latest = records[records.length - 1];
      setExpandedIds(new Set([latest.id]));
    }
  }, [records]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (record: DriftRecord) => {
    onSelectRecord?.(record);
  };

  const getStatusBg = (status: string | null) => {
    if (!status) return 'bg-oak-100 text-oak-700';
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'drifting':
        return 'bg-green-100 text-green-700';
      case 'arrived':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-oak-100 text-oak-700';
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-oak-500">加载中...</div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <BookOpen className="mb-4 h-12 w-12 text-oak-300" />
        <div className="text-oak-500">暂无漂流记录</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-oak-800">
        <Clock className="h-5 w-5" />
        漂流时间轴
        <span className="ml-auto text-sm font-normal text-oak-500">
          共 {records.length} 条记录
        </span>
      </h3>
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-oak-200" />
        <div className="space-y-4">
          {records.map((record, index) => {
            const isExpanded = expandedIds.has(record.id);
            const isSelected = selectedRecordId === record.id;
            const isLatest = index === records.length - 1;

            return (
              <div key={record.id} className="relative pl-12">
                <div
                  className={cn(
                    'absolute left-0 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-cornsilk',
                    isSelected
                      ? 'border-oak-600 ring-4 ring-oak-200'
                      : 'border-oak-300',
                    isLatest && 'animate-pulse-dot'
                  )}
                  style={{
                    borderColor: record.statusChange
                      ? STATUS_COLORS[record.statusChange]
                      : undefined,
                  }}
                >
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full',
                      record.statusChange
                        ? ''
                        : 'bg-oak-400'
                    )}
                    style={{
                      backgroundColor: record.statusChange
                        ? STATUS_COLORS[record.statusChange]
                        : undefined,
                    }}
                  />
                </div>

                <div
                  className={cn(
                    'cursor-pointer rounded-xl border-2 bg-cornsilk/80 p-4 transition-all duration-200 hover:shadow-card',
                    isSelected
                      ? 'border-oak-500 shadow-card'
                      : 'border-oak-200 hover:border-oak-300'
                  )}
                  onClick={() => {
                    toggleExpand(record.id);
                    handleSelect(record);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-oak-500" />
                        <span className="font-medium text-oak-800 truncate">
                          {record.toLocation || '未知地点'}
                        </span>
                        {isLatest && (
                          <span className="flex-shrink-0 rounded-full bg-oak-500 px-2 py-0.5 text-xs text-cornsilk">
                            最新
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-oak-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {formatDistanceToNow(record.timestamp, {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      className="flex-shrink-0 rounded-lg p-1 text-oak-400 hover:bg-oak-100 hover:text-oak-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(record.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 animate-expand border-t border-oak-200 pt-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-oak-600">
                          <User className="h-4 w-4 text-oak-400" />
                          <span>操作人：{record.operatorName}</span>
                        </div>
                        <div className="text-oak-600">
                          <span className="text-oak-400">时间：</span>
                          {format(record.timestamp, 'yyyy年MM月dd日 HH:mm', {
                            locale: zhCN,
                          })}
                        </div>
                        {record.statusChange && (
                          <div className="flex items-center gap-2">
                            <span className="text-oak-400">状态：</span>
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                getStatusBg(record.statusChange)
                              )}
                            >
                              {STATUS_LABELS[record.statusChange]}
                            </span>
                          </div>
                        )}
                        {record.note && (
                          <div className="text-oak-600">
                            <span className="text-oak-400">备注：</span>
                            {record.note}
                          </div>
                        )}
                        {record.fromLocation && (
                          <div className="text-oak-500 text-xs">
                            从 {record.fromLocation} 漂来
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
