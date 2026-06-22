import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Highlight,
  Comment,
  HighlightColor,
  HighlightRange,
  AVATAR_COLORS,
  RANDOM_NICKNAMES,
  DEFAULT_DOCUMENT,
} from './types';

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createLocalUser(): User {
  const idx = Math.floor(Math.random() * RANDOM_NICKNAMES.length);
  const colorIdx = Math.floor(Math.random() * AVATAR_COLORS.length);
  return {
    id: uuidv4(),
    nickname: RANDOM_NICKNAMES[idx],
    color: AVATAR_COLORS[colorIdx],
    avatarIndex: colorIdx,
  };
}

interface AppState {
  documentContent: string;
  setDocumentContent: (content: string) => void;

  currentUser: User;
  users: User[];
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;

  roomId: string;
  setRoomId: (roomId: string) => void;

  highlights: Highlight[];
  addHighlight: (range: HighlightRange, color: HighlightColor, userId?: string) => Highlight;
  addHighlightFromRemote: (highlight: Highlight) => void;
  removeHighlight: (id: string) => void;

  comments: Comment[];
  addComment: (highlightId: string, content: string, userId?: string) => Comment;
  addCommentFromRemote: (comment: Comment) => void;

  activeHighlightId: string | null;
  setActiveHighlightId: (id: string | null) => void;

  isExporting: boolean;
  setIsExporting: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  documentContent: DEFAULT_DOCUMENT,
  setDocumentContent: (content: string) => set({ documentContent: content }),

  currentUser: createLocalUser(),
  users: [],
  addUser: (user: User) => {
    const { users } = get();
    if (!users.find((u) => u.id === user.id)) {
      set({ users: [...users, user] });
    }
  },
  removeUser: (userId: string) => {
    const { users } = get();
    set({ users: users.filter((u) => u.id !== userId) });
  },

  roomId: generateRoomId(),
  setRoomId: (roomId: string) => set({ roomId }),

  highlights: [],
  addHighlight: (range: HighlightRange, color: HighlightColor, userId?: string) => {
    const { currentUser, highlights } = get();
    const uid = userId ?? currentUser.id;
    const highlight: Highlight = {
      id: uuidv4(),
      userId: uid,
      color,
      range,
      createdAt: Date.now(),
    };
    set({ highlights: [...highlights, highlight] });
    return highlight;
  },
  addHighlightFromRemote: (highlight: Highlight) => {
    const { highlights } = get();
    if (!highlights.find((h) => h.id === highlight.id)) {
      set({ highlights: [...highlights, highlight] });
    }
  },
  removeHighlight: (id: string) => {
    const { highlights, comments } = get();
    set({
      highlights: highlights.filter((h) => h.id !== id),
      comments: comments.filter((c) => c.highlightId !== id),
    });
  },

  comments: [],
  addComment: (highlightId: string, content: string, userId?: string) => {
    const { currentUser, comments } = get();
    const uid = userId ?? currentUser.id;
    const comment: Comment = {
      id: uuidv4(),
      highlightId,
      userId: uid,
      content,
      timestamp: Date.now(),
    };
    set({ comments: [...comments, comment] });
    return comment;
  },
  addCommentFromRemote: (comment: Comment) => {
    const { comments } = get();
    if (!comments.find((c) => c.id === comment.id)) {
      set({ comments: [...comments, comment] });
    }
  },

  activeHighlightId: null,
  setActiveHighlightId: (id: string | null) => set({ activeHighlightId: id }),

  isExporting: false,
  setIsExporting: (v: boolean) => set({ isExporting: v }),
}));
