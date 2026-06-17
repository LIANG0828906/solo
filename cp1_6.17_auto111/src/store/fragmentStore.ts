import { create } from 'zustand';
import { Fragment, Cluster, Link, CanvasNode, CanvasLink } from '../types';

interface FragmentStore {
  fragments: Fragment[];
  selectedFragmentId: string | null;
  clusters: Cluster[];
  links: Link[];
  canvasNodes: CanvasNode[];
  canvasLinks: CanvasLink[];
  isLoading: boolean;
  fetchFragments: () => Promise<void>;
  createFragment: (title: string, content: string, keywords: string[]) => Promise<void>;
  selectFragment: (id: string | null) => void;
  deleteFragment: (id: string) => Promise<void>;
  fetchClusters: () => Promise<void>;
  prepareCanvasData: () => void;
}

export const useFragmentStore = create<FragmentStore>((set, get) => ({
  fragments: [],
  selectedFragmentId: null,
  clusters: [],
  links: [],
  canvasNodes: [],
  canvasLinks: [],
  isLoading: false,

  fetchFragments: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('http://localhost:3001/api/fragments');
      const data = await response.json();
      set({ 
        fragments: data, 
        selectedFragmentId: data.length > 0 ? data[0].id : null,
        isLoading: false 
      });
      get().prepareCanvasData();
    } catch (error) {
      console.error('Failed to fetch fragments:', error);
      set({ isLoading: false });
    }
  },

  createFragment: async (title: string, content: string, keywords: string[]) => {
    set({ isLoading: true });
    try {
      await fetch('http://localhost:3001/api/fragments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, keywords })
      });
      await get().fetchFragments();
      await get().fetchClusters();
    } catch (error) {
      console.error('Failed to create fragment:', error);
      set({ isLoading: false });
    }
  },

  selectFragment: (id: string | null) => {
    set({ selectedFragmentId: id });
    get().prepareCanvasData();
  },

  deleteFragment: async (id: string) => {
    set({ isLoading: true });
    try {
      await fetch(`http://localhost:3001/api/fragments/${id}`, {
        method: 'DELETE'
      });
      await get().fetchFragments();
      await get().fetchClusters();
    } catch (error) {
      console.error('Failed to delete fragment:', error);
      set({ isLoading: false });
    }
  },

  fetchClusters: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('http://localhost:3001/api/clusters');
      const data = await response.json();
      set({ clusters: data.clusters, links: data.links, isLoading: false });
      get().prepareCanvasData();
    } catch (error) {
      console.error('Failed to fetch clusters:', error);
      set({ isLoading: false });
    }
  },

  prepareCanvasData: () => {
    const { fragments, selectedFragmentId, clusters, links } = get();
    
    if (!selectedFragmentId) {
      set({ canvasNodes: [], canvasLinks: [] });
      return;
    }

    const selectedFragment = fragments.find(f => f.id === selectedFragmentId);
    if (!selectedFragment) {
      set({ canvasNodes: [], canvasLinks: [] });
      return;
    }

    const cluster = clusters.find(c => c.id === selectedFragment.clusterId);
    if (!cluster) {
      set({ canvasNodes: [], canvasLinks: [] });
      return;
    }

    const clusterFragments = fragments.filter(f => cluster.fragmentIds.includes(f.id));
    const maxRadius = 60;
    const baseRadius = 40;
    const clusterSize = clusterFragments.length;
    const radiusScale = Math.min(1 + (clusterSize - 1) * 0.1, maxRadius / baseRadius);
    const nodeRadius = baseRadius * radiusScale;

    const centerX = 300;
    const centerY = 300;
    const circleRadius = 150;

    const canvasNodes: CanvasNode[] = clusterFragments.map((fragment, index) => {
      const angle = (2 * Math.PI * index) / clusterFragments.length;
      return {
        id: fragment.id,
        x: centerX + circleRadius * Math.cos(angle),
        y: centerY + circleRadius * Math.sin(angle),
        vx: 0,
        vy: 0,
        fragment,
        radius: nodeRadius,
        color: cluster.color
      };
    });

    const canvasLinks: CanvasLink[] = links
      .filter(link => 
        cluster.fragmentIds.includes(link.source) && 
        cluster.fragmentIds.includes(link.target)
      )
      .map(link => ({
        source: link.source,
        target: link.target,
        strength: link.strength
      }));

    set({ canvasNodes, canvasLinks });
  }
}));
