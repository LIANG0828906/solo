import { create } from 'zustand';
import type { MindMapNode, LayoutMode } from '@/types';

interface State {
  rawText: string;
  nodeTree: MindMapNode | null;
  layoutMode: LayoutMode;
  collapsedNodes: string[];
  isExporting: boolean;
}

interface Actions {
  setRawText: (text: string) => void;
  setNodeTree: (tree: MindMapNode | null) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleNodeCollapse: (nodeId: string) => void;
  setExporting: (exporting: boolean) => void;
}

const initialRawText = `中心主题
  分支一
    子节点1
    子节点2
  分支二
    子节点3
      孙节点1
  分支三`;

export const useMindMapStore = create<State & Actions>((set) => ({
  rawText: initialRawText,
  nodeTree: null,
  layoutMode: 'mindmap',
  collapsedNodes: [],
  isExporting: false,

  setRawText: (text) => set({ rawText: text }),
  setNodeTree: (tree) => set({ nodeTree: tree }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  toggleNodeCollapse: (nodeId) =>
    set((state) => ({
      collapsedNodes: state.collapsedNodes.includes(nodeId)
        ? state.collapsedNodes.filter((id) => id !== nodeId)
        : [...state.collapsedNodes, nodeId],
    })),
  setExporting: (exporting) => set({ isExporting: exporting }),
}));
