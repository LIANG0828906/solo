import { v4 as uuidv4 } from 'uuid';
import { MindMapNode } from '../types';

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }
}

const STORAGE_KEY = 'mindmap_nodes';
const DEFAULT_NODE_WIDTH = 140;
const DEFAULT_NODE_HEIGHT = 50;

export class MapEngine {
  private nodes: Map<string, MindMapNode> = new Map();
  private rootNodeId: string | null = null;
  public eventBus: EventBus = new EventBus();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          parsed.nodes.forEach((node: MindMapNode) => {
            this.nodes.set(node.id, node);
            if (node.parentId === null) {
              this.rootNodeId = node.id;
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to load nodes from localStorage:', e);
    }
  }

  private saveToStorage() {
    try {
      const nodesArray = Array.from(this.nodes.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: nodesArray }));
    } catch (e) {
      console.error('Failed to save nodes to localStorage:', e);
    }
  }

  getNodes(): MindMapNode[] {
    return Array.from(this.nodes.values());
  }

  getNode(id: string): MindMapNode | undefined {
    return this.nodes.get(id);
  }

  getRootNode(): MindMapNode | null {
    return this.rootNodeId ? this.nodes.get(this.rootNodeId) || null : null;
  }

  createNode(
    title: string,
    x: number,
    y: number,
    parentId: string | null = null
  ): MindMapNode {
    const id = uuidv4();
    const node: MindMapNode = {
      id,
      title,
      x,
      y,
      parentId,
      children: [],
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    };

    this.nodes.set(id, node);

    if (parentId) {
      const parent = this.nodes.get(parentId);
      if (parent) {
        parent.children.push(id);
      }
    } else if (!this.rootNodeId) {
      this.rootNodeId = id;
    }

    this.saveToStorage();
    this.eventBus.emit('node:created', node);
    this.eventBus.emit('nodes:changed', this.getNodes());

    return node;
  }

  updateNode(id: string, updates: Partial<MindMapNode>): MindMapNode | null {
    const node = this.nodes.get(id);
    if (!node) return null;

    Object.assign(node, updates);

    this.saveToStorage();
    this.eventBus.emit('node:updated', node);
    this.eventBus.emit('nodes:changed', this.getNodes());

    return node;
  }

  deleteNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    const deleteChildren = (nodeId: string) => {
      const n = this.nodes.get(nodeId);
      if (n) {
        n.children.forEach((childId) => deleteChildren(childId));
        this.nodes.delete(nodeId);
        this.eventBus.emit('node:deleted', nodeId);
      }
    };

    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.children = parent.children.filter((cid) => cid !== id);
      }
    }

    if (id === this.rootNodeId) {
      this.rootNodeId = null;
    }

    deleteChildren(id);

    this.saveToStorage();
    this.eventBus.emit('nodes:changed', this.getNodes());

    return true;
  }

  moveNode(id: string, x: number, y: number): MindMapNode | null {
    return this.updateNode(id, { x, y });
  }

  getConnections(): { from: string; to: string }[] {
    const connections: { from: string; to: string }[] = [];
    this.nodes.forEach((node) => {
      if (node.parentId) {
        connections.push({ from: node.parentId, to: node.id });
      }
    });
    return connections;
  }

  getNodeChildren(id: string): MindMapNode[] {
    const node = this.nodes.get(id);
    if (!node) return [];
    return node.children
      .map((childId) => this.nodes.get(childId))
      .filter((n): n is MindMapNode => n !== undefined);
  }
}

export const mapEngine = new MapEngine();
