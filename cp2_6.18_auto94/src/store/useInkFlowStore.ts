import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, Chapter, ChapterContent, VersionHistory, Comment } from '@/types';
import { generateFullMockData } from '@/utils/mockData';

const COVER_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#3B82F6', '#EF4444', '#14B8A6', '#F97316', '#84CC16'
];

const STORAGE_KEY = 'inkflow_store_v1';

function persistToStorage(state: Partial<InkFlowStore>) {
  try {
    const toSave = {
      projects: state.projects,
      chapters: state.chapters,
      chapterContents: state.chapterContents,
      versionHistories: state.versionHistories,
      comments: state.comments,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to persist store', e);
  }
}

function loadFromStorage(): any | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load store', e);
  }
  return null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

export interface InkFlowStore {
  projects: Project[];
  currentProjectId: string | null;
  currentChapterId: string | null;
  chapters: Chapter[];
  chapterContents: Record<string, ChapterContent>;
  versionHistories: VersionHistory[];
  comments: Comment[];

  setCurrentProject: (projectId: string | null) => void;
  setCurrentChapter: (chapterId: string | null) => void;

  createProject: (title: string, description: string) => Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  toggleFavorite: (projectId: string) => void;

  addChapter: (projectId: string, title: string) => Chapter;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  deleteChapter: (chapterId: string) => void;
  reorderChapters: (projectId: string, fromIndex: number, toIndex: number) => void;
  toggleChapterCompleted: (chapterId: string) => void;

  updateChapterContent: (chapterId: string, content: string, skipTimestamp?: boolean) => void;
  createVersionSnapshot: (chapterId: string, snapshotName?: string) => VersionHistory;

  addComment: (
    chapterId: string,
    text: string,
    startOffset: number,
    endOffset: number,
    parentCommentId?: string | null
  ) => Comment;
  deleteComment: (commentId: string) => void;
  resolveComment: (commentId: string, resolved: boolean) => void;

  getProjectChapters: (projectId: string) => Chapter[];
  getProjectProgress: (projectId: string) => { completed: number; total: number; percent: number };
}

const initData = (() => {
  const stored = loadFromStorage();
  if (stored && stored.projects && stored.projects.length > 0) {
    return stored;
  }
  return generateFullMockData();
})();

export const useInkFlowStore = create<InkFlowStore>((set, get) => ({
  projects: initData.projects,
  currentProjectId: null,
  currentChapterId: null,
  chapters: initData.chapters,
  chapterContents: initData.chapterContents,
  versionHistories: initData.versionHistories,
  comments: initData.comments,

  setCurrentProject: (projectId) => {
    const projectChapters = get().getProjectChapters(projectId || '');
    const firstChapter = projectChapters[0];
    set({
      currentProjectId: projectId,
      currentChapterId: firstChapter?.id || null,
    });
  },

  setCurrentChapter: (chapterId) => set({ currentChapterId: chapterId }),

  createProject: (title, description) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: uuidv4(),
      title: title.trim(),
      description: description.trim(),
      coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };
    const next = { ...get(), projects: [newProject, ...get().projects] };
    set({ projects: next.projects });
    persistToStorage(next);
    return newProject;
  },

  updateProject: (projectId, updates) => {
    const projects = get().projects.map((p) =>
      p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    const next = { ...get(), projects };
    set({ projects });
    persistToStorage(next);
  },

  deleteProject: (projectId) => {
    const projects = get().projects.filter((p) => p.id !== projectId);
    const chapters = get().chapters.filter((c) => c.projectId !== projectId);
    const chapterIds = get().chapters.filter((c) => c.projectId === projectId).map((c) => c.id);
    const chapterContents = { ...get().chapterContents };
    chapterIds.forEach((id) => delete chapterContents[id]);
    const versionHistories = get().versionHistories.filter((v) => !chapterIds.includes(v.chapterId));
    const comments = get().comments.filter((c) => !chapterIds.includes(c.chapterId));
    const currentProjectId = get().currentProjectId === projectId ? null : get().currentProjectId;

    const next = { ...get(), projects, chapters, chapterContents, versionHistories, comments, currentProjectId };
    set(next);
    persistToStorage(next);
  },

  toggleFavorite: (projectId) => {
    const projects = get().projects.map((p) =>
      p.id === projectId
        ? { ...p, isFavorite: !p.isFavorite, updatedAt: new Date().toISOString() }
        : p
    );
    const next = { ...get(), projects };
    set({ projects });
    persistToStorage(next);
  },

  addChapter: (projectId, title) => {
    const now = new Date().toISOString();
    const projectChapters = get().chapters.filter((c) => c.projectId === projectId);
    const orderIndex = projectChapters.length;
    const newChapter: Chapter = {
      id: uuidv4(),
      projectId,
      title: title.trim(),
      orderIndex,
      isCompleted: false,
      isExpanded: true,
      createdAt: now,
      updatedAt: now,
    };
    const chapters = [...get().chapters, newChapter];
    const chapterContents = {
      ...get().chapterContents,
      [newChapter.id]: {
        chapterId: newChapter.id,
        content: `<h2>${title.trim()}</h2><p><br></p>`,
        wordCount: 0,
        lastSavedAt: now,
      },
    };
    const projects = get().projects.map((p) =>
      p.id === projectId ? { ...p, updatedAt: now } : p
    );
    const next = { ...get(), chapters, chapterContents, projects };
    set({ chapters, chapterContents, projects, currentChapterId: newChapter.id });
    persistToStorage(next);
    return newChapter;
  },

  updateChapter: (chapterId, updates) => {
    const chapters = get().chapters.map((c) =>
      c.id === chapterId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    const chapter = get().chapters.find((c) => c.id === chapterId);
    const projects = chapter
      ? get().projects.map((p) =>
          p.id === chapter.projectId ? { ...p, updatedAt: new Date().toISOString() } : p
        )
      : get().projects;
    const next = { ...get(), chapters, projects };
    set({ chapters, projects });
    persistToStorage(next);
  },

  deleteChapter: (chapterId) => {
    const chapter = get().chapters.find((c) => c.id === chapterId);
    if (!chapter) return;

    const chapters = get()
      .chapters.filter((c) => c.id !== chapterId)
      .map((c) =>
        c.projectId === chapter.projectId && c.orderIndex > chapter.orderIndex
          ? { ...c, orderIndex: c.orderIndex - 1 }
          : c
      );
    const chapterContents = { ...get().chapterContents };
    delete chapterContents[chapterId];
    const versionHistories = get().versionHistories.filter((v) => v.chapterId !== chapterId);
    const comments = get().comments.filter((c) => c.chapterId !== chapterId);

    const next = { ...get(), chapters, chapterContents, versionHistories, comments };
    set({
      chapters,
      chapterContents,
      versionHistories,
      comments,
      currentChapterId: get().currentChapterId === chapterId ? null : get().currentChapterId,
    });
    persistToStorage(next);
  },

  reorderChapters: (projectId, fromIndex, toIndex) => {
    const projectChapters = get()
      .chapters.filter((c) => c.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    if (fromIndex < 0 || fromIndex >= projectChapters.length) return;
    if (toIndex < 0 || toIndex >= projectChapters.length) return;

    const [moved] = projectChapters.splice(fromIndex, 1);
    projectChapters.splice(toIndex, 0, moved);

    const reorderedIds = new Set(projectChapters.map((c) => c.id));
    const chapters = get().chapters.map((c) => {
      if (!reorderedIds.has(c.id)) return c;
      const newIdx = projectChapters.findIndex((pc) => pc.id === c.id);
      return { ...c, orderIndex: newIdx, updatedAt: new Date().toISOString() };
    });
    const next = { ...get(), chapters };
    set({ chapters });
    persistToStorage(next);
  },

  toggleChapterCompleted: (chapterId) => {
    const chapters = get().chapters.map((c) =>
      c.id === chapterId ? { ...c, isCompleted: !c.isCompleted, updatedAt: new Date().toISOString() } : c
    );
    const next = { ...get(), chapters };
    set({ chapters });
    persistToStorage(next);
  },

  updateChapterContent: (chapterId, content, skipTimestamp = false) => {
    const now = new Date().toISOString();
    const plain = stripHtml(content);
    const existing = get().chapterContents[chapterId];
    const chapterContents = {
      ...get().chapterContents,
      [chapterId]: {
        chapterId,
        content,
        wordCount: plain.length,
        lastSavedAt: now,
      },
    };

    let chapters = get().chapters;
    let projects = get().projects;
    if (!skipTimestamp) {
      chapters = chapters.map((c) =>
        c.id === chapterId ? { ...c, updatedAt: now } : c
      );
      const chapter = get().chapters.find((c) => c.id === chapterId);
      if (chapter) {
        projects = projects.map((p) =>
          p.id === chapter.projectId ? { ...p, updatedAt: now } : p
        );
      }
    }

    const next = { ...get(), chapterContents, chapters, projects };
    set({ chapterContents, chapters, projects });
    if (!skipTimestamp) persistToStorage(next);
  },

  createVersionSnapshot: (chapterId, snapshotName) => {
    const now = new Date().toISOString();
    const content = get().chapterContents[chapterId]?.content || '';
    const date = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const defaultName = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

    const newVersion: VersionHistory = {
      id: uuidv4(),
      chapterId,
      content,
      snapshotName: snapshotName || defaultName,
      createdAt: now,
      authorName: '我',
      authorAvatar: 'ME',
    };
    const versionHistories = [newVersion, ...get().versionHistories];
    const next = { ...get(), versionHistories };
    set({ versionHistories });
    persistToStorage(next);
    return newVersion;
  },

  addComment: (chapterId, text, startOffset, endOffset, parentCommentId = null) => {
    const now = new Date().toISOString();
    const newComment: Comment = {
      id: uuidv4(),
      chapterId,
      text,
      authorName: '我',
      authorAvatar: 'ME',
      createdAt: now,
      parentCommentId,
      startOffset,
      endOffset,
      resolved: false,
    };
    const comments = [...get().comments, newComment];
    const next = { ...get(), comments };
    set({ comments });
    persistToStorage(next);
    return newComment;
  },

  deleteComment: (commentId) => {
    const toDelete = new Set<string>([commentId]);
    let changed = true;
    while (changed) {
      changed = false;
      get().comments.forEach((c) => {
        if (c.parentCommentId && toDelete.has(c.parentCommentId) && !toDelete.has(c.id)) {
          toDelete.add(c.id);
          changed = true;
        }
      });
    }
    const comments = get().comments.filter((c) => !toDelete.has(c.id));
    const next = { ...get(), comments };
    set({ comments });
    persistToStorage(next);
  },

  resolveComment: (commentId, resolved) => {
    const comments = get().comments.map((c) =>
      c.id === commentId ? { ...c, resolved } : c
    );
    const next = { ...get(), comments };
    set({ comments });
    persistToStorage(next);
  },

  getProjectChapters: (projectId) => {
    return get()
      .chapters.filter((c) => c.projectId === projectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  },

  getProjectProgress: (projectId) => {
    const chapters = get().getProjectChapters(projectId);
    const total = chapters.length;
    const completed = chapters.filter((c) => c.isCompleted).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percent };
  },
}));
