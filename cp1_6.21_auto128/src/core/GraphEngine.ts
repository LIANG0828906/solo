import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import type { SceneConfig, StarNode, StarEdge, StarFace, SubPoint, UpdateCallback } from '../types';

const NODE_COUNT = 50;
const SPREAD_RADIUS = 10;
const SUB_POINT_COUNT = 6;
const MIN_LOOP_NODES = 5;

export class GraphEngine {
  public nodes: Map<string, StarNode> = new Map();
  public edges: Map<string, StarEdge> = new Map();
  public faces: StarFace[] = [];
  public config: SceneConfig;
  public pendingConnectNodeId: string | null = null;
  public selectedNodeId: string | null = null;

  private updateCallbacks: UpdateCallback[] = [];

  constructor(config: SceneConfig) {
    this.config = config;
    this.generateInitialNodes();
  }

  private generateInitialNodes(): void {
    const baseColor = new THREE.Color('#4A5A8A');
    for (let i = 0; i < NODE_COUNT; i++) {
      const pos = this.randomPointInSphere(SPREAD_RADIUS);
      this.nodes.set(uuidv4(), {
        id: '',
        position: pos,
        baseColor: baseColor.clone(),
        baseScale: 0.2,
        isSelected: false,
        isDragging: false,
        pulsePhase: 0,
        breathSeed: Math.random() * Math.PI * 2,
      });
    }
    const ids = Array.from(this.nodes.keys());
    for (const id of ids) {
      const node = this.nodes.get(id)!;
      node.id = id;
    }
  }

  private randomPointInSphere(radius: number): THREE.Vector3 {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = radius * Math.cbrt(Math.random());
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }

  public getNodeById(id: string): StarNode | undefined {
    return this.nodes.get(id);
  }

  public updateNodePosition(id: string, pos: THREE.Vector3): void {
    const node = this.nodes.get(id);
    if (!node) return;
    node.position.copy(pos);
    this.rebuildEdgesForNode(id);
    this.triggerUpdate();
  }

  public selectNode(id: string): void {
    if (this.selectedNodeId && this.selectedNodeId !== id) {
      const prev = this.nodes.get(this.selectedNodeId);
      if (prev) prev.isSelected = false;
    }
    const node = this.nodes.get(id);
    if (node) {
      node.isSelected = true;
      node.pulsePhase = 0;
    }
    this.selectedNodeId = id;
    this.triggerUpdate();
  }

  public deselectAll(): void {
    if (this.selectedNodeId) {
      const node = this.nodes.get(this.selectedNodeId);
      if (node) node.isSelected = false;
      this.selectedNodeId = null;
    }
    this.pendingConnectNodeId = null;
    this.triggerUpdate();
  }

  public setNodeDragging(id: string, dragging: boolean): void {
    const node = this.nodes.get(id);
    if (node) {
      node.isDragging = dragging;
      if (dragging) {
        node.pulsePhase = 0;
      }
    }
    this.triggerUpdate();
  }

  public initiateConnect(id: string): void {
    if (this.pendingConnectNodeId === null) {
      this.pendingConnectNodeId = id;
      const node = this.nodes.get(id);
      if (node) node.isSelected = true;
      this.triggerUpdate();
      return;
    }
    if (this.pendingConnectNodeId === id) {
      const node = this.nodes.get(id);
      if (node) node.isSelected = false;
      this.pendingConnectNodeId = null;
      this.triggerUpdate();
      return;
    }
    const fromId = this.pendingConnectNodeId;
    const toId = id;
    this.addEdge(fromId, toId);
    const fromNode = this.nodes.get(fromId);
    if (fromNode) fromNode.isSelected = false;
    this.pendingConnectNodeId = null;
  }

  public hasEdgeBetween(fromId: string, toId: string): boolean {
    for (const edge of this.edges.values()) {
      if (
        (edge.from === fromId && edge.to === toId) ||
        (edge.from === toId && edge.to === fromId)
      ) {
        return true;
      }
    }
    return false;
  }

  public addEdge(fromId: string, toId: string): string | null {
    if (fromId === toId) return null;
    if (this.hasEdgeBetween(fromId, toId)) return null;
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (!fromNode || !toNode) return null;

    const id = uuidv4();
    const mid = fromNode.position.clone().add(toNode.position).multiplyScalar(0.5);
    const perturb = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    mid.add(perturb);

    const curve = new THREE.CatmullRomCurve3(
      [fromNode.position.clone(), mid, toNode.position.clone()],
      false,
      'catmullrom',
      0.5
    );

    const subPoints: SubPoint[] = [];
    for (let i = 0; i < SUB_POINT_COUNT; i++) {
      subPoints.push({
        offset: (i + 0.5) / SUB_POINT_COUNT,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.edges.set(id, {
      id,
      from: fromId,
      to: toId,
      curve,
      flowPhase: Math.random() * Math.PI * 2,
      subPoints,
    });

    this.detectAndUpdateFaces();
    this.triggerUpdate();
    return id;
  }

  private rebuildEdgesForNode(nodeId: string): void {
    for (const edge of this.edges.values()) {
      if (edge.from === nodeId || edge.to === nodeId) {
        const fromNode = this.nodes.get(edge.from);
        const toNode = this.nodes.get(edge.to);
        if (!fromNode || !toNode) continue;
        const mid = fromNode.position.clone().add(toNode.position).multiplyScalar(0.5);
        const oldMid = edge.curve.getPointAt(0.5);
        const direction = oldMid.clone().sub(fromNode.position.clone().add(toNode.position).multiplyScalar(0.5));
        if (direction.length() < 0.1) {
          mid.add(direction);
        }
        edge.curve = new THREE.CatmullRomCurve3(
          [fromNode.position.clone(), mid, toNode.position.clone()],
          false,
          'catmullrom',
          0.5
        );
      }
    }
  }

  public removeEdge(id: string): void {
    this.edges.delete(id);
    this.detectAndUpdateFaces();
    this.triggerUpdate();
  }

  public reset(): void {
    this.nodes.clear();
    this.edges.clear();
    this.faces = [];
    this.pendingConnectNodeId = null;
    this.selectedNodeId = null;
    this.generateInitialNodes();
    this.triggerUpdate();
  }

  private getAdjacencyList(): Map<string, string[]> {
    const adj = new Map<string, string[]>();
    for (const id of this.nodes.keys()) {
      adj.set(id, []);
    }
    for (const edge of this.edges.values()) {
      adj.get(edge.from)!.push(edge.to);
      adj.get(edge.to)!.push(edge.from);
    }
    return adj;
  }

  public detectClosedLoops(): StarFace[] {
    const adj = this.getAdjacencyList();
    const nodeIds = Array.from(this.nodes.keys());
    const foundLoops: string[][] = [];
    const seenKeys = new Set<string>();

    for (const startId of nodeIds) {
      const path: string[] = [startId];
      const visited = new Set<string>([startId]);

      const dfs = (current: string) => {
        const neighbors = adj.get(current) || [];
        for (const next of neighbors) {
          if (next === startId && path.length >= MIN_LOOP_NODES) {
            const loop = [...path];
            const key = this.canonicalizeLoop(loop);
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              foundLoops.push(loop);
            }
            continue;
          }
          if (visited.has(next)) continue;
          if (path.length >= 12) continue;
          visited.add(next);
          path.push(next);
          dfs(next);
          path.pop();
          visited.delete(next);
        }
      };

      dfs(startId);
    }

    return foundLoops.map((nodeIds) => {
      let r = 0, g = 0, b = 0;
      for (const id of nodeIds) {
        const node = this.nodes.get(id);
        if (node) {
          r += node.baseColor.r;
          g += node.baseColor.g;
          b += node.baseColor.b;
        }
      }
      const n = nodeIds.length;
      const avgColor = new THREE.Color(r / n, g / n, b / n);
      return {
        id: uuidv4(),
        nodeIds,
        avgColor,
      };
    });
  }

  private canonicalizeLoop(loop: string[]): string {
    const n = loop.length;
    const rotations: string[] = [];
    for (let i = 0; i < n; i++) {
      const rot = [];
      for (let j = 0; j < n; j++) {
        rot.push(loop[(i + j) % n]);
      }
      rotations.push(rot.join(','));
    }
    const reversed = loop.slice().reverse();
    for (let i = 0; i < n; i++) {
      const rot = [];
      for (let j = 0; j < n; j++) {
        rot.push(reversed[(i + j) % n]);
      }
      rotations.push(rot.join(','));
    }
    rotations.sort();
    return rotations[0];
  }

  public detectAndUpdateFaces(): void {
    this.faces = this.detectClosedLoops();
  }

  public hasAnyFace(): boolean {
    return this.faces.length > 0;
  }

  public updateConfig(partial: Partial<SceneConfig>): void {
    Object.assign(this.config, partial);
    this.triggerUpdate();
  }

  public onUpdate(callback: UpdateCallback): void {
    this.updateCallbacks.push(callback);
  }

  private triggerUpdate(): void {
    for (const cb of this.updateCallbacks) {
      cb();
    }
  }
}
