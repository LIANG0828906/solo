import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useReadingStore } from '../../stores/readingStore';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export const CalendarHeatmap = () => {
  const { getSessionsByDate } = useReadingStore();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetails, setDayDetails] = useState<{ bookTitle: string; pages: number; duration: number }[]>([]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentDate]);

  const pagesByDay = useMemo(() => {
    const map = new Map<string, number>();
    const { books } = useReadingStore.getState();

    books.forEach((book) => {
      book.sessions.forEach((session) => {
        const pages = session.endPage - session.startPage;
        map.set(session.date, (map.get(session.date) || 0) + pages);
      });
    });

    return map;
  }, []);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDayColor = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const pages = pagesByDay.get(dateStr) || 0;

    if (pages === 0) return 'bg-primary-card/50';
    if (pages < 20) return 'bg-primary-card';
    if (pages < 50) return 'bg-[#1A3A5C]';
    if (pages < 80) return 'bg-[#2A5A8C]';
    if (pages < 100) return 'bg-accent-teal/60';
    return 'bg-accent-teal';
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const details = getSessionsByDate(dateStr);
    setSelectedDate(dateStr);
    setDayDetails(details);
  };

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  return (
    <div className="bg-primary-card rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          阅读日历
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-md bg-primary-dark hover:bg-primary-dark/80 text-text-secondary hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-white text-sm font-medium min-w-[100px] text-center">
            {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-md bg-primary-dark hover:bg-primary-dark/80 text-text-secondary hover:text-white transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-text-secondary text-xs py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const pages = pagesByDay.get(dateStr) || 0;

          return (
            <div
              key={day}
              onClick={() => pages > 0 && handleDayClick(day)}
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-all ${
                pages > 0 ? 'cursor-pointer hover:scale-105' : ''
              } ${getDayColor(day)}`}
            >
              <span className={`${pages > 0 ? 'text-white' : 'text-text-secondary/50'}`}>
                {day}
              </span>
              {pages > 0 && (
                <span className="text-[10px] text-white/80 font-medium">{pages}页</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-text-secondary">
        <span>少</span>
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded bg-primary-card/50" />
          <div className="w-5 h-5 rounded bg-[#1A3A5C]" />
          <div className="w-5 h-5 rounded bg-[#2A5A8C]" />
          <div className="w-5 h-5 rounded bg-accent-teal/60" />
          <div className="w-5 h-5 rounded bg-accent-teal" />
        </div>
        <span>多</span>
      </div>

      {selectedDate && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 flex items-center justify-center p-4"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="bg-primary-dark/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-md border border-accent/20 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-white">{selectedDate} 阅读记录</h4>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {dayDetails.length === 0 ? (
              <p className="text-text-secondary text-center py-8">当天没有阅读记录</p>
            ) : (
              <div className="space-y-3">
                {dayDetails.map((detail, idx) => (
                  <div
                    key={idx}
                    className="bg-primary-card rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-white font-medium">{detail.bookTitle}</p>
                      <p className="text-text-secondary text-sm">{detail.pages} 页</p>
                    </div>
                    <div className="text-accent font-semibold">
                      {detail.duration} 分钟
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-primary-dark flex justify-between items-center">
                  <span className="text-text-secondary">总计</span>
                  <div className="text-right">
                    <span className="text-white font-bold">
                      {dayDetails.reduce((sum, d) => sum + d.pages, 0)} 页
                    </span>
                    <span className="text-text-secondary mx-2">/</span>
                    <span className="text-accent font-bold">
                      {dayDetails.reduce((sum, d) => sum + d.duration, 0)} 分钟
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
