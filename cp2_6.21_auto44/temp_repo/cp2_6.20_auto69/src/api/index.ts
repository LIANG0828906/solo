import axios from 'axios';
import type {
  Class,
  Essay,
  Comment,
  Score,
  PresetComment,
  DimensionStats,
  GradeDistribution,
  RadarData,
  ApiResponse,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const classApi = {
  getClasses: (): Promise<ApiResponse<Class[]>> =>
    api.get('/classes').then((res) => res.data),

  getClassById: (id: string): Promise<ApiResponse<Class>> =>
    api.get(`/classes/${id}`).then((res) => res.data),
};

export const essayApi = {
  getEssaysByClass: (classId: string): Promise<ApiResponse<Essay[]>> =>
    api.get(`/essays?classId=${classId}`).then((res) => res.data),

  getEssayById: (id: string): Promise<ApiResponse<Essay>> =>
    api.get(`/essays/${id}`).then((res) => res.data),
};

export const commentApi = {
  getCommentsByEssay: (essayId: string): Promise<ApiResponse<Comment[]>> =>
    api.get(`/comments?essayId=${essayId}`).then((res) => res.data),

  addComment: (data: Omit<Comment, 'id' | 'createdAt'>): Promise<ApiResponse<Comment>> =>
    api.post('/comments', data).then((res) => res.data),

  updateComment: (id: string, data: Partial<Comment>): Promise<ApiResponse<Comment>> =>
    api.put(`/comments/${id}`, data).then((res) => res.data),

  deleteComment: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/comments/${id}`).then((res) => res.data),
};

export const presetCommentApi = {
  getPresetComments: (): Promise<ApiResponse<PresetComment[]>> =>
    api.get('/preset-comments').then((res) => res.data),

  addPresetComment: (
    data: Omit<PresetComment, 'id' | 'createdAt'>
  ): Promise<ApiResponse<PresetComment>> =>
    api.post('/preset-comments', data).then((res) => res.data),

  deletePresetComment: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/preset-comments/${id}`).then((res) => res.data),
};

export const scoreApi = {
  submitScore: (data: Omit<Score, 'id' | 'gradedAt'>): Promise<ApiResponse<Score>> =>
    api.post('/scores', data).then((res) => res.data),

  getScoreByEssay: (essayId: string): Promise<ApiResponse<Score | null>> =>
    api.get(`/scores?essayId=${essayId}`).then((res) => res.data),
};

export const statsApi = {
  getOverview: (classId: string): Promise<ApiResponse<{ total: number; average: number }>> =>
    api.get(`/stats/overview?classId=${classId}`).then((res) => res.data),

  getDimensions: (classId: string): Promise<ApiResponse<DimensionStats[]>> =>
    api.get(`/stats/dimensions?classId=${classId}`).then((res) => res.data),

  getDistribution: (classId: string): Promise<ApiResponse<GradeDistribution[]>> =>
    api.get(`/stats/distribution?classId=${classId}`).then((res) => res.data),

  getStudentRadar: (essayId: string): Promise<ApiResponse<RadarData[]>> =>
    api.get(`/stats/student/${essayId}`).then((res) => res.data),
};
