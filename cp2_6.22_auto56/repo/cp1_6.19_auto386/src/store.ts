import { create } from 'zustand';
import axios from 'axios';
import type { StoreState, FeedbackSubmission, Feedback } from './types';
import { analyzeSentiment } from './sentiment';

export const useStore = create<StoreState>((set, get) => ({
  courses: [],
  selectedCourseId: '',
  feedbacks: [],
  analysisData: null,
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  sortOrder: 'newest',
  currentPage: 1,
  searchQuery: '',
  successMessage: '',

  setCourses: (courses) => set({ courses }),
  setSelectedCourseId: (id) => set({ selectedCourseId: id, currentPage: 1 }),
  setFeedbacks: (feedbacks) => set({ feedbacks }),
  setAnalysisData: (data) => set({ analysisData: data }),
  setDateRange: (range) => set({ dateRange: range }),
  setSortOrder: (order) => set({ sortOrder: order, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setSuccessMessage: (msg) => set({ successMessage: msg }),

  fetchCourses: async () => {
    const res = await axios.get('/api/courses');
    set({ courses: res.data });
    if (res.data.length > 0 && !get().selectedCourseId) {
      set({ selectedCourseId: res.data[0].id });
    }
  },

  fetchAnalysis: async (courseId: string) => {
    const { dateRange } = get();
    const res = await axios.get('/api/analysis', {
      params: { courseId, startDate: dateRange.start, endDate: dateRange.end },
    });
    set({ analysisData: res.data });
  },

  submitFeedback: async (data: FeedbackSubmission) => {
    const sentiment = analyzeSentiment(
      data.comment,
      data.contentQuality,
      data.instructorExpression,
      data.practicalValue,
    );
    const payload = { ...data, sentiment };
    await axios.post('/api/feedback', payload);
    set({ successMessage: '反馈提交成功！' });
    setTimeout(() => set({ successMessage: '' }), 3000);
    const state = get();
    if (state.selectedCourseId) {
      await state.fetchAnalysis(state.selectedCourseId);
      await state.fetchFeedbacks(state.selectedCourseId);
    }
  },

  fetchFeedbacks: async (courseId: string) => {
    const res = await axios.get('/api/feedback', {
      params: { courseId },
    });
    const feedbacks: Feedback[] = res.data;
    set({ feedbacks });
  },
}));
