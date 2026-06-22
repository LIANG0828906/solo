import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export type CourseType = '哈他' | '流' | '阿斯汤加' | '阴瑜伽';

export interface BookingData {
  date: string;
  timeSlot: number;
  courseType: CourseType;
  bookings: number;
  capacity: number;
  instructorId: string;
}

export interface ScheduleItem {
  id: string;
  date: string;
  timeSlot: number;
  courseType: CourseType;
  instructorId: string;
}

export interface Instructor {
  id: string;
  name: string;
}

export interface ConflictInfo {
  date: string;
  timeSlot: number;
  instructorId: string;
  items: ScheduleItem[];
}

export interface HeatmapResponse {
  period: 'week' | 'month';
  startDate: string;
  endDate: string;
  data: BookingData[];
  summary: {
    totalBookings: number;
    avgAttendance: number;
    peakTimeSlot: number;
    conflictCount: number;
  };
  courseRankings: { type: CourseType; count: number }[];
}

export interface ScheduleResponse {
  weekStart: string;
  instructors: Instructor[];
  schedule: ScheduleItem[];
  conflicts: ConflictInfo[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');

export const COURSE_TYPES: CourseType[] = ['哈他', '流', '阿斯汤加', '阴瑜伽'];
export const INSTRUCTORS: Instructor[] = [
  { id: 'ins-001', name: '李静雅' },
  { id: 'ins-002', name: '王晨阳' },
  { id: 'ins-003', name: '张雨薇' },
  { id: 'ins-004', name: '陈明远' },
  { id: 'ins-005', name: '刘思琪' },
];
export const TIME_SLOTS_COUNT = 9;
export const CAPACITY = 20;

const MIN_BOOKINGS = 2;
const MAX_BOOKINGS = 18;

let bookingsCache: BookingData[] | null = null;
let scheduleCache: ScheduleItem[] | null = null;

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readJSON<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function generateBookings(weeks: number = 4): BookingData[] {
  const bookings: BookingData[] = [];
  const days = weeks * 7;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentDate = formatDate(addDays(startDate, dayOffset));
    
    for (let slot = 0; slot < TIME_SLOTS_COUNT; slot++) {
      const instructor = INSTRUCTORS[getRandomInt(0, INSTRUCTORS.length - 1)];
      const courseType = COURSE_TYPES[getRandomInt(0, COURSE_TYPES.length - 1)];
      
      bookings.push({
        date: currentDate,
        timeSlot: slot,
        courseType,
        bookings: getRandomInt(MIN_BOOKINGS, MAX_BOOKINGS),
        capacity: CAPACITY,
        instructorId: instructor.id,
      });
    }
  }

  return bookings;
}

export function generateSchedule(): ScheduleItem[] {
  const schedule: ScheduleItem[] = [];
  const days = 7;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentDate = formatDate(addDays(startDate, dayOffset));
    
    for (let slot = 0; slot < TIME_SLOTS_COUNT; slot++) {
      const instructor = INSTRUCTORS[getRandomInt(0, INSTRUCTORS.length - 1)];
      const courseType = COURSE_TYPES[getRandomInt(0, COURSE_TYPES.length - 1)];
      
      schedule.push({
        id: uuidv4(),
        date: currentDate,
        timeSlot: slot,
        courseType,
        instructorId: instructor.id,
      });
    }
  }

  return schedule;
}

export function detectConflicts(schedule: ScheduleItem[]): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];
  const instructorTimeMap = new Map<string, ScheduleItem[]>();

  for (const item of schedule) {
    const key = `${item.date}-${item.timeSlot}-${item.instructorId}`;
    const existing = instructorTimeMap.get(key) || [];
    instructorTimeMap.set(key, [...existing, item]);
  }

  for (const [key, items] of instructorTimeMap.entries()) {
    if (items.length > 1) {
      const [date, timeSlot, instructorId] = key.split('-');
      conflicts.push({
        date,
        timeSlot: parseInt(timeSlot, 10),
        instructorId,
        items,
      });
    }
  }

  return conflicts;
}

export async function getHeatmapData(period: 'week' | 'month'): Promise<HeatmapResponse> {
  if (!bookingsCache) {
    bookingsCache = await readJSON<BookingData[]>(BOOKINGS_FILE);
    if (!bookingsCache) {
      bookingsCache = generateBookings();
      await writeJSON(BOOKINGS_FILE, bookingsCache);
    }
  }

  const weeks = period === 'week' ? 1 : 4;
  const days = weeks * 7;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = addDays(startDate, days - 1);
  const startDateStr = formatDate(startDate);
  const endDateStr = formatDate(endDate);

  const data = bookingsCache.filter(b => {
    const bookingDate = new Date(b.date);
    return bookingDate >= startDate && bookingDate <= endDate;
  });

  const totalBookings = data.reduce((sum, b) => sum + b.bookings, 0);
  const avgAttendance = data.length > 0 ? Math.round((totalBookings / data.length) * 10) / 10 : 0;

  const timeSlotBookings = new Map<number, number>();
  for (const b of data) {
    const current = timeSlotBookings.get(b.timeSlot) || 0;
    timeSlotBookings.set(b.timeSlot, current + b.bookings);
  }
  let peakTimeSlot = 0;
  let maxBookings = 0;
  for (const [slot, count] of timeSlotBookings.entries()) {
    if (count > maxBookings) {
      maxBookings = count;
      peakTimeSlot = slot;
    }
  }

  const courseCountMap = new Map<CourseType, number>();
  for (const b of data) {
    const current = courseCountMap.get(b.courseType) || 0;
    courseCountMap.set(b.courseType, current + 1);
  }
  const courseRankings = Array.from(courseCountMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const schedule = await readJSON<ScheduleItem[]>(SCHEDULE_FILE);
  const conflictCount = schedule ? detectConflicts(schedule).length : 0;

  return {
    period,
    startDate: startDateStr,
    endDate: endDateStr,
    data,
    summary: {
      totalBookings,
      avgAttendance,
      peakTimeSlot,
      conflictCount,
    },
    courseRankings,
  };
}

export async function getScheduleData(): Promise<ScheduleResponse> {
  if (!scheduleCache) {
    scheduleCache = await readJSON<ScheduleItem[]>(SCHEDULE_FILE);
    if (!scheduleCache) {
      scheduleCache = generateSchedule();
      await writeJSON(SCHEDULE_FILE, scheduleCache);
    }
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const weekStart = formatDate(startDate);

  const conflicts = detectConflicts(scheduleCache);

  return {
    weekStart,
    instructors: INSTRUCTORS,
    schedule: scheduleCache,
    conflicts,
  };
}

export async function updateScheduleItem(
  itemId: string,
  newDate: string,
  newTimeSlot: number
): Promise<ScheduleResponse> {
  if (!scheduleCache) {
    scheduleCache = await readJSON<ScheduleItem[]>(SCHEDULE_FILE);
    if (!scheduleCache) {
      scheduleCache = generateSchedule();
    }
  }

  const itemIndex = scheduleCache.findIndex(item => item.id === itemId);
  if (itemIndex !== -1) {
    scheduleCache[itemIndex] = {
      ...scheduleCache[itemIndex],
      date: newDate,
      timeSlot: newTimeSlot,
    };
    await writeJSON(SCHEDULE_FILE, scheduleCache);
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const weekStart = formatDate(startDate);

  const conflicts = detectConflicts(scheduleCache);

  return {
    weekStart,
    instructors: INSTRUCTORS,
    schedule: scheduleCache,
    conflicts,
  };
}

export async function regenerateAllData(): Promise<void> {
  bookingsCache = generateBookings();
  scheduleCache = generateSchedule();

  await writeJSON(BOOKINGS_FILE, bookingsCache);
  await writeJSON(SCHEDULE_FILE, scheduleCache);
}
