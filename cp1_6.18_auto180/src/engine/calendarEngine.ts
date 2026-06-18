import type { Task, TaskType } from '../stores/plantStore';

export interface CalendarCell {
  date: Date;
  dateStr: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  taskTypes: TaskType[];
  isOverdue: boolean;
}

export interface CalendarData {
  year: number;
  month: number;
  monthName: string;
  cells: CalendarCell[][];
  weekDays: string[];
}

const weekDaysCN = ['日', '一', '二', '三', '四', '五', '六'];
const monthNamesCN = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function generateCalendar(year: number, month: number, tasks: Task[]): CalendarData {
  const today = new Date();
  const todayStr = formatDate(today);

  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();

  const startDate = new Date(year, month, 1 - startDayOfWeek);

  const cells: CalendarCell[][] = [];

  for (let row = 0; row < 6; row++) {
    const rowCells: CalendarCell[] = [];
    for (let col = 0; col < 7; col++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + row * 7 + col);
      const dateStr = formatDate(date);

      const dayTasks = tasks.filter(t => t.date === dateStr);
      const taskTypes = Array.from(new Set(dayTasks.map(t => t.type)));

      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const isOverdue = dayTasks.some(t => {
        if (t.completed) return false;
        const taskDate = new Date(t.date);
        return taskDate < twoDaysAgo;
      });

      rowCells.push({
        date,
        dateStr,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: isSameDate(date, today),
        tasks: dayTasks,
        taskTypes,
        isOverdue,
      });
    }
    cells.push(rowCells);
  }

  return {
    year,
    month,
    monthName: monthNamesCN[month],
    cells,
    weekDays: weekDaysCN,
  };
}

export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}

export function getTodayYearMonth(): { year: number; month: number } {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() };
}
