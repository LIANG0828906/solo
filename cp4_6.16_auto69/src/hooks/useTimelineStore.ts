import { create } from 'zustand';
import type { Article, EventNode } from '../types';

interface TimelineState {
  selectedNodeId: string | null;
  activeArticleFilter: string;
  leftPanelCollapsed: boolean;
  detailPanelOpen: boolean;
  articles: Article[];
  eventNodes: EventNode[];

  setSelectedNode: (id: string | null) => void;
  setArticleFilter: (filter: string) => void;
  toggleLeftPanel: () => void;
  setDetailPanelOpen: (open: boolean) => void;
  setArticles: (articles: Article[]) => void;
  addArticle: (article: Article) => void;
  removeArticle: (id: string) => void;
  setEventNodes: (nodes: EventNode[]) => void;
  addEventNodes: (nodes: EventNode[]) => void;
  removeEventNodesByArticle: (articleId: string) => void;
  updateEventNode: (node: EventNode) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  selectedNodeId: null,
  activeArticleFilter: 'all',
  leftPanelCollapsed: false,
  detailPanelOpen: false,
  articles: [],
  eventNodes: [],

  setSelectedNode: (id) =>
    set({ selectedNodeId: id, detailPanelOpen: id !== null }),
  setArticleFilter: (filter) => set({ activeArticleFilter: filter }),
  toggleLeftPanel: () =>
    set((s) => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),
  setArticles: (articles) => set({ articles }),
  addArticle: (article) =>
    set((s) => ({ articles: [...s.articles, article] })),
  removeArticle: (id) =>
    set((s) => ({
      articles: s.articles.filter((a) => a.id !== id),
    })),
  setEventNodes: (nodes) => set({ eventNodes: nodes }),
  addEventNodes: (nodes) =>
    set((s) => ({
      eventNodes: [...s.eventNodes, ...nodes].sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    })),
  removeEventNodesByArticle: (articleId) =>
    set((s) => ({
      eventNodes: s.eventNodes.filter((n) => n.articleId !== articleId),
    })),
  updateEventNode: (node) =>
    set((s) => ({
      eventNodes: s.eventNodes.map((n) => (n.id === node.id ? node : n)),
    })),
}));
