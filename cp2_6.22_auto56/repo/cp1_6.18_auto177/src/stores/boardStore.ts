import { create } from 'zustand';
import type { BoardElement, ToolType, BrushSize, BrushColor, Snapshot, DiffHighlight, IncrementalOp } from '../types';
import { boardEngine } from '../engine/boardEngine';
import { snapshotEngine } from '../engine/snapshotEngine';
import { collaborationEngine } from '../engine/collaborationEngine';

export interface BoardStoreState {
  elements: BoardElement[];
  zoom: number;
  offsetX: number;
  offsetY: number;
  currentTool: ToolType;
  brushColor: BrushColor;
  brushSize: BrushSize;
  snapshots: Snapshot[];
  currentSnapshotIndex: number;
  isConnected: boolean;
  collabRole: 'editor' | 'viewer';
  isLoading: boolean;
  isDormant: boolean;
  showVersionPanel: boolean;
}

export interface BoardStoreActions {
  setTool: (tool: ToolType) => void;
  setBrushColor: (color: BrushColor) => void;
  setBrushSize: (size: BrushSize) => void;
  addStickyNote: () => void;
  deleteElement: (id: string) => void;
  updateStickyText: (id: string, text: string) => void;
  setZoom: (zoom: number) => void;
  setOffset: (x: number, y: number) => void;
  restoreSnapshot: (index: number) => void;
  restoreSnapshotById: (id: string) => void;
  setShowVersionPanel: (show: boolean) => void;
  setIsDormant: (dormant: boolean) => void;
  initBoardEngine: (canvas: HTMLCanvasElement) => void;
  initCollaboration: (boardId: string, role: 'editor' | 'viewer') => void;
  syncFromBoardEngine: () => void;
}

export type BoardStore = BoardStoreState & BoardStoreActions;

let engineInitialized = false;
let collabInitialized = false;
const DORMANT_TIMEOUT_MS = 120000;
let dormantTimer: number | null = null;

export const useBoardStore = create<BoardStore>((set, get) => ({
  elements: [],
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  currentTool: 'none',
  brushColor: '#6C5CE7',
  brushSize: 3,
  snapshots: [],
  currentSnapshotIndex: -1,
  isConnected: false,
  collabRole: 'editor',
  isLoading: false,
  isDormant: false,
  showVersionPanel: false,

  setTool: (tool) => {
    boardEngine.setTool(tool);
    set({ currentTool: tool });
  },

  setBrushColor: (color) => {
    boardEngine.setBrushColor(color);
    set({ brushColor: color });
  },

  setBrushSize: (size) => {
    boardEngine.setBrushSize(size);
    set({ brushSize: size });
  },

  addStickyNote: () => {
    boardEngine.addStickyNoteAtCenter();
  },

  deleteElement: (id) => {
    boardEngine.deleteElement(id);
  },

  updateStickyText: (id, text) => {
    boardEngine.updateStickyText(id, text);
  },

  setZoom: (zoom) => {
    boardEngine.setZoom(zoom);
    set({ zoom: boardEngine.getState().zoom });
  },

  setOffset: (x, y) => {
    boardEngine.setOffset(x, y);
    const s = boardEngine.getState();
    set({ offsetX: s.offsetX, offsetY: s.offsetY });
  },

  restoreSnapshot: (index) => {
    snapshotEngine.restoreToIndex(index);
  },

  restoreSnapshotById: (id) => {
    snapshotEngine.restoreToId(id);
  },

  setShowVersionPanel: (show) => {
    set({ showVersionPanel: show });
  },

  setIsDormant: (dormant) => {
    set({ isDormant: dormant });
  },

  initBoardEngine: (canvas) => {
    if (engineInitialized) return;
    engineInitialized = true;

    boardEngine.init(canvas);

    boardEngine.onStateChange((state) => {
      set({
        elements: state.elements,
        zoom: state.zoom,
        offsetX: state.offsetX,
        offsetY: state.offsetY,
        currentTool: state.currentTool,
        brushColor: state.brushColor,
        brushSize: state.brushSize,
      });
      snapshotEngine.recordChange(state.elements);
    });

    boardEngine.onAction((action, payload) => {
      resetDormantTimer();
      if (!collaborationEngine.isConnected()) return;
      switch (action) {
        case 'add': {
          const el = payload as BoardElement;
          if (el.type === 'brush' && el.points.length > 20) {
            const simplified = { ...el, points: simplifyPoints(el.points, 3) };
            collaborationEngine.sendOp({ type: 'add', elementId: el.id, element: simplified });
          } else {
            collaborationEngine.sendOp({ type: 'add', elementId: el.id, element: el });
          }
          break;
        }
        case 'remove':
          collaborationEngine.sendOp({ type: 'remove', elementId: payload.elementId });
          break;
        case 'update':
          collaborationEngine.sendOp({
            type: 'update',
            elementId: payload.elementId,
            delta: payload.delta,
          });
          break;
        case 'move':
          collaborationEngine.sendOp({
            type: 'move',
            elementId: payload.elementId,
            delta: payload.delta,
          });
          break;
      }
    });

    snapshotEngine.onSnapshotsChange((snapshots, currentIndex) => {
      set({ snapshots, currentSnapshotIndex: currentIndex });
    });

    snapshotEngine.onRestore((elements, diff: DiffHighlight) => {
      boardEngine.setElements(elements, { added: diff.addedIds, removed: diff.removedIds });
      collaborationEngine.setLocalElements(elements);
    });

    collaborationEngine.setRemoteOpHandler((op: IncrementalOp) => {
      const state = boardEngine.getState();
      let changed = false;
      const elements = state.elements;

      switch (op.type) {
        case 'add':
          if (op.element && !elements.find(e => e.id === op.elementId)) {
            elements.push(op.element);
            changed = true;
          }
          break;
        case 'remove': {
          const idx = elements.findIndex(e => e.id === op.elementId);
          if (idx >= 0) {
            const el = elements[idx];
            elements.splice(idx, 1);
            if (el.type === 'sticky') {
              for (let i = elements.length - 1; i >= 0; i--) {
                const e = elements[i];
                if (e.type === 'line' && (e.fromStickyId === op.elementId || e.toStickyId === op.elementId)) {
                  elements.splice(i, 1);
                }
              }
            }
            changed = true;
          }
          break;
        }
        case 'update':
        case 'move': {
          const el = elements.find(e => e.id === op.elementId) as any;
          if (el && op.delta) {
            Object.assign(el, op.delta);
            changed = true;
          }
          break;
        }
      }
      if (changed) {
        boardEngine.setElements(elements);
      }
    });

    collaborationEngine.onConnection((connected, role) => {
      set({ isConnected: connected, collabRole: role });
    });

    collaborationEngine.onLoading((loading) => {
      set({ isLoading: loading });
    });

    startDormantDetection();
    setTimeout(() => {
      snapshotEngine.forceSnapshot(boardEngine.getState().elements);
    }, 1000);
  },

  initCollaboration: async (boardId, role) => {
    if (collabInitialized) return;
    try {
      await collaborationEngine.connect(boardId, role);
      collabInitialized = true;
      const els = boardEngine.getState().elements;
      collaborationEngine.setLocalElements(els);
    } catch (e) {
      console.warn('[Store] collab init failed (offline mode ok)', e);
    }
  },

  syncFromBoardEngine: () => {
    const s = boardEngine.getState();
    set({
      elements: s.elements,
      zoom: s.zoom,
      offsetX: s.offsetX,
      offsetY: s.offsetY,
      currentTool: s.currentTool,
      brushColor: s.brushColor,
      brushSize: s.brushSize,
    });
  },
}));

function simplifyPoints(points: { x: number; y: number }[], tolerance: number): { x: number; y: number }[] {
  if (points.length <= 2) return points;
  const result: { x: number; y: number }[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const cur = points[i];
    if (Math.hypot(cur.x - prev.x, cur.y - prev.y) >= tolerance) {
      result.push(cur);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

function startDormantDetection() {
  const resetAndSchedule = () => {
    if (dormantTimer !== null) window.clearTimeout(dormantTimer);
    useBoardStore.getState().setIsDormant(false);
    dormantTimer = window.setTimeout(() => {
      useBoardStore.getState().setIsDormant(true);
    }, DORMANT_TIMEOUT_MS);
  };
  window.addEventListener('mousemove', resetAndSchedule);
  window.addEventListener('keydown', resetAndSchedule);
  window.addEventListener('mousedown', resetAndSchedule);
  window.addEventListener('wheel', resetAndSchedule, { passive: true });
  resetAndSchedule();
}

function resetDormantTimer() {
  if (dormantTimer !== null) window.clearTimeout(dormantTimer);
  useBoardStore.getState().setIsDormant(false);
  dormantTimer = window.setTimeout(() => {
    useBoardStore.getState().setIsDormant(true);
  }, DORMANT_TIMEOUT_MS);
}
