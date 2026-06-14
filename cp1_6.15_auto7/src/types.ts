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
