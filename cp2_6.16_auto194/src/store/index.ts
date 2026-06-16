import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  DocumentItem,
  AnnotationItem,
  AnnotationType,
  ReplyItem,
  User,
  NotificationItem,
  AnnotationStats,
} from '@/types';
import {
  getAllDocuments,
  addDocument as idbAddDocument,
  updateDocument as idbUpdateDocument,
  deleteDocument as idbDeleteDocument,
  getAnnotationsByDocument,
  addAnnotation as idbAddAnnotation,
  updateAnnotation as idbUpdateAnnotation,
  addReply as idbAddReply,
  getRepliesByAnnotation,
} from '@/utils/idb';
import { getRandomColor } from '@/utils/colors';

interface AppState {
  documents: DocumentItem[];
  annotations: Record<string, AnnotationItem[]>;
  currentUser: User;
  notifications: NotificationItem[];
  isLoading: boolean;

  initData: () => Promise<void>;
  loadDocuments: () => Promise<void>;
  loadAnnotations: (documentId: string) => Promise<void>;

  addDocument: (title: string, content: string) => Promise<DocumentItem>;
  updateDocument: (id: string, content: string) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  getDocumentById: (id: string) => DocumentItem | undefined;

  addAnnotation: (
    documentId: string,
    type: AnnotationType,
    content: string,
    startOffset: number,
    endOffset: number,
    selectedText: string,
  ) => Promise<AnnotationItem>;
  addReply: (annotationId: string, documentId: string, content: string) => Promise<void>;
  getAnnotationsForDocument: (documentId: string) => AnnotationItem[];
  getAnnotationStats: (documentId: string) => AnnotationStats;

  addNotification: (message: string) => void;
  removeNotification: (id: string) => void;
}

const DEFAULT_USER: User = {
  id: 'user-1',
  name: '张同学',
  color: '#3498DB',
};

export const useAppStore = create<AppState>((set, get) => ({
  documents: [],
  annotations: {},
  currentUser: DEFAULT_USER,
  notifications: [],
  isLoading: false,

  initData: async () => {
    set({ isLoading: true });
    await get().loadDocuments();

    const docs = get().documents;
    if (docs.length === 0) {
      const sampleDoc = await get().addDocument(
        '论文初稿 - 人工智能在教育中的应用',
        '摘要：本文探讨了人工智能技术在教育领域的应用现状与发展趋势。通过分析智能教学系统、个性化学习推荐、自动评分系统等应用场景，揭示了AI技术对传统教育模式的深刻变革。\n\n关键词：人工智能；教育技术；个性化学习；智能教学\n\n一、引言\n随着人工智能技术的迅猛发展，教育领域正在经历前所未有的变革。智能教学系统能够根据学生的学习进度和特点，提供个性化的学习路径和资源推荐，大大提升了学习效率。\n\n二、AI在教育中的主要应用\n2.1 智能教学系统\n智能教学系统通过自然语言处理和机器学习技术，能够与学生进行智能对话，解答疑问，提供即时反馈。\n\n2.2 个性化学习推荐\n基于学生的学习历史和表现数据，系统可以精准推荐适合的学习内容和练习题目。\n\n2.3 自动评分系统\n利用自然语言处理技术，系统能够对主观题进行自动评分，提高评估效率。\n\n三、挑战与展望\n尽管AI教育应用前景广阔，但仍面临数据隐私、算法偏见、教师角色转变等挑战。',
      );

      const content = sampleDoc.content;
      const text1 = '人工智能技术在教育领域的应用';
      const start1 = content.indexOf(text1);
      const end1 = start1 + text1.length;

      await get().addAnnotation(
        sampleDoc.id,
        'suggestion',
        '建议在这里增加一些具体的数据支撑，比如市场规模或者增长率。',
        start1,
        end1,
        text1,
      );

      const text2 = '智能教学系统';
      const start2 = content.indexOf(text2);
      const end2 = start2 + text2.length;

      await get().addAnnotation(
        sampleDoc.id,
        'question',
        '这里的智能教学系统具体指的是哪些产品？有没有典型案例可以引用？',
        start2,
        end2,
        text2,
      );

      const text3 = '数据隐私';
      const start3 = content.indexOf(text3);
      const end3 = start3 + text3.length;

      await get().addAnnotation(
        sampleDoc.id,
        'error',
        '"数据隐私"后面应该加个"问题"，句子才完整。',
        start3,
        end3,
        text3,
      );
    }

    set({ isLoading: false });
  },

  loadDocuments: async () => {
    const docs = await getAllDocuments();
    set({ documents: docs });
  },

  loadAnnotations: async (documentId: string) => {
    const annotations = await getAnnotationsByDocument(documentId);

    const annotationsWithReplies = await Promise.all(
      annotations.map(async (ann) => {
        const replies = await getRepliesByAnnotation(ann.id);
        return { ...ann, replies };
      }),
    );

    set((state) => ({
      annotations: {
        ...state.annotations,
        [documentId]: annotationsWithReplies,
      },
    }));
  },

  addDocument: async (title: string, content: string) => {
    const now = new Date().toISOString();
    const doc: DocumentItem = {
      id: uuidv4(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };

    await idbAddDocument(doc);
    set((state) => ({
      documents: [doc, ...state.documents],
    }));

    return doc;
  },

  updateDocument: async (id: string, content: string) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;

    const updatedDoc: DocumentItem = {
      ...doc,
      content,
      updatedAt: new Date().toISOString(),
    };

    await idbUpdateDocument(updatedDoc);
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? updatedDoc : d)),
    }));
  },

  removeDocument: async (id: string) => {
    await idbDeleteDocument(id);
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      annotations: {
        ...state.annotations,
        [id]: [],
      },
    }));
  },

  getDocumentById: (id: string) => {
    return get().documents.find((d) => d.id === id);
  },

  addAnnotation: async (
    documentId: string,
    type: AnnotationType,
    content: string,
    startOffset: number,
    endOffset: number,
    selectedText: string,
  ) => {
    const user = get().currentUser;
    const now = new Date().toISOString();

    const annotation: AnnotationItem = {
      id: uuidv4(),
      documentId,
      type,
      content,
      author: user.name,
      authorColor: user.color || getRandomColor(),
      startOffset,
      endOffset,
      selectedText,
      createdAt: now,
      replies: [],
    };

    await idbAddAnnotation(annotation);

    set((state) => {
      const docAnnotations = state.annotations[documentId] || [];
      return {
        annotations: {
          ...state.annotations,
          [documentId]: [annotation, ...docAnnotations],
        },
      };
    });

    get().addNotification(`${user.name}添加了一条批注`);

    return annotation;
  },

  addReply: async (annotationId: string, documentId: string, content: string) => {
    const user = get().currentUser;
    const now = new Date().toISOString();

    const reply: ReplyItem = {
      id: uuidv4(),
      annotationId,
      content,
      author: user.name,
      authorColor: user.color || getRandomColor(),
      createdAt: now,
    };

    await idbAddReply(reply);

    set((state) => {
      const docAnnotations = state.annotations[documentId] || [];
      const updatedAnnotations = docAnnotations.map((ann) => {
        if (ann.id === annotationId) {
          return {
            ...ann,
            replies: [...ann.replies, reply],
          };
        }
        return ann;
      });

      return {
        annotations: {
          ...state.annotations,
          [documentId]: updatedAnnotations,
        },
      };
    });

    get().addNotification(`${user.name}回复了一条批注`);
  },

  getAnnotationsForDocument: (documentId: string) => {
    return get().annotations[documentId] || [];
  },

  getAnnotationStats: (documentId: string) => {
    const annotations = get().annotations[documentId] || [];
    const total = annotations.length;

    const suggestion = annotations.filter((a) => a.type === 'suggestion').length;
    const question = annotations.filter((a) => a.type === 'question').length;
    const error = annotations.filter((a) => a.type === 'error').length;

    const suggestionPercent = total > 0 ? Math.round((suggestion / total) * 100) : 0;
    const questionPercent = total > 0 ? Math.round((question / total) * 100) : 0;
    const errorPercent = total > 0 ? Math.round((error / total) * 100) : 0;

    const recentAnnotations = [...annotations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);

    return {
      total,
      suggestion,
      question,
      error,
      suggestionPercent,
      questionPercent,
      errorPercent,
      recentAnnotations,
    };
  },

  addNotification: (message: string) => {
    const notification: NotificationItem = {
      id: uuidv4(),
      message,
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    setTimeout(() => {
      get().removeNotification(notification.id);
    }, 3000);
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
