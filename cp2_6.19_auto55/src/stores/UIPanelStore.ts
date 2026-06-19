import { create } from 'zustand';
import type { PanelKey, KnowledgeNode, KnowledgeLink } from '@/types';

interface UIPanelStore {
  activePanel: PanelKey;
  nodeModalOpen: boolean;
  editingNode: KnowledgeNode | null;
  editingLink: KnowledgeLink | null;
  linkTypeModalOpen: boolean;
  pendingLink: { sourceId: string; targetId: string } | null;
  forceLayoutRunning: boolean;

  togglePanel: (key: PanelKey) => void;
  openNodeModal: (node?: KnowledgeNode | null) => void;
  closeNodeModal: () => void;
  openLinkEditor: (link: KnowledgeLink) => void;
  closeLinkEditor: () => void;
  openLinkTypeModal: (sourceId: string, targetId: string) => void;
  closeLinkTypeModal: () => void;
  setForceLayoutRunning: (v: boolean) => void;
}

export const useUIPanelStore = create<UIPanelStore>((set) => ({
  activePanel: null,
  nodeModalOpen: false,
  editingNode: null,
  editingLink: null,
  linkTypeModalOpen: false,
  pendingLink: null,
  forceLayoutRunning: false,

  togglePanel: (key) =>
    set((state) => ({ activePanel: state.activePanel === key ? null : key })),

  openNodeModal: (node = null) =>
    set({ nodeModalOpen: true, editingNode: node }),

  closeNodeModal: () => set({ nodeModalOpen: false, editingNode: null }),

  openLinkEditor: (link) => set({ editingLink: link }),
  closeLinkEditor: () => set({ editingLink: null }),

  openLinkTypeModal: (sourceId, targetId) =>
    set({ linkTypeModalOpen: true, pendingLink: { sourceId, targetId } }),
  closeLinkTypeModal: () => set({ linkTypeModalOpen: false, pendingLink: null }),

  setForceLayoutRunning: (v) => set({ forceLayoutRunning: v }),
}));
