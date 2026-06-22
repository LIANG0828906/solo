export interface TimeSlot {
  day: number;
  startSlot: number;
  endSlot: number;
}

export interface Teacher {
  id: string;
  name: string;
  experience: number;
  subject: string;
  availableSlots: TimeSlot[];
}

export interface Course {
  id: string;
  name: string;
  grade: string;
  duration: number;
  requiredRoomType: string;
  preferredTeacherIds: string[];
  weeklyHours: number;
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  type: string;
}

export interface ScheduleEntry {
  id: string;
  courseId: string;
  teacherId: string;
  classroomId: string;
  day: number;
  startSlot: number;
}

export interface ConflictInfo {
  type: 'teacher' | 'classroom';
  message: string;
  existingEntry: ScheduleEntry;
}

const teacher1Id = 't1';
const teacher2Id = 't2';
const teacher3Id = 't3';

const course1Id = 'c1';
const course2Id = 'c2';
const course3Id = 'c3';

const classroom1Id = 'r1';
const classroom2Id = 'r2';
const classroom3Id = 'r3';

export const teachers = new Map<string, Teacher>([
  [teacher1Id, {
    id: teacher1Id,
    name: '张老师',
    experience: 10,
    subject: '数学',
    availableSlots: [
      { day: 0, startSlot: 0, endSlot: 8 },
      { day: 2, startSlot: 0, endSlot: 8 },
      { day: 1, startSlot: 0, endSlot: 6 },
      { day: 3, startSlot: 0, endSlot: 6 },
    ],
  }],
  [teacher2Id, {
    id: teacher2Id,
    name: '李老师',
    experience: 8,
    subject: '物理',
    availableSlots: [
      { day: 0, startSlot: 0, endSlot: 8 },
      { day: 1, startSlot: 0, endSlot: 8 },
      { day: 2, startSlot: 0, endSlot: 8 },
      { day: 3, startSlot: 0, endSlot: 8 },
    ],
  }],
  [teacher3Id, {
    id: teacher3Id,
    name: '王老师',
    experience: 5,
    subject: '化学',
    availableSlots: [
      { day: 0, startSlot: 0, endSlot: 6 },
      { day: 2, startSlot: 0, endSlot: 6 },
      { day: 4, startSlot: 0, endSlot: 6 },
    ],
  }],
]);

export const courses = new Map<string, Course>([
  [course1Id, {
    id: course1Id,
    name: '高一数学',
    grade: '高一',
    duration: 2,
    requiredRoomType: 'normal',
    preferredTeacherIds: [teacher1Id],
    weeklyHours: 4,
  }],
  [course2Id, {
    id: course2Id,
    name: '高二物理',
    grade: '高二',
    duration: 2,
    requiredRoomType: 'lab',
    preferredTeacherIds: [teacher2Id],
    weeklyHours: 3,
  }],
  [course3Id, {
    id: course3Id,
    name: '高一化学',
    grade: '高一',
    duration: 2,
    requiredRoomType: 'lab',
    preferredTeacherIds: [teacher3Id],
    weeklyHours: 2,
  }],
]);

export const classrooms = new Map<string, Classroom>([
  [classroom1Id, {
    id: classroom1Id,
    name: '101教室',
    capacity: 50,
    type: 'normal',
  }],
  [classroom2Id, {
    id: classroom2Id,
    name: '实验室A',
    capacity: 30,
    type: 'lab',
  }],
  [classroom3Id, {
    id: classroom3Id,
    name: '多媒体教室1',
    capacity: 40,
    type: 'multimedia',
  }],
]);

export const schedule = new Map<string, ScheduleEntry>();
