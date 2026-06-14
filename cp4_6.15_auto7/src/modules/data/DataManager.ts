export interface GraphNode {
  id: string;
  title: string;
  content: string;
  color: string;
  tags: string[];
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type LayoutType = 'force' | 'hierarchical';

export const NODE_COLORS = [
  '#64c8ff',
  '#a855f7',
  '#22c55e',
  '#f97316',
  '#ec4899',
  '#06b6d4',
  '#eab308',
  '#ef4444',
];

const STORAGE_KEY = 'knowledge-graph-data';

const generateId = (): string => {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateEdgeId = (): string => {
  return `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const getRandomColor = (): string => {
  return NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
};

class DataManager {
  private data: GraphData;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): GraphData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load graph data:', e);
    }
    return { nodes: [], edges: [] };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save graph data:', e);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getData(): GraphData {
    return { ...this.data };
  }

  getNode(id: string): GraphNode | undefined {
    return this.data.nodes.find((n) => n.id === id);
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.data.edges.find((e) => e.id === id);
  }

  addNode(node: Omit<GraphNode, 'id'>): GraphNode {
    const newNode: GraphNode = {
      ...node,
      id: generateId(),
    };
    this.data.nodes.push(newNode);
    this.saveToStorage();
    this.notifyListeners();
    return newNode;
  }

  updateNode(id: string, updates: Partial<Omit<GraphNode, 'id'>>): GraphNode | undefined {
    const index = this.data.nodes.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.data.nodes[index] = { ...this.data.nodes[index], ...updates };
      this.saveToStorage();
      this.notifyListeners();
      return this.data.nodes[index];
    }
    return undefined;
  }

  deleteNode(id: string): void {
    this.data.nodes = this.data.nodes.filter((n) => n.id !== id);
    this.data.edges = this.data.edges.filter((e) => e.source !== id && e.target !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  addEdge(edge: Omit<GraphEdge, 'id' | 'animated'>): GraphEdge {
    const exists = this.data.edges.some(
      (e) =>
        (e.source === edge.source && e.target === edge.target) ||
        (e.source === edge.target && e.target === edge.source)
    );
    
    if (exists) {
      return this.data.edges.find(
        (e) =>
          (e.source === edge.source && e.target === edge.target) ||
          (e.source === edge.target && e.target === edge.source)
      )!;
    }

    const newEdge: GraphEdge = {
      ...edge,
      id: generateEdgeId(),
      animated: true,
    };
    this.data.edges.push(newEdge);
    this.saveToStorage();
    this.notifyListeners();
    return newEdge;
  }

  updateEdge(id: string, updates: Partial<Omit<GraphEdge, 'id'>>): GraphEdge | undefined {
    const index = this.data.edges.findIndex((e) => e.id === id);
    if (index !== -1) {
      this.data.edges[index] = { ...this.data.edges[index], ...updates };
      this.saveToStorage();
      this.notifyListeners();
      return this.data.edges[index];
    }
    return undefined;
  }

  deleteEdge(id: string): void {
    this.data.edges = this.data.edges.filter((e) => e.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  applyForceLayout(): void {
    const nodes = this.data.nodes;
    if (nodes.length === 0) return;

    const centerX = 0;
    const centerY = 0;
    const nodeSpacing = 180;

    if (nodes.length <= 10) {
      const radius = 150;
      nodes.forEach((node, index) => {
        const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
        node.position = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
      });
    } else {
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const rows = Math.ceil(nodes.length / cols);
      const startX = centerX - ((cols - 1) * nodeSpacing) / 2;
      const startY = centerY - ((rows - 1) * nodeSpacing) / 2;

      nodes.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        node.position = {
          x: startX + col * nodeSpacing,
          y: startY + row * nodeSpacing,
        };
      });
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  applyHierarchicalLayout(): void {
    const nodes = this.data.nodes;
    const edges = this.data.edges;
    if (nodes.length === 0) return;

    const adjacencyList: Map<string, string[]> = new Map();
    const inDegree: Map<string, number> = new Map();

    nodes.forEach((node) => {
      adjacencyList.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    edges.forEach((edge) => {
      adjacencyList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    const levels: Map<string, number> = new Map();
    const queue: string[] = [];
    const visited: Set<string> = new Set();

    nodes.forEach((node) => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node.id);
        levels.set(node.id, 0);
        visited.add(node.id);
      }
    });

    if (queue.length === 0) {
      queue.push(nodes[0].id);
      levels.set(nodes[0].id, 0);
      visited.add(nodes[0].id);
    }

    let maxLevel = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current) || 0;
      maxLevel = Math.max(maxLevel, currentLevel);

      const neighbors = adjacencyList.get(current) || [];
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          levels.set(neighbor, currentLevel + 1);
          queue.push(neighbor);
        }
      });
    }

    nodes.forEach((node) => {
      if (!levels.has(node.id)) {
        levels.set(node.id, maxLevel + 1);
      }
    });

    const levelNodes: Map<number, string[]> = new Map();
    levels.forEach((level, nodeId) => {
      if (!levelNodes.has(level)) {
        levelNodes.set(level, []);
      }
      levelNodes.get(level)?.push(nodeId);
    });

    const horizontalSpacing = 160;
    const verticalSpacing = 140;
    const totalHeight = (maxLevel) * verticalSpacing;
    const startY = -totalHeight / 2;

    levelNodes.forEach((nodeIds, level) => {
      const width = nodeIds.length * horizontalSpacing;
      const startX = -width / 2 + horizontalSpacing / 2;

      nodeIds.forEach((nodeId, index) => {
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
          node.position = {
            x: startX + index * horizontalSpacing,
            y: startY + level * verticalSpacing,
          };
        }
      });
    });

    this.saveToStorage();
    this.notifyListeners();
  }

  applyLayout(layoutType: LayoutType): void {
    if (layoutType === 'force') {
      this.applyForceLayout();
    } else {
      this.applyHierarchicalLayout();
    }
  }

  exportToJSON(): string {
    return JSON.stringify(this.data, null, 2);
  }

  importFromJSON(json: string, autoLayout: boolean = true): boolean {
    try {
      const data = JSON.parse(json);
      if (!data.nodes || !data.edges) {
        throw new Error('Invalid graph data format');
      }

      data.nodes.forEach((node: GraphNode) => {
        if (!node.id || !node.title) {
          throw new Error('Invalid node data');
        }
        if (!node.position) {
          node.position = { x: 0, y: 0 };
        }
      });

      data.edges.forEach((edge: GraphEdge) => {
        if (!edge.id || !edge.source || !edge.target) {
          throw new Error('Invalid edge data');
        }
        if (edge.animated === undefined) {
          edge.animated = true;
        }
      });

      this.data = data;

      if (autoLayout && this.data.nodes.length > 0) {
        if (this.data.edges.length > 0) {
          this.applyHierarchicalLayout();
        } else {
          this.applyForceLayout();
        }
      } else {
        this.saveToStorage();
        this.notifyListeners();
      }

      return true;
    } catch (e) {
      console.error('Failed to import graph data:', e);
      return false;
    }
  }

  clearAll(): void {
    this.data = { nodes: [], edges: [] };
    this.saveToStorage();
    this.notifyListeners();
  }

  downloadJSON(): void {
    const json = this.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-graph-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const dataManager = new DataManager();
