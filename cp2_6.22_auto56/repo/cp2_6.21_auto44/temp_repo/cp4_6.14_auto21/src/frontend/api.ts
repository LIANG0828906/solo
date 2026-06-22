import axios from 'axios';
import {
  Instructor,
  Course,
  Learner,
  CreateCourseRequest,
  CreateCourseResponse,
  LearnerProgress,
  AssessmentResponse,
  AnalyticsStats,
  TimeSlotStat,
} from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const instructorApi = {
  getInstructors: (): Promise<Instructor[]> =>
    api.get('/instructors').then((res) => res.data),
};

export const courseApi = {
  getCourses: (): Promise<Course[]> =>
    api.get('/courses').then((res) => res.data),

  getSchedule: (): Promise<Course[]> =>
    api.get('/courses/schedule').then((res) => res.data),

  createCourse: (data: CreateCourseRequest): Promise<CreateCourseResponse> =>
    api.post('/courses', data).then((res) => res.data),

  updateCourse: (
    id: string,
    data: Partial<CreateCourseRequest>
  ): Promise<CreateCourseResponse> =>
    api.put(`/courses/${id}`, data).then((res) => res.data),

  deleteCourse: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/courses/${id}`).then((res) => res.data),
};

export const learnerApi = {
  getLearners: (): Promise<Learner[]> =>
    api.get('/learners').then((res) => res.data),

  getLearnerById: (id: string): Promise<Learner> =>
    api.get(`/learners/${id}`).then((res) => res.data),

  enrollCourse: (
    learnerId: string,
    courseId: string
  ): Promise<{ success: boolean; enrollment?: unknown; message?: string }> =>
    api.post(`/learners/${learnerId}/enroll/${courseId}`).then((res) => res.data),

  getLearnerProgress: (learnerId: string): Promise<LearnerProgress[]> =>
    api.get(`/learners/${learnerId}/progress`).then((res) => res.data),

  updateChapterCompletion: (
    learnerId: string,
    courseId: string,
    chapterId: string,
    completed: boolean
  ): Promise<{ success: boolean; enrollment?: unknown; message?: string }> =>
    api
      .put(`/learners/${learnerId}/courses/${courseId}/chapters/${chapterId}`, {
        completed,
      })
      .then((res) => res.data),

  submitAssessment: (
    learnerId: string,
    courseId: string,
    answers: number[]
  ): Promise<{ success: boolean; result?: AssessmentResponse; message?: string }> =>
    api
      .post(`/learners/${learnerId}/courses/${courseId}/assessment`, {
        answers,
      })
      .then((res) => res.data),
};

export const analyticsApi = {
  getStats: (): Promise<AnalyticsStats> =>
    api.get('/analytics/stats').then((res) => res.data),

  getTimeSlotStats: (): Promise<TimeSlotStat[]> =>
    api.get('/analytics/time-slots').then((res) => res.data),
};
