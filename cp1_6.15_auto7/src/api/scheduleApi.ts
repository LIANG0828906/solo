import { Teacher, Course, Classroom, ScheduleEntry, TimeSlot, ConflictInfo } from '../types';

const API_BASE = '/api';

export async function fetchTeachers(): Promise<Teacher[]> {
  const res = await fetch(`${API_BASE}/teachers`);
  return res.json();
}

export async function createTeacher(data: { name: string; experience: number; subject: string }): Promise<Teacher> {
  const res = await fetch(`${API_BASE}/teachers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
  const res = await fetch(`${API_BASE}/teachers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteTeacher(id: string): Promise<void> {
  await fetch(`${API_BASE}/teachers/${id}`, { method: 'DELETE' });
}

export async function updateTeacherSlots(id: string, availableSlots: TimeSlot[]): Promise<Teacher> {
  const res = await fetch(`${API_BASE}/teachers/${id}/slots`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availableSlots }),
  });
  return res.json();
}

export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(`${API_BASE}/courses`);
  return res.json();
}

export async function createCourse(data: {
  name: string;
  grade: string;
  duration: number;
  requiredRoomType: string;
  preferredTeacherIds: string[];
  weeklyHours: number;
}): Promise<Course> {
  const res = await fetch(`${API_BASE}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<Course> {
  const res = await fetch(`${API_BASE}/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCourse(id: string): Promise<void> {
  await fetch(`${API_BASE}/courses/${id}`, { method: 'DELETE' });
}

export async function fetchClassrooms(): Promise<Classroom[]> {
  const res = await fetch(`${API_BASE}/classrooms`);
  return res.json();
}

export async function createClassroom(data: { name: string; capacity: number; type: string }): Promise<Classroom> {
  const res = await fetch(`${API_BASE}/classrooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateClassroom(id: string, data: Partial<Classroom>): Promise<Classroom> {
  const res = await fetch(`${API_BASE}/classrooms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteClassroom(id: string): Promise<void> {
  await fetch(`${API_BASE}/classrooms/${id}`, { method: 'DELETE' });
}

export async function fetchSchedule(): Promise<ScheduleEntry[]> {
  const res = await fetch(`${API_BASE}/schedule`);
  return res.json();
}

export async function autoSchedule(): Promise<{ schedule: ScheduleEntry[]; conflicts: string[] }> {
  const res = await fetch(`${API_BASE}/schedule/auto`, { method: 'POST' });
  return res.json();
}

export async function moveScheduleEntry(
  entryId: string,
  newDay: number,
  newStartSlot: number,
  newClassroomId?: string
): Promise<{ success: boolean; conflicts?: ConflictInfo[] }> {
  const res = await fetch(`${API_BASE}/schedule/${entryId}/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newDay, newStartSlot, newClassroomId }),
  });
  return res.json();
}

export async function deleteScheduleEntry(id: string): Promise<void> {
  await fetch(`${API_BASE}/schedule/${id}`, { method: 'DELETE' });
}

export async function fetchClassroomOccupancy(classroomId: string): Promise<ScheduleEntry[]> {
  const res = await fetch(`${API_BASE}/classrooms/${classroomId}/occupancy`);
  return res.json();
}
