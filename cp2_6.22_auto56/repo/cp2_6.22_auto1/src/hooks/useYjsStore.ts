import { create } from 'zustand';
import type { IComment, ITask, IDocumentVersion, IUserInfo, TaskStatus } from '../shared/types';

const USER_PALETTE = [
  '#E06C75',
  '#61AFEF',
  '#C678DD',
  '#56B6C2',
  '#E5C07B',
  '#98C379',
  '#D19A66',
  '#BE5046',
  '#7EC8E3',
  '#F4A261',
  '#2A9D8F',
  '#E76F51',
];

function colorFromUserId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return USER_PALETTE[Math.abs(hash) % USER_PALETTE.length];
}

function getOrCreateUserId(): string {
  const stored = localStorage.getItem('coedit-userId');
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem('coedit-userId', id);
  return id;
}

type ActivePanel = 'none' | 'history' | 'properties' | 'comments' | 'tasks';

interface YjsState {
  roomId: string;
  userName: string;
  userId: string;
  userColor: string;
  connected: boolean;
  comments: IComment[];
  tasks: ITask[];
  versions: IDocumentVersion[];
  activePanel: ActivePanel;
  showCommentPopup: boolean;
  commentPopupPosition: { x: number; y: number };
  selectedTextRange: { from: number; to: number } | null;
  sidebarOpen: boolean;
  diffMode: { leftId: string | null; rightId: string | null };
  users: IUserInfo[];
}

interface YjsActions {
  setRoomId: (id: string) => void;
  setUserName: (name: string) => void;
  setConnected: (value: boolean) => void;
  addComment: (comment: IComment) => void;
  resolveComment: (commentId: string) => void;
  addReply: (reply: IComment) => void;
  addTask: (task: ITask) => void;
  updateTask: (id: string, patch: Partial<ITask>) => void;
  deleteTask: (id: string) => void;
  reorderTask: (id: string, newOrder: number) => void;
  addVersion: (version: IDocumentVersion) => void;
  setActivePanel: (panel: ActivePanel) => void;
  toggleSidebar: () => void;
  setShowCommentPopup: (show: boolean) => void;
  setCommentPopupPosition: (pos: { x: number; y: number }) => void;
  setSelectedTextRange: (range: { from: number; to: number } | null) => void;
  setDiffMode: (mode: { leftId: string | null; rightId: string | null }) => void;
  getUserInfo: () => IUserInfo;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateVersionLabel: (versionId: string, label: string) => void;
  setUsers: (users: IUserInfo[]) => void;
  hydrate: (partial: Partial<YjsState>) => void;
}

const userId = getOrCreateUserId();

export const useYjsStore = create<YjsState & YjsActions>()((set, get) => ({
  roomId: '',
  userName: localStorage.getItem('coedit-userName') || '',
  userId,
  userColor: colorFromUserId(userId),
  connected: false,
  comments: [],
  tasks: [],
  versions: [],
  activePanel: 'none',
  showCommentPopup: false,
  commentPopupPosition: { x: 0, y: 0 },
  selectedTextRange: null,
  sidebarOpen: true,
  diffMode: { leftId: null, rightId: null },
  users: [],

  setRoomId: (id) => set({ roomId: id }),
  setUserName: (name) => {
    localStorage.setItem('coedit-userName', name);
    set({ userName: name });
  },
  setConnected: (value) => set({ connected: value }),

  addComment: (comment) =>
    set((s) => ({ comments: [...s.comments, comment] })),

  resolveComment: (commentId) =>
    set((s) => ({
      comments: s.comments.map((c) =>
        c.id === commentId ? { ...c, resolved: true } : c
      ),
    })),

  addReply: (reply) =>
    set((s) => ({ comments: [...s.comments, reply] })),

  addTask: (task) =>
    set((s) => ({ tasks: [...s.tasks, task] })),

  updateTask: (id, patch) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),

  deleteTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  reorderTask: (id, newOrder) =>
    set((s) => {
      const tasks = [...s.tasks];
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) return s;
      const [task] = tasks.splice(idx, 1);
      task.order = newOrder;
      tasks.splice(newOrder, 0, task);
      return { tasks: tasks.map((t, i) => ({ ...t, order: i })) };
    }),

  addVersion: (version) =>
    set((s) => ({ versions: [...s.versions, version] })),

  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setShowCommentPopup: (show) => set({ showCommentPopup: show }),
  setCommentPopupPosition: (pos) => set({ commentPopupPosition: pos }),
  setSelectedTextRange: (range) => set({ selectedTextRange: range }),
  setDiffMode: (mode) => set({ diffMode: mode }),

  getUserInfo: () => {
    const { userId, userName, userColor } = get();
    return { userId, name: userName, color: userColor };
  },

  updateTaskStatus: (id, status) => get().updateTask(id, { status }),

  updateVersionLabel: (versionId, label) =>
    set((s) => ({
      versions: s.versions.map((v) =>
        v.id === versionId ? { ...v, label } : v
      ),
    })),

  setUsers: (users) => set({ users }),

  hydrate: (partial) => set((s) => ({ ...s, ...partial })),
}));
