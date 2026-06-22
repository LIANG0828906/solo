import { cloneDeep } from 'lodash';

export interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId: string | null;
  level: number;
  collapsed: boolean;
  children: string[];
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

export interface LayoutNodePosition {
  id: string;
  x: number;
  y: number;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const MAX_HISTORY = 50;

let idCounter = 0;
export const generateId = (): string => {
  idCounter++;
  return `node_${Date.now()}_${idCounter}_${Math.random().toString(36).slice(2, 8)}`;
};

export const measureNodeSize = (text: string, level: number): { width: number; height: number } => {
  const baseWidth = level === 0 ? 200 : 160;
  const lines = text.split('\n').slice(0, 3);
  const maxLineLen = Math.max(...lines.map(l => l.length), 1);
  const width = Math.max(baseWidth, Math.min(maxLineLen * 14 + 40, 320));
  const height = 40 + lines.length * 20;
  return { width, height };
};

export class HistoryStateManager {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge> = new Map();
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeDefault();
  }

  private initializeDefault(): void {
    const rootId = generateId();
    const size = measureNodeSize('中心主题', 0);
    const root: Node = {
      id: rootId,
      text: '中心主题',
      x: 400,
      y: 300,
      width: size.width,
      height: size.height,
      parentId: null,
      level: 0,
      collapsed: false,
      children: [],
    };
    this.nodes.set(rootId, root);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  pushSnapshot(): void {
    const snapshot: Snapshot = JSON.parse(
      JSON.stringify({
        nodes: Array.from(this.nodes.values()),
        edges: Array.from(this.edges.values()),
      })
    );
    this.undoStack.push(snapshot);
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const current: Snapshot = JSON.parse(
      JSON.stringify({
        nodes: Array.from(this.nodes.values()),
        edges: Array.from(this.edges.values()),
      })
    );
    this.redoStack.push(current);
    const prev = this.undoStack.pop()!;
    this.nodes.clear();
    this.edges.clear();
    prev.nodes.forEach(n => this.nodes.set(n.id, n));
    prev.edges.forEach(e => this.edges.set(e.id, e));
    this.notify();
    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const current: Snapshot = JSON.parse(
      JSON.stringify({
        nodes: Array.from(this.nodes.values()),
        edges: Array.from(this.edges.values()),
      })
    );
    this.undoStack.push(current);
    const next = this.redoStack.pop()!;
    this.nodes.clear();
    this.edges.clear();
    next.nodes.forEach(n => this.nodes.set(n.id, n));
    next.edges.forEach(e => this.edges.set(e.id, e));
    this.notify();
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): Edge[] {
    return Array.from(this.edges.values());
  }

  getNode(id: string): Node | undefined {
    return this.nodes.get(id);
  }

  getRootNodes(): Node[] {
    return this.getNodes().filter(n => n.parentId === null);
  }

  getChildren(parentId: string): Node[] {
    const parent = this.nodes.get(parentId);
    if (!parent) return [];
    return parent.children
      .map(id => this.nodes.get(id))
      .filter((n): n is Node => n !== undefined);
  }

  createRootNode(x: number, y: number, text: string = '中心主题'): Node {
    this.pushSnapshot();
    const id = generateId();
    const size = measureNodeSize(text, 0);
    const node: Node = {
      id,
      text,
      x,
      y,
      width: size.width,
      height: size.height,
      parentId: null,
      level: 0,
      collapsed: false,
      children: [],
    };
    this.nodes.set(id, node);
    this.notify();
    return node;
  }

  createChildNode(parentId: string, text: string = '新节点'): Node | null {
    const parent = this.nodes.get(parentId);
    if (!parent) return null;
    this.pushSnapshot();
    const id = generateId();
    const level = parent.level + 1;
    const size = measureNodeSize(text, level);
    const node: Node = {
      id,
      text,
      x: parent.x + parent.width + 100,
      y: parent.y,
      width: size.width,
      height: size.height,
      parentId,
      level,
      collapsed: false,
      children: [],
    };
    this.nodes.set(id, node);
    parent.children.push(id);
    const edgeId = generateId();
    this.edges.set(edgeId, {
      id: edgeId,
      source: parentId,
      target: id,
    });
    this.notify();
    return node;
  }

  deleteNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    this.pushSnapshot();
    const toDelete: string[] = [];
    const collectChildren = (id: string) => {
      toDelete.push(id);
      const n = this.nodes.get(id);
      if (n) n.children.forEach(collectChildren);
    };
    collectChildren(nodeId);
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.children = parent.children.filter(c => c !== nodeId);
      }
    }
    toDelete.forEach(id => {
      this.nodes.delete(id);
      Array.from(this.edges.values())
        .filter(e => e.source === id || e.target === id)
        .forEach(e => this.edges.delete(e.id));
    });
    this.notify();
  }

  updateNodeText(nodeId: string, text: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    this.pushSnapshot();
    node.text = text;
    const size = measureNodeSize(text, node.level);
    node.width = size.width;
    node.height = size.height;
    this.notify();
  }

  updateNodePositions(positions: LayoutNodePosition[]): void {
    positions.forEach(p => {
      const node = this.nodes.get(p.id);
      if (node) {
        node.x = p.x;
        node.y = p.y;
      }
    });
    this.notify();
  }

  updateNodePositionDirect(nodeId: string, x: number, y: number): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.x = x;
      node.y = y;
      this.notify();
    }
  }

  toggleCollapse(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node || node.children.length === 0) return;
    this.pushSnapshot();
    node.collapsed = !node.collapsed;
    this.notify();
  }

  addEdge(sourceId: string, targetId: string): Edge | null {
    if (sourceId === targetId) return null;
    const exists = Array.from(this.edges.values()).find(
      e => e.source === sourceId && e.target === targetId
    );
    if (exists) return null;
    this.pushSnapshot();
    const id = generateId();
    const edge: Edge = { id, source: sourceId, target: targetId };
    this.edges.set(id, edge);
    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);
    if (source && target && !source.children.includes(targetId)) {
      source.children.push(targetId);
      if (target.parentId === null) {
        target.parentId = sourceId;
        target.level = source.level + 1;
      }
    }
    this.notify();
    return edge;
  }

  deleteEdge(edgeId: string): void {
    const edge = this.edges.get(edgeId);
    if (!edge) return;
    this.pushSnapshot();
    this.edges.delete(edgeId);
    const source = this.nodes.get(edge.source);
    if (source) {
      source.children = source.children.filter(c => c !== edge.target);
    }
    const target = this.nodes.get(edge.target);
    if (target && target.parentId === edge.source) {
      target.parentId = null;
      target.level = 0;
    }
    this.notify();
  }

  exportToJSON(): object {
    const buildTree = (nodeId: string): any => {
      const node = this.nodes.get(nodeId)!;
      return {
        id: node.id,
        title: node.text,
        level: node.level,
        collapsed: node.collapsed,
        children: node.children.map(buildTree),
      };
    };
    const roots = this.getRootNodes();
    return {
      version: '1.0',
      roots: roots.map(r => buildTree(r.id)),
      edges: this.getEdges().map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
      })),
    };
  }

  importFromJSON(data: any): void {
    this.pushSnapshot();
    this.nodes.clear();
    this.edges.clear();
    const importNode = (item: any, parentId: string | null): string => {
      const size = measureNodeSize(item.title || item.text || '节点', item.level || 0);
      const node: Node = {
        id: item.id || generateId(),
        text: item.title || item.text || '节点',
        x: item.x ?? 0,
        y: item.y ?? 0,
        width: size.width,
        height: size.height,
        parentId,
        level: item.level ?? (parentId === null ? 0 : 1),
        collapsed: !!item.collapsed,
        children: [],
      };
      this.nodes.set(node.id, node);
      if (item.children) {
        item.children.forEach((child: any) => {
          const childId = importNode(child, node.id);
          node.children.push(childId);
        });
      }
      return node.id;
    };
    if (data.roots) {
      data.roots.forEach((root: any) => importNode(root, null));
    } else if (Array.isArray(data)) {
      data.forEach((root: any) => importNode(root, null));
    }
    if (data.edges) {
      data.edges.forEach((e: any) => {
        if (this.nodes.has(e.source) && this.nodes.has(e.target)) {
          this.edges.set(e.id || generateId(), {
            id: e.id || generateId(),
            source: e.source,
            target: e.target,
          });
        }
      });
    }
    this.getNodes().forEach(n => {
      if (n.parentId === null && n.x === 0 && n.y === 0) {
        n.x = 400;
        n.y = 300;
      }
    });
    this.notify();
  }

  getVisibleNodes(): Node[] {
    const visible = new Set<string>();
    const collect = (nodeId: string) => {
      const node = this.nodes.get(nodeId);
      if (!node) return;
      visible.add(nodeId);
      if (!node.collapsed) {
        node.children.forEach(collect);
      }
    };
    this.getRootNodes().forEach(r => collect(r.id));
    return this.getNodes().filter(n => visible.has(n.id));
  }
}
