import { v4 as uuidv4 } from 'uuid';

export type AnnotationType = 'pen' | 'rect' | 'text' | 'highlight';

export interface Point {
  x: number;
  y: number;
}

export interface BaseAnnotation {
  id: string;
  page: number;
  type: AnnotationType;
  color: string;
}

export interface PenAnnotation extends BaseAnnotation {
  type: 'pen';
  points: Point[];
  strokeWidth: number;
}

export interface RectAnnotation extends BaseAnnotation {
  type: 'rect' | 'highlight';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type Annotation = PenAnnotation | RectAnnotation | TextAnnotation;

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  isNew: boolean;
}

export interface CommentThread {
  id: string;
  annotationId: string;
  page: number;
  anchorX: number;
  anchorY: number;
  comments: Comment[];
  isCollapsed: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  isTeacher: boolean;
}

type Listener = () => void;

const MOCK_USERS: Omit<User, 'id'>[] = [
  { name: '张小明', avatar: '👦', isTeacher: false },
  { name: '李思思', avatar: '👧', isTeacher: false },
  { name: '王大伟', avatar: '🧑', isTeacher: false },
  { name: '刘芳芳', avatar: '👩', isTeacher: false },
  { name: '陈老师', avatar: '👨‍🏫', isTeacher: true },
  { name: '赵老师', avatar: '👩‍🏫', isTeacher: true },
  { name: '孙悟空', avatar: '🐵', isTeacher: false },
  { name: '猪八戒', avatar: '🐷', isTeacher: false },
];

const MOCK_COMMENTS = [
  '这个知识点讲得很好！',
  '请问这里可以再详细解释一下吗？',
  '我有不同的看法...',
  '笔记已收藏，谢谢老师！',
  '这个例子很生动',
  '考试会考这个吗？',
  '能不能再举几个例子',
  '理解了，谢谢！',
  '前面的内容和这个有什么关系？',
  '我觉得这个方法很实用',
];

export class AnnotationManager {
  private annotations: Map<string, Annotation> = new Map();
  private threads: Map<string, CommentThread> = new Map();
  private users: Map<string, User> = new Map();
  private listeners: Set<Listener> = new Set();
  private currentTeacher: User;

  constructor() {
    this.currentTeacher = {
      id: uuidv4(),
      name: '教师',
      avatar: '👨‍🏫',
      isTeacher: true,
    };
    this.users.set(this.currentTeacher.id, this.currentTeacher);
  }

  getCurrentTeacher(): User {
    return this.currentTeacher;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  addAnnotation(annotation: Omit<Annotation, 'id'>): Annotation {
    const id = uuidv4();
    const newAnnotation = { ...annotation, id } as Annotation;
    this.annotations.set(id, newAnnotation);
    this.notify();
    return newAnnotation;
  }

  updateAnnotation(id: string, updates: Partial<Annotation>): Annotation | null {
    const annotation = this.annotations.get(id);
    if (!annotation) return null;
    const updated = { ...annotation, ...updates } as Annotation;
    this.annotations.set(id, updated);
    this.notify();
    return updated;
  }

  deleteAnnotation(id: string): boolean {
    const deleted = this.annotations.delete(id);
    const threadsToDelete: string[] = [];
    this.threads.forEach((thread) => {
      if (thread.annotationId === id) {
        threadsToDelete.push(thread.id);
      }
    });
    threadsToDelete.forEach((tid) => this.threads.delete(tid));
    if (deleted || threadsToDelete.length > 0) {
      this.notify();
    }
    return deleted;
  }

  getAnnotation(id: string): Annotation | undefined {
    return this.annotations.get(id);
  }

  getAnnotationsByPage(page: number): Annotation[] {
    const result: Annotation[] = [];
    this.annotations.forEach((ann) => {
      if (ann.page === page) {
        result.push(ann);
      }
    });
    return result;
  }

  addThread(thread: Omit<CommentThread, 'id' | 'comments' | 'isCollapsed'>): CommentThread {
    const id = uuidv4();
    const newThread: CommentThread = {
      ...thread,
      id,
      comments: [],
      isCollapsed: false,
    };
    this.threads.set(id, newThread);
    this.notify();
    return newThread;
  }

  addComment(threadId: string, comment: Omit<Comment, 'id' | 'timestamp' | 'isNew'>): Comment | null {
    const thread = this.threads.get(threadId);
    if (!thread) return null;
    const newComment: Comment = {
      ...comment,
      id: uuidv4(),
      timestamp: Date.now(),
      isNew: true,
    };
    thread.comments.push(newComment);
    thread.isCollapsed = false;
    this.notify();
    return newComment;
  }

  toggleThreadCollapse(threadId: string): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;
    thread.isCollapsed = !thread.isCollapsed;
    this.notify();
    return true;
  }

  markThreadRead(threadId: string): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;
    thread.comments.forEach((c) => (c.isNew = false));
    this.notify();
    return true;
  }

  getThread(id: string): CommentThread | undefined {
    return this.threads.get(id);
  }

  getThreadsByPage(page: number): CommentThread[] {
    const result: CommentThread[] = [];
    this.threads.forEach((thread) => {
      if (thread.page === page) {
        result.push(thread);
      }
    });
    return result.sort((a, b) => a.comments[0]?.timestamp - b.comments[0]?.timestamp || 0);
  }

  getAllThreads(): CommentThread[] {
    return Array.from(this.threads.values());
  }

  addSimulatedUser(): User {
    const mockUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
    const user: User = {
      ...mockUser,
      id: uuidv4(),
    };
    this.users.set(user.id, user);
    this.notify();
    return user;
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  addSimulatedComment(page: number): { thread: CommentThread; comment: Comment } | null {
    const annotations = this.getAnnotationsByPage(page);
    if (annotations.length === 0) return null;

    const annotation = annotations[Math.floor(Math.random() * annotations.length)];
    const users = this.getUsers().filter((u) => !u.isTeacher);
    if (users.length === 0) return null;

    const user = users[Math.floor(Math.random() * users.length)];
    const content = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];

    let thread = this.getThreadsByPage(page).find((t) => t.annotationId === annotation.id);
    let anchorX = 0;
    let anchorY = 0;

    if (annotation.type === 'pen') {
      const points = annotation.points;
      anchorX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      anchorY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    } else if (annotation.type === 'rect' || annotation.type === 'highlight') {
      anchorX = annotation.x + annotation.width / 2;
      anchorY = annotation.y + annotation.height / 2;
    } else if (annotation.type === 'text') {
      anchorX = annotation.x;
      anchorY = annotation.y;
    }

    if (!thread) {
      thread = this.addThread({
        annotationId: annotation.id,
        page,
        anchorX,
        anchorY,
      });
    }

    const comment = this.addComment(thread.id, {
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      content,
    });

    if (!comment) return null;
    return { thread, comment };
  }

  duplicateAnnotation(id: string): Annotation | null {
    const annotation = this.annotations.get(id);
    if (!annotation) return null;

    let newAnnotation: Annotation;
    const offset = 20;

    if (annotation.type === 'pen') {
      newAnnotation = {
        ...annotation,
        id: uuidv4(),
        points: annotation.points.map((p) => ({ x: p.x + offset, y: p.y + offset })),
      } as PenAnnotation;
    } else if (annotation.type === 'rect' || annotation.type === 'highlight') {
      newAnnotation = {
        ...annotation,
        id: uuidv4(),
        x: annotation.x + offset,
        y: annotation.y + offset,
      } as RectAnnotation;
    } else if (annotation.type === 'text') {
      newAnnotation = {
        ...annotation,
        id: uuidv4(),
        x: annotation.x + offset,
        y: annotation.y + offset,
      } as TextAnnotation;
    } else {
      return null;
    }

    this.annotations.set(newAnnotation.id, newAnnotation);
    this.notify();
    return newAnnotation;
  }
}

export const annotationManager = new AnnotationManager();
