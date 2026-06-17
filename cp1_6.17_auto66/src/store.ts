import { create } from 'zustand';
import type { Course, Chapter, Assignment, Submission, StudentProgress } from './types';

interface AppState {
  currentView: 'teacher' | 'student';
  courses: Course[];
  selectedCourseId: string | null;
  selectedChapterId: string | null;
  loadingCourses: boolean;
  
  assignments: Assignment[];
  submissions: Submission[];
  selectedSubmission: Submission | null;
  loadingAssignments: boolean;
  loadingSubmissions: boolean;
  
  currentStudentProgress: StudentProgress | null;
  loadingProgress: boolean;
  
  isSaving: boolean;
  successMessage: string | null;
  sidebarCollapsed: boolean;
  
  toggleView: () => void;
  toggleSidebar: () => void;
  
  fetchCourses: () => Promise<void>;
  createCourse: (title: string) => Promise<void>;
  addChapter: (courseId: string, chapter: Chapter, parentId?: string) => Promise<void>;
  updateChapterName: (courseId: string, chapterId: string, name: string) => Promise<void>;
  reorderChapters: (courseId: string, chapters: Chapter[]) => Promise<void>;
  deleteChapter: (courseId: string, chapterId: string) => Promise<void>;
  selectChapter: (chapterId: string | null) => void;
  toggleChapterExpand: (courseId: string, chapterId: string) => void;
  
  fetchAssignments: (chapterId: string) => Promise<void>;
  createAssignment: (data: Omit<Assignment, 'id' | 'createdAt'>) => Promise<void>;
  
  fetchSubmissions: (assignmentId: string) => Promise<void>;
  submitAssignment: (data: Omit<Submission, 'id' | 'submittedAt' | 'status'>) => Promise<void>;
  gradeSubmission: (submissionId: string, grade: number, feedback: string) => Promise<void>;
  selectSubmission: (submission: Submission | null) => void;
  
  fetchProgress: (studentId: string) => Promise<void>;
  
  setSuccessMessage: (msg: string | null) => void;
}

function updateChapterExpand(chapters: Chapter[], id: string): Chapter[] {
  return chapters.map(ch => {
    if (ch.id === id) {
      return { ...ch, expanded: !ch.expanded };
    }
    if (ch.children.length > 0) {
      return { ...ch, children: updateChapterExpand(ch.children, id) };
    }
    return ch;
  });
}

function updateChapterName(chapters: Chapter[], id: string, name: string): Chapter[] {
  return chapters.map(ch => {
    if (ch.id === id) {
      return { ...ch, name };
    }
    if (ch.children.length > 0) {
      return { ...ch, children: updateChapterName(ch.children, id, name) };
    }
    return ch;
  });
}

export const useStore = create<AppState>((set, get) => ({
  currentView: 'teacher',
  courses: [],
  selectedCourseId: null,
  selectedChapterId: null,
  loadingCourses: false,
  
  assignments: [],
  submissions: [],
  selectedSubmission: null,
  loadingAssignments: false,
  loadingSubmissions: false,
  
  currentStudentProgress: null,
  loadingProgress: false,
  
  isSaving: false,
  successMessage: null,
  sidebarCollapsed: false,
  
  toggleView: () => set({ currentView: get().currentView === 'teacher' ? 'student' : 'teacher' }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  
  fetchCourses: async () => {
    set({ loadingCourses: true });
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      set({ 
        courses: data, 
        loadingCourses: false,
        selectedCourseId: data[0]?.id || null,
        selectedChapterId: data[0]?.chapters[0]?.children[0]?.id || data[0]?.chapters[0]?.id || null,
      });
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      set({ loadingCourses: false });
    }
  },
  
  createCourse: async (title: string) => {
    set({ isSaving: true });
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const newCourse = await res.json();
      set(state => ({ 
        courses: [...state.courses, newCourse], 
        isSaving: false,
        successMessage: '课程创建成功',
      }));
      setTimeout(() => set({ successMessage: null }), 2000);
    } catch (error) {
      console.error('Failed to create course:', error);
      set({ isSaving: false });
    }
  },
  
  addChapter: async (courseId: string, chapter: Chapter, parentId?: string) => {
    set({ isSaving: true });
    try {
      const res = await fetch(`/api/courses/${courseId}/chapter`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter, parentId }),
      });
      const updatedCourse = await res.json();
      set(state => ({
        courses: state.courses.map(c => c.id === courseId ? updatedCourse : c),
        isSaving: false,
        successMessage: '章节添加成功',
      }));
      setTimeout(() => set({ successMessage: null }), 2000);
    } catch (error) {
      console.error('Failed to add chapter:', error);
      set({ isSaving: false });
    }
  },
  
  updateChapterName: async (courseId: string, chapterId: string, name: string) => {
    const course = get().courses.find(c => c.id === courseId);
    if (!course) return;
    
    const updateInTree = (chapters: Chapter[]): Chapter[] => {
      return chapters.map(ch => {
        if (ch.id === chapterId) {
          return { ...ch, name };
        }
        if (ch.children.length > 0) {
          return { ...ch, children: updateInTree(ch.children) };
        }
        return ch;
      });
    };
    
    const updatedChapters = updateInTree(course.chapters);
    const updatedChapter = JSON.parse(JSON.stringify(
      updatedChapters.flatMap(function find(ch): Chapter[] {
        if (ch.id === chapterId) return [ch];
        return ch.children.flatMap(find);
      })[0]
    ));
    
    set(state => ({
      courses: state.courses.map(c => 
        c.id === courseId 
          ? { ...c, chapters: updateChapterName(c.chapters, chapterId, name) }
          : c
      ),
    }));
    
    try {
      await fetch(`/api/courses/${courseId}/chapter`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter: updatedChapter }),
      });
      set({ successMessage: '章节名称已更新' });
      setTimeout(() => set({ successMessage: null }), 2000);
    } catch (error) {
      console.error('Failed to update chapter:', error);
    }
  },
  
  reorderChapters: async (courseId: string, chapters: Chapter[]) => {
    set(state => ({
      courses: state.courses.map(c => 
        c.id === courseId ? { ...c, chapters } : c
      ),
    }));
    
    try {
      await fetch(`/api/courses/${courseId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters }),
      });
    } catch (error) {
      console.error('Failed to reorder chapters:', error);
    }
  },
  
  deleteChapter: async (courseId: string, chapterId: string) => {
    try {
      await fetch(`/api/courses/${courseId}/chapter/${chapterId}`, {
        method: 'DELETE',
      });
      set(state => ({
        courses: state.courses.map(c => 
          c.id === courseId 
            ? { ...c, chapters: c.chapters.filter(ch => ch.id !== chapterId) }
            : c
        ),
        successMessage: '章节已删除',
      }));
      setTimeout(() => set({ successMessage: null }), 2000);
    } catch (error) {
      console.error('Failed to delete chapter:', error);
    }
  },
  
  selectChapter: (chapterId: string | null) => {
    set({ selectedChapterId: chapterId, selectedSubmission: null });
  },
  
  toggleChapterExpand: (courseId: string, chapterId: string) => {
    set(state => ({
      courses: state.courses.map(c => 
        c.id === courseId 
          ? { ...c, chapters: updateChapterExpand(c.chapters, chapterId) }
          : c
      ),
    }));
  },
  
  fetchAssignments: async (chapterId: string) => {
    if (!chapterId) {
      set({ assignments: [] });
      return;
    }
    set({ loadingAssignments: true });
    try {
      const res = await fetch(`/api/assignments/${chapterId}`);
      const data = await res.json();
      set({ assignments: data, loadingAssignments: false });
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      set({ loadingAssignments: false });
    }
  },
  
  createAssignment: async (data: Omit<Assignment, 'id' | 'createdAt'>) => {
    set({ isSaving: true });
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newAssignment = await res.json();
      set(state => ({
        assignments: [...state.assignments, newAssignment],
        isSaving: false,
        successMessage: '作业发布成功',
      }));
      setTimeout(() => set({ successMessage: null }), 2000);
    } catch (error) {
      console.error('Failed to create assignment:', error);
      set({ isSaving: false });
    }
  },
  
  fetchSubmissions: async (assignmentId: string) => {
    if (!assignmentId) {
      set({ submissions: [] });
      return;
    }
    set({ loadingSubmissions: true });
    try {
      const res = await fetch(`/api/submissions/${assignmentId}`);
      const data = await res.json();
      set({ submissions: data, loadingSubmissions: false });
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      set({ loadingSubmissions: false });
    }
  },
  
  submitAssignment: async (data: Omit<Submission, 'id' | 'submittedAt' | 'status'>) => {
    set({ isSaving: true });
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const newSubmission = await res.json();
      set(state => ({
        submissions: [newSubmission, ...state.submissions],
        isSaving: false,
        successMessage: '作业提交成功',
      }));
      setTimeout(() => set({ successMessage: null }), 2000);
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      set({ isSaving: false });
    }
  },
  
  gradeSubmission: async (submissionId: string, grade: number, feedback: string) => {
    set({ isSaving: true });
    try {
      const res = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, feedback }),
      });
      const updatedSubmission = await res.json();
      set(state => ({
        submissions: state.submissions.map(s => 
          s.id === submissionId ? updatedSubmission : s
        ),
        selectedSubmission: updatedSubmission,
        isSaving: false,
        successMessage: '评分保存成功',
      }));
      setTimeout(() => set({ successMessage: null }), 2000);
    } catch (error) {
      console.error('Failed to grade submission:', error);
      set({ isSaving: false });
    }
  },
  
  selectSubmission: (submission: Submission | null) => {
    set({ selectedSubmission: submission });
  },
  
  fetchProgress: async (studentId: string) => {
    set({ loadingProgress: true });
    try {
      const res = await fetch(`/api/progress/${studentId}`);
      const data = await res.json();
      set({ currentStudentProgress: data, loadingProgress: false });
    } catch (error) {
      console.error('Failed to fetch progress:', error);
      set({ loadingProgress: false });
    }
  },
  
  setSuccessMessage: (msg: string | null) => {
    set({ successMessage: msg });
  },
}));
