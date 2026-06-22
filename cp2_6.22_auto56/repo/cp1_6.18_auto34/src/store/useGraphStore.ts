import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  InspirationNode,
  Link,
  Tag,
  Viewport,
  AnimatedNode,
  Fragment,
} from '../types';
import { getInitialData } from '../api/mockData';
import { calculateTreeLayout, animateLayout } from '../utils/layoutEngine';

interface GraphState {
  nodes: InspirationNode[];
  links: Link[];
  selectedNodeId: string | null;
  editingNodeId: string | null;
  searchKeyword: string;
  viewport: Viewport;
  isModalOpen: boolean;
  modalParentId: string | null;
  animatedNodes: Map<string, AnimatedNode>;
  fragments: Fragment[];
  isLayoutAnimating: boolean;
  actions: {
    addNode: (data: {
      title: string;
      tag: Tag;
      color: string;
      priority: number;
      x?: number;
      y?: number;
      parentId?: string | null;
    }) => void;
    deleteNode: (id: string) => void;
    updateNode: (id: string, updates: Partial<InspirationNode>) => void;
    moveNode: (id: string, x: number, y: number) => void;
    selectNode: (id: string | null) => void;
    setEditingNode: (id: string | null) => void;
    setSearchKeyword: (keyword: string) => void;
    addLink: (sourceId: string, targetId: string, type: 'strong' | 'weak') => void;
    deleteLink: (id: string) => void;
    toggleCollapse: (id: string) => void;
    autoLayout: () => void;
    setViewport: (viewport: Viewport) => void;
    openModal: (parentId?: string | null) => void;
    closeModal: () => void;
    addFragments: (fragments: Fragment[]) => void;
    removeFragment: (id: string) => void;
    addAnimatedNode: (animated: AnimatedNode) => void;
    removeAnimatedNode: (id: string) => void;
    getNodeById: (id: string) => InspirationNode | undefined;
    getFilteredNodes: () => InspirationNode[];
    getMatchingNodeIds: () => Set<string>;
  };
}

const initialData = getInitialData();

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: initialData.nodes,
  links: initialData.links,
  selectedNodeId: null,
  editingNodeId: null,
  searchKeyword: '',
  viewport: { x: 0, y: 0, scale: 1 },
  isModalOpen: false,
  modalParentId: null,
  animatedNodes: new Map(),
  fragments: [],
  isLayoutAnimating: false,

  actions: {
    addNode: (data) => {
      const { title, tag, color, priority, x, y, parentId = null } = data;
      const id = uuidv4();
      const now = Date.now();

      let nodeX = x;
      let nodeY = y;

      if (nodeX === undefined || nodeY === undefined) {
        if (parentId) {
          const parent = get().nodes.find((n) => n.id === parentId);
          if (parent) {
            nodeX = parent.x + 100 + Math.random() * 50;
            nodeY = parent.y + 80 + Math.random() * 50;
          }
        } else {
          const { viewport } = get();
          nodeX = -viewport.x / viewport.scale + window.innerWidth / 2 - 150;
          nodeY = -viewport.y / viewport.scale + window.innerHeight / 2 - 300;
        }
      }

      const newNode: InspirationNode = {
        id,
        title,
        tag,
        color,
        priority,
        x: nodeX!,
        y: nodeY!,
        parentId,
        children: [],
        collapsed: false,
        createdAt: now,
      };

      const animatedNode: AnimatedNode = {
        node: newNode,
        scale: 0,
        opacity: 1,
        targetX: nodeX!,
        targetY: nodeY!,
        startTime: now,
        duration: 400,
        type: 'add',
      };

      set((state) => {
        const updatedNodes = state.nodes.map((n) => {
          if (n.id === parentId) {
            return { ...n, children: [...n.children, id] };
          }
          return n;
        });

        const newAnimatedNodes = new Map(state.animatedNodes);
        newAnimatedNodes.set(id, animatedNode);

        return {
          nodes: [...updatedNodes, newNode],
          animatedNodes: newAnimatedNodes,
          selectedNodeId: id,
        };
      });

      setTimeout(() => {
        get().actions.removeAnimatedNode(id);
      }, 450);
    },

    deleteNode: (id) => {
      const node = get().nodes.find((n) => n.id === id);
      if (!node) return;

      const fragments: Fragment[] = [];
      const colors = ['#6C63FF', node.color, '#FFFFFF', '#3A3A5C'];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const speed = 2 + Math.random() * 3;
        fragments.push({
          id: `${id}-frag-${i}`,
          x: node.x,
          y: node.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 6,
          opacity: 1,
          startTime: Date.now(),
        });
      }

      get().actions.addFragments(fragments);

      setTimeout(() => {
        fragments.forEach((f) => get().actions.removeFragment(f.id));
      }, 350);

      setTimeout(() => {
        set((state) => {
          const nodesToDelete = new Set<string>();

          function collectNodes(nodeId: string) {
            nodesToDelete.add(nodeId);
            const node = state.nodes.find((n) => n.id === nodeId);
            if (node) {
              node.children.forEach(collectNodes);
            }
          }

          collectNodes(id);

          const updatedNodes = state.nodes
            .filter((n) => !nodesToDelete.has(n.id))
            .map((n) => ({
              ...n,
              children: n.children.filter((c) => !nodesToDelete.has(c)),
            }));

          const updatedLinks = state.links.filter(
            (l) => !nodesToDelete.has(l.sourceId) && !nodesToDelete.has(l.targetId),
          );

          return {
            nodes: updatedNodes,
            links: updatedLinks,
            selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
            editingNodeId: state.editingNodeId === id ? null : state.editingNodeId,
          };
        });
      }, 300);
    },

    updateNode: (id, updates) => {
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      }));
    },

    moveNode: (id, x, y) => {
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
      }));
    },

    selectNode: (id) => {
      set({ selectedNodeId: id, editingNodeId: null });
    },

    setEditingNode: (id) => {
      set({ editingNodeId: id });
    },

    setSearchKeyword: (keyword) => {
      set({ searchKeyword: keyword });
    },

    addLink: (sourceId, targetId, type) => {
      const exists = get().links.some(
        (l) =>
          (l.sourceId === sourceId && l.targetId === targetId) ||
          (l.sourceId === targetId && l.targetId === sourceId),
      );

      if (exists || sourceId === targetId) return;

      const newLink: Link = {
        id: uuidv4(),
        sourceId,
        targetId,
        type,
      };

      set((state) => ({
        links: [...state.links, newLink],
      }));
    },

    deleteLink: (id) => {
      set((state) => ({
        links: state.links.filter((l) => l.id !== id),
      }));
    },

    toggleCollapse: (id) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, collapsed: !n.collapsed } : n,
        ),
      }));
    },

    autoLayout: () => {
      if (get().isLayoutAnimating) return;

      const { nodes } = get();
      const positions = calculateTreeLayout(nodes);

      set({ isLayoutAnimating: true });

      animateLayout(
        nodes,
        positions,
        600,
        (nodeId, x, y) => {
          get().actions.moveNode(nodeId, x, y);
        },
        () => {
          set({ isLayoutAnimating: false });
        },
      );
    },

    setViewport: (viewport) => {
      set({ viewport });
    },

    openModal: (parentId = null) => {
      set({ isModalOpen: true, modalParentId: parentId });
    },

    closeModal: () => {
      set({ isModalOpen: false, modalParentId: null });
    },

    addFragments: (newFragments) => {
      set((state) => ({
        fragments: [...state.fragments, ...newFragments],
      }));
    },

    removeFragment: (id) => {
      set((state) => ({
        fragments: state.fragments.filter((f) => f.id !== id),
      }));
    },

    addAnimatedNode: (animated) => {
      set((state) => {
        const newAnimatedNodes = new Map(state.animatedNodes);
        newAnimatedNodes.set(animated.node.id, animated);
        return { animatedNodes: newAnimatedNodes };
      });
    },

    removeAnimatedNode: (id) => {
      set((state) => {
        const newAnimatedNodes = new Map(state.animatedNodes);
        newAnimatedNodes.delete(id);
        return { animatedNodes: newAnimatedNodes };
      });
    },

    getNodeById: (id) => {
      return get().nodes.find((n) => n.id === id);
    },

    getFilteredNodes: () => {
      const { nodes, searchKeyword } = get();
      if (!searchKeyword.trim()) return nodes;

      const keyword = searchKeyword.toLowerCase();
      const matchingIds = new Set<string>();

      function markMatches(nodeId: string): boolean {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return false;

        const matches =
          node.title.toLowerCase().includes(keyword) ||
          node.tag.toLowerCase().includes(keyword);

        const childMatches = node.children.some(markMatches);

        if (matches || childMatches) {
          matchingIds.add(nodeId);
        }

        return matches || childMatches;
      }

      nodes.filter((n) => n.parentId === null).forEach((n) => markMatches(n.id));

      return nodes.filter((n) => matchingIds.has(n.id));
    },

    getMatchingNodeIds: () => {
      const { nodes, searchKeyword } = get();
      if (!searchKeyword.trim()) return new Set<string>();

      const keyword = searchKeyword.toLowerCase();
      return new Set(
        nodes
          .filter(
            (n) =>
              n.title.toLowerCase().includes(keyword) ||
              n.tag.toLowerCase().includes(keyword),
          )
          .map((n) => n.id),
      );
    },
  },
}));
