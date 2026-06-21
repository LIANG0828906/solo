import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Schedule } from '@/shared/types';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function getSchedulesForDate(schedules: Schedule[], dateStr: string): Schedule[] {
  return schedules.filter((s) => s.date === dateStr);
}

function formatDateStr(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function getTagColor(count: number): string {
  if (count <= 3) return '#DBEAFE';
  if (count <= 6) return '#FED7AA';
  return '#FEE2E2';
}

function getTagTextColor(count: number): string {
  if (count <= 3) return '#1E40AF';
  if (count <= 6) return '#9A3412';
  return '#991B1B';
}

function hasTimeOverlap(a: Schedule, b: Schedule): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

function countConflicts(schedules: Schedule[]): number {
  let count = 0;
  const byDate = new Map<string, Schedule[]>();
  for (const s of schedules) {
    const list = byDate.get(s.date) || [];
    list.push(s);
    byDate.set(s.date, list);
  }
  for (const [, list] of byDate) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (hasTimeOverlap(list[i], list[j])) count++;
      }
    }
  }
  return count;
}

function MeetingTag({ schedule }: { schedule: Schedule }) {
  const color = getTagColor(schedule.participantIds.length);
  const textColor = getTagTextColor(schedule.participantIds.length);
  return (
    <span
      className="inline-block rounded-lg px-1.5 py-0.5 text-[11px] font-medium truncate max-w-full"
      style={{ backgroundColor: color, color: textColor }}
    >
      {schedule.title}
    </span>
  );
}

function DateCell({
  day,
  isCurrentMonth,
  schedules,
  isToday,
}: {
  day: number;
  isCurrentMonth: boolean;
  schedules: Schedule[];
  isToday: boolean;
}) {
  return (
    <div
      className={`min-h-[80px] border border-gray-100 p-1.5 transition-colors ${
        isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'
      } hover:bg-blue-50/40`}
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
          isToday
            ? 'bg-blue-500 font-semibold text-white'
            : isCurrentMonth
            ? 'text-gray-800'
            : 'text-gray-300'
        }`}
      >
        {day}
      </span>
      <div className="mt-0.5 flex flex-col gap-0.5 overflow-hidden">
        {schedules.map((s) => (
          <MeetingTag key={s.id} schedule={s} />
        ))}
      </div>
    </div>
  );
}

function MonthHeader({
  currentMonth,
  onPrev,
  onNext,
  direction,
}: {
  currentMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  direction: number;
}) {
  const monthName = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={onPrev}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-transform hover:scale-120 hover:bg-gray-100"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="relative h-7 w-40 overflow-hidden">
        <span
          key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}`}
          className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800 transition-all duration-300"
          style={{
            transform: direction === 0
              ? 'translateX(0)'
              : direction < 0
              ? 'translateX(0)'
              : 'translateX(0)',
            animation: direction < 0
              ? 'slideInLeft 0.3s ease'
              : direction > 0
              ? 'slideInRight 0.3s ease'
              : 'none',
          }}
        >
          {monthName}
        </span>
      </div>
      <button
        onClick={onNext}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-transform hover:scale-120 hover:bg-gray-100"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

function BottomBar({
  meetingCount,
  conflictCount,
}: {
  meetingCount: number;
  conflictCount: number;
}) {
  return (
    <div className="flex items-center gap-4 border-t border-gray-100 bg-white px-4 py-2.5 text-sm text-gray-600">
      <span>
        本月会议：<strong className="text-gray-800">{meetingCount}</strong> 场
      </span>
      {conflictCount > 0 && (
        <span className="flex items-center gap-1 text-red-500">
          <AlertCircle size={14} />
          <strong>{conflictCount}</strong> 场冲突
        </span>
      )}
    </div>
  );
}

export default function CalendarView() {
  const { schedules, currentMonth, setCurrentMonth } = useStore();
  const [direction, setDirection] = useState(0);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const firstDay = useMemo(() => getFirstDayOfMonth(year, month), [year, month]);

  const prevMonthDays = useMemo(() => {
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    return getDaysInMonth(py, pm);
  }, [year, month]);

  const today = useMemo(() => {
    const t = new Date();
    return formatDateStr(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const calendarCells = useMemo(() => {
    const cells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const pm = month === 0 ? 11 : month - 1;
      const py = month === 0 ? year - 1 : year;
      cells.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        dateStr: formatDateStr(py, pm, prevMonthDays - i),
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        isCurrentMonth: true,
        dateStr: formatDateStr(year, month, d),
      });
    }

    const remaining = 42 - cells.length;
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        isCurrentMonth: false,
        dateStr: formatDateStr(ny, nm, d),
      });
    }

    return cells;
  }, [year, month, daysInMonth, firstDay, prevMonthDays]);

  const meetingCount = useMemo(
    () =>
      schedules.filter((s) => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length,
    [schedules, year, month]
  );

  const conflictCount = useMemo(
    () =>
      countConflicts(
        schedules.filter((s) => {
          const d = new Date(s.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
      ),
    [schedules, year, month]
  );

  const navigate = useCallback(
    (dir: -1 | 1) => {
      setDirection(dir);
      const next = new Date(year, month + dir, 1);
      setCurrentMonth(next);
    },
    [year, month, setCurrentMonth]
  );

  const weeks = useMemo(() => {
    const result: typeof calendarCells[] = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      result.push(calendarCells.slice(i, i + 7));
    }
    return result;
  }, [calendarCells]);

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <MonthHeader
        currentMonth={currentMonth}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        direction={direction}
      />
      <div className="flex-1 overflow-auto px-4 pb-2">
        <div className="grid grid-cols-7 rounded-t-lg border border-gray-100 bg-white text-center text-xs font-medium text-gray-500">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div
          key={`${year}-${month}`}
          className="transition-all duration-300"
          style={{
            animation:
              direction < 0
                ? 'slideInLeft 0.3s ease'
                : direction > 0
                ? 'slideInRight 0.3s ease'
                : 'none',
          }}
        >
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((cell, di) => (
                <DateCell
                  key={`${wi}-${di}`}
                  day={cell.day}
                  isCurrentMonth={cell.isCurrentMonth}
                  schedules={getSchedulesForDate(schedules, cell.dateStr)}
                  isToday={cell.dateStr === today}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <BottomBar meetingCount={meetingCount} conflictCount={conflictCount} />
    </div>
  );
}
