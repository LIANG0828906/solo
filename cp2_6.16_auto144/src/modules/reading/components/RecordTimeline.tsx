import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReadingRecord } from '@/types';
import { MOOD_COLORS } from '@/types';
import { Clock, BookOpen, X } from 'lucide-react';

interface RecordTimelineProps {
  records: ReadingRecord[];
  onDelete?: (id: string) => void;
}

export function RecordTimeline({ records, onDelete }: RecordTimelineProps) {
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const displayRecords = records.slice(0, displayCount);
  const hasMore = displayCount < records.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setTimeout(() => {
      setDisplayCount((prev) => prev + 10);
      setIsLoading(false);
    }, 300);
  }, [isLoading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDay = weekDays[date.getDay()];
    return `${month}月${day}日 ${weekDay}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <BookOpen className="w-12 h-12 mb-3 opacity-50" />
        <p>暂无阅读记录</p>
        <p className="text-sm mt-1">开始记录你的阅读旅程吧</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#A0522D] via-gray-200 to-transparent" />

      <div className="space-y-6">
        {displayRecords.map((record, index) => {
          const moodColor = MOOD_COLORS[record.mood] || '#9E9E9E';
          const isLast = index === displayRecords.length - 1;

          return (
            <div key={record.id} className="relative pl-12 group">
              <div
                className="absolute left-2 w-5 h-5 rounded-full border-2 border-white shadow-md z-10 transition-transform duration-200 group-hover:scale-125"
                style={{ backgroundColor: moodColor, top: '8px' }}
              />

              {!isLast && (
                <div
                  className="absolute left-4 top-6 bottom-0 w-0.5 border-l-2 border-dashed"
                  style={{ borderColor: '#DCD6D0' }}
                />
              )}

              <div className="bg-white border border-[#DCD6D0] rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-250">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800 font-medium">{formatDate(record.date)}</span>
                      <span className="text-gray-400 text-sm">{formatTime(record.date)}</span>
                      <span
                        className="px-2 py-0.5 text-xs rounded-full text-white"
                        style={{ backgroundColor: moodColor }}
                      >
                        {record.mood}
                      </span>
                    </div>
                    {record.customTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {record.customTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs rounded-full bg-[#FFF8E7] text-[#8B4513] border border-[#A0522D]/30"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {onDelete && (
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all duration-250"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(record.id);
                      }}
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" style={{ color: '#8B4513' }} />
                    <span>
                      第 {record.startPage} - {record.endPage} 页
                      <span className="ml-1 text-[#8B4513] font-medium">
                        ({record.endPage - record.startPage + 1} 页)
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" style={{ color: '#8B4513' }} />
                    <span>{record.duration} 分钟</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div ref={observerRef} className="py-8 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <p className="text-gray-400 text-sm">加载更多记录...</p>
          )}
        </div>
      )}
    </div>
  );
}
