'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { mixColors } from '@/lib/flavorAnalyzer';
import type { RecordLike } from '@/lib/flavorAnalyzer';
import { useRouter } from 'next/navigation';

interface CalendarProps {
  records: (RecordLike & { id: string })[];
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function Calendar({ records }: CalendarProps) {
  const router = useRouter();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const recordsByDate = useMemo(() => {
    const map = new Map<string, typeof records>();
    for (const record of records) {
      const date = new Date(record.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(record);
    }
    return map;
  }, [records]);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const goPrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const goNext = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const handleDayClick = (day: number) => {
    const key = `${year}-${month}-${day}`;
    const dayRecords = recordsByDate.get(key);
    if (dayRecords && dayRecords.length > 0) {
      router.push(`/records/${dayRecords[0].id}`);
    }
  };

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl font-semibold text-white flex items-center gap-2">
          <span className="text-yellow-400">📅</span>
          品鉴日历
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            aria-label="上个月"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            今天
          </button>
          <button
            onClick={goNext}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            aria-label="下个月"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-center mb-4">
        <span className="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
          {year} 年 {month + 1} 月
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-xs font-medium text-white/40 py-2 uppercase tracking-wider"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={idx} className="aspect-square" />;
          }
          const key = `${year}-${month}-${day}`;
          const dayRecords = recordsByDate.get(key) || [];
          const hasRecord = dayRecords.length > 0;
          const mainColor = hasRecord
            ? mixColors(dayRecords.flatMap((r) => r.flavorTags.map((t) => t.color)))
            : undefined;
          const todayMark = isToday(day);

          return (
            <button
              key={idx}
              onClick={() => hasRecord && handleDayClick(day)}
              disabled={!hasRecord}
              className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                hasRecord
                  ? 'cursor-pointer hover:scale-105'
                  : 'cursor-default text-white/30'
              } ${todayMark ? 'ring-2 ring-yellow-400/60' : ''}`}
              style={
                hasRecord
                  ? {
                      background: `radial-gradient(circle at 30% 30%, ${mainColor}66 0%, rgba(22, 33, 62, 0.6) 70%)`,
                    }
                  : { backgroundColor: 'rgba(255,255,255,0.02)' }
              }
            >
              <span
                className={`relative z-10 ${
                  hasRecord ? 'text-white font-semibold' : ''
                }`}
              >
                {day}
              </span>
              {hasRecord && (
                <span
                  className="absolute bottom-1.5 flex gap-0.5"
                  aria-label={`${dayRecords.length}条记录`}
                >
                  {dayRecords.slice(0, 3).map((r, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: r.flavorTags[0]?.color || '#FFD700',
                        opacity: 0.9,
                      }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500" />
            有记录
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full ring-2 ring-yellow-400/60" />
            今天
          </span>
        </div>
        <span>
          本月共 <span className="font-semibold text-yellow-400">{recordsByDate.size}</span> 天记录
        </span>
      </div>
    </div>
  );
}
