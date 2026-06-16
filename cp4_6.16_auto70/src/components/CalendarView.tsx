import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlantStore } from '@/store/plantStore';
import { getDaysInMonth, getRecordsColor, getTextColor, formatDate } from '@/utils/date';
import type { DateRecordModalData } from '@/types';
import DateRecordsModal from './DateRecordsModal';
import { useShallow } from 'zustand/react/shallow';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export default function CalendarView() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [rippleCell, setRippleCell] = useState<string | null>(null);
  const [modalData, setModalData] = useState<DateRecordModalData | null>(null);

  const { plants, careLogs } = usePlantStore(
    useShallow((state) => ({
      plants: state.plants,
      careLogs: state.careLogs,
    }))
  );

  const days = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  const recordsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const log of careLogs) {
      const key = formatDate(log.date);
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [careLogs]);

  const firstDayOfWeek = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    return (firstDay.getDay() + 6) % 7;
  }, [currentYear, currentMonth]);

  const cells: { date: Date | null; key: string }[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ date: null, key: `empty-${i}` });
  }
  for (const d of days) {
    cells.push({ date: d, key: formatDate(d) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, key: `empty-end-${cells.length}` });
  }

  const goPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const handleCellClick = (date: Date, event: React.MouseEvent<HTMLDivElement>) => {
    const dateStr = formatDate(date);
    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cellKey = dateStr;

    setRippleCell(cellKey);
    setTimeout(() => setRippleCell(null), 500);

    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    setModalData({
      date: dateStr,
      x: originX,
      y: rect.bottom,
      originX,
      originY,
    });
  };

  const monthLabel = `${currentYear}年${currentMonth + 1}月`;

  const maxCount = Math.max(0, ...Object.values(recordsMap));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-app-text mb-1">养护日历</h2>
        <p className="text-sm text-app-text-light">
          颜色越深表示当天养护记录越多，点击格子查看详情
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-primary/5 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-primary/10">
          <button
            onClick={goPrevMonth}
            className="p-2 rounded-xl hover:bg-app-bg transition-colors text-app-text-light hover:text-app-text"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4">
            <h3 className="text-lg font-serif font-semibold">{monthLabel}</h3>
            <button
              onClick={goToday}
              className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
            >
              今天
            </button>
          </div>

          <button
            onClick={goNextMonth}
            className="p-2 rounded-xl hover:bg-app-bg transition-colors text-app-text-light hover:text-app-text"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs sm:text-sm font-medium text-app-text-light py-2"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((cell) => {
              if (!cell.date) {
                return <div key={cell.key} className="aspect-square sm:aspect-auto sm:h-20" />;
              }

              const dateStr = formatDate(cell.date);
              const count = recordsMap[dateStr] || 0;
              const isToday =
                cell.date.getFullYear() === today.getFullYear() &&
                cell.date.getMonth() === today.getMonth() &&
                cell.date.getDate() === today.getDate();
              const bgColor = getRecordsColor(count);
              const textColor = getTextColor(count);
              const isRipple = rippleCell === cell.key;
              const intensity = maxCount > 0 ? count / maxCount : 0;
              const actualBg =
                count === 0
                  ? 'transparent'
                  : count <= 2
                  ? 'rgba(91, 140, 90, 0.12)'
                  : count <= 5
                  ? `rgba(91, 140, 90, ${0.25 + intensity * 0.15})`
                  : `rgba(91, 140, 90, ${0.5 + intensity * 0.3})`;

              return (
                <div
                  key={cell.key}
                  onClick={(e) => handleCellClick(cell.date!, e)}
                  className="relative aspect-square sm:aspect-auto sm:h-20 rounded-lg sm:rounded-xl cursor-pointer overflow-hidden transition-all duration-200 hover:scale-[1.03] hover:shadow-md border border-transparent hover:border-primary/20 flex flex-col items-center justify-center p-1"
                  style={{ backgroundColor: actualBg }}
                >
                  <span
                    className={`text-xs sm:text-sm font-semibold leading-none mb-0.5 ${
                      count >= 6 ? 'text-white' : isToday ? 'text-primary' : 'text-app-text'
                    }`}
                    style={{ color: count >= 6 ? '#fff' : textColor }}
                  >
                    {cell.date.getDate()}
                  </span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] sm:text-xs leading-none font-medium ${
                        count >= 6 ? 'text-white/90' : 'text-primary'
                      }`}
                    >
                      {count} 条
                    </span>
                  )}
                  {isToday && count < 6 && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                  )}
                  {isRipple && (
                    <div
                      className="absolute left-1/2 top-1/2 w-4 h-4 rounded-full bg-primary/40 pointer-events-none"
                      style={{
                        animation: 'rippleExpand 0.5s ease-out forwards',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-6 mt-6 pt-4 border-t border-primary/5 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white border border-primary/10" />
              <span className="text-xs text-app-text-light">无记录</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(91, 140, 90, 0.12)' }} />
              <span className="text-xs text-app-text-light">1-2 条</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(91, 140, 90, 0.35)' }} />
              <span className="text-xs text-app-text-light">3-5 条</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(91, 140, 90, 0.7)' }} />
              <span className="text-xs text-app-text-light">6+ 条</span>
            </div>
          </div>
        </div>
      </div>

      <DateRecordsModal
        data={modalData}
        onClose={() => setModalData(null)}
        logs={
          modalData
            ? careLogs.filter((l) => {
                const logDate = new Date(l.date).toISOString().split('T')[0];
                return logDate === modalData.date;
              })
            : []
        }
        plants={plants}
      />
    </div>
  );
}
