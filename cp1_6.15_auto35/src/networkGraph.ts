import * as THREE from 'three';

export type NodeType = 'router' | 'server' | 'terminal';
export type ParticleType = 'TCP' | 'UDP' | 'ICMP';

export interface NetworkNodeData {
  id: string;
  name: string;
  ip: string;
  type: NodeType;
  processingRate: number;
  connections: number;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
  opacity: number;
  state: 'idle' | 'hovered' | 'selected' | 'entering' | 'leaving';
  enterTime: number;
  leaveTime: number;
  mesh: THREE.Mesh | null;
  glowMesh: THREE.Mesh | null;
}

export interface NetworkEdgeData {
  id: string;
  sourceId: string;
  targetId: string;
  load: number;
  curve: THREE.CatmullRomCurve3 | null;
  tubeMesh: THREE.Mesh | null;
  state: 'active' | 'highlighted' | 'leaving';
  leaveTime: number;
  particleBaseSpeed: number;
  particleSpawnRate: number;
  midPoint: THREE.Vector3;
}

const NODE_COLORS: Record<NodeType, number> = {
  router: 0x4488ff,
  server: 0x44ff88,
  terminal: 0xaa44ff
};

const NODE_BASE_SIZE: Record<NodeType, number> = {
  router: 1.2,
  server: 1.0,
  terminal: 0.7
};

function randomIP(): string {
  return `${10 + Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${1 + Math.floor(Math.random() * 254)}`;
}

function randomName(type: NodeType, index: number): string {
  const prefixes: Record<NodeType, string> = {
    router: 'RT',
    server: 'SV',
    terminal: 'TM'
  };
  return `${prefixes[type]}-${String(index).padStart(3, '0')}`;
}

export class NetworkGraph {
  public nodes: Map<string, NetworkNodeData> = new Map();
  public edges: Map<string, NetworkEdgeData> = new Map();
  public scene: THREE.Scene;

  private nodeGeometry: THREE.SphereGeometry;
  private glowGeometry: THREE.SphereGeometry;
  private nodeCounter = 0;
  private edgeCounter = 0;

  private forceParams = {
    repulsionStrength: 80,
    attractionStrength: 0.012,
    centerStrength: 0.003,
    damping: 0.92,
    maxVelocity: 2.5
  };

  private layoutDirty = false;
  private layoutScheduled = false;
  private layoutRunning = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.nodeGeometry = new THREE.SphereGeometry(1, 24, 24);
    this.glowGeometry = new THREE.SphereGeometry(1.3, 24, 24);
  }

  public generateInitialGraph(nodeCount: number): void {
    const types: NodeType[] = ['router', 'server', 'terminal'];
    const routerCount = Math.ceil(nodeCount * 0.25);
    const serverCount = Math.ceil(nodeCount * 0.35);
    const terminalCount = nodeCount - routerCount - serverCount;

    let idx = 0;
    for (let i = 0; i < routerCount; i++) this.addNode('router', idx++);
    for (let i = 0; i < serverCount; i++) this.addNode('server', idx++);
    for (let i = 0; i < terminalCount; i++) this.addNode('terminal', idx++);

    this.createInitialEdges();
    this.rebuildCurves();
    this.layoutDirty = true;
    this.scheduleLayout();
  }

  private addNode(type: NodeType, index: number): NetworkNodeData {
    const id = `node_${++this.nodeCounter}`;
    const baseSize = NODE_BASE_SIZE[type];
    const sizeVariation = 0.8 + Math.random() * 0.4;
    const processingRate = Math.round(100 + Math.random() * 900);

    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 15;
    const y = (Math.random() - 0.5) * 15;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const pos = new THREE.Vector3(x, y, z);
    const targetPos = pos.clone();

    const node: NetworkNodeData = {
      id,
      name: randomName(type, index),
      ip: randomIP(),
      type,
      processingRate,
      connections: 0,
      position: pos,
      targetPosition: targetPos,
      velocity: new THREE.Vector3(),
      scale: baseSize * sizeVariation,
      opacity: 0,
      state: 'entering',
      enterTime: performance.now() + Math.random() * 500,
      leaveTime: 0,
      mesh: null,
      glowMesh: null
    };

    this.createNodeMesh(node);
    this.nodes.set(id, node);
    return node;
  }

  private createNodeMesh(node: NetworkNodeData): void {
    const color = NODE_COLORS[node.type];

    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity: 0,
      emissive: color,
      emissiveIntensity: 0.3,
      shininess: 80
    });

    const mesh = new THREE.Mesh(this.nodeGeometry, material);
    mesh.scale.setScalar(node.scale);
    mesh.position.copy(node.position);
    mesh.userData.nodeId = node.id;
    this.scene.add(mesh);
    node.mesh = mesh;

    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(this.glowGeometry, glowMaterial);
    glowMesh.scale.setScalar(node.scale * 1.3);
    glowMesh.position.copy(node.position);
    this.scene.add(glowMesh);
    node.glowMesh = glowMesh;
  }

  private createInitialEdges(): void {
    const nodeArray = Array.from(this.nodes.values());
    const routers = nodeArray.filter(n => n.type === 'router');
    const servers = nodeArray.filter(n => n.type === 'server');
    const terminals = nodeArray.filter(n => n.type === 'terminal');

    for (let i = 0; i < routers.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 2, routers.length); j++) {
        this.addEdge(routers[i].id, routers[j].id);
      }
    }

    for (const server of servers) {
      const router = routers[Math.floor(Math.random() * routers.length)];
      if (router) this.addEdge(server.id, router.id);
    }

    for (const terminal of terminals) {
      const routerOrServer = [...routers, ...servers][Math.floor(Math.random() * (routers.length + servers.length))];
      if (routerOrServer) this.addEdge(terminal.id, routerOrServer.id);
    }

    const extraEdges = Math.floor(nodeArray.length * 0.4);
    for (let i = 0; i < extraEdges; i++) {
      const a = nodeArray[Math.floor(Math.random() * nodeArray.length)];
      const b = nodeArray[Math.floor(Math.random() * nodeArray.length)];
      if (a.id !== b.id && !this.hasEdge(a.id, b.id)) {
        this.addEdge(a.id, b.id);
      }
    }
  }

  private hasEdge(aId: string, bId: string): boolean {
    for (const edge of this.edges.values()) {
      if ((edge.sourceId === aId && edge.targetId === bId) ||
          (edge.sourceId === bId && edge.targetId === aId)) {
        return true;
      }
    }
    return false;
  }

  private addEdge(sourceId: string, targetId: string): NetworkEdgeData | null {
    if (this.hasEdge(sourceId, targetId)) return null;

    const id = `edge_${++this.edgeCounter}`;
    const load = 0.2 + Math.random() * 0.6;

    const edge: NetworkEdgeData = {
      id,
      sourceId,
      targetId,
      load,
      curve: null,
      tubeMesh: null,
      state: 'active',
      leaveTime: 0,
      particleBaseSpeed: 0.002 + Math.random() * 0.003,
      particleSpawnRate: 0.02 + load * 0.05,
      midPoint: new THREE.Vector3()
    };

    this.createEdgeMesh(edge);

    const source = this.nodes.get(sourceId);
    const target = this.nodes.get(targetId);
    if (source) source.connections++;
    if (target) target.connections++;

    this.edges.set(id, edge);
    return edge;
  }

  private createEdgeMesh(edge: NetworkEdgeData): void {
    const source = this.nodes.get(edge.sourceId);
    const target = this.nodes.get(edge.targetId);
    if (!source || !target) return;

    const mid = source.position.clone().add(target.position).multiplyScalar(0.5);
    const dist = source.position.distanceTo(target.position);
    const lift = dist * 0.15;
    const dir = source.position.clone().sub(target.position).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(dir, up).normalize();
    mid.add(perp.multiplyScalar(lift * (Math.random() - 0.5)));
    mid.y += lift * 0.5;

    const curve = new THREE.CatmullRomCurve3([
      source.position.clone(),
      mid.clone(),
      target.position.clone()
    ]);
    edge.curve = curve;
    edge.midPoint = mid;

    const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.08, 6, false);
    const color = this.lerpColor(0x4488ff, 0xff4444, edge.load);

    const material = new THREE.MeshPhongMaterial({
      color,
      transparent: true,
      opacity: 0.35,
      emissive: color,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(tubeGeometry, material);
    mesh.userData.edgeId = edge.id;
    this.scene.add(mesh);
    edge.tubeMesh = mesh;
  }

  private lerpColor(color1: number, color2: number, t: number): number {
    const r1 = (color1 >> 16) & 255;
    const g1 = (color1 >> 8) & 255;
    const b1 = color1 & 255;
    const r2 = (color2 >> 16) & 255;
    const g2 = (color2 >> 8) & 255;
    const b2 = color2 & 255;

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return (r << 16) | (g << 8) | b;
  }

  public rebuildCurves(): void {
    for (const edge of this.edges.values()) {
      this.updateEdgeCurve(edge);
    }
  }

  private updateEdgeCurve(edge: NetworkEdgeData): void {
    const source = this.nodes.get(edge.sourceId);
    const target = this.nodes.get(edge.targetId);
    if (!source || !target || !edge.curve || !edge.tubeMesh) return;

    const mid = source.position.clone().add(target.position).multiplyScalar(0.5);
    const dist = source.position.distanceTo(target.position);
    const lift = dist * 0.15;
    const dir = source.position.clone().sub(target.position).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const perp = new THREE.Vector3().crossVectors(dir, up).normalize();

    const midOffset = mid.clone();
    midOffset.add(perp.multiplyScalar(lift * 0.5));
    midOffset.y += lift * 0.3;

    edge.curve.points[0].copy(source.position);
    edge.curve.points[1].copy(midOffset);
    edge.curve.points[2].copy(target.position);
    edge.midPoint.copy(midOffset);

    const oldGeo = edge.tubeMesh.geometry as THREE.TubeGeometry;
    oldGeo.dispose();
    edge.tubeMesh.geometry = new THREE.TubeGeometry(edge.curve, 20, 0.08, 6, false);
  }

  public scheduleLayout(): void {
    if (this.layoutScheduled || this.layoutRunning) return;
    this.layoutScheduled = true;

    const runLayout = () => {
      this.layoutScheduled = false;
      this.layoutRunning = true;
      this.stepForceLayout();
      this.layoutRunning = false;
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(runLayout, { timeout: 16 });
    } else {
      setTimeout(runLayout, 0);
    }
  }

  private stepForceLayout(): void {
    const nodeArray = Array.from(this.nodes.values()).filter(n => n.state !== 'leaving');
    if (nodeArray.length < 2) return;

    const { repulsionStrength, attractionStrength, centerStrength, damping, maxVelocity } = this.forceParams;

    for (let i = 0; i < nodeArray.length; i++) {
      const nodeA = nodeArray[i];
      if (nodeA.state === 'entering') continue;

      for (let j = i + 1; j < nodeArray.length; j++) {
        const nodeB = nodeArray[j];
        if (nodeB.state === 'entering') continue;

        const diff = nodeA.position.clone().sub(nodeB.position);
        let distSq = diff.lengthSq();
        if (distSq < 0.01) distSq = 0.01;
        const dist = Math.sqrt(distSq);

        const force = repulsionStrength / distSq;
        const repulsion = diff.normalize().multiplyScalar(force);

        nodeA.velocity.add(repulsion);
        nodeB.velocity.sub(repulsion);
      }
    }

    for (const edge of this.edges.values()) {
      if (edge.state !== 'active') continue;
      const source = this.nodes.get(edge.sourceId);
      const target = this.nodes.get(edge.targetId);
      if (!source || !target) continue;
      if (source.state === 'entering' || target.state === 'entering') continue;

      const diff = target.position.clone().sub(source.position);
      const dist = diff.length();
      if (dist < 0.1) continue;

      const force = dist * attractionStrength;
      const attraction = diff.normalize().multiplyScalar(force);

      source.velocity.add(attraction);
      target.velocity.sub(attraction);
    }

    const center = new THREE.Vector3(0, 0, 0);
    for (const node of nodeArray) {
      if (node.state === 'entering') continue;
      const toCenter = center.clone().sub(node.position);
      node.velocity.add(toCenter.multiplyScalar(centerStrength));
    }

    let maxMove = 0;
    for (const node of nodeArray) {
      if (node.state === 'entering') continue;

      node.velocity.multiplyScalar(damping);

      const speed = node.velocity.length();
      if (speed > maxVelocity) {
        node.velocity.normalize().multiplyScalar(maxVelocity);
      }

      node.position.add(node.velocity);
      node.targetPosition.copy(node.position);

      maxMove = Math.max(maxMove, node.velocity.length());

      if (node.mesh) {
        node.mesh.position.copy(node.position);
      }
      if (node.glowMesh) {
        node.glowMesh.position.copy(node.position);
      }
    }

    this.rebuildCurves();

    if (maxMove > 0.02) {
      this.layoutDirty = true;
    }
  }

  public update(delta: number): void {
    const now = performance.now();

    for (const node of this.nodes.values()) {
      this.updateNodeState(node, now, delta);
    }

    for (const edge of this.edges.values()) {
      this.updateEdgeState(edge, now, delta);
    }

    if (this.layoutDirty) {
      this.layoutDirty = false;
      this.scheduleLayout();
    }

    this.cleanupRemoved();
  }

  private updateNodeState(node: NetworkNodeData, now: number, delta: number): void {
    if (node.state === 'entering') {
      const elapsed = now - node.enterTime;
      const duration = 1000;
      const progress = Math.min(elapsed / duration, 1);

      const bounceProgress = this.bounceEaseOut(progress);
      node.opacity = progress;
      const scale = node.scale * bounceProgress;

      if (node.mesh) {
        node.mesh.scale.setScalar(scale);
        const mat = node.mesh.material as THREE.MeshPhongMaterial;
        mat.opacity = 0.85 * progress;
      }
      if (node.glowMesh) {
        node.glowMesh.scale.setScalar(scale * 1.3);
        const mat = node.glowMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.25 * progress;
      }

      if (progress >= 1) {
        node.state = 'idle';
        this.layoutDirty = true;
      }
    } else if (node.state === 'leaving') {
      const elapsed = now - node.leaveTime;
      const duration = 600;
      const progress = Math.min(elapsed / duration, 1);

      const shrink = 1 - progress;
      if (node.mesh) {
        node.mesh.scale.setScalar(node.scale * shrink);
        const mat = node.mesh.material as THREE.MeshPhongMaterial;
        mat.opacity = 0.85 * (1 - progress);
      }
      if (node.glowMesh) {
        node.glowMesh.scale.setScalar(node.scale * 1.3 * shrink);
        const mat = node.glowMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.25 * (1 - progress);
      }
    } else if (node.state === 'hovered') {
      const targetScale = node.scale * 1.2;
      if (node.mesh) {
        node.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
        const mat = node.mesh.material as THREE.MeshPhongMaterial;
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.7, 0.15);
      }
      if (node.glowMesh) {
        const s = targetScale * 1.5;
        node.glowMesh.scale.lerp(new THREE.Vector3(s, s, s), 0.15);
        const mat = node.glowMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.4, 0.15);
      }
    } else if (node.state === 'selected') {
      const targetScale = node.scale * 1.15;
      if (node.mesh) {
        node.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        const mat = node.mesh.material as THREE.MeshPhongMaterial;
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.6, 0.1);
      }
      if (node.glowMesh) {
        const s = targetScale * 1.4;
        node.glowMesh.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
      }
    } else {
      if (node.mesh) {
        node.mesh.scale.lerp(new THREE.Vector3(node.scale, node.scale, node.scale), 0.1);
        const mat = node.mesh.material as THREE.MeshPhongMaterial;
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.3, 0.1);
      }
      if (node.glowMesh) {
        const s = node.scale * 1.3;
        node.glowMesh.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
        const mat = node.glowMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.25, 0.1);
      }
    }
  }

  private bounceEaseOut(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  private updateEdgeState(edge: NetworkEdgeData, now: number, delta: number): void {
    if (edge.state === 'leaving') {
      const elapsed = now - edge.leaveTime;
      const duration = 500;
      const progress = Math.min(elapsed / duration, 1);

      if (edge.tubeMesh) {
        const mat = edge.tubeMesh.material as THREE.MeshPhongMaterial;
        mat.opacity = 0.35 * (1 - progress);
      }
    } else if (edge.state === 'highlighted') {
      if (edge.tubeMesh) {
        const mat = edge.tubeMesh.material as THREE.MeshPhongMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.7, 0.1);
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.5, 0.1);
      }
    } else {
      if (edge.tubeMesh) {
        const mat = edge.tubeMesh.material as THREE.MeshPhongMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.35, 0.08);
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.2, 0.08);
      }
    }
  }

  private cleanupRemoved(): void {
    const now = performance.now();

    for (const [id, node] of this.nodes) {
      if (node.state === 'leaving' && now - node.leaveTime > 800) {
        if (node.mesh) {
          this.scene.remove(node.mesh);
          const mat = node.mesh.material as THREE.Material;
          mat.dispose();
        }
        if (node.glowMesh) {
          this.scene.remove(node.glowMesh);
          const mat = node.glowMesh.material as THREE.Material;
          mat.dispose();
        }
        this.nodes.delete(id);
      }
    }

    for (const [id, edge] of this.edges) {
      if (edge.state === 'leaving' && now - edge.leaveTime > 700) {
        if (edge.tubeMesh) {
          this.scene.remove(edge.tubeMesh);
          const geo = edge.tubeMesh.geometry;
          geo.dispose();
          const mat = edge.tubeMesh.material as THREE.Material;
          mat.dispose();
        }
        this.edges.delete(id);
      }
    }
  }

  public setNodeHovered(nodeId: string, hovered: boolean): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    if (node.state === 'entering' || node.state === 'leaving') return;

    if (hovered) {
      if (node.state !== 'selected') node.state = 'hovered';
      for (const edge of this.edges.values()) {
        if (edge.sourceId === nodeId || edge.targetId === nodeId) {
          edge.state = 'highlighted';
        }
      }
    } else {
      if (node.state === 'hovered') node.state = 'idle';
      for (const edge of this.edges.values()) {
        if (edge.state === 'highlighted' &&
            edge.sourceId !== this.getSelectedNodeId() &&
            edge.targetId !== this.getSelectedNodeId()) {
          edge.state = 'active';
        }
      }
    }
  }

  private getSelectedNodeId(): string | null {
    for (const [id, node] of this.nodes) {
      if (node.state === 'selected') return id;
    }
    return null;
  }

  public selectNode(nodeId: string | null): void {
    for (const node of this.nodes.values()) {
      if (node.state === 'selected') node.state = 'idle';
    }

    if (nodeId) {
      const node = this.nodes.get(nodeId);
      if (node && node.state !== 'leaving' && node.state !== 'entering') {
        node.state = 'selected';
      }
    }

    this.setOtherNodesTransparent(nodeId);
    this.layoutDirty = true;
  }

  private setOtherNodesTransparent(selectedId: string | null): void {
    for (const [id, node] of this.nodes) {
      if (!node.mesh) continue;
      const mat = node.mesh.material as THREE.MeshPhongMaterial;

      if (selectedId && id !== selectedId) {
        mat.opacity = 0.25;
        if (node.glowMesh) {
          const glowMat = node.glowMesh.material as THREE.MeshBasicMaterial;
          glowMat.opacity = 0.08;
        }
      } else {
        mat.opacity = 0.85;
        if (node.glowMesh) {
          const glowMat = node.glowMesh.material as THREE.MeshBasicMaterial;
          glowMat.opacity = 0.25;
        }
      }
    }
  }

  public setEdgeHighlighted(edgeId: string, highlighted: boolean): void {
    const edge = this.edges.get(edgeId);
    if (!edge || edge.state === 'leaving') return;
    edge.state = highlighted ? 'highlighted' : 'active';
  }

  public addRandomNode(): void {
    const types: NodeType[] = ['router', 'server', 'terminal'];
    const type = types[Math.floor(Math.random() * types.length)];
    const index = this.nodes.size;
    const node = this.addNode(type, index);

    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 20;
    const y = (Math.random() - 0.5) * 30;
    node.position.set(Math.cos(angle) * dist, y, Math.sin(angle) * dist);
    if (node.mesh) node.mesh.position.copy(node.position);
    if (node.glowMesh) node.glowMesh.position.copy(node.position);

    const nodeArray = Array.from(this.nodes.values()).filter(n => n.id !== node.id && n.state !== 'leaving');
    const connectCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < connectCount && nodeArray.length > 0; i++) {
      const target = nodeArray[Math.floor(Math.random() * nodeArray.length)];
      if (target && !this.hasEdge(node.id, target.id)) {
        this.addEdge(node.id, target.id);
      }
    }

    this.rebuildCurves();
    this.layoutDirty = true;
  }

  public removeRandomNode(): void {
    const removable = Array.from(this.nodes.values()).filter(n => n.state === 'idle' || n.state === 'hovered');
    if (removable.length <= 5) return;

    const node = removable[Math.floor(Math.random() * removable.length)];
    node.state = 'leaving';
    node.leaveTime = performance.now();

    for (const edge of this.edges.values()) {
      if (edge.sourceId === node.id || edge.targetId === node.id) {
        if (edge.state !== 'leaving') {
          edge.state = 'leaving';
          edge.leaveTime = performance.now();
        }
      }
    }
  }

  public getNodeById(id: string): NetworkNodeData | undefined {
    return this.nodes.get(id);
  }

  public getEdgeById(id: string): NetworkEdgeData | undefined {
    return this.edges.get(id);
  }

  public getAverageLatency(): number {
    let total = 0;
    let count = 0;
    for (const edge of this.edges.values()) {
      if (edge.state === 'leaving') continue;
      total += 5 + edge.load * 45;
      count++;
    }
    return count > 0 ? Math.round(total / count) : 0;
  }

  public dispose(): void {
    for (const node of this.nodes.values()) {
      if (node.mesh) {
        const mat = node.mesh.material as THREE.Material;
        mat.dispose();
        this.scene.remove(node.mesh);
      }
      if (node.glowMesh) {
        const mat = node.glowMesh.material as THREE.Material;
        mat.dispose();
        this.scene.remove(node.glowMesh);
      }
    }
    for (const edge of this.edges.values()) {
      if (edge.tubeMesh) {
        edge.tubeMesh.geometry.dispose();
        const mat = edge.tubeMesh.material as THREE.Material;
        mat.dispose();
        this.scene.remove(edge.tubeMesh);
      }
    }
    this.nodeGeometry.dispose();
    this.glowGeometry.dispose();
  }
}
