import { create } from 'zustand';
import type { User, Assignment, Submission, ErrorBookEntry, Notification } from '../types';
import { gradeAssignment } from '../components/GradingEngine';
import { sampleAssignments, sampleSubmissions, sampleErrorBook, sampleUsers } from '../data/mockData';

interface AppState {
  currentUser: User | null;
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
  errorBook: ErrorBookEntry[];
  notifications: Notification[];
  _gradingTimers: Map<string, number>;
  _notificationTimers: Map<string, [number, number]>;
  setCurrentUser: (user: User) => void;
  addSubmission: (
    assignmentId: string,
    answers: { questionId: number; content: string }[]
  ) => { submissionId: string; cleanup: () => void };
  gradeSubmission: (submissionId: string) => void;
  addNotification: (type: Notification['type'], message: string) => { id: string; cleanup: () => void };
  hideNotification: (id: string) => void;
  getUserSubmissions: (userId: string) => Submission[];
  getUserErrorBook: (userId: string) => ErrorBookEntry[];
  getSubmissionForAssignment: (userId: string, assignmentId: string) => Submission | undefined;
  cleanupAllTimers: () => void;
}

const PERSIST_KEY = 'app_store_state_v1';
type PersistedFields = Pick<AppState, 'submissions' | 'errorBook'>;

const loadPersisted = (): Partial<PersistedFields> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedFields;
    return {
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      errorBook: Array.isArray(parsed.errorBook) ? parsed.errorBook : [],
    };
  } catch {
    return {};
  }
};

const savePersisted = (fields: PersistedFields) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        submissions: fields.submissions,
        errorBook: fields.errorBook,
      })
    );
  } catch {
    /* noop */
  }
};

const persisted = loadPersisted();

export const useStore = create<AppState>((set, get) => ({
  currentUser: sampleUsers[0],
  users: sampleUsers,
  assignments: sampleAssignments,
  submissions: persisted.submissions ?? sampleSubmissions,
  errorBook: persisted.errorBook ?? sampleErrorBook,
  notifications: [],
  _gradingTimers: new Map(),
  _notificationTimers: new Map(),

  setCurrentUser: (user: User) => {
    set({ currentUser: user });
  },

  addSubmission: (assignmentId, answers) => {
    const state = get();
    const currentUser = state.currentUser;
    if (!currentUser) return { submissionId: '', cleanup: () => {} };

    let submissionId: string;

    const existingSub = state.submissions.find(
      (s) => s.userId === currentUser.id && s.assignmentId === assignmentId && s.status !== 'grading'
    );

    if (existingSub) {
      submissionId = existingSub.id;
      set((prev) => ({
        submissions: prev.submissions.map((s) =>
          s.id === existingSub.id
            ? {
                ...s,
                answers: answers.map((a) => ({ questionId: a.questionId, content: a.content })),
                gradingResults: [],
                submittedAt: new Date().toISOString(),
                status: 'grading' as const,
              }
            : s
        ),
      }));
    } else {
      submissionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const submission: Submission = {
        id: submissionId,
        assignmentId,
        userId: currentUser.id,
        answers: answers.map((a) => ({ questionId: a.questionId, content: a.content })),
        gradingResults: [],
        submittedAt: new Date().toISOString(),
        status: 'grading',
      };
      set((prev) => ({ submissions: [...prev.submissions, submission] }));
    }

    const existingTimer = get()._gradingTimers.get(submissionId);
    if (existingTimer) window.clearTimeout(existingTimer);

    const timerId = window.setTimeout(() => {
      const timers = get()._gradingTimers;
      timers.delete(submissionId);
      get().gradeSubmission(submissionId);
    }, 2000);

    set((prev) => {
      const newTimers = new Map(prev._gradingTimers);
      newTimers.set(submissionId, timerId);
      return { _gradingTimers: newTimers };
    });

    const cleanup = () => {
      const currentTimer = get()._gradingTimers.get(submissionId);
      if (currentTimer) {
        window.clearTimeout(currentTimer);
        set((prev) => {
          const newTimers = new Map(prev._gradingTimers);
          newTimers.delete(submissionId);
          return { _gradingTimers: newTimers };
        });
      }
    };

    return { submissionId, cleanup };
  },

  gradeSubmission: (submissionId) => {
    const state = get();
    const submission = state.submissions.find((s) => s.id === submissionId);
    if (!submission) return;

    const assignment = state.assignments.find((a) => a.id === submission.assignmentId);
    if (!assignment) return;

    const gradingResults = gradeAssignment(assignment.questions, submission.answers);

    const existingErrors = state.errorBook.filter(
      (e) => e.userId === submission.userId && e.assignmentId === assignment.id
    );
    const existingErrorQids = new Set(existingErrors.map((e) => e.question.id));

    const newErrorEntries: ErrorBookEntry[] = gradingResults
      .filter((r) => r.score < 60 && r.errorType && !existingErrorQids.has(r.questionId))
      .map((result, idx) => {
        const question = assignment.questions.find((q) => q.id === result.questionId)!;
        const answer = submission.answers.find((a) => a.questionId === result.questionId);
        return {
          id: `err_${Date.now()}_${result.questionId}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          userId: submission.userId,
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          subject: assignment.subject,
          question,
          studentAnswer: answer?.content || '',
          score: result.score,
          feedback: result.feedback,
          errorType: result.errorType!,
          createdAt: new Date().toISOString(),
        };
      });

    const avgScore = gradingResults.reduce((sum, r) => sum + r.score, 0) / gradingResults.length;
    let notifType: Notification['type'] = 'success';
    let notifMessage = '';
    if (avgScore >= 80) {
      notifType = 'success';
      notifMessage = `作业批改完成！平均分数：${avgScore.toFixed(1)}分，表现优秀！`;
    } else if (avgScore >= 60) {
      notifType = 'warning';
      notifMessage = `作业批改完成！平均分数：${avgScore.toFixed(1)}分，继续加油！`;
    } else {
      notifType = 'error';
      notifMessage = `作业批改完成！平均分数：${avgScore.toFixed(1)}分，需要加强练习。`;
    }

    const newSubmissions = state.submissions.map((s) =>
      s.id === submissionId ? { ...s, gradingResults, status: 'graded' as const } : s
    );
    const newErrorBook = newErrorEntries.length > 0 ? [...state.errorBook, ...newErrorEntries] : state.errorBook;

    set({ submissions: newSubmissions, errorBook: newErrorBook });
    savePersisted({ submissions: newSubmissions, errorBook: newErrorBook });

    get().addNotification(notifType, notifMessage);
  },

  addNotification: (type, message) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      notifications: [...state.notifications, { id, type, message, visible: true }],
    }));

    const hideTimer = window.setTimeout(() => {
      get().hideNotification(id);
      const timers = get()._notificationTimers;
      timers.delete(id);
    }, 4000);

    set((prev) => {
      const map = new Map(prev._notificationTimers);
      map.set(id, [hideTimer, 0]);
      return { _notificationTimers: map };
    });

    const cleanup = () => {
      const entry = get()._notificationTimers.get(id);
      if (entry) {
        if (entry[0]) window.clearTimeout(entry[0]);
        if (entry[1]) window.clearTimeout(entry[1]);
        set((prev) => {
          const map = new Map(prev._notificationTimers);
          map.delete(id);
          return { _notificationTimers: map, notifications: prev.notifications.filter((n) => n.id !== id) };
        });
      }
    };
    return { id, cleanup };
  },

  hideNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, visible: false } : n
      ),
    }));
    const removeTimer = window.setTimeout(() => {
      set((state) => {
        const map = new Map(state._notificationTimers);
        map.delete(id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          _notificationTimers: map,
        };
      });
    }, 500);

    set((prev) => {
      const map = new Map(prev._notificationTimers);
      const existing = map.get(id);
      if (existing) {
        existing[1] = removeTimer;
      }
      return { _notificationTimers: map };
    });
  },

  getUserSubmissions: (userId) => get().submissions.filter((s) => s.userId === userId),

  getUserErrorBook: (userId) => get().errorBook.filter((e) => e.userId === userId),

  getSubmissionForAssignment: (userId, assignmentId) =>
    get().submissions.find((s) => s.userId === userId && s.assignmentId === assignmentId),

  cleanupAllTimers: () => {
    const state = get();
    state._gradingTimers.forEach((timerId) => window.clearTimeout(timerId));
    state._notificationTimers.forEach(([t1, t2]) => {
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearTimeout(t2);
    });
    set({ _gradingTimers: new Map(), _notificationTimers: new Map(), notifications: [] });
  },
}));

export type StoreInstance = typeof useStore;

declare global {
  interface Window {
    __store: StoreInstance;
  }
}

const safeInstallStore = () => {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __store?: StoreInstance };
  if (!w.__store) {
    w.__store = useStore;
  }
};
safeInstallStore();
