import { create } from 'zustand';
import type { UserInfo, Comment, Version, ConflictInfo, EditOp } from '../types';
import { EditorEngine } from '../engine/editorEngine';
import { CollabEngine, ConnectionStatus } from '../engine/collabEngine';

interface EditorState {
  userId: string;
  userName: string;
  userColor: string;
  documentId: string;
  content: string;
  comments: Comment[];
  versions: Version[];
  users: UserInfo[];
  connectionStatus: ConnectionStatus;
  lastSavedAt: number;
  wordCount: number;
  cursorPosition: number;
  selectionStart: number;
  selectionEnd: number;
  activePanel: 'comments' | 'versions' | null;
  conflict: ConflictInfo | null;
  showConflictDetail: boolean;
  searchQuery: string;
  previewVersion: string | null;
  editorEngine: EditorEngine | null;
  collabEngine: CollabEngine | null;

  setContent: (content: string) => void;
  setComments: (comments: Comment[]) => void;
  setVersions: (versions: Version[]) => void;
  setUsers: (users: UserInfo[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastSavedAt: (time: number) => void;
  setCursorPosition: (pos: number) => void;
  setSelection: (start: number, end: number) => void;
  setActivePanel: (panel: 'comments' | 'versions' | null) => void;
  setConflict: (conflict: ConflictInfo | null) => void;
  setShowConflictDetail: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setPreviewVersion: (versionId: string | null) => void;
  initEngines: () => void;
  addComment: (start: number, end: number, text: string) => void;
  resolveComment: (commentId: string, resolved: boolean) => void;
  replyToComment: (commentId: string, text: string) => void;
  saveVersion: () => void;
  restoreVersion: (versionId: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  handleRemoteEdit: (userId: string, op: EditOp) => void;
  updateRemoteCursor: (userId: string, position: number, color: string) => void;
  updateRemoteSelection: (userId: string, start: number, end: number, color: string) => void;
  addRemoteUser: (user: UserInfo) => void;
  removeRemoteUser: (userId: string) => void;
  setUserColor: (color: string) => void;
}

const generateUserId = (): string => {
  let id = localStorage.getItem('collab_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('collab_user_id', id);
  }
  return id;
};

const generateUserName = (): string => {
  const names = ['小明', '小红', '作者A', '编辑B', '审稿人C'];
  const idx = Math.floor(Math.random() * names.length);
  return names[idx];
};

export const useEditorStore = create<EditorState>((set, get) => ({
  userId: generateUserId(),
  userName: generateUserName(),
  userColor: '#FF6B6B',
  documentId: 'default-doc',
  content: '',
  comments: [],
  versions: [],
  users: [],
  connectionStatus: 'disconnected',
  lastSavedAt: Date.now(),
  wordCount: 0,
  cursorPosition: 0,
  selectionStart: 0,
  selectionEnd: 0,
  activePanel: 'comments',
  conflict: null,
  showConflictDetail: false,
  searchQuery: '',
  previewVersion: null,
  editorEngine: null,
  collabEngine: null,

  setContent: (content) => {
    set({ content, wordCount: content.trim() ? content.trim().split(/\s+/).length : 0 });
  },

  setComments: (comments) => set({ comments }),

  setVersions: (versions) => set({ versions }),

  setUsers: (users) => set({ users }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setLastSavedAt: (time) => set({ lastSavedAt: time }),

  setCursorPosition: (pos) => set({ cursorPosition: pos }),

  setSelection: (start, end) => set({ selectionStart: start, selectionEnd: end }),

  setActivePanel: (panel) => set({ activePanel: panel }),

  setConflict: (conflict) => set({ conflict }),

  setShowConflictDetail: (show) => set({ showConflictDetail: show }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setPreviewVersion: (versionId) => set({ previewVersion: versionId }),

  setUserColor: (color) => set({ userColor: color }),

  initEngines: () => {
    const { userId, userName, documentId } = get();
    const editorEngine = new EditorEngine('', userId);
    const collabEngine = new CollabEngine({
      userId,
      userName,
      documentId,
    });

    collabEngine.setOnMessage((message) => {
      switch (message.type) {
        case 'init':
          editorEngine.setContent(message.content);
          editorEngine.setComments(message.comments);
          set({
            content: message.content,
            comments: message.comments,
            users: message.users,
            wordCount: message.content.trim() ? message.content.trim().split(/\s+/).length : 0,
          });
          const self = message.users.find((u) => u.id === userId);
          if (self) {
            set({ userColor: self.color });
          }
          break;
        case 'users':
          set({ users: message.users });
          const me = message.users.find((u) => u.id === userId);
          if (me) {
            set({ userColor: me.color });
          }
          break;
        case 'userJoin':
          set((state) => ({
            users: [...state.users.filter((u) => u.id !== message.user.id), message.user],
          }));
          break;
        case 'userLeave':
          set((state) => ({
            users: state.users.filter((u) => u.id !== message.userId),
          }));
          break;
        case 'edit':
          get().handleRemoteEdit(message.userId, message.op);
          break;
        case 'cursor':
          get().updateRemoteCursor(message.userId, message.position, message.color);
          break;
        case 'selection':
          get().updateRemoteSelection(message.userId, message.start, message.end, message.color);
          break;
        case 'comment':
          set((state) => ({
            comments: [...state.comments, message.comment],
          }));
          editorEngine.setComments([...get().comments, message.comment]);
          break;
        case 'resolveComment':
          set((state) => ({
            comments: state.comments.map((c) =>
              c.id === message.commentId ? { ...c, resolved: message.resolved } : c
            ),
          }));
          break;
        case 'replyComment':
          set((state) => ({
            comments: state.comments.map((c) =>
              c.id === message.commentId
                ? { ...c, replies: [...c.replies, message.reply] }
                : c
            ),
          }));
          break;
      }
    });

    collabEngine.setOnStatusChange((status) => {
      set({ connectionStatus: status });
    });

    editorEngine.subscribe(() => {
      set({
        content: editorEngine.getContent(),
        comments: editorEngine.getComments(),
        versions: editorEngine.getVersions(),
        lastSavedAt: editorEngine.getLastSavedAt(),
        wordCount: editorEngine.getWordCount(),
        cursorPosition: editorEngine.getCursorPosition(),
        selectionStart: editorEngine.getSelection().start,
        selectionEnd: editorEngine.getSelection().end,
      });
    });

    collabEngine.connect();

    set({ editorEngine, collabEngine });
  },

  addComment: (start, end, text) => {
    const { editorEngine, collabEngine, userName, userColor } = get();
    if (!editorEngine || !collabEngine) return;

    const comment = editorEngine.addComment(start, end, text, userName, userColor);
    collabEngine.sendComment(comment);
  },

  resolveComment: (commentId, resolved) => {
    const { editorEngine, collabEngine } = get();
    if (!editorEngine || !collabEngine) return;

    editorEngine.resolveComment(commentId, resolved);
    collabEngine.sendResolveComment(commentId, resolved);
  },

  replyToComment: (commentId, text) => {
    const { editorEngine, collabEngine, userName } = get();
    if (!editorEngine || !collabEngine) return;

    const reply = editorEngine.replyToComment(commentId, text, userName);
    if (reply) {
      collabEngine.sendReplyComment(commentId, reply);
    }
  },

  saveVersion: () => {
    const { editorEngine } = get();
    if (!editorEngine) return;

    editorEngine.createVersion();
    set({ versions: editorEngine.getVersions() });
  },

  restoreVersion: (versionId) => {
    const { editorEngine } = get();
    if (!editorEngine) return;

    editorEngine.restoreVersion(versionId);
    set({
      content: editorEngine.getContent(),
      comments: editorEngine.getComments(),
      previewVersion: null,
    });
  },

  undo: () => {
    const { editorEngine, collabEngine } = get();
    if (!editorEngine || !collabEngine) return;

    if (editorEngine.undo()) {
      const op: EditOp = {
        type: 'delete',
        position: editorEngine.getCursorPosition(),
        text: '',
        timestamp: Date.now(),
        userId: get().userId,
      };
      collabEngine.sendEdit(op);
    }
  },

  redo: () => {
    const { editorEngine, collabEngine } = get();
    if (!editorEngine || !collabEngine) return;

    if (editorEngine.redo()) {
      const op: EditOp = {
        type: 'insert',
        position: editorEngine.getCursorPosition(),
        text: '',
        timestamp: Date.now(),
        userId: get().userId,
      };
      collabEngine.sendEdit(op);
    }
  },

  canUndo: () => {
    const { editorEngine } = get();
    return editorEngine ? editorEngine.canUndo() : false;
  },

  canRedo: () => {
    const { editorEngine } = get();
    return editorEngine ? editorEngine.canRedo() : false;
  },

  handleRemoteEdit: (userId, op) => {
    const { editorEngine, users } = get();
    if (!editorEngine) return;

    const success = editorEngine.applyRemoteOp(op);
    if (!success) {
      const remoteUser = users.find((u) => u.id === userId);
      if (remoteUser) {
        const conflict = editorEngine.createConflictInfo(op, remoteUser);
        set({ conflict, showConflictDetail: false });
      }
    }
  },

  updateRemoteCursor: (userId, position, color) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId
          ? { ...u, cursorPosition: position, color, selectionStart: position, selectionEnd: position }
          : u
      ),
    }));
  },

  updateRemoteSelection: (userId, start, end, color) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId
          ? { ...u, selectionStart: start, selectionEnd: end, cursorPosition: end, color }
          : u
      ),
    }));
  },

  addRemoteUser: (user) => {
    set((state) => ({
      users: [...state.users.filter((u) => u.id !== user.id), user],
    }));
  },

  removeRemoteUser: (userId) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
    }));
  },
}));
