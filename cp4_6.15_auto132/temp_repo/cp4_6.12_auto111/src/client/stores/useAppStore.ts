import { create } from 'zustand';
import {
  Assignment,
  Submission,
  Review,
  UserRole,
  AssignmentStats,
  Notification,
  TestResult,
} from '../types';

interface AppState {
  role: UserRole;
  currentUserId: string;
  currentUserName: string;
  assignments: Assignment[];
  currentSubmission: Submission | null;
  currentAssignment: Assignment | null;
  reviews: Review[];
  stats: AssignmentStats | null;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  testResults: TestResult[] | null;

  setRole: (role: UserRole) => void;
  setCurrentUser: (id: string, name: string) => void;
  fetchAssignments: () => Promise<void>;
  createAssignment: (title: string, description: string, testCases: string) => Promise<Assignment | null>;
  submitCode: (assignmentId: string, code: string) => Promise<Submission | null>;
  runTests: (assignmentId: string, code: string) => Promise<TestResult[] | null>;
  fetchNextReview: (assignmentId: string) => Promise<Submission | null>;
  submitReview: (assignmentId: string, submissionId: string, score: number, comment: string) => Promise<Review | null>;
  fetchStats: (assignmentId: string) => Promise<void>;
  fetchReviews: (assignmentId: string) => Promise<void>;
  addNotification: (type: Notification['type'], message: string) => void;
  markNotificationRead: (id: string) => void;
  setCurrentAssignment: (a: Assignment | null) => void;
  setCurrentSubmission: (s: Submission | null) => void;
  setError: (err: string | null) => void;
  clearTestResults: () => void;
}

const genUserId = () => {
  const stored = localStorage.getItem('userId');
  if (stored) return stored;
  const id = 'user_' + Math.random().toString(36).slice(2, 10);
  localStorage.setItem('userId', id);
  return id;
};

const genUserName = () => {
  const stored = localStorage.getItem('userName');
  if (stored) return stored;
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  const name = names[Math.floor(Math.random() * names.length)];
  localStorage.setItem('userName', name);
  return name;
};

export const useAppStore = create<AppState>((set, get) => ({
  role: 'student',
  currentUserId: genUserId(),
  currentUserName: genUserName(),
  assignments: [],
  currentSubmission: null,
  currentAssignment: null,
  reviews: [],
  stats: null,
  notifications: [],
  loading: false,
  error: null,
  testResults: null,

  setRole: (role) => set({ role }),
  setCurrentUser: (id, name) => {
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    set({ currentUserId: id, currentUserName: name });
  },

  setCurrentAssignment: (a) => set({ currentAssignment: a }),
  setCurrentSubmission: (s) => set({ currentSubmission: s }),
  setError: (err) => set({ error: err }),
  clearTestResults: () => set({ testResults: null }),

  addNotification: (type, message) => {
    const notification: Notification = {
      id: 'notif_' + Date.now(),
      type,
      message,
      createdAt: Date.now(),
      read: false,
    };
    set((s) => ({ notifications: [notification, ...s.notifications] }));
  },

  markNotificationRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  fetchAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/assignments');
      if (!res.ok) throw new Error('获取作业列表失败');
      const data = await res.json();
      set({ assignments: data, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  createAssignment: async (title, description, testCases) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, testCases }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '创建作业失败');
      }
      const data: Assignment = await res.json();
      set((s) => ({
        assignments: [data, ...s.assignments],
        loading: false,
      }));
      get().addNotification('assignment', `新作业已发布：${title}`);
      return data;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },

  submitCode: async (assignmentId, code) => {
    set({ loading: true, error: null });
    const { currentUserId, currentUserName } = get();
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, studentId: currentUserId, studentName: currentUserName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '提交失败');
      }
      const data: Submission = await res.json();
      set({ loading: false, testResults: data.testResults, currentSubmission: data });
      return data;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },

  runTests: async (assignmentId, code) => {
    set({ loading: true, error: null });
    const { currentUserId, currentUserName } = get();
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, studentId: currentUserId, studentName: currentUserName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '运行测试失败');
      }
      const data: Submission = await res.json();
      set({ loading: false, testResults: data.testResults, currentSubmission: data });
      return data.testResults;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },

  fetchNextReview: async (assignmentId) => {
    set({ loading: true, error: null });
    const { currentUserId } = get();
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/review/next?reviewerId=${currentUserId}`);
      if (!res.ok) throw new Error('获取待评价代码失败');
      const data = await res.json();
      set({ loading: false, currentSubmission: data });
      return data;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },

  submitReview: async (assignmentId, submissionId, score, comment) => {
    set({ loading: true, error: null });
    const { currentUserId } = get();
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, comment, reviewerId: currentUserId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '提交评价失败');
      }
      const data: Review = await res.json();
      set((s) => ({ reviews: [data, ...s.reviews], loading: false }));
      get().addNotification('review_submitted', '评价已提交');
      return data;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      return null;
    }
  },

  fetchStats: async (assignmentId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/stats`);
      if (!res.ok) throw new Error('获取统计数据失败');
      const data = await res.json();
      set({ stats: data, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchReviews: async (assignmentId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/reviews`);
      if (!res.ok) throw new Error('获取评价失败');
      const data = await res.json();
      set({ reviews: data, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
}));
