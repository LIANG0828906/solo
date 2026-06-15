import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type NodeColor = 'red' | 'blue' | 'green' | 'orange';

export const COLOR_MAP: Record<NodeColor, string> = {
  red: '#ff6b6b',
  blue: '#4ecdc4',
  green: '#95e1a3',
  orange: '#ffa94d',
};

export interface GraphNode {
  id: string;
  title: string;
  description: string;
  color: NodeColor;
  createdAt: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  cluster?: string;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  description?: string;
}

export interface GraphCluster {
  id: string;
  nodeIds: string[];
  centerX: number;
  centerY: number;
  radius: number;
}

export interface GraphState {
  nodes: GraphNode[];
  links: GraphLink[];
  clusters: GraphCluster[];
  selectedNodeId: string | null;
  connectingFromId: string | null;
}

export interface GraphContextValue extends GraphState {
  addNode: (title: string, color: NodeColor) => void;
  updateNode: (id: string, updates: Partial<GraphNode>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  startConnecting: (id: string) => void;
  cancelConnecting: () => void;
  addLink: (sourceId: string, targetId: string) => void;
  deleteLink: (id: string) => void;
  recomputeClusters: () => void;
  exportJSON: () => void;
  importJSON: (data: GraphState) => void;
}

const GraphContext = createContext<GraphContextValue | null>(null);

function computeClusters(nodes: GraphNode[], links: GraphLink[]): GraphCluster[] {
  if (nodes.length < 3) return [];

  const adjacency: Record<string, Set<string>> = {};
  nodes.forEach(n => { adjacency[n.id] = new Set(); });
  links.forEach(l => {
    adjacency[l.source]?.add(l.target);
    adjacency[l.target]?.add(l.source);
  });

  const visited = new Set<string>();
  const clusters: GraphCluster[] = [];
  let clusterIdx = 0;

  nodes.forEach(node => {
    if (visited.has(node.id)) return;

    const queue = [node.id];
    const component: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      component.push(current);

      adjacency[current]?.forEach(neighbor => {
        if (!visited.has(neighbor)) queue.push(neighbor);
      });
    }

    if (component.length >= 2) {
      const clusterNodes = component.map(id => nodes.find(n => n.id === id)!).filter(Boolean);
      const xs = clusterNodes.map(n => n.x ?? 0);
      const ys = clusterNodes.map(n => n.y ?? 0);
      const centerX = xs.reduce((a, b) => a + b, 0) / xs.length;
      const centerY = ys.reduce((a, b) => a + b, 0) / ys.length;
      const maxDist = Math.max(
        ...clusterNodes.map(n => Math.sqrt(((n.x ?? 0) - centerX) ** 2 + ((n.y ?? 0) - centerY) ** 2))
      );

      clusters.push({
        id: `cluster-${clusterIdx++}`,
        nodeIds: component,
        centerX,
        centerY,
        radius: maxDist + 60,
      });
    }
  });

  return clusters;
}

export function GraphProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GraphState>({
    nodes: [],
    links: [],
    clusters: [],
    selectedNodeId: null,
    connectingFromId: null,
  });

  const addNode = useCallback((title: string, color: NodeColor) => {
    setState(prev => {
      const newNode: GraphNode = {
        id: uuidv4(),
        title,
        description: '',
        color,
        createdAt: Date.now(),
        x: 400 + (Math.random() - 0.5) * 200,
        y: 300 + (Math.random() - 0.5) * 200,
      };
      const newNodes = [...prev.nodes, newNode];
      const shouldRecluster = newNodes.length > 0 && newNodes.length % 5 === 0;
      return {
        ...prev,
        nodes: newNodes,
        clusters: shouldRecluster ? computeClusters(newNodes, prev.links) : prev.clusters,
      };
    });
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<GraphNode>) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.id === id ? { ...n, ...updates } : n)),
    }));
  }, []);

  const deleteNode = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== id),
      links: prev.links.filter(l => l.source !== id && l.target !== id),
      selectedNodeId: prev.selectedNodeId === id ? null : prev.selectedNodeId,
    }));
  }, []);

  const selectNode = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedNodeId: id }));
  }, []);

  const startConnecting = useCallback((id: string) => {
    setState(prev => ({ ...prev, connectingFromId: id }));
  }, []);

  const cancelConnecting = useCallback(() => {
    setState(prev => ({ ...prev, connectingFromId: null }));
  }, []);

  const addLink = useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setState(prev => {
      const exists = prev.links.some(
        l => (l.source === sourceId && l.target === targetId) ||
             (l.source === targetId && l.target === sourceId)
      );
      if (exists) return prev;
      const newLink: GraphLink = {
        id: uuidv4(),
        source: sourceId,
        target: targetId,
      };
      const newLinks = [...prev.links, newLink];
      return {
        ...prev,
        links: newLinks,
        connectingFromId: null,
        clusters: computeClusters(prev.nodes, newLinks),
      };
    });
  }, []);

  const deleteLink = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      links: prev.links.filter(l => l.id !== id),
    }));
  }, []);

  const recomputeClusters = useCallback(() => {
    setState(prev => ({
      ...prev,
      clusters: computeClusters(prev.nodes, prev.links),
    }));
  }, []);

  const exportJSON = useCallback(() => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-graph-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importJSON = useCallback((data: GraphState) => {
    setState({
      ...data,
      selectedNodeId: null,
      connectingFromId: null,
    });
  }, []);

  const value: GraphContextValue = {
    ...state,
    addNode,
    updateNode,
    deleteNode,
    selectNode,
    startConnecting,
    cancelConnecting,
    addLink,
    deleteLink,
    recomputeClusters,
    exportJSON,
    importJSON,
  };

  return <GraphContext.Provider value={value}>{children}</GraphContext.Provider>;
}

export function useGraph(): GraphContextValue {
  const ctx = useContext(GraphContext);
  if (!ctx) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return ctx;
}
