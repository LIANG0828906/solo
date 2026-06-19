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
  setCurrentUser: (user: User) => void;
  addSubmission: (assignmentId: string, answers: { questionId: number; content: string }[]) => void;
  gradeSubmission: (submissionId: string) => void;
  addNotification: (type: Notification['type'], message: string) => void;
  hideNotification: (id: string) => void;
  getUserSubmissions: (userId: string) => Submission[];
  getUserErrorBook: (userId: string) => ErrorBookEntry[];
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: sampleUsers[0],
  users: sampleUsers,
  assignments: sampleAssignments,
  submissions: sampleSubmissions,
  errorBook: sampleErrorBook,
  notifications: [],

  setCurrentUser: (user: User) => {
    set({ currentUser: user });
  },

  addSubmission: (assignmentId: string, answers: { questionId: number; content: string }[]) => {
    const state = get();
    const currentUser = state.currentUser;
    if (!currentUser) return;

    const submission: Submission = {
      id: `sub_${Date.now()}`,
      assignmentId,
      userId: currentUser.id,
      answers: answers.map((a) => ({ questionId: a.questionId, content: a.content })),
      gradingResults: [],
      submittedAt: new Date().toISOString(),
      status: 'grading',
    };

    set((state) => ({
      submissions: [...state.submissions, submission],
    }));

    setTimeout(() => {
      get().gradeSubmission(submission.id);
    }, 2000);
  },

  gradeSubmission: (submissionId: string) => {
    const state = get();
    const submission = state.submissions.find((s) => s.id === submissionId);
    if (!submission) return;

    const assignment = state.assignments.find((a) => a.id === submission.assignmentId);
    if (!assignment) return;

    const gradingResults = gradeAssignment(assignment.questions, submission.answers);

    const newErrorEntries: ErrorBookEntry[] = gradingResults
      .filter((r) => r.score < 60 && r.errorType)
      .map((result) => {
        const question = assignment.questions.find((q) => q.id === result.questionId)!;
        const answer = submission.answers.find((a) => a.questionId === result.questionId);
        return {
          id: `err_${Date.now()}_${result.questionId}`,
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

    set((state) => ({
      submissions: state.submissions.map((s) =>
        s.id === submissionId ? { ...s, gradingResults, status: 'graded' as const } : s
      ),
      errorBook: newErrorEntries.length > 0 ? [...state.errorBook, ...newErrorEntries] : state.errorBook,
    }));

    get().addNotification(notifType, notifMessage);
  },

  addNotification: (type: Notification['type'], message: string) => {
    const id = `notif_${Date.now()}`;
    set((state) => ({
      notifications: [...state.notifications, { id, type, message, visible: true }],
    }));
    setTimeout(() => {
      get().hideNotification(id);
    }, 4000);
  },

  hideNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, visible: false } : n
      ),
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 500);
  },

  getUserSubmissions: (userId: string) => {
    return get().submissions.filter((s) => s.userId === userId);
  },

  getUserErrorBook: (userId: string) => {
    return get().errorBook.filter((e) => e.userId === userId);
  },
}));
