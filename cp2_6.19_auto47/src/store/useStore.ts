import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, ClassEntity, Submission, Annotation } from '../types';
import { loadState, saveState, debounce } from '../utils/storage';

const initialState: AppState = {
  classes: [],
  submissions: [],
  currentClassId: null,
  currentSubmissionId: null,
};

const debouncedSave = debounce((state: AppState) => {
  saveState(state);
}, 100);

function getInitialState(): AppState {
  const saved = loadState();
  if (saved) {
    return { ...initialState, ...saved };
  }
  return initialState;
}

interface StoreActions {
  addClass: (name: string, studentNames: string[]) => void;
  deleteClass: (classId: string) => void;
  setCurrentClass: (classId: string | null) => void;
  addSubmission: (classId: string, studentName: string, title: string, content: string) => void;
  setCurrentSubmission: (submissionId: string | null) => void;
  addAnnotation: (submissionId: string, annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  deleteAnnotation: (submissionId: string, annotationId: string) => void;
  updateOverallComment: (submissionId: string, comment: string) => void;
  updateScore: (submissionId: string, score: number | null) => void;
  submitGrading: (submissionId: string) => void;
  getSubmissionsByClass: (classId: string) => Submission[];
  getSubmissionById: (id: string) => Submission | undefined;
  getClassById: (id: string) => ClassEntity | undefined;
}

export type AppStore = AppState & StoreActions;

export const useStore = create<AppStore>((set, get) => {
  const state = getInitialState();
  
  return {
    ...state,

    addClass: (name, studentNames) => {
      const newClass: ClassEntity = {
        id: uuidv4(),
        name,
        studentNames,
        createdAt: Date.now(),
      };
      set((s) => ({ classes: [...s.classes, newClass] }));
      debouncedSave(get());
    },

    deleteClass: (classId) => {
      set((s) => ({
        classes: s.classes.filter((c) => c.id !== classId),
        submissions: s.submissions.filter((s) => s.classId !== classId),
        currentClassId: s.currentClassId === classId ? null : s.currentClassId,
        currentSubmissionId: null,
      }));
      debouncedSave(get());
    },

    setCurrentClass: (classId) => {
      set({ currentClassId: classId, currentSubmissionId: null });
    },

    addSubmission: (classId, studentName, title, content) => {
      const newSubmission: Submission = {
        id: uuidv4(),
        classId,
        studentName,
        title,
        content,
        submittedAt: Date.now(),
        annotations: [],
        overallComment: '',
        score: null,
        gradedAt: null,
      };
      set((s) => ({ submissions: [newSubmission, ...s.submissions] }));
      debouncedSave(get());
    },

    setCurrentSubmission: (submissionId) => {
      set({ currentSubmissionId: submissionId });
    },

    addAnnotation: (submissionId, annotation) => {
      const newAnnotation: Annotation = {
        ...annotation,
        id: uuidv4(),
        createdAt: Date.now(),
      };
      set((s) => ({
        submissions: s.submissions.map((sub) =>
          sub.id === submissionId
            ? { ...sub, annotations: [...sub.annotations, newAnnotation] }
            : sub
        ),
      }));
      debouncedSave(get());
    },

    deleteAnnotation: (submissionId, annotationId) => {
      set((s) => ({
        submissions: s.submissions.map((sub) =>
          sub.id === submissionId
            ? { ...sub, annotations: sub.annotations.filter((a) => a.id !== annotationId) }
            : sub
        ),
      }));
      debouncedSave(get());
    },

    updateOverallComment: (submissionId, comment) => {
      set((s) => ({
        submissions: s.submissions.map((sub) =>
          sub.id === submissionId ? { ...sub, overallComment: comment } : sub
        ),
      }));
      debouncedSave(get());
    },

    updateScore: (submissionId, score) => {
      set((s) => ({
        submissions: s.submissions.map((sub) =>
          sub.id === submissionId ? { ...sub, score } : sub
        ),
      }));
    },

    submitGrading: (submissionId) => {
      set((s) => ({
        submissions: s.submissions.map((sub) =>
          sub.id === submissionId
            ? { ...sub, gradedAt: sub.gradedAt ?? Date.now() }
            : sub
        ),
      }));
      debouncedSave(get());
    },

    getSubmissionsByClass: (classId) => {
      return get().submissions
        .filter((s) => s.classId === classId)
        .sort((a, b) => b.submittedAt - a.submittedAt);
    },

    getSubmissionById: (id) => {
      return get().submissions.find((s) => s.id === id);
    },

    getClassById: (id) => {
      return get().classes.find((c) => c.id === id);
    },
  };
});
