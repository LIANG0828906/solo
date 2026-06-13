import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { sampleNodes, sampleEdges } from '@/data/sampleData';
import type { WireframeNode, WireframeEdge, Comment } from '@/data/sampleData';

interface AppState {
  nodes: WireframeNode[];
  edges: WireframeEdge[];
  selectedNodeId: string | null;
  modalNodeId: string | null;
  canvasTransform: { x: number; y: number; k: number };
  selectNode: (id: string | null) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  addComment: (nodeId: string, content: string) => void;
  setCanvasTransform: (transform: { x: number; y: number; k: number }) => void;
  navigateToNode: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  nodes: sampleNodes,
  edges: sampleEdges,
  selectedNodeId: null,
  modalNodeId: null,
  canvasTransform: { x: 0, y: 0, k: 1 },
  selectNode: (id) => set({ selectedNodeId: id }),
  openModal: (id) => set({ modalNodeId: id }),
  closeModal: () => set({ modalNodeId: null }),
  addComment: (nodeId, content) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              comments: [
                ...node.comments,
                {
                  id: uuidv4(),
                  username: '当前用户',
                  timestamp: new Date().toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  content,
                },
              ],
            }
          : node
      ),
    })),
  setCanvasTransform: (transform) => set({ canvasTransform: transform }),
  navigateToNode: (id) => {
    set({ selectedNodeId: id, modalNodeId: null });
  },
}));

export function getNodeSize(referenceCount: number): number {
  const minSize = 40;
  const maxSize = 80;
  const maxRef = 5;
  const t = Math.min(referenceCount, maxRef) / maxRef;
  const size = minSize + (maxSize - minSize) * t * t;
  return Math.round(size);
}

export function getConnectedNodeIds(nodeId: string, edges: WireframeEdge[]): string[] {
  const ids = new Set<string>();
  edges.forEach((e) => {
    if (e.source === nodeId) ids.add(e.target);
    if (e.target === nodeId) ids.add(e.source);
  });
  return Array.from(ids);
}

export function getOutgoingEdges(nodeId: string, edges: WireframeEdge[]): WireframeEdge[] {
  return edges.filter((e) => e.source === nodeId);
}
