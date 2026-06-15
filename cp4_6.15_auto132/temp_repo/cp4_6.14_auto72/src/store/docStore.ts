import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { MOCK_DOCUMENT, MOCK_USERS, MOCK_ANNOTATIONS, USER_COLORS, AVATAR_COLORS } from '@/utils/mockData';

export interface User {
  id: string;
  name: string;
  color: string;
  positionPercent: number;
  paragraphIndex: number;
  isNew?: boolean;
}

export interface Annotation {
  id: string;
  type: 'highlight' | 'comment';
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
  comment: string;
  userId: string;
  createdAt: number;
}

export interface SelectedRange {
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
}

export interface HistoryItem {
  id: string;
  docId: string;
  docTitle: string;
  paragraphIndex: number;
  summary: string;
  timestamp: number;
}

export interface PageDirection {
  page: number;
  direction: 'left' | 'right' | null;
}

interface DocStore {
  currentDoc: { id: string; title: string; paragraphs: string[] };
  pageState: PageDirection;
  paragraphsPerPage: number;

  positionPercent: number;
  currentParagraphIndex: number;

  users: User[];
  currentUserId: string;

  annotations: Annotation[];
  selectedRange: SelectedRange | null;
  showAnnotationToolbar: boolean;
  showCommentModal: boolean;

  history: HistoryItem[];
  showHistoryPanel: boolean;
  showUserPanel: boolean;

  setCurrentPage: (page: number, direction?: 'left' | 'right') => void;
  updatePosition: (percent: number, paragraphIndex: number) => void;
  addUser: (name: string) => void;
  broadcastPosition: () => void;
  receiveRemotePosition: (userId: string, percent: number, paragraphIndex: number) => void;
  setSelectedRange: (range: SelectedRange | null) => void;
  addHighlight: () => void;
  addComment: (comment: string) => void;
  toggleCommentModal: (show: boolean) => void;
  clearUserNewFlag: (userId: string) => void;
  addHistoryRecord: () => void;
  jumpToHistory: (historyId: string) => void;
  toggleHistoryPanel: () => void;
  toggleUserPanel: () => void;
}

const getCurrentUserId = () => {
  let id = localStorage.getItem('collab_current_user_id');
  if (!id) {
    id = 'user-' + uuidv4().slice(0, 8);
    localStorage.setItem('collab_current_user_id', id);
  }
  return id;
};

const getInitialUsers = (): User[] => {
  const currentUserId = getCurrentUserId();
  const currentUserExists = MOCK_USERS.some((u) => u.id === currentUserId);
  if (currentUserExists) {
    return MOCK_USERS;
  }
  return [
    ...MOCK_USERS,
    {
      id: currentUserId,
      name: '我',
      color: USER_COLORS[3],
      positionPercent: 0,
      paragraphIndex: 0,
      isNew: false,
    },
  ];
};

export const useDocStore = create<DocStore>((set, get) => ({
  currentDoc: MOCK_DOCUMENT,
  pageState: { page: 1, direction: null },
  paragraphsPerPage: 10,

  positionPercent: 0,
  currentParagraphIndex: 0,

  users: getInitialUsers(),
  currentUserId: getCurrentUserId(),

  annotations: MOCK_ANNOTATIONS,
  selectedRange: null,
  showAnnotationToolbar: false,
  showCommentModal: false,

  history: [],
  showHistoryPanel: false,
  showUserPanel: true,

  setCurrentPage: (page, direction) => {
    const { paragraphsPerPage, currentDoc, addHistoryRecord } = get();
    const totalPages = Math.ceil(currentDoc.paragraphs.length / paragraphsPerPage);
    const safePage = Math.max(1, Math.min(page, totalPages));
    set({
      pageState: { page: safePage, direction: direction ?? null },
      currentParagraphIndex: (safePage - 1) * paragraphsPerPage,
      positionPercent: ((safePage - 1) * paragraphsPerPage) / currentDoc.paragraphs.length,
    });
    addHistoryRecord();
  },

  updatePosition: (percent, paragraphIndex) => {
    set({
      positionPercent: Math.max(0, Math.min(1, percent)),
      currentParagraphIndex: paragraphIndex,
    });
  },

  addUser: (name) => {
    if (!name.trim()) return;
    const { users } = get();
    const colorIndex = users.length % AVATAR_COLORS.length;
    const newUser: User = {
      id: 'user-' + uuidv4().slice(0, 8),
      name: name.trim(),
      color: AVATAR_COLORS[colorIndex],
      positionPercent: 0,
      paragraphIndex: 0,
      isNew: true,
    };
    set({ users: [...users, newUser] });
    setTimeout(() => {
      get().clearUserNewFlag(newUser.id);
    }, 600);
  },

  broadcastPosition: () => {
    const { currentUserId, positionPercent, currentParagraphIndex } = get();
    get().receiveRemotePosition(currentUserId, positionPercent, currentParagraphIndex);
  },

  receiveRemotePosition: (userId, percent, paragraphIndex) => {
    const { users, currentUserId } = get();
    if (userId !== currentUserId) {
      set({
        users: users.map((u) =>
          u.id === userId
            ? { ...u, positionPercent: percent, paragraphIndex }
            : u
        ),
      });
    } else {
      set({
        users: users.map((u) =>
          u.id === userId
            ? { ...u, positionPercent: percent, paragraphIndex }
            : u
        ),
      });
    }
  },

  setSelectedRange: (range) => {
    set({
      selectedRange: range,
      showAnnotationToolbar: range !== null,
    });
  },

  addHighlight: () => {
    const { selectedRange, currentUserId, annotations } = get();
    if (!selectedRange) return;
    const newAnnotation: Annotation = {
      id: 'ann-' + uuidv4().slice(0, 8),
      type: 'highlight',
      paragraphIndex: selectedRange.paragraphIndex,
      startOffset: selectedRange.startOffset,
      endOffset: selectedRange.endOffset,
      text: selectedRange.text,
      comment: '',
      userId: currentUserId,
      createdAt: Date.now(),
    };
    set({
      annotations: [...annotations, newAnnotation],
      selectedRange: null,
      showAnnotationToolbar: false,
    });
  },

  addComment: (comment) => {
    const { selectedRange, currentUserId, annotations } = get();
    if (!selectedRange || !comment.trim()) return;
    const newAnnotation: Annotation = {
      id: 'ann-' + uuidv4().slice(0, 8),
      type: 'comment',
      paragraphIndex: selectedRange.paragraphIndex,
      startOffset: selectedRange.startOffset,
      endOffset: selectedRange.endOffset,
      text: selectedRange.text,
      comment: comment.trim(),
      userId: currentUserId,
      createdAt: Date.now(),
    };
    set({
      annotations: [...annotations, newAnnotation],
      selectedRange: null,
      showAnnotationToolbar: false,
      showCommentModal: false,
    });
  },

  toggleCommentModal: (show) => {
    set({ showCommentModal: show });
  },

  clearUserNewFlag: (userId) => {
    const { users } = get();
    set({
      users: users.map((u) => (u.id === userId ? { ...u, isNew: false } : u)),
    });
  },

  addHistoryRecord: () => {
    const { currentDoc, currentParagraphIndex, history } = get();
    const paragraph = currentDoc.paragraphs[currentParagraphIndex] || '';
    const summary = paragraph.length > 20 ? paragraph.slice(0, 20) + '...' : paragraph;
    const newRecord: HistoryItem = {
      id: 'hist-' + uuidv4().slice(0, 8),
      docId: currentDoc.id,
      docTitle: currentDoc.title,
      paragraphIndex: currentParagraphIndex,
      summary,
      timestamp: Date.now(),
    };
    const updated = [newRecord, ...history].slice(0, 20);
    set({ history: updated });
  },

  jumpToHistory: (historyId) => {
    const { history, paragraphsPerPage, setCurrentPage } = get();
    const record = history.find((h) => h.id === historyId);
    if (!record) return;
    const targetPage = Math.floor(record.paragraphIndex / paragraphsPerPage) + 1;
    setCurrentPage(targetPage);
    set({ showHistoryPanel: false });
  },

  toggleHistoryPanel: () => {
    set((state) => ({ showHistoryPanel: !state.showHistoryPanel }));
  },

  toggleUserPanel: () => {
    set((state) => ({ showUserPanel: !state.showUserPanel }));
  },
}));
