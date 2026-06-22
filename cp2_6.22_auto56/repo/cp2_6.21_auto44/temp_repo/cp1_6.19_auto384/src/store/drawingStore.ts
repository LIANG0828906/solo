import { create } from 'zustand';

export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export interface DrawAction {
  id: string;
  sessionId: string;
  userId: string;
  color: string;
  thickness: number;
  mode: 'brush' | 'eraser';
  points: Point[];
  startTime: number;
  endTime: number;
}

export interface CursorInfo {
  userId: string;
  color: string;
  x: number;
  y: number;
}

export interface SessionInfo {
  id: string;
  name: string;
  createdAt: number;
  actionCount: number;
}

interface DrawingState {
  userId: string | null;
  userColor: string;
  currentSessionId: string | null;
  currentSessionName: string;

  color: string;
  thickness: number;
  mode: 'brush' | 'eraser';

  undoStack: DrawAction[];
  redoStack: DrawAction[];
  maxStackSize: number;

  actions: DrawAction[];
  remoteActions: DrawAction[];

  remoteCursors: Record<string, CursorInfo>;
  sessions: SessionInfo[];

  isPlaying: boolean;
  playIndex: number;
  playActions: DrawAction[];

  setUserId: (id: string, color: string) => void;
  setCurrentSession: (id: string, name: string) => void;

  setColor: (color: string) => void;
  setThickness: (thickness: number) => void;
  setMode: (mode: 'brush' | 'eraser') => void;

  addLocalAction: (action: DrawAction) => void;
  addRemoteAction: (action: DrawAction) => void;
  addRemoteActionPart: (actionId: string, point: Point) => void;
  initRemoteAction: (action: DrawAction) => void;

  undo: () => DrawAction | null;
  redo: () => DrawAction | null;

  setActions: (actions: DrawAction[]) => void;
  clearCanvas: () => void;

  setRemoteCursor: (cursor: CursorInfo) => void;
  removeRemoteCursor: (userId: string) => void;
  setCursors: (cursors: CursorInfo[]) => void;

  setSessions: (sessions: SessionInfo[]) => void;
  updateSessionActionCount: (sessionId: string, count: number) => void;

  startPlayback: (actions: DrawAction[]) => void;
  stopPlayback: () => void;
  setPlayIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

const useDrawingStore = create<DrawingState>((set, get) => ({
  userId: null,
  userColor: '#FF5722',
  currentSessionId: null,
  currentSessionName: '',

  color: '#FF5722',
  thickness: 5,
  mode: 'brush',

  undoStack: [],
  redoStack: [],
  maxStackSize: 50,

  actions: [],
  remoteActions: [],

  remoteCursors: {},
  sessions: [],

  isPlaying: false,
  playIndex: 0,
  playActions: [],

  setUserId: (id, color) => set({ userId: id, userColor: color }),

  setCurrentSession: (id, name) =>
    set({
      currentSessionId: id,
      currentSessionName: name,
      actions: [],
      remoteActions: [],
      undoStack: [],
      redoStack: [],
    }),

  setColor: (color) => set({ color }),
  setThickness: (thickness) => set({ thickness }),
  setMode: (mode) => set({ mode }),

  addLocalAction: (action) => {
    const { undoStack, actions, maxStackSize } = get();
    const newUndoStack = [...undoStack, action];
    if (newUndoStack.length > maxStackSize) {
      newUndoStack.shift();
    }
    set({
      undoStack: newUndoStack,
      redoStack: [],
      actions: [...actions, action],
    });
  },

  addRemoteAction: (action) => {
    const { remoteActions } = get();
    set({
      remoteActions: [...remoteActions, action],
    });
  },

  initRemoteAction: (action) => {
    const { remoteActions } = get();
    set({
      remoteActions: [...remoteActions, action],
    });
  },

  addRemoteActionPart: (actionId, point) => {
    const { remoteActions } = get();
    const updated = remoteActions.map((a) => {
      if (a.id === actionId) {
        return {
          ...a,
          points: [...a.points, point],
          endTime: point.timestamp,
        };
      }
      return a;
    });
    set({ remoteActions: updated });
  },

  undo: () => {
    const { undoStack, redoStack, actions } = get();
    if (undoStack.length === 0) return null;

    const lastAction = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const newActions = actions.filter((a) => a.id !== lastAction.id);

    set({
      undoStack: newUndoStack,
      redoStack: [...redoStack, lastAction],
      actions: newActions,
    });

    return lastAction;
  },

  redo: () => {
    const { undoStack, redoStack, actions, maxStackSize } = get();
    if (redoStack.length === 0) return null;

    const redoAction = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    const newUndoStack = [...undoStack, redoAction];

    if (newUndoStack.length > maxStackSize) {
      newUndoStack.shift();
    }

    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      actions: [...actions, redoAction],
    });

    return redoAction;
  },

  setActions: (serverActions) => {
    const { userId } = get();
    const local: DrawAction[] = [];
    const remote: DrawAction[] = [];

    serverActions.forEach((a) => {
      if (a.userId === userId) {
        local.push(a);
      } else {
        remote.push(a);
      }
    });

    set({
      actions: local,
      remoteActions: remote,
    });
  },

  clearCanvas: () => {
    set({
      actions: [],
      remoteActions: [],
      undoStack: [],
      redoStack: [],
    });
  },

  setRemoteCursor: (cursor) => {
    const { remoteCursors } = get();
    set({
      remoteCursors: { ...remoteCursors, [cursor.userId]: cursor },
    });
  },

  removeRemoteCursor: (userId) => {
    const { remoteCursors } = get();
    const newCursors = { ...remoteCursors };
    delete newCursors[userId];
    set({ remoteCursors: newCursors });
  },

  setCursors: (cursors) => {
    const cursorMap: Record<string, CursorInfo> = {};
    cursors.forEach((c) => {
      cursorMap[c.userId] = c;
    });
    set({ remoteCursors: cursorMap });
  },

  setSessions: (sessions) => set({ sessions }),

  updateSessionActionCount: (sessionId, count) => {
    const { sessions } = get();
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, actionCount: count } : s
    );
    set({ sessions: updated });
  },

  startPlayback: (actions) =>
    set({
      isPlaying: true,
      playIndex: 0,
      playActions: actions,
    }),

  stopPlayback: () =>
    set({
      isPlaying: false,
      playIndex: 0,
      playActions: [],
    }),

  setPlayIndex: (index) => set({ playIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
}));

export default useDrawingStore;
