import type {
  NodeData,
  RelationData,
  LayoutNode,
  LayoutRelation,
  HistoryAction,
  FamilyTreeStats,
  AvatarCrop,
  RelationType,
} from '../types';

const NODE_WIDTH = 80;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 120;
const MAX_HISTORY = 20;

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export class FamilyGraph {
  private nodes: Map<string, NodeData> = new Map();
  private relations: Map<string, RelationData> = new Map();
  private undoStack: HistoryAction[] = [];
  private redoStack: HistoryAction[] = [];
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  getNodes(): NodeData[] {
    return Array.from(this.nodes.values());
  }

  getRelations(): RelationData[] {
    return Array.from(this.relations.values());
  }

  getNode(id: string): NodeData | undefined {
    return this.nodes.get(id);
  }

  getRelation(id: string): RelationData | undefined {
    return this.relations.get(id);
  }

  private pushHistory(action: HistoryAction): void {
    this.undoStack.push(action);
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): boolean {
    const action = this.undoStack.pop();
    if (!action) return false;
    this.applyInverse(action);
    this.redoStack.push(action);
    this.emit();
    return true;
  }

  redo(): boolean {
    const action = this.redoStack.pop();
    if (!action) return false;
    this.applyAction(action);
    this.undoStack.push(action);
    this.emit();
    return true;
  }

  private applyAction(action: HistoryAction): void {
    switch (action.type) {
      case 'ADD_NODE':
        this.nodes.set(action.node.id, action.node);
        break;
      case 'REMOVE_NODE':
        this.nodes.delete(action.node.id);
        action.relations.forEach((r) => this.relations.delete(r.id));
        break;
      case 'UPDATE_NODE': {
        const node = this.nodes.get(action.id);
        if (node) Object.assign(node, action.next);
        break;
      }
      case 'ADD_RELATION':
        this.relations.set(action.relation.id, action.relation);
        this.updateAdjacency(action.relation, true);
        break;
      case 'REMOVE_RELATION':
        this.relations.delete(action.relation.id);
        this.updateAdjacency(action.relation, false);
        break;
    }
  }

  private applyInverse(action: HistoryAction): void {
    switch (action.type) {
      case 'ADD_NODE':
        this.nodes.delete(action.node.id);
        break;
      case 'REMOVE_NODE':
        this.nodes.set(action.node.id, action.node);
        action.relations.forEach((r) => this.relations.set(r.id, r));
        break;
      case 'UPDATE_NODE': {
        const node = this.nodes.get(action.id);
        if (node) Object.assign(node, action.prev);
        break;
      }
      case 'ADD_RELATION':
        this.relations.delete(action.relation.id);
        this.updateAdjacency(action.relation, false);
        break;
      case 'REMOVE_RELATION':
        this.relations.set(action.relation.id, action.relation);
        this.updateAdjacency(action.relation, true);
        break;
    }
  }

  private updateAdjacency(rel: RelationData, add: boolean): void {
    const from = this.nodes.get(rel.fromNodeId);
    const to = this.nodes.get(rel.toNodeId);
    if (add) {
      if (from && !from.childrenIds.includes(rel.toNodeId)) {
        from.childrenIds.push(rel.toNodeId);
      }
      if (to && !to.parentIds.includes(rel.fromNodeId)) {
        to.parentIds.push(rel.fromNodeId);
      }
    } else {
      if (from) {
        from.childrenIds = from.childrenIds.filter((id) => id !== rel.toNodeId);
      }
      if (to) {
        to.parentIds = to.parentIds.filter((id) => id !== rel.fromNodeId);
      }
    }
  }

  addNode(params: {
    name: string;
    photoUrl?: string;
    avatarCrop?: AvatarCrop;
    generation?: number;
  }): NodeData {
    const node: NodeData = {
      id: generateId(),
      name: params.name,
      photoUrl: params.photoUrl,
      avatarCrop: params.avatarCrop,
      generation: params.generation ?? this.estimateMaxGeneration(),
      isCollapsed: false,
      parentIds: [],
      childrenIds: [],
    };
    this.nodes.set(node.id, node);
    this.pushHistory({ type: 'ADD_NODE', node: { ...node, parentIds: [], childrenIds: [] } });
    this.emit();
    return node;
  }

  removeNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;
    const relatedRelations = Array.from(this.relations.values()).filter(
      (r) => r.fromNodeId === id || r.toNodeId === id,
    );
    relatedRelations.forEach((r) => this.updateAdjacency(r, false));
    this.nodes.delete(id);
    relatedRelations.forEach((r) => this.relations.delete(r.id));
    this.pushHistory({
      type: 'REMOVE_NODE',
      node: { ...node },
      relations: relatedRelations.map((r) => ({ ...r })),
    });
    this.emit();
    return true;
  }

  updateNode(id: string, changes: Partial<Omit<NodeData, 'id'>>): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;
    const prev: Partial<NodeData> = {};
    const next: Partial<NodeData> = {};
    (Object.keys(changes) as Array<keyof typeof changes>).forEach((key) => {
      if (key === 'id') return;
      (prev as Record<string, unknown>)[key] = node[key];
      (next as Record<string, unknown>)[key] = changes[key];
      (node as Record<string, unknown>)[key] = changes[key];
    });
    this.pushHistory({ type: 'UPDATE_NODE', id, prev, next });
    this.emit();
    return true;
  }

  addRelation(params: {
    fromNodeId: string;
    toNodeId: string;
    type: RelationType;
    label?: string;
  }): RelationData | null {
    if (params.fromNodeId === params.toNodeId) return null;
    if (!this.nodes.has(params.fromNodeId) || !this.nodes.has(params.toNodeId)) return null;
    const duplicate = Array.from(this.relations.values()).find(
      (r) =>
        r.fromNodeId === params.fromNodeId && r.toNodeId === params.toNodeId,
    );
    if (duplicate) return null;
    const relation: RelationData = {
      id: generateId(),
      fromNodeId: params.fromNodeId,
      toNodeId: params.toNodeId,
      type: params.type,
      label: params.label,
    };
    this.relations.set(relation.id, relation);
    this.updateAdjacency(relation, true);
    this.pushHistory({ type: 'ADD_RELATION', relation: { ...relation } });
    this.emit();
    return relation;
  }

  removeRelation(id: string): boolean {
    const relation = this.relations.get(id);
    if (!relation) return false;
    this.updateAdjacency(relation, false);
    this.relations.delete(id);
    this.pushHistory({ type: 'REMOVE_RELATION', relation: { ...relation } });
    this.emit();
    return true;
  }

  updateRelation(id: string, changes: Partial<Omit<RelationData, 'id'>>): boolean {
    const rel = this.relations.get(id);
    if (!rel) return false;
    const prev: Partial<RelationData> = {};
    const next: Partial<RelationData> = {};
    (Object.keys(changes) as Array<keyof typeof changes>).forEach((key) => {
      if (key === 'id') return;
      (prev as Record<string, unknown>)[key] = rel[key];
      (next as Record<string, unknown>)[key] = changes[key];
      (rel as Record<string, unknown>)[key] = changes[key];
    });
    this.pushHistory({ type: 'UPDATE_NODE' as any, id, prev: prev as any, next: next as any });
    this.emit();
    return true;
  }

  toggleCollapse(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    const prev = { isCollapsed: node.isCollapsed };
    node.isCollapsed = !node.isCollapsed;
    this.pushHistory({
      type: 'UPDATE_NODE',
      id: nodeId,
      prev,
      next: { isCollapsed: node.isCollapsed },
    });
    this.emit();
    return true;
  }

  private estimateMaxGeneration(): number {
    let max = 0;
    this.nodes.forEach((n) => {
      if (n.generation > max) max = n.generation;
    });
    return max;
  }

  computeGenerations(): void {
    const roots = Array.from(this.nodes.values()).filter((n) => n.parentIds.length === 0);
    const visited = new Set<string>();
    const queue: { id: string; gen: number }[] = roots.map((n) => ({ id: n.id, gen: 0 }));
    while (queue.length) {
      const { id, gen } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const node = this.nodes.get(id);
      if (node) {
        node.generation = gen;
        node.childrenIds.forEach((cid) => queue.push({ id: cid, gen: gen + 1 }));
      }
    }
    this.nodes.forEach((n, id) => {
      if (!visited.has(id)) {
        const localMax = this.estimateMaxGeneration();
        n.generation = localMax + 1;
      }
    });
  }

  collectDescendants(nodeId: string, acc: Set<string> = new Set()): Set<string> {
    const node = this.nodes.get(nodeId);
    if (!node) return acc;
    node.childrenIds.forEach((cid) => {
      if (!acc.has(cid)) {
        acc.add(cid);
        this.collectDescendants(cid, acc);
      }
    });
    return acc;
  }

  layout(): { nodes: LayoutNode[]; relations: LayoutRelation[] } {
    this.computeGenerations();

    const byGen = new Map<number, NodeData[]>();
    this.nodes.forEach((n) => {
      if (!byGen.has(n.generation)) byGen.set(n.generation, []);
      byGen.get(n.generation)!.push(n);
    });

    const collapsedHidden = new Set<string>();
    this.nodes.forEach((n) => {
      if (n.isCollapsed) {
        this.collectDescendants(n.id, collapsedHidden);
      }
    });

    const collapsedCounts = new Map<string, number>();
    this.nodes.forEach((n) => {
      if (n.isCollapsed) {
        const desc = this.collectDescendants(n.id);
        collapsedCounts.set(n.id, desc.size);
      }
    });

    const genList = Array.from(byGen.keys()).sort((a, b) => a - b);
    const layoutNodes: LayoutNode[] = [];
    const layoutRelations: LayoutRelation[] = [];

    genList.forEach((gen) => {
      const nodes = byGen.get(gen)!;
      const visible = nodes.filter((n) => !collapsedHidden.has(n.id));
      const totalWidth =
        visible.length * NODE_WIDTH + (visible.length - 1) * HORIZONTAL_GAP;
      const startX = -totalWidth / 2;
      visible.forEach((n, idx) => {
        const x = startX + idx * (NODE_WIDTH + HORIZONTAL_GAP);
        const y = gen * (NODE_HEIGHT + VERTICAL_GAP);
        layoutNodes.push({
          ...n,
          x,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          isVisible: !collapsedHidden.has(n.id),
          collapsedDescendantCount: collapsedCounts.get(n.id),
          targetX: x,
          targetY: y,
        });
      });
    });

    const posMap = new Map(layoutNodes.map((ln) => [ln.id, ln]));

    this.relations.forEach((rel) => {
      const from = posMap.get(rel.fromNodeId);
      const to = posMap.get(rel.toNodeId);
      if (!from || !to) return;
      if (!from.isVisible || !to.isVisible) return;
      layoutRelations.push({
        id: rel.id,
        fromX: from.x + NODE_WIDTH / 2,
        fromY: from.y + NODE_HEIGHT,
        toX: to.x + NODE_WIDTH / 2,
        toY: to.y,
        type: rel.type,
        label: rel.label,
        fromNodeId: rel.fromNodeId,
        toNodeId: rel.toNodeId,
      });
    });

    return { nodes: layoutNodes, relations: layoutRelations };
  }

  getStats(): FamilyTreeStats {
    this.computeGenerations();
    let maxGen = 0;
    this.nodes.forEach((n) => {
      if (n.generation > maxGen) maxGen = n.generation;
    });
    return {
      totalMembers: this.nodes.size,
      generations: this.nodes.size === 0 ? 0 : maxGen + 1,
    };
  }

  loadData(nodes: NodeData[], relations: RelationData[]): void {
    this.nodes.clear();
    this.relations.clear();
    nodes.forEach((n) => this.nodes.set(n.id, { ...n }));
    relations.forEach((r) => {
      this.relations.set(r.id, { ...r });
      this.updateAdjacency(r, true);
    });
    this.undoStack = [];
    this.redoStack = [];
    this.emit();
  }

  serialize(): { nodes: NodeData[]; relations: RelationData[] } {
    return {
      nodes: Array.from(this.nodes.values()).map((n) => ({ ...n })),
      relations: Array.from(this.relations.values()).map((r) => ({ ...r })),
    };
  }
}
