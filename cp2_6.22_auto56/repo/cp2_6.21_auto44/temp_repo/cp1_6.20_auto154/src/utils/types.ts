export type CourseType = '瑜伽' | '普拉提' | '动感单车' | '力量训练';

export interface TimeSlot {
  id: number;
  label: string;
  start: string;
  end: string;
}

export interface BookingData {
  id: string;
  date: string;
  timeSlot: number;
  courseType: CourseType;
  coachId: string;
  coachName: string;
  bookings: number;
  capacity: number;
}

export interface HeatmapDataPoint {
  date: string;
  timeSlot: number;
  value: number;
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  specialties: CourseType[];
}

export interface ScheduleItem {
  id: string;
  date: string;
  timeSlot: number;
  courseType: CourseType;
  coachId: string;
  coachName: string;
  capacity: number;
}

export interface ConflictInfo {
  id: string;
  type: 'coach' | 'time';
  message: string;
  itemIds: string[];
}

export interface HeatmapResponse {
  period: 'week' | 'month';
  data: HeatmapDataPoint[];
  minValue: number;
  maxValue: number;
}

export interface ScheduleResponse {
  schedule: ScheduleItem[];
  conflicts: ConflictInfo[];
}

export interface StatsSummary {
  totalBookings: number;
  avgAttendance: number;
  peakTimeSlot: string;
  conflictCount: number;
}

export interface CourseRankingItem {
  type: string;
  count: number;
}

export const TIME_SLOTS: TimeSlot[] = [
  { id: 0, label: '08:00-09:00', start: '08:00', end: '09:00' },
  { id: 1, label: '09:00-10:00', start: '09:00', end: '10:00' },
  { id: 2, label: '10:00-11:00', start: '10:00', end: '11:00' },
  { id: 3, label: '11:00-12:00', start: '11:00', end: '12:00' },
  { id: 4, label: '12:00-13:00', start: '12:00', end: '13:00' },
  { id: 5, label: '14:00-15:00', start: '14:00', end: '15:00' },
  { id: 6, label: '15:00-16:00', start: '15:00', end: '16:00' },
  { id: 7, label: '16:00-17:00', start: '16:00', end: '17:00' },
  { id: 8, label: '17:00-18:00', start: '17:00', end: '18:00' },
];

export const COURSE_CAPACITY = 20;

export const INSTRUCTORS: Instructor[] = [
  {
    id: 'coach_1',
    name: '张教练',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoachZhang',
    specialties: ['瑜伽', '普拉提'],
  },
  {
    id: 'coach_2',
    name: '李教练',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoachLi',
    specialties: ['动感单车', '力量训练'],
  },
  {
    id: 'coach_3',
    name: '王教练',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoachWang',
    specialties: ['瑜伽', '动感单车'],
  },
  {
    id: 'coach_4',
    name: '赵教练',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoachZhao',
    specialties: ['普拉提', '力量训练'],
  },
  {
    id: 'coach_5',
    name: '陈教练',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoachChen',
    specialties: ['瑜伽', '普拉提', '力量训练'],
  },
];
