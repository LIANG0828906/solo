import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Note,
  Annotation,
  Concept,
  Edge,
  VersionHistory,
  User,
  AnnotationReply,
} from '@/types';
import {
  saveNote,
  saveAnnotation,
  deleteAnnotation,
  saveConcepts,
  saveEdges,
  saveVersion,
  deleteConceptsByNoteId,
  deleteEdgesByNoteId,
} from '@/utils/db';

const CURRENT_NOTE_ID = 'default-note';
const VERSION_INTERVAL = 10 * 60 * 1000;
const IDLE_VERSION_DELAY = 5 * 60 * 1000;

interface StoreState {
  currentUser: User;
  otherUsers: User[];
  note: Note;
  annotations: Annotation[];
  concepts: Concept[];
  edges: Edge[];
  versionHistory: VersionHistory[];
  selectedText: { text: string; from: number; to: number } | null;
  highlightPosition: number | null;
  isLoading: boolean;
  wsConnected: boolean;
  rightPanelMode: 'annotations' | 'knowledge' | 'history';
  lastEditTime: number;

  setNoteContent: (content: string, html: string) => void;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'replies'>) => void;
  updateAnnotation: (id: string, text: string) => void;
  removeAnnotation: (id: string) => void;
  addReply: (annotationId: string, text: string, author: string, authorColor: string) => void;
  setConceptsAndEdges: (concepts: Concept[], edges: Edge[]) => void;
  setSelectedText: (selected: { text: string; from: number; to: number } | null) => void;
  setHighlightPosition: (position: number | null) => void;
  setOtherUsers: (users: User[]) => void;
  updateUserCursor: (userId: string, position: number | null) => void;
  addVersion: (description?: string) => void;
  restoreVersion: (versionId: string) => void;
  setVersionHistory: (history: VersionHistory[]) => void;
  setWsConnected: (connected: boolean) => void;
  setRightPanelMode: (mode: 'annotations' | 'knowledge' | 'history') => void;
  setNote: (note: Note) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  setCurrentUser: (user: User) => void;
  initAutoSave: () => void;
  cleanupAutoSave: () => void;
}

const mockUsers: User[] = [
  { id: 'user-1', name: '学生A', color: '#E74C3C', cursorPosition: null },
  { id: 'user-2', name: '学生B', color: '#3498DB', cursorPosition: null },
];

const getInitialNote = (): Note => {
  const now = new Date();
  return {
    id: CURRENT_NOTE_ID,
    content: `机器学习（Machine Learning）是人工智能的一个分支，它使计算机系统能够从数据中学习并改进性能，而无需进行明确的编程。机器学习的核心是算法，这些算法可以从数据中发现模式并做出预测或决策。

监督学习（Supervised Learning）是机器学习的一种类型，其中模型从标记的数据中学习。常见的监督学习算法包括线性回归（Linear Regression）、决策树（Decision Tree）、支持向量机（SVM）和神经网络（Neural Network）。

无监督学习（Unsupervised Learning）则从未标记的数据中学习，试图发现数据中的隐藏模式或结构。聚类（Clustering）和降维（Dimensionality Reduction）是无监督学习的主要任务，K均值（K-Means）和主成分分析（PCA）是常用的算法。

深度学习（Deep Learning）是机器学习的一个子领域，它使用多层神经网络来学习复杂的数据表示。卷积神经网络（CNN）在图像识别方面表现出色，而循环神经网络（RNN）则适用于序列数据处理。

机器学习在各个领域都有广泛应用，包括自然语言处理（NLP）、计算机视觉（Computer Vision）、推荐系统（Recommendation System）和自动驾驶（Autonomous Driving）。

模型评估（Model Evaluation）是机器学习流程中的重要环节，常用的评估指标包括准确率（Accuracy）、精确率（Precision）、召回率（Recall）和F1分数（F1 Score）。交叉验证（Cross Validation）可以更可靠地评估模型的泛化能力。

过拟合（Overfitting）是机器学习中的常见问题，指模型在训练数据上表现很好，但在未见过的数据上表现不佳。正则化（Regularization）和数据增强（Data Augmentation）是防止过拟合的常用技术。`,
    html: '',
    createdAt: now,
    updatedAt: now,
  };
};

let intervalTimer: ReturnType<typeof setInterval> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<StoreState>((set, get) => ({
  currentUser: mockUsers[0],
  otherUsers: [mockUsers[1]],
  note: getInitialNote(),
  annotations: [],
  concepts: [],
  edges: [],
  versionHistory: [],
  selectedText: null,
  highlightPosition: null,
  isLoading: false,
  wsConnected: false,
  rightPanelMode: 'knowledge',
  lastEditTime: Date.now(),

  initAutoSave: () => {
    if (intervalTimer) {
      clearInterval(intervalTimer);
    }

    intervalTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastEdit = now - get().lastEditTime;
      if (timeSinceLastEdit >= VERSION_INTERVAL) {
        get().addVersion('定时自动保存');
      }
    }, VERSION_INTERVAL);
  },

  cleanupAutoSave: () => {
    if (intervalTimer) {
      clearInterval(intervalTimer);
      intervalTimer = null;
    }
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  },

  setCurrentUser: (user: User) => {
    set({ currentUser: user });
  },

  setNoteContent: (content: string, html: string) => {
    const updatedNote = {
      ...get().note,
      content,
      html,
      updatedAt: new Date(),
    };
    const now = Date.now();

    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    idleTimer = setTimeout(() => {
      get().addVersion('空闲自动保存');
    }, IDLE_VERSION_DELAY);

    set({ note: updatedNote, lastEditTime: now });
    saveNote(updatedNote).catch(console.error);
  },

  setNote: (note: Note) => {
    set({ note });
    saveNote(note).catch(console.error);
  },

  addAnnotation: (annotationData) => {
    const newAnnotation: Annotation = {
      ...annotationData,
      id: uuidv4(),
      createdAt: new Date(),
      replies: [],
    };

    const relatedConcept = get().concepts.find(
      (c) => annotationData.selectedText.toLowerCase().includes(c.name.toLowerCase())
    );
    if (relatedConcept) {
      newAnnotation.relatedConceptId = relatedConcept.id;
    }

    const updatedAnnotations = [...get().annotations, newAnnotation];
    set({ annotations: updatedAnnotations });
    saveAnnotation(newAnnotation).catch(console.error);
  },

  updateAnnotation: (id: string, text: string) => {
    const updatedAnnotations = get().annotations.map((a) =>
      a.id === id ? { ...a, text } : a
    );
    set({ annotations: updatedAnnotations });
    const annotation = updatedAnnotations.find((a) => a.id === id);
    if (annotation) {
      saveAnnotation(annotation).catch(console.error);
    }
  },

  removeAnnotation: (id: string) => {
    const updatedAnnotations = get().annotations.filter((a) => a.id !== id);
    set({ annotations: updatedAnnotations });
    deleteAnnotation(id).catch(console.error);
  },

  setAnnotations: (annotations: Annotation[]) => {
    set({ annotations });
  },

  addReply: (annotationId: string, text: string, author: string, authorColor: string) => {
    const reply: AnnotationReply = {
      id: uuidv4(),
      text,
      author,
      authorColor,
      createdAt: new Date(),
    };

    const updatedAnnotations = get().annotations.map((a) =>
      a.id === annotationId ? { ...a, replies: [...a.replies, reply] } : a
    );
    set({ annotations: updatedAnnotations });
    const annotation = updatedAnnotations.find((a) => a.id === annotationId);
    if (annotation) {
      saveAnnotation(annotation).catch(console.error);
    }
  },

  setConceptsAndEdges: (concepts: Concept[], edges: Edge[]) => {
    const noteId = get().note.id;
    deleteConceptsByNoteId(noteId)
      .then(() => saveConcepts(concepts))
      .catch(console.error);
    deleteEdgesByNoteId(noteId)
      .then(() => saveEdges(edges))
      .catch(console.error);
    set({ concepts, edges });
  },

  setSelectedText: (selected) => {
    set({ selectedText: selected });
  },

  setHighlightPosition: (position) => {
    set({ highlightPosition: position });
    if (position !== null) {
      setTimeout(() => {
        if (get().highlightPosition === position) {
          set({ highlightPosition: null });
        }
      }, 500);
    }
  },

  setOtherUsers: (users: User[]) => {
    set({ otherUsers: users });
  },

  updateUserCursor: (userId: string, position: number | null) => {
    set((state) => ({
      otherUsers: state.otherUsers.map((u) =>
        u.id === userId ? { ...u, cursorPosition: position } : u
      ),
    }));
  },

  addVersion: (description?: string) => {
    const { note } = get();
    const version: VersionHistory = {
      id: uuidv4(),
      noteId: note.id,
      content: note.content,
      html: note.html,
      description: description || `版本快照 - ${new Date().toLocaleString('zh-CN')}`,
      timestamp: new Date(),
    };

    const updatedHistory = [version, ...get().versionHistory];
    set({ versionHistory: updatedHistory });
    saveVersion(version).catch(console.error);
  },

  setVersionHistory: (history: VersionHistory[]) => {
    set({ versionHistory: history });
  },

  restoreVersion: (versionId: string) => {
    const version = get().versionHistory.find((v) => v.id === versionId);
    if (version) {
      const updatedNote = {
        ...get().note,
        content: version.content,
        html: version.html,
        updatedAt: new Date(),
      };
      set({ note: updatedNote });
      saveNote(updatedNote).catch(console.error);
    }
  },

  setWsConnected: (connected) => {
    set({ wsConnected: connected });
  },

  setRightPanelMode: (mode) => {
    set({ rightPanelMode: mode });
  },
}));
