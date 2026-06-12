import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { FlowNode, FlowEdge, TriggerType, EasingType } from '../types';

interface FlowStore {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedId: string | null;
  selectedEdgeId: string | null;
  pan: { x: number; y: number };
  zoom: number;
  isSpacePressed: boolean;
  isPanning: boolean;
  isDragging: boolean;
  showDetailPanel: boolean;
  showClearDialog: boolean;
  deletingIds: Set<string>;

  addNode: (x: number, y: number) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  updateNodeAnimation: (id: string, updates: Partial<FlowNode['animation']>) => void;
  deleteNode: (id: string) => void;
  addEdge: (source: string, target: string) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  deleteEdge: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
  setSpacePressed: (pressed: boolean) => void;
  setPanning: (panning: boolean) => void;
  setDragging: (dragging: boolean) => void;
  setShowDetailPanel: (show: boolean) => void;
  setShowClearDialog: (show: boolean) => void;
  clearAll: () => void;
  importData: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  animateDelete: (id: string, callback: () => void) => void;
}

const createDefaultNode = (x: number, y: number): FlowNode => ({
  id: uuidv4(),
  x,
  y,
  width: 100,
  height: 60,
  name: '新状态',
  color: '#f0f0f0',
  animation: {
    trigger: 'hover',
    duration: 500,
    easing: 'ease-out',
  },
});

export const useFlowStore = create<FlowStore>((set, get) => ({
  nodes: [
    createDefaultNode(200, 200),
    createDefaultNode(400, 200),
    createDefaultNode(300, 350),
  ],
  edges: [],
  selectedId: