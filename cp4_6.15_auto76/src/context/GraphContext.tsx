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

  const nodeIds = nodes.map(n => n.id);
  const nodeIndex: Record<string, number> = {};
  nodes.forEach((n, i) => { nodeIndex[n.id] = i; });

  const n = nodes.length;
  const m = links.length;
  if (m === 0) return [];

  const degree: number[] = new Array(n).fill(0);
  const adjacency: number[][] = new Array(n).fill(null).map(() => []);

  links.forEach(l => {
    const si = nodeIndex[l.source];
    const ti = nodeIndex[l.target];
    if (si !== undefined && ti !== undefined) {
      degree[si]++;
      degree[ti]++;
      adjacency[si].push(ti);
      adjacency[ti].push(si);
    }
  });

  const community: number[] = new Array(n).fill(0).map((_, i) => i);

  const computeModularityGain = (nodeIdx: number, targetComm: number, communities: number[]): number => {
    const currentComm = communities[nodeIdx];
    if (currentComm === targetComm) return 0;

    let sigmaInTarget = 0;
    let sigmaTotTarget = 0;
    let kIIn = 0;

    for (let i = 0; i < n; i++) {
      if (communities[i] === targetComm) {
        sigmaTotTarget += degree[i];
        for (const j of adjacency[i]) {
          if (j > i && communities[j] === targetComm) {
            sigmaInTarget += 2;
          }
        }
      }
    }

    for (const neighbor of adjacency[nodeIdx]) {
      if (communities[neighbor] === targetComm) {
        kIIn++;
      }
    }

    const kI = degree[nodeIdx];
    const twoM = 2 * m;

    const term1 = (sigmaInTarget + 2 * kIIn) / twoM;
    const term2 = ((sigmaTotTarget + kI) / twoM) ** 2;
    const term3 = sigmaInTarget / twoM;
    const term4 = (sigmaTotTarget / twoM) ** 2;
    const term5 = (kI / twoM) ** 2;

    const deltaQ = (term1 - term2) - (term3 - term4 - term5);
    return deltaQ;
  };

  let improved = true;
  const maxIterations = 20;
  let iteration = 0;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    const nodeOrder = new Array(n).fill(0).map((_, i) => i);
    for (let i = nodeOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nodeOrder[i], nodeOrder[j]] = [nodeOrder[j], nodeOrder[i]];
    }

    for (const nodeIdx of nodeOrder) {
      const currentComm = community[nodeIdx];
      const neighborComms = new Set<number>();

      for (const neighbor of adjacency[nodeIdx]) {
        if (community[neighbor] !== currentComm) {
          neighborComms.add(community[neighbor]);
        }
      }

      let bestGain = 0;
      let bestComm = currentComm;

      for (const targetComm of neighborComms) {
        const gain = computeModularityGain(nodeIdx, targetComm, community);
        if (gain > bestGain) {
          bestGain = gain;
          bestComm = targetComm;
        }
      }

      if (bestComm !== currentComm && bestGain > 0) {
        community[nodeIdx] = bestComm;
        improved = true;
      }
    }
  }

  const commToNodes: Record<number, number[]> = {};
  for (let i = 0; i < n; i++) {
    const c = community[i];
    if (!commToNodes[c]) commToNodes[c] = [];
    commToNodes[c].push(i);
  }

  const validClusters = Object.values(commToNodes).filter(members => members.length >= 3);

  const clusters: GraphCluster[] = [];
  validClusters.forEach((members, clusterIdx) => {
    const clusterNodeIds = members.map(i => nodeIds[i]);

    clusterNodeIds.forEach(id => {
      const node = nodes.find(n => n.id === id);
      if (node) {
        node.cluster = `cluster-${clusterIdx}`;
      }
    });

    const clusterNodes = members.map(i => nodes[i]);
    const xs = clusterNodes.map(node => node.x ?? 0);
    const ys = clusterNodes.map(node => node.y ?? 0);
    const centerX = xs.reduce((a, b) => a + b, 0) / xs.length;
    const centerY = ys.reduce((a, b) => a + b, 0) / ys.length;

    const maxDist = Math.max(
      ...clusterNodes.map(node => Math.sqrt(((node.x ?? 0) - centerX) ** 2 + ((node.y ?? 0) - centerY) ** 2))
    );

    clusters.push({
      id: `cluster-${clusterIdx}`,
      nodeIds: clusterNodeIds,
      centerX,
      centerY,
      radius: maxDist + 24 + 30,
    });
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
    const exportData = {
      nodes: state.nodes.map(node => ({
        id: node.id,
        title: node.title,
        description: node.description,
        color: node.color,
        createdAt: node.createdAt,
        x: node.x,
        y: node.y,
        cluster: node.cluster,
      })),
      links: state.links.map(link => ({
        id: link.id,
        source: link.source,
        target: link.target,
        description: link.description,
      })),
      clusters: state.clusters.map(cluster => ({
        id: cluster.id,
        nodeIds: [...cluster.nodeIds],
        centerX: cluster.centerX,
        centerY: cluster.centerY,
        radius: cluster.radius,
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
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
