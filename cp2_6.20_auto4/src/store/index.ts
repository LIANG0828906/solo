import { create } from 'zustand';
import type { Book, CheckInRecord, Comment, Achievement, BookList, CommentSortType } from '@/types';
import * as api from '@/api';
import { mockBooks, mockCheckInRecords, mockComments, mockAchievements, mockBookLists } from '@/mock/data';

function updateCommentInTree(
  comments: Comment[],
  id: string,
  updater: (c: Comment) => Comment
): Comment[] {
  return comments.map((c) => {
    if (c.id === id) return updater(c);
    if (c.replies.length > 0) {
      return { ...c, replies: updateCommentInTree(c.replies, id, updater) };
    }
    return c;
  });
}

function addReplyToComment(
  comments: Comment[],
  parentId: string,
  reply: Comment
): Comment[] {
  return comments.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...c.replies, reply] };
    }
    if (c.replies.length > 0) {
      return { ...c, replies: addReplyToComment(c.replies, parentId, reply) };
    }
    return c;
  });
}

interface StoreState {
  books: Book[];
  currentBook: Book | null;
  booksLoading: boolean;
  checkInRecords: CheckInRecord[];
  checkInLoading: boolean;
  comments: Comment[];
  commentsTotal: number;
  commentSortType: CommentSortType;
  commentsPage: number;
  commentsLoading: boolean;
  achievements: Achievement[];
  achievementsLoading: boolean;
  bookLists: BookList[];
  bookListsLoading: boolean;
  modalState: Record<string, boolean>;
  activeNavItem: string;
  mobileMenuOpen: boolean;

  fetchRecommendations: () => Promise<void>;
  fetchBookById: (id: string) => Promise<void>;
  fetchRecords: () => Promise<void>;
  submitRecord: (data: Omit<CheckInRecord, 'id'>) => Promise<void>;
  updateRecord: (id: string, data: Partial<CheckInRecord>) => Promise<void>;
  fetchComments: (bookId: string) => Promise<void>;
  addComment: (data: { bookId: string; content: string; parentId?: string }) => Promise<void>;
  likeComment: (id: string) => Promise<void>;
  replyComment: (id: string, content: string) => Promise<void>;
  setSortType: (sort: CommentSortType) => void;
  fetchAchievements: () => Promise<void>;
  fetchBookLists: () => Promise<void>;
  createBookList: (data: { name: string; type: BookList['type'] }) => Promise<void>;
  deleteBookList: (id: string) => Promise<void>;
  addBookToList: (listId: string, bookId: string) => Promise<void>;
  reorderLists: (orders: { id: string; order: number }[]) => Promise<void>;
  setModalState: (key: string, open: boolean) => void;
  setActiveNavItem: (item: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  books: [],
  currentBook: null,
  booksLoading: false,
  checkInRecords: [],
  checkInLoading: false,
  comments: [],
  commentsTotal: 0,
  commentSortType: 'latest',
  commentsPage: 1,
  commentsLoading: false,
  achievements: [],
  achievementsLoading: false,
  bookLists: [],
  bookListsLoading: false,
  modalState: {},
  activeNavItem: 'home',
  mobileMenuOpen: false,

  fetchRecommendations: async () => {
    set({ booksLoading: true });
    try {
      const data = await api.getBookRecommendations();
      set({ books: data, booksLoading: false });
    } catch {
      set({ books: mockBooks, booksLoading: false });
    }
  },

  fetchBookById: async (id) => {
    set({ booksLoading: true });
    try {
      const data = await api.getBookById(id);
      set({ currentBook: data, booksLoading: false });
    } catch {
      const book = mockBooks.find((b) => b.id === id) ?? null;
      set({ currentBook: book, booksLoading: false });
    }
  },

  fetchRecords: async () => {
    set({ checkInLoading: true });
    try {
      const data = await api.getCheckInRecords();
      set({ checkInRecords: data, checkInLoading: false });
    } catch {
      set({ checkInRecords: mockCheckInRecords, checkInLoading: false });
    }
  },

  submitRecord: async (data) => {
    try {
      const record = await api.submitCheckIn(data);
      set((state) => ({ checkInRecords: [record, ...state.checkInRecords] }));
    } catch {
      const record: CheckInRecord = { ...data, id: `ci_${Date.now()}` };
      set((state) => ({ checkInRecords: [record, ...state.checkInRecords] }));
    }
  },

  updateRecord: async (id, data) => {
    try {
      const record = await api.updateCheckIn(id, data);
      set((state) => ({
        checkInRecords: state.checkInRecords.map((r) => (r.id === id ? record : r)),
      }));
    } catch {
      set((state) => ({
        checkInRecords: state.checkInRecords.map((r) =>
          r.id === id ? { ...r, ...data } : r
        ),
      }));
    }
  },

  fetchComments: async (bookId) => {
    set({ commentsLoading: true });
    try {
      const data = await api.fetchComments(
        bookId,
        get().commentsPage,
        10,
        get().commentSortType
      );
      set({
        comments: data.items,
        commentsTotal: data.total,
        commentsLoading: false,
      });
    } catch {
      const filtered = mockComments.filter((c) => c.bookId === bookId);
      set({ comments: filtered, commentsTotal: filtered.length, commentsLoading: false });
    }
  },

  addComment: async (data) => {
    try {
      const comment = await api.submitComment(data);
      set((state) => ({
        comments: [comment, ...state.comments],
        commentsTotal: state.commentsTotal + 1,
      }));
    } catch {
      const comment: Comment = {
        id: `c_${Date.now()}`,
        bookId: data.bookId,
        userId: 'u_current',
        userName: '我',
        avatar: '',
        content: data.content,
        likes: 0,
        replies: [],
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        comments: [comment, ...state.comments],
        commentsTotal: state.commentsTotal + 1,
      }));
    }
  },

  likeComment: async (id) => {
    try {
      const result = await api.likeComment(id);
      set((state) => ({
        comments: updateCommentInTree(state.comments, id, (c) => ({
          ...c,
          likes: result.likes,
        })),
      }));
    } catch {
      set((state) => ({
        comments: updateCommentInTree(state.comments, id, (c) => ({
          ...c,
          likes: c.likes + 1,
        })),
      }));
    }
  },

  replyComment: async (id, content) => {
    try {
      const reply = await api.replyComment(id, content);
      set((state) => ({
        comments: addReplyToComment(state.comments, id, reply),
      }));
    } catch {
      const reply: Comment = {
        id: `r_${Date.now()}`,
        bookId: '',
        userId: 'u_current',
        userName: '我',
        avatar: '',
        content,
        likes: 0,
        replies: [],
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        comments: addReplyToComment(state.comments, id, reply),
      }));
    }
  },

  setSortType: (sort) => {
    set({ commentSortType: sort, commentsPage: 1 });
  },

  fetchAchievements: async () => {
    set({ achievementsLoading: true });
    try {
      const data = await api.getAchievements();
      set({ achievements: data, achievementsLoading: false });
    } catch {
      set({ achievements: mockAchievements, achievementsLoading: false });
    }
  },

  fetchBookLists: async () => {
    set({ bookListsLoading: true });
    try {
      const data = await api.getBookLists();
      set({ bookLists: data, bookListsLoading: false });
    } catch {
      set({ bookLists: mockBookLists, bookListsLoading: false });
    }
  },

  createBookList: async (data) => {
    try {
      const list = await api.createBookList(data);
      set((state) => ({ bookLists: [...state.bookLists, list] }));
    } catch {
      const list: BookList = {
        id: `bl_${Date.now()}`,
        name: data.name,
        type: data.type,
        cover: '',
        books: [],
        order: get().bookLists.length + 1,
      };
      set((state) => ({ bookLists: [...state.bookLists, list] }));
    }
  },

  deleteBookList: async (id) => {
    try {
      await api.deleteBookList(id);
      set((state) => ({ bookLists: state.bookLists.filter((l) => l.id !== id) }));
    } catch {
      set((state) => ({ bookLists: state.bookLists.filter((l) => l.id !== id) }));
    }
  },

  addBookToList: async (listId, bookId) => {
    try {
      const updated = await api.addBookToBookList(listId, bookId);
      set((state) => ({
        bookLists: state.bookLists.map((l) => (l.id === listId ? updated : l)),
      }));
    } catch {
      const book = mockBooks.find((b) => b.id === bookId);
      if (book) {
        set((state) => ({
          bookLists: state.bookLists.map((l) =>
            l.id === listId ? { ...l, books: [...l.books, book] } : l
          ),
        }));
      }
    }
  },

  reorderLists: async (orders) => {
    try {
      const data = await api.reorderBookLists(orders);
      set({ bookLists: data });
    } catch {
      set((state) => ({
        bookLists: state.bookLists.map((l) => {
          const order = orders.find((o) => o.id === l.id);
          return order ? { ...l, order: order.order } : l;
        }),
      }));
    }
  },

  setModalState: (key, open) => {
    set((state) => ({ modalState: { ...state.modalState, [key]: open } }));
  },

  setActiveNavItem: (item) => {
    set({ activeNavItem: item });
  },

  setMobileMenuOpen: (open) => {
    set({ mobileMenuOpen: open });
  },
}));
