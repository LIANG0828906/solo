import { v4 as uuidv4 } from 'uuid';
import {
  teachers,
  courses,
  classrooms,
  schedule,
  type TimeSlot,
  type Teacher,
  type Course,
  type Classroom,
  type ScheduleEntry,
  type ConflictInfo,
} from '../models/dataStore.js';

function slotsOverlap(start1: number, duration1: number, start2: number, duration2: number): boolean {
  return start1 < start2 + duration2 && start2 < start1 + duration1;
}

export function getAllTeachers(): Teacher[] {
  return Array.from(teachers.values());
}

export function createTeacher(data: { name: string; experience: number; subject: string }): Teacher {
  const teacher: Teacher = {
    id: uuidv4(),
    name: data.name,
    experience: data.experience,
    subject: data.subject,
    availableSlots: [],
  };
  teachers.set(teacher.id, teacher);
  return teacher;
}

export function updateTeacher(id: string, data: Partial<Teacher>): Teacher | null {
  const teacher = teachers.get(id);
  if (!teacher) return null;
  if (data.name !== undefined) teacher.name = data.name;
  if (data.experience !== undefined) teacher.experience = data.experience;
  if (data.subject !== undefined) teacher.subject = data.subject;
  teachers.set(id, teacher);
  return teacher;
}

export function deleteTeacher(id: string): boolean {
  if (!teachers.has(id)) return false;
  teachers.delete(id);
  for (const [entryId, entry] of schedule) {
    if (entry.teacherId === id) {
      schedule.delete(entryId);
    }
  }
  return true;
}

export function updateTeacherSlots(id: string, slots: TimeSlot[]): Teacher | null {
  const teacher = teachers.get(id);
  if (!teacher) return null;
  teacher.availableSlots = slots;
  teachers.set(id, teacher);
  return teacher;
}

export function getAllCourses(): Course[] {
  return Array.from(courses.values());
}

export function createCourse(data: { name: string; grade: string; duration: number; requiredRoomType: string; preferredTeacherIds: string[]; weeklyHours: number }): Course {
  const course: Course = {
    id: uuidv4(),
    name: data.name,
    grade: data.grade,
    duration: data.duration,
    requiredRoomType: data.requiredRoomType,
    preferredTeacherIds: data.preferredTeacherIds,
    weeklyHours: data.weeklyHours,
  };
  courses.set(course.id, course);
  return course;
}

export function updateCourse(id: string, data: Partial<Course>): Course | null {
  const course = courses.get(id);
  if (!course) return null;
  if (data.name !== undefined) course.name = data.name;
  if (data.grade !== undefined) course.grade = data.grade;
  if (data.duration !== undefined) course.duration = data.duration;
  if (data.requiredRoomType !== undefined) course.requiredRoomType = data.requiredRoomType;
  if (data.preferredTeacherIds !== undefined) course.preferredTeacherIds = data.preferredTeacherIds;
  if (data.weeklyHours !== undefined) course.weeklyHours = data.weeklyHours;
  courses.set(id, course);
  return course;
}

export function deleteCourse(id: string): boolean {
  if (!courses.has(id)) return false;
  courses.delete(id);
  for (const [entryId, entry] of schedule) {
    if (entry.courseId === id) {
      schedule.delete(entryId);
    }
  }
  return true;
}

export function getAllClassrooms(): Classroom[] {
  return Array.from(classrooms.values());
}

export function createClassroom(data: { name: string; capacity: number; type: string }): Classroom {
  const classroom: Classroom = {
    id: uuidv4(),
    name: data.name,
    capacity: data.capacity,
    type: data.type,
  };
  classrooms.set(classroom.id, classroom);
  return classroom;
}

export function updateClassroom(id: string, data: Partial<Classroom>): Classroom | null {
  const classroom = classrooms.get(id);
  if (!classroom) return null;
  if (data.name !== undefined) classroom.name = data.name;
  if (data.capacity !== undefined) classroom.capacity = data.capacity;
  if (data.type !== undefined) classroom.type = data.type;
  classrooms.set(id, classroom);
  return classroom;
}

export function deleteClassroom(id: string): boolean {
  if (!classrooms.has(id)) return false;
  classrooms.delete(id);
  for (const [entryId, entry] of schedule) {
    if (entry.classroomId === id) {
      schedule.delete(entryId);
    }
  }
  return true;
}

export function getAllSchedule(): ScheduleEntry[] {
  return Array.from(schedule.values());
}

export function getClassroomOccupancy(classroomId: string): ScheduleEntry[] {
  return Array.from(schedule.values()).filter(e => e.classroomId === classroomId);
}

export function autoSchedule(): { schedule: ScheduleEntry[]; conflicts: string[] } {
  schedule.clear();

  const sessions: { course: Course; sessionIndex: number }[] = [];
  for (const course of courses.values()) {
    for (let i = 0; i < course.weeklyHours; i++) {
      sessions.push({ course, sessionIndex: i + 1 });
    }
  }

  const roomTypeSpecificity: Record<string, number> = { lab: 2, multimedia: 1, normal: 0 };
  sessions.sort((a, b) => {
    const prefDiff = a.course.preferredTeacherIds.length - b.course.preferredTeacherIds.length;
    if (prefDiff !== 0) return prefDiff;
    const specA = roomTypeSpecificity[a.course.requiredRoomType] ?? 0;
    const specB = roomTypeSpecificity[b.course.requiredRoomType] ?? 0;
    return specB - specA;
  });

  const teacherAssignmentCounts = new Map<string, number>();
  const classroomUsageCounts = new Map<string, number>();
  for (const t of teachers.keys()) teacherAssignmentCounts.set(t, 0);
  for (const c of classrooms.keys()) classroomUsageCounts.set(c, 0);

  const conflicts: string[] = [];

  for (const session of sessions) {
    const { course, sessionIndex } = session;
    const preferredTeachers = course.preferredTeacherIds
      .map(id => ({ id, teacher: teachers.get(id) }))
      .filter(t => t.teacher !== undefined)
      .sort((a, b) => (teacherAssignmentCounts.get(a.id) ?? 0) - (teacherAssignmentCounts.get(b.id) ?? 0));

    let placed = false;

    for (const { id: teacherId, teacher } of preferredTeachers) {
      for (let day = 0; day < 5; day++) {
        const availableOnDay = teacher!.availableSlots.filter(s => s.day === day);

        for (const slot of availableOnDay) {
          for (let startSlot = slot.startSlot; startSlot + course.duration <= slot.endSlot; startSlot++) {
            const teacherBusy = Array.from(schedule.values()).some(
              e => e.teacherId === teacherId && e.day === day && slotsOverlap(e.startSlot, getCourseDuration(e.courseId), startSlot, course.duration)
            );
            if (teacherBusy) continue;

            const matchingClassrooms = Array.from(classrooms.values())
              .filter(c => c.type === course.requiredRoomType)
              .sort((a, b) => (classroomUsageCounts.get(a.id) ?? 0) - (classroomUsageCounts.get(b.id) ?? 0));

            for (const classroom of matchingClassrooms) {
              const classroomBusy = Array.from(schedule.values()).some(
                e => e.classroomId === classroom.id && e.day === day && slotsOverlap(e.startSlot, getCourseDuration(e.courseId), startSlot, course.duration)
              );
              if (classroomBusy) continue;

              const entry: ScheduleEntry = {
                id: uuidv4(),
                courseId: course.id,
                teacherId,
                classroomId: classroom.id,
                day,
                startSlot,
              };
              schedule.set(entry.id, entry);
              teacherAssignmentCounts.set(teacherId, (teacherAssignmentCounts.get(teacherId) ?? 0) + 1);
              classroomUsageCounts.set(classroom.id, (classroomUsageCounts.get(classroom.id) ?? 0) + 1);
              placed = true;
              break;
            }
            if (placed) break;
          }
          if (placed) break;
        }
        if (placed) break;
      }
      if (placed) break;
    }

    if (!placed) {
      conflicts.push(`课程 ${course.name} 第${sessionIndex}节课无法排入`);
    }
  }

  return { schedule: Array.from(schedule.values()), conflicts };
}

function getCourseDuration(courseId: string): number {
  const course = courses.get(courseId);
  return course ? course.duration : 1;
}

export function moveScheduleEntry(
  entryId: string,
  newDay: number,
  newStartSlot: number,
  newClassroomId?: string
): { success: boolean; conflicts?: ConflictInfo[] } {
  const entry = schedule.get(entryId);
  if (!entry) return { success: false };

  const course = courses.get(entry.courseId);
  if (!course) return { success: false };

  const targetClassroomId = newClassroomId ?? entry.classroomId;
  const duration = course.duration;
  const conflictList: ConflictInfo[] = [];

  for (const existing of schedule.values()) {
    if (existing.id === entryId) continue;

    if (existing.teacherId === entry.teacherId && existing.day === newDay) {
      const existingDuration = getCourseDuration(existing.courseId);
      if (slotsOverlap(newStartSlot, duration, existing.startSlot, existingDuration)) {
        conflictList.push({
          type: 'teacher',
          message: `教师冲突：该教师在第${newDay + 1}天 ${existing.startSlot} 节已有课程安排`,
          existingEntry: existing,
        });
      }
    }

    if (existing.classroomId === targetClassroomId && existing.day === newDay) {
      const existingDuration = getCourseDuration(existing.courseId);
      if (slotsOverlap(newStartSlot, duration, existing.startSlot, existingDuration)) {
        conflictList.push({
          type: 'classroom',
          message: `教室冲突：该教室在第${newDay + 1}天 ${existing.startSlot} 节已被占用`,
          existingEntry: existing,
        });
      }
    }
  }

  if (conflictList.length > 0) {
    return { success: false, conflicts: conflictList };
  }

  entry.day = newDay;
  entry.startSlot = newStartSlot;
  entry.classroomId = targetClassroomId;
  schedule.set(entryId, entry);
  return { success: true };
}

export function deleteScheduleEntry(id: string): boolean {
  if (!schedule.has(id)) return false;
  schedule.delete(id);
  return true;
}
