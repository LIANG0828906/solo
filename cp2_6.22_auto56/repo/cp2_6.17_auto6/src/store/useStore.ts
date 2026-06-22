import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface CursorInfo {
  userId: string;
  userName: string;
  color: string;
  position: number;
  lineNumber: number;
}

export interface CommentType {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  lineNumber: number;
  content: string;
  timestamp: number;
  replies: ReplyType[];
}

export interface ReplyType {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  timestamp: number;
  mention?: string;
}

export interface OnlineUser {
  id: string;
  name: string;
  color: string;
}

export interface VersionSnapshot {
  id: string;
  timestamp: number;
  content: string;
  creator: string;
}

interface AppState {
  document: string;
  revision: number;
  cursors: CursorInfo[];
  comments: CommentType[];
  onlineUsers: OnlineUser[];
  versionHistory: VersionSnapshot[];
  currentUser: OnlineUser | null;
  selectedLine: number | null;
  highlightedLine: number | null;
  commentPanelOpen: boolean;
  versionPanelOpen: boolean;
  pendingOps: number;

  setDocument: (doc: string) => void;
  setRevision: (rev: number) => void;
  incrementPendingOps: () => void;
  decrementPendingOps: () => void;

  addCursor: (cursor: CursorInfo) => void;
  removeCursor: (userId: string) => void;
  updateCursor: (cursor: CursorInfo) => void;

  addComment: (comment: CommentType) => void;
  addReply: (commentId: string, reply: ReplyType) => void;
  setSelectedLine: (line: number | null) => void;
  setHighlightedLine: (line: number | null) => void;

  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (id: string) => void;
  setCurrentUser: (user: OnlineUser) => void;

  addVersion: (version: VersionSnapshot) => void;
  restoreVersion: (versionId: string) => void;
  setVersionPanelOpen: (open: boolean) => void;

  setCommentPanelOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  document: '',
  revision: 0,
  cursors: [],
  comments: [],
  onlineUsers: [],
  versionHistory: [],
  currentUser: null,
  selectedLine: null,
  highlightedLine: null,
  commentPanelOpen: true,
  versionPanelOpen: false,
  pendingOps: 0,

  setDocument: (doc) => set({ document: doc }),
  setRevision: (rev) => set({ revision: rev }),
  incrementPendingOps: () => set((s) => ({ pendingOps: s.pendingOps + 1 })),
  decrementPendingOps: () => set((s) => ({ pendingOps: Math.max(0, s.pendingOps - 1) })),

  addCursor: (cursor) =>
    set((s) => {
      const existing = s.cursors.find((c) => c.userId === cursor.userId);
      if (existing) {
        return {
          cursors: s.cursors.map((c) =>
            c.userId === cursor.userId ? cursor : c
          ),
        };
      }
      return { cursors: [...s.cursors, cursor] };
    }),

  removeCursor: (userId) =>
    set((s) => ({ cursors: s.cursors.filter((c) => c.userId !== userId) })),

  updateCursor: (cursor) =>
    set((s) => ({
      cursors: s.cursors.map((c) =>
        c.userId === cursor.userId ? cursor : c
      ),
    })),

  addComment: (comment) =>
    set((s) => ({ comments: [comment, ...s.comments] })),

  addReply: (commentId, reply) =>
    set((s) => ({
      comments: s.comments.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
      ),
    })),

  setSelectedLine: (line) => set({ selectedLine: line }),
  setHighlightedLine: (line) => set({ highlightedLine: line }),

  addOnlineUser: (user) =>
    set((s) => {
      if (s.onlineUsers.find((u) => u.id === user.id)) return s;
      return { onlineUsers: [...s.onlineUsers, user] };
    }),

  removeOnlineUser: (id) =>
    set((s) => ({
      onlineUsers: s.onlineUsers.filter((u) => u.id !== id),
      cursors: s.cursors.filter((c) => c.userId !== id),
    })),

  setCurrentUser: (user) => set({ currentUser: user }),

  addVersion: (version) =>
    set((s) => ({ versionHistory: [...s.versionHistory, version] })),

  restoreVersion: (versionId) => {
    const version = get().versionHistory.find((v) => v.id === versionId);
    if (version) {
      set({ document: version.content });
    }
  },

  setVersionPanelOpen: (open) => set({ versionPanelOpen: open }),
  setCommentPanelOpen: (open) => set({ commentPanelOpen: open }),
}));
