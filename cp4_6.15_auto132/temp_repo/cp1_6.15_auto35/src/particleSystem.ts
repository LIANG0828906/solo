import * as THREE from 'three';
import { NetworkGraph, NetworkEdgeData, ParticleType } from './networkGraph';

interface ParticleInstance {
  edgeId: string;
  progress: number;
  speed: number;
  baseSpeed: number;
  type: ParticleType;
  size: number;
  life: number;
  maxLife: number;
  active: boolean;
  index: number;
}

const PARTICLE_COLORS: Record<ParticleType, number> = {
  TCP: 0x4488ff,
  UDP: 0xffaa44,
  ICMP: 0xff4466
};

export class ParticleSystem {
  public scene: THREE.Scene;
  public graph: NetworkGraph;
  public maxParticles: number;

  private instancedMesh: THREE.InstancedMesh;
  private particles: ParticleInstance[] = [];
  private dummy: THREE.Object3D;
  private colorArray: Float32Array;
  private particleGeometry: THREE.SphereGeometry;
  private particleMaterial: THREE.MeshBasicMaterial;

  private spawnTimers: Map<string, number> = new Map();
  private activeCount = 0;

  private hoveredEdgeId: string | null = null;
  private selectedNodeId: string | null = null;

  constructor(scene: THREE.Scene, graph: NetworkGraph, maxParticles = 2000) {
    this.scene = scene;
    this.graph = graph;
    this.maxParticles = maxParticles;

    this.particleGeometry = new THREE.SphereGeometry(1, 6, 6);
    this.particleMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.9,
      vertexColors: false
    });

    this.instancedMesh = new THREE.InstancedMesh(
      this.particleGeometry,
      this.particleMaterial,
      maxParticles
    );
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(maxParticles * 3),
      3
    );
    this.colorArray = this.instancedMesh.instanceColor!.array as Float32Array;

    this.instancedMesh.frustumCulled = false;
    this.scene.add(this.instancedMesh);

    this.dummy = new THREE.Object3D();

    for (let i = 0; i < maxParticles; i++) {
      this.particles.push({
        edgeId: '',
        progress: 0,
        speed: 0,
        baseSpeed: 0,
        type: 'TCP',
        size: 0.1,
        life: 0,
        maxLife: 1,
        active: false,
        index: i
      });
    }
  }

  public update(delta: number): void {
    const dt = Math.min(delta, 100);

    this.spawnParticles(dt);
    this.updateParticles(dt);
    this.applyInstancedTransforms();
  }

  private spawnParticles(dt: number): void {
    for (const edge of this.graph.edges.values()) {
      if (edge.state === 'leaving') continue;
      if (!edge.curve) continue;

      let spawnRate = edge.particleSpawnRate;
      let speedMult = 1;

      if (this.hoveredEdgeId === edge.id) {
        spawnRate *= 2.5;
        speedMult = 1.8;
      }

      if (this.selectedNodeId &&
          (edge.sourceId === this.selectedNodeId || edge.targetId === this.selectedNodeId)) {
        speedMult *= 1.5;
        spawnRate *= 1.3;
      }

      let timer = this.spawnTimers.get(edge.id) || 0;
      timer += dt * 0.06 * spawnRate;

      while (timer >= 1 && this.activeCount < this.maxParticles * 0.95) {
        this.spawnParticle(edge, speedMult);
        timer -= 1;
      }

      this.spawnTimers.set(edge.id, timer);
    }
  }

  private spawnParticle(edge: NetworkEdgeData, speedMult: number): void {
    const types: ParticleType[] = ['TCP', 'TCP', 'UDP', 'UDP', 'ICMP'];
    const type = types[Math.floor(Math.random() * types.length)];

    const particle = this.findInactiveParticle();
    if (!particle) return;

    particle.edgeId = edge.id;
    particle.progress = 0;
    particle.baseSpeed = edge.particleBaseSpeed;
    particle.speed = edge.particleBaseSpeed * speedMult * (0.7 + Math.random() * 0.6);
    particle.type = type;
    particle.size = 0.08 + Math.random() * 0.12;
    particle.life = 0;
    particle.maxLife = 1;
    particle.active = true;

    this.activeCount++;
  }

  private findInactiveParticle(): ParticleInstance | null {
    for (const p of this.particles) {
      if (!p.active) return p;
    }
    return null;
  }

  private updateParticles(dt: number): void {
    for (const particle of this.particles) {
      if (!particle.active) continue;

      const edge = this.graph.getEdgeById(particle.edgeId);
      if (!edge || !edge.curve || edge.state === 'leaving') {
        particle.active = false;
        this.activeCount = Math.max(0, this.activeCount - 1);
        continue;
      }

      let speed = particle.baseSpeed;
      if (this.hoveredEdgeId === edge.id) {
        speed *= 1.8;
      }
      if (this.selectedNodeId &&
          (edge.sourceId === this.selectedNodeId || edge.targetId === this.selectedNodeId)) {
        speed *= 1.5;
      }
      particle.speed = speed * (0.8 + Math.random() * 0.4);

      particle.progress += particle.speed * dt;
      particle.life = particle.progress;

      if (particle.progress >= 1) {
        particle.active = false;
        this.activeCount = Math.max(0, this.activeCount - 1);
      }
    }
  }

  private applyInstancedTransforms(): void {
    let visibleCount = 0;

    for (const particle of this.particles) {
      if (!particle.active) continue;

      const edge = this.graph.getEdgeById(particle.edgeId);
      if (!edge || !edge.curve) continue;

      const point = edge.curve.getPoint(particle.progress);
      if (!point) continue;

      let alpha = 1;
      if (particle.progress < 0.1) {
        alpha = particle.progress / 0.1;
      } else if (particle.progress > 0.85) {
        alpha = (1 - particle.progress) / 0.15;
      }
      alpha = Math.max(0, Math.min(1, alpha));

      const baseSize = particle.size;
      let size = baseSize * alpha;

      if (this.hoveredEdgeId === edge.id) {
        size *= 1.5;
      }

      this.dummy.position.copy(point);
      this.dummy.scale.setScalar(size);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(particle.index, this.dummy.matrix);

      const color = new THREE.Color(PARTICLE_COLORS[particle.type]);
      const colorIdx = particle.index * 3;
      this.colorArray[colorIdx] = color.r;
      this.colorArray[colorIdx + 1] = color.g;
      this.colorArray[colorIdx + 2] = color.b;

      visibleCount = Math.max(visibleCount, particle.index + 1);
    }

    this.instancedMesh.count = visibleCount;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public setHoveredEdge(edgeId: string | null): void {
    this.hoveredEdgeId = edgeId;
  }

  public setSelectedNode(nodeId: string | null): void {
    this.selectedNodeId = nodeId;
  }

  public getActiveParticleCount(): number {
    return this.activeCount;
  }

  public dispose(): void {
    this.scene.remove(this.instancedMesh);
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.instancedMesh.dispose();
  }
}
