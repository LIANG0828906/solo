import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import type {
  CanvasAction,
  CanvasTool,
  Collaborator,
  StickerType,
  BrushStroke,
  StickerItem,
  TextBubble,
  Point
} from './types';

const MAX_HISTORY = 50;

interface CanvasState {
  actions: CanvasAction[];
  history: CanvasAction[][];
  historyIndex: number;
  selectedTool: CanvasTool;
  selectedColor: string;
  brushSize: number;
  selectedSticker: StickerType | null;
  activeColorOptions: string[];
  collaborators: Map<string, Collaborator>;
  currentDrawing: BrushStroke | null;
  selectedActionId: string | null;
  canvasVoteInviteCode: string | null;
  broadcastChannel: BroadcastChannel | null;
  lastSyncTime: number;

  setTool: (tool: CanvasTool) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setActiveColorOptions: (colors: string[]) => void;
  setSelectedSticker: (sticker: StickerType | null) => void;

  startDrawing: (point: Point) => void;
  continueDrawing: (point: Point) => void;
  endDrawing: () => void;

  addSticker: (x: number, y: number, stickerType: StickerType, associatedOptionId?: string) => void;
  addTextBubble: (x: number, y: number, text: string, color: string, bgColor: string, associatedOptionId?: string) => void;
  addAction: (action: CanvasAction, broadcast?: boolean) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveSnapshot: () => void;
  restoreSnapshot: () => void;

  selectAction: (id: string | null) => void;
  transformAction: (id: string, changes: Partial<StickerItem | TextBubble>) => void;
  deleteAction: (id: string) => void;

  updateCollaboratorCursor: (userId: string, x: number, y: number, userName: string, color: string, tool: CanvasTool) => void;
  removeInactiveCollaborators: () => void;

  initBroadcastChannel: (inviteCode: string) => void;
  closeBroadcastChannel: () => void;
  broadcastAction: (action: CanvasAction) => void;
  broadcastCursor: (x: number, y: number) => void;
  broadcastUndo: () => void;
  broadcastRedo: () => void;
  requestState: () => void;

  saveToDB: (inviteCode: string) => Promise<void>;
  loadFromDB: (inviteCode: string) => Promise<CanvasAction[] | null>;
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9'
];

const getAssignedColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  actions: [],
  history: [[]],
  historyIndex: 0,
  selectedTool: 'brush',
  selectedColor: '#333333',
  brushSize: 3,
  selectedSticker: null,
  activeColorOptions: [],
  collaborators: new Map(),
  currentDrawing: null,
  selectedActionId: null,
  canvasVoteInviteCode: null,
  broadcastChannel: null,
  lastSyncTime: 0,

  setTool: (tool) => set({ selectedTool: tool, selectedSticker: null }),
  setColor: (color) => set({ selectedColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),
  setActiveColorOptions: (colors) => set({ activeColorOptions: colors }),
  setSelectedSticker: (sticker) => set({ selectedSticker: sticker, selectedTool: 'sticker' }),

  startDrawing: (point) => {
    const { selectedColor, brushSize } = get();
    const userId = localStorage.getItem('voteCanvas_userId') || uuidv4();
    const userName = localStorage.getItem('voteCanvas_userName') || '匿名用户';

    const stroke: BrushStroke = {
      type: 'brush',
      id: uuidv4(),
      points: [{ ...point }],
      color: selectedColor,
      lineWidth: brushSize,
      opacity: 0.85,
      userId,
      userName,
      timestamp: Date.now()
    };

    set({ currentDrawing: stroke });
  },

  continueDrawing: (point) => {
    const { currentDrawing } = get();
    if (!currentDrawing) return;

    const updatedStroke: BrushStroke = {
      ...currentDrawing,
      points: [...currentDrawing.points, { ...point }]
    };

    set({ currentDrawing: updatedStroke });
  },

  endDrawing: () => {
    const { currentDrawing, addAction } = get();
    if (!currentDrawing || currentDrawing.points.length < 2) {
      set({ currentDrawing: null });
      return;
    }
    addAction({ ...currentDrawing }, true);
    set({ currentDrawing: null });
  },

  addSticker: (x, y, stickerType, associatedOptionId) => {
    const userId = localStorage.getItem('voteCanvas_userId') || uuidv4();
    const userName = localStorage.getItem('voteCanvas_userName') || '匿名用户';

    const sticker: StickerItem = {
      type: 'sticker',
      id: uuidv4(),
      stickerType,
      x,
      y,
      scale: 1,
      rotation: 0,
      userId,
      userName,
      timestamp: Date.now(),
      associatedOptionId
    };

    get().addAction(sticker, true);
  },

  addTextBubble: (x, y, text, color, bgColor, associatedOptionId) => {
    const userId = localStorage.getItem('voteCanvas_userId') || uuidv4();
    const userName = localStorage.getItem('voteCanvas_userName') || '匿名用户';

    const bubble: TextBubble = {
      type: 'text',
      id: uuidv4(),
      text,
      x,
      y,
      fontSize: 18,
      color,
      bgColor,
      userId,
      userName,
      timestamp: Date.now(),
      associatedOptionId
    };

    get().addAction(bubble, true);
  },

  addAction: (action, broadcast = true) => {
    const { actions, history, historyIndex, saveSnapshot, broadcastAction } = get();

    const newActions = [...actions, action];
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newActions);

    if (newHistory.length > MAX_HISTORY + 1) {
      newHistory.shift();
    }

    set({
      actions: newActions,
      history: newHistory,
      historyIndex: newHistory.length - 1
    });

    if (broadcast) {
      broadcastAction(action);
    }

    saveSnapshot();
  },

  undo: () => {
    const { history, historyIndex, broadcastUndo } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const newActions = history[newIndex] || [];

    set({
      actions: newActions,
      historyIndex: newIndex
    });

    broadcastUndo();
  },

  redo: () => {
    const { history, historyIndex, broadcastRedo } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const newActions = history[newIndex] || [];

    set({
      actions: newActions,
      historyIndex: newIndex
    });

    broadcastRedo();
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  saveSnapshot: () => {
    const { canvasVoteInviteCode, saveToDB } = get();
    if (canvasVoteInviteCode) {
      saveToDB(canvasVoteInviteCode);
    }
  },

  restoreSnapshot: () => {
    const { canvasVoteInviteCode, loadFromDB } = get();
    if (canvasVoteInviteCode) {
      loadFromDB(canvasVoteInviteCode).then((data) => {
        if (data) {
          set({
            actions: data,
            history: [data],
            historyIndex: 0
          });
        }
      });
    }
  },

  selectAction: (id) => set({ selectedActionId: id }),

  transformAction: (id, changes) => {
    const { actions, broadcastAction } = get();
    const idx = actions.findIndex((a) => a.id === id);
    if (idx === -1) return;

    const action = actions[idx];
    if (action.type === 'brush') return;

    const updatedAction = { ...action, ...changes } as CanvasAction;
    const newActions = [...actions];
    newActions[idx] = updatedAction;

    set({ actions: newActions });
    broadcastAction(updatedAction);
  },

  deleteAction: (id) => {
    const { actions } = get();
    const newActions = actions.filter((a) => a.id !== id);
    const { addAction } = get();
    set({
      actions: newActions,
      history: [...get().history.slice(0, get().historyIndex + 1), newActions],
      historyIndex: get().historyIndex + 1,
      selectedActionId: null
    });
  },

  updateCollaboratorCursor: (userId, x, y, userName, color, tool) => {
    const { collaborators } = get();
    const newCollaborators = new Map(collaborators);
    newCollaborators.set(userId, {
      userId,
      userName,
      cursorX: x,
      cursorY: y,
      color,
      lastActive: Date.now(),
      selectedTool: tool
    });
    set({ collaborators: newCollaborators });
  },

  removeInactiveCollaborators: () => {
    const { collaborators } = get();
    const now = Date.now();
    const newCollaborators = new Map<string, Collaborator>();
    collaborators.forEach((c, id) => {
      if (now - c.lastActive < 10000) {
        newCollaborators.set(id, c);
      }
    });
    if (newCollaborators.size !== collaborators.size) {
      set({ collaborators: newCollaborators });
    }
  },

  initBroadcastChannel: (inviteCode) => {
    const { closeBroadcastChannel, actions, addAction, undo, redo, updateCollaboratorCursor } = get();
    closeBroadcastChannel();
    set({ canvasVoteInviteCode: inviteCode });

    try {
      const channel = new BroadcastChannel(`voteCanvas_canvas_${inviteCode}`);
      const myUserId = localStorage.getItem('voteCanvas_userId') || uuidv4();

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.userId) return;
        if (data.userId === myUserId) return;

        if (data.type === 'ACTION_ADD' && data.action) {
          addAction(data.action, false);
        }
        if (data.type === 'CURSOR_UPDATE') {
          updateCollaboratorCursor(
            data.userId,
            data.x,
            data.y,
            data.userName,
            data.color,
            data.tool
          );
        }
        if (data.type === 'UNDO') {
          undo();
        }
        if (data.type === 'REDO') {
          redo();
        }
        if (data.type === 'REQUEST_STATE') {
          channel.postMessage({
            type: 'STATE_RESPONSE',
            userId: myUserId,
            actions: actions,
            timestamp: Date.now()
          });
        }
        if (data.type === 'STATE_RESPONSE' && get().actions.length === 0) {
          if (data.actions && data.actions.length > 0) {
            set({
              actions: data.actions,
              history: [data.actions],
              historyIndex: 0
            });
          }
        }
      };

      channel.postMessage({
        type: 'REQUEST_STATE',
        userId: myUserId,
        timestamp: Date.now()
      });

      set({ broadcastChannel: channel });
    } catch (e) {
      console.warn('Canvas BroadcastChannel not supported:', e);
    }
  },

  closeBroadcastChannel: () => {
    const { broadcastChannel } = get();
    if (broadcastChannel) {
      broadcastChannel.close();
      set({ broadcastChannel: null });
    }
  },

  broadcastAction: (action) => {
    const { broadcastChannel } = get();
    if (!broadcastChannel) return;
    const userId = localStorage.getItem('voteCanvas_userId') || uuidv4();
    broadcastChannel.postMessage({
      type: 'ACTION_ADD',
      userId,
      action,
      timestamp: Date.now()
    });
  },

  broadcastCursor: (x, y) => {
    const { broadcastChannel, selectedTool } = get();
    if (!broadcastChannel) return;
    const userId = localStorage.getItem('voteCanvas_userId') || uuidv4();
    const userName = localStorage.getItem('voteCanvas_userName') || '匿名用户';
    broadcastChannel.postMessage({
      type: 'CURSOR_UPDATE',
      userId,
      userName,
      color: getAssignedColor(userId),
      x,
      y,
      tool: selectedTool,
      timestamp: Date.now()
    });
  },

  broadcastUndo: () => {
    const { broadcastChannel } = get();
    if (!broadcastChannel) return;
    const userId = localStorage.getItem('voteCanvas_userId') || uuidv4();
    broadcastChannel.postMessage({ type: 'UNDO', userId });
  },

  broadcastRedo: () => {
    const { broadcastChannel } = get();
    if (!broadcastChannel) return;
    const userId = localStorage.getItem('voteCanvas_userId') || uuidv4();
    broadcastChannel.postMessage({ type: 'REDO', userId });
  },

  requestState: () => {
    const { broadcastChannel } = get();
    if (!broadcastChannel) return;
    const userId = localStorage.getItem('voteCanvas_userId') || uuidv4();
    broadcastChannel.postMessage({ type: 'REQUEST_STATE', userId });
  },

  saveToDB: async (inviteCode) => {
    try {
      await set(`canvas_${inviteCode}`, JSON.parse(JSON.stringify(get().actions)));
    } catch (e) {
      console.warn('Failed to save canvas to IndexedDB:', e);
    }
  },

  loadFromDB: async (inviteCode) => {
    try {
      const data = await get(`canvas_${inviteCode}`);
      return data ? (data as CanvasAction[]) : null;
    } catch (e) {
      console.warn('Failed to load canvas from IndexedDB:', e);
      return null;
    }
  }
}));
