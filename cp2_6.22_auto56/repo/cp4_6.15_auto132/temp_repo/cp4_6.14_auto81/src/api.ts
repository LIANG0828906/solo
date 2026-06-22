const BASE_URL = '/api';

export interface Course {
  id: string;
  name: string;
  description: string;
  instructor: string;
  averageRating: number;
  totalStudents: number;
  participationRate: number;
}

export interface Feedback {
  id: string;
  courseId: string;
  rating: number;
  comment: string;
  timestamp: string;
  studentName: string;
}

export interface ParticipationData {
  date: string;
  count: number;
}

export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(`${BASE_URL}/courses`);
  if (!res.ok) throw new Error('Failed to fetch courses');
  return res.json();
}

export async function fetchFeedback(courseId?: string, page: number = 1, limit: number = 20): Promise<{ data: Feedback[]; total: number }> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (courseId) params.set('courseId', courseId);
  const res = await fetch(`${BASE_URL}/feedback?${params}`);
  if (!res.ok) throw new Error('Failed to fetch feedback');
  return res.json();
}

export async function fetchParticipation(courseId: string): Promise<ParticipationData[]> {
  const res = await fetch(`${BASE_URL}/participation/${courseId}`);
  if (!res.ok) throw new Error('Failed to fetch participation');
  return res.json();
}

export async function submitFeedback(data: { courseId: string; rating: number; comment: string }): Promise<Feedback> {
  const res = await fetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
}
