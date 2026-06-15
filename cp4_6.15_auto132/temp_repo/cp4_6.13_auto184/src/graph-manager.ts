import type { DependencyNode, DependencyEdge } from './parser';

export type LayoutType = 'force' | 'concentric' | 'tree';

export interface GraphManagerOptions {
  onLayoutUpdate?: () => void;
  forceStrength?: number;
}

export class GraphManager {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  currentLayout: LayoutType = 'force';
  forceStrength: number;
  animationFrameId: number = 0;
  isAnimating: boolean = false;
  centerX: number;
  centerY: number;

  private onLayoutUpdate?: () => void;
  private incrementalIndex: number = 0;

  constructor(nodes: DependencyNode[], edges: DependencyEdge[], options?: GraphManagerOptions) {
    this.nodes = nodes;
    this.edges = edges;
    this.onLayoutUpdate = options?.onLayoutUpdate;
    this.forceStrength = options?.forceStrength ?? 1.0;
    this.centerX = 300;
    this.centerY = 200;
  }

  setNodesAndEdges(nodes: DependencyNode[], edges: DependencyEdge[]): void {
    this.nodes = nodes;
    this.edges = edges;
    this.incrementalIndex = 0;
  }

  setLayout(layout: LayoutType): void {
    this.stopForceLayout();
    this.currentLayout = layout;

    const targetPositions = new Map<string, { x: number; y: number }>();

    if (layout === 'concentric') {
      this.applyConcentricLayout();
      for (const node of this.nodes) {
        targetPositions.set(node.id, { x: node.x, y: node.y });
      }
    } else if (layout === 'tree') {
      this.applyTreeLayout();
      for (const node of this.nodes) {
        targetPositions.set(node.id, { x: node.x, y: node.y });
      }
    } else {
      this.startForceLayout();
      return;
    }

    this.animateToPositions(targetPositions);
  }

  setForceStrength(strength: number): void {
    this.forceStrength = strength;
    if (this.currentLayout === 'force') {
      this.startForceLayout();
    }
  }

  getNodeById(id: string): DependencyNode | undefined {
    return this.nodes.find(n => n.id === id);
  }

  exportJSON(): {
    nodes: Array<{ id: string; label: string; type: DependencyNode['type']; size: number; exports: string[]; x: number; y: number }>;
    edges: DependencyEdge[];
  } {
    return {
      nodes: this.nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        size: n.size,
        exports: [...n.exports],
        x: n.x,
        y: n.y,
      })),
      edges: this.edges.map(e => ({
        source: e.source,
        target: e.target,
        type: e.type,
      })),
    };
  }

  startForceLayout(): void {
    this.stopForceLayout();
    this.isAnimating = true;
    this.incrementalIndex = 0;

    const tick = () => {
      this.forceStep();
      this.onLayoutUpdate?.();
      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  stopForceLayout(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    this.isAnimating = false;
  }

  private forceStep(): void {
    const strength = this.forceStrength;
    const padding = 100;
    const totalNodes = this.nodes.length;
    if (totalNodes === 0) return;

    const chunkSize = Math.max(1, Math.ceil(totalNodes / 5));
    const start = this.incrementalIndex * chunkSize;
    const end = Math.min(start + chunkSize, totalNodes);

    for (let i = start; i < end; i++) {
      const node = this.nodes[i];
      let fx = 0;
      let fy = 0;

      for (let j = 0; j < totalNodes; j++) {
        if (i === j) continue;
        const other = this.nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distSq = Math.max(1, dx * dx + dy * dy);
        const dist = Math.sqrt(distSq);
        const repulsion = strength * 5000 / distSq;
        fx += (dx / dist) * repulsion;
        fy += (dy / dist) * repulsion;
      }

      for (const edge of this.edges) {
        let connected: DependencyNode | null = null;
        if (edge.source === node.id) {
          connected = this.getNodeById(edge.target) ?? null;
        } else if (edge.target === node.id) {
          connected = this.getNodeById(edge.source) ?? null;
        }
        if (connected) {
          const dx = connected.x - node.x;
          const dy = connected.y - node.y;
          const dist = Math.sqrt(Math.max(1, dx * dx + dy * dy));
          const attraction = strength * 0.01 * dist;
          fx += (dx / dist) * attraction;
          fy += (dy / dist) * attraction;
        }
      }

      node.vx = (node.vx + fx) * 0.8;
      node.vy = (node.vy + fy) * 0.8;
      node.x += node.vx;
      node.y += node.vy;

      node.x = Math.max(padding, Math.min(this.centerX * 2 - padding, node.x));
      node.y = Math.max(padding, Math.min(this.centerY * 2 - padding, node.y));
    }

    this.incrementalIndex = (this.incrementalIndex + 1) % 5;
  }

  applyConcentricLayout(): void {
    const inDegree = new Map<string, number>();
    for (const node of this.nodes) {
      inDegree.set(node.id, 0);
    }
    for (const edge of this.edges) {
      const count = inDegree.get(edge.target) ?? 0;
      inDegree.set(edge.target, count + 1);
    }

    const groups = new Map<number, DependencyNode[]>();
    for (const node of this.nodes) {
      const deg = inDegree.get(node.id) ?? 0;
      if (!groups.has(deg)) {
        groups.set(deg, []);
      }
      groups.get(deg)!.push(node);
    }

    const sortedDegrees = Array.from(groups.keys()).sort((a, b) => b - a);
    const ringCount = sortedDegrees.length;
    const maxRadius = Math.min(this.centerX, this.centerY) - 100;
    const ringSpacing = ringCount > 1 ? maxRadius / (ringCount - 1) : 0;

    for (let ring = 0; ring < sortedDegrees.length; ring++) {
      const degree = sortedDegrees[ring];
      const nodesInRing = groups.get(degree)!;
      const radius = ring === 0 ? 0 : ring * ringSpacing;
      const angleStep = nodesInRing.length > 1 ? (2 * Math.PI) / nodesInRing.length : 0;
      const startAngle = ring === 0 && nodesInRing.length === 1 ? 0 : -Math.PI / 2;

      for (let i = 0; i < nodesInRing.length; i++) {
        const angle = startAngle + i * angleStep;
        nodesInRing[i].x = this.centerX + radius * Math.cos(angle);
        nodesInRing[i].y = this.centerY + radius * Math.sin(angle);
        nodesInRing[i].vx = 0;
        nodesInRing[i].vy = 0;
      }
    }
  }

  applyTreeLayout(): void {
    const inDegree = new Map<string, number>();
    for (const node of this.nodes) {
      inDegree.set(node.id, 0);
    }
    for (const edge of this.edges) {
      const count = inDegree.get(edge.target) ?? 0;
      inDegree.set(edge.target, count + 1);
    }

    let root = this.nodes.find(n => inDegree.get(n.id) === 0);
    if (!root) {
      root = this.nodes.find(n => n.id === 'root');
    }
    if (!root && this.nodes.length > 0) {
      root = this.nodes[0];
    }
    if (!root) return;

    const children = new Map<string, DependencyNode[]>();
    for (const node of this.nodes) {
      children.set(node.id, []);
    }
    for (const edge of this.edges) {
      const parent = this.getNodeById(edge.source);
      const child = this.getNodeById(edge.target);
      if (parent && child && parent.id !== child.id) {
        children.get(parent.id)?.push(child);
      }
    }

    const levels = new Map<string, number>();
    const queue: DependencyNode[] = [root];
    levels.set(root.id, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current.id)!;
      for (const child of children.get(current.id) ?? []) {
        if (!levels.has(child.id)) {
          levels.set(child.id, currentLevel + 1);
          queue.push(child);
        }
      }
    }

    for (const node of this.nodes) {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    }

    const levelGroups = new Map<number, DependencyNode[]>();
    for (const node of this.nodes) {
      const level = levels.get(node.id)!;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    }

    const maxLevel = Math.max(...Array.from(levelGroups.keys()));
    const levelHeight = 150;
    const siblingSpacing = 80;
    const totalHeight = maxLevel * levelHeight;
    const startY = this.centerY - totalHeight / 2;

    for (const [level, nodesInLevel] of levelGroups) {
      const y = startY + level * levelHeight;
      const totalWidth = (nodesInLevel.length - 1) * siblingSpacing;
      const startX = this.centerX - totalWidth / 2;

      for (let i = 0; i < nodesInLevel.length; i++) {
        nodesInLevel[i].x = startX + i * siblingSpacing;
        nodesInLevel[i].y = y;
        nodesInLevel[i].vx = 0;
        nodesInLevel[i].vy = 0;
      }
    }
  }

  animateToPositions(targetPositions: Map<string, { x: number; y: number }>, duration: number = 500): void {
    this.stopForceLayout();

    const startPositions = new Map<string, { x: number; y: number }>();
    for (const node of this.nodes) {
      startPositions.set(node.id, { x: node.x, y: node.y });
    }

    const startTime = performance.now();
    this.isAnimating = true;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);

      for (const node of this.nodes) {
        const start = startPositions.get(node.id);
        const target = targetPositions.get(node.id);
        if (start && target) {
          node.x = start.x + (target.x - start.x) * eased;
          node.y = start.y + (target.y - start.y) * eased;
        }
      }

      this.onLayoutUpdate?.();

      if (t < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.animationFrameId = 0;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }
}
