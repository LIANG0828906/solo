export interface Course {
  id: string;
  name: string;
  teacher: string;
  classroom: string;
  dayOfWeek: number;
  startSlot: number;
  duration: number;
  weekType: 'all' | 'odd' | 'even';
  colorTag: 'major' | 'elective' | 'pe' | 'lab';
}

export type CourseInput = Omit<Course, 'id'>;

export type ColorTag = Course['colorTag'];
export type WeekType = Course['weekType'];

export const COLOR_MAP: Record<ColorTag, string> = {
  major: '#5B86E5',
  elective: '#A66CFF',
  pe: '#FF8A5C',
  lab: '#4ECDC4',
};

export const COLOR_LABEL: Record<ColorTag, string> = {
  major: '专业必修',
  elective: '通识选修',
  pe: '体育',
  lab: '实验',
};

export const WEEK_LABEL: Record<WeekType, string> = {
  all: '全周',
  odd: '单周',
  even: '双周',
};

export const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export const TOTAL_SLOTS = 26;
export const SLOT_MINUTES = 30;
export const START_HOUR = 8;

export function slotToTime(slot: number): string {
  const totalMinutes = START_HOUR * 60 + slot * SLOT_MINUTES;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
