import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface CareRecord {
  id: string;
  plantId: string;
  type: 'watering' | 'fertilizing' | 'repotting';
  date: string;
  notes: string;
  completed: boolean;
  createdAt: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
}

export interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface CalendarEvent {
  recordId: string;
  plantId: string;
  plantName: string;
  type: 'watering' | 'fertilizing' | 'repotting';
  completed: boolean;
  notes: string;
}

export const CARE_TYPE_COLORS: Record<string, string> = {
  watering: 'var(--watering-color)',
  fertilizing: 'var(--fertilizing-color)',
  repotting: 'var(--repotting-color)'
};

export const CARE_TYPE_LABELS: Record<string, string> = {
  watering: '浇水',
  fertilizing: '施肥',
  repotting: '换盆'
};

export const CARE_TYPE_ICONS: Record<string, string> = {
  watering: '💧',
  fertilizing: '🧪',
  repotting: '🪴'
};

export const generateCalendarDays = (
  currentDate: Date,
  records: CareRecord[],
  plants: Plant[]
): CalendarDay[] => {
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  
  const startDay = start.getDay();
  const adjustedStart = new Date(start);
  adjustedStart.setDate(start.getDate() - startDay);
  
  const endDay = end.getDay();
  const adjustedEnd = new Date(end);
  adjustedEnd.setDate(end.getDate() + (6 - endDay));
  
  const days = eachDayOfInterval({ start: adjustedStart, end: adjustedEnd });
  
  const plantMap = new Map(plants.map(p => [p.id, p]));
  
  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayRecords = records.filter(r => r.date === dateStr);
    
    const events: CalendarEvent[] = dayRecords.map(record => {
      const plant = plantMap.get(record.plantId);
      return {
        recordId: record.id,
        plantId: record.plantId,
        plantName: plant?.name || '未知植物',
        type: record.type,
        completed: record.completed,
        notes: record.notes
      };
    });
    
    return {
      date,
      dateStr,
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isToday(date),
      events
    };
  });
};

export const getMonthLabel = (date: Date): string => {
  return format(date, 'yyyy年MM月', { locale: zhCN });
};

export const getWeekdayLabels = (): string[] => {
  return ['日', '一', '二', '三', '四', '五', '六'];
};

export const navigateMonth = (current: Date, direction: 'prev' | 'next'): Date => {
  return direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1);
};

export const getEventsByDate = (
  date: Date,
  records: CareRecord[],
  plants: Plant[]
): CalendarEvent[] => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayRecords = records.filter(r => r.date === dateStr);
  const plantMap = new Map(plants.map(p => [p.id, p]));
  
  return dayRecords.map(record => {
    const plant = plantMap.get(record.plantId);
    return {
      recordId: record.id,
      plantId: record.plantId,
      plantName: plant?.name || '未知植物',
      type: record.type,
      completed: record.completed,
      notes: record.notes
    };
  });
};

export const groupRecordsByMonth = (records: CareRecord[]): Map<string, CareRecord[]> => {
  const grouped = new Map<string, CareRecord[]>();
  
  records.forEach(record => {
    const monthKey = format(new Date(record.date), 'yyyy-MM');
    const existing = grouped.get(monthKey) || [];
    existing.push(record);
    grouped.set(monthKey, existing);
  });
  
  return grouped;
};
