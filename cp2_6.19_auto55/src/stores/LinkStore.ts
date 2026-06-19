import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { KnowledgeLink, LinkType } from '@/types';
import { LINK_TYPE_LABELS } from '@/types';

interface LinkStore {
  links: KnowledgeLink[];
  highlightedPathIds: string[];
  addLink: (data: { sourceId: string; targetId: string; type: LinkType }) => KnowledgeLink | null;
  updateLink: (id: string, data: Partial<KnowledgeLink>) => void;
  deleteLink: (id: string) => void;
  deleteLinksByNode: (nodeId: string) => void;
  getLinksByNode: (nodeId: string) => KnowledgeLink[];
  findLink: (sourceId: string, targetId: string) => KnowledgeLink | undefined;
  setHighlightedPathIds: (ids: string[]) => void;
}

export const useLinkStore = create<LinkStore>()(
  persist(
    (set, get) => ({
      links: [],
      highlightedPathIds: [],

      addLink: (data) => {
        const { sourceId, targetId, type } = data;
        if (sourceId === targetId) return null;
        const exists = get().findLink(sourceId, targetId) || get().findLink(targetId, sourceId);
        if (exists) return null;
        const now = Date.now();
        const link: KnowledgeLink = {
          id: uuidv4(),
          sourceId,
          targetId,
          type,
          label: LINK_TYPE_LABELS[type],
          createdAt: now,
        };
        set((state) => ({ links: [...state.links, link] }));
        return link;
      },

      updateLink: (id, data) => {
        set((state) => ({
          links: state.links.map((l) =>
            l.id === id
              ? {
                  ...l,
                  ...data,
                  label: data.type ? LINK_TYPE_LABELS[data.type] : l.label,
                }
              : l,
          ),
        }));
      },

      deleteLink: (id) => {
        set((state) => ({ links: state.links.filter((l) => l.id !== id) }));
      },

      deleteLinksByNode: (nodeId) => {
        set((state) => ({
          links: state.links.filter((l) => l.sourceId !== nodeId && l.targetId !== nodeId),
        }));
      },

      getLinksByNode: (nodeId) =>
        get().links.filter((l) => l.sourceId === nodeId || l.targetId === nodeId),

      findLink: (sourceId, targetId) =>
        get().links.find((l) => l.sourceId === sourceId && l.targetId === targetId),

      setHighlightedPathIds: (ids) => set({ highlightedPathIds: ids }),
    }),
    {
      name: 'knowledge-link-store',
      partialize: (state) => ({ links: state.links }),
    },
  ),
);
