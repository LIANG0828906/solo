import { create } from "zustand";
import type { AppState, TimelineNode } from "./types";

let nodeIdCounter = 0;

function createNodeId(): string {
  nodeIdCounter += 1;
  return `node-${Date.now()}-${nodeIdCounter}`;
}

export const useAppStore = create<AppState>((set) => ({
  nodes: [],
  searchKeyword: "",
  activeNodeId: null,
  timelineOpen: false,

  addNode: (content: string, htmlContent: string) => {
    const newNode: TimelineNode = {
      id: createNodeId(),
      content,
      timestamp: Date.now(),
      marked: false,
      htmlContent,
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
  },

  toggleMark: (id: string) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, marked: !node.marked } : node
      ),
    }));
  },

  setSearchKeyword: (keyword: string) => {
    set({ searchKeyword: keyword });
  },

  setActiveNodeId: (id: string | null) => {
    set({ activeNodeId: id });
  },

  setTimelineOpen: (open: boolean) => {
    set({ timelineOpen: open });
  },
}));
