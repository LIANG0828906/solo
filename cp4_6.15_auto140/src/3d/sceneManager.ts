import * as THREE from 'three';
import { terrainEngine, STRATA_DEFINITIONS, MiningHole, ArtifactLocation } from '../geo/terrainEngine';
import { ARTIFACT_DEFINITIONS } from '../artifact/artifactManager';

export interface SceneConfig {
  backgroundColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  cameraFov: number;
  cameraNear: number;
  cameraFar: number;
  initialCameraPosition: THREE.Vector3;
  initialCameraTarget: THREE.Vector3;
}

export interface LightingConfig {
  ambientIntensity: number;
  ambientColor: number;
  directionalIntensity: number;
  directionalColor: number;
  directionalPosition: THREE.Vector3;
  hemisphereSky: number;
  hemisphereGround: number;
  hemisphereIntensity: number;
}

export interface AnimationState {
  id: string;
  type: 'artifact_spawn' | 'mining_collapse' | 'restore_glow' | 'particle_burst';
  startTime: number;
  duration: number;
  data: Record<string, unknown>;
  complete: boolean;
}

export interface LODStrategy {
  nearDistance: number;
  midDistance: number;
  farDistance: number;
}

export type AnimationCompleteCallback = (anim: AnimationState) => void;
export type TerrainUpdateCallback = () => void;

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  backgroundColor: 0x2a1a0d,
  fogColor: 0x2a1a0d,
  fogNear: 50,
  fogFar: 90,
  cameraFov: 50,
  cameraNear: 0.1,
  cameraFar: 200,
  initialCameraPosition: new THREE.Vector3(26, 22, 26),
  initialCameraTarget: new THREE.Vector3(0, 0, 0)
};

export const DEFAULT_LIGHTING: LightingConfig = {
  ambientIntensity: 0.42,
  ambientColor: 0xd4b896,
  directionalIntensity: 1.25,
  directionalColor: 0xf5e6c8,
  directionalPosition: new THREE.Vector3(30, 42, 22),
  hemisphereSky: 0x87ceeb,
  hemisphereGround: 0x3d2817,
  hemisphereIntensity: 0.32
};

export const DEFAULT_LOD: LODStrategy = {
  nearDistance: 12,
  midDistance: 28,
  farDistance: 48
};

export class SceneManager {
  private config: SceneConfig;
  private lighting: LightingConfig;
  private lodStrategy: LODStrategy;

  private animations: Map<string, AnimationState> = new Map();
  private spawnedArtifacts: Set<string> = new Set();
  private restoredArtifacts: Set<string> = new Set();

  private onAnimationComplete: Set<AnimationCompleteCallback> = new Set();
  private onTerrainUpdate: Set<TerrainUpdateCallback> = new Set();

  private artifactSpawnQueue: ArtifactLocation[] = [];
  private particleQueue: { x: number; y: number; z: number; color: string; count: number }[] = [];

  private lastTerrainRevision = 0;
  private discoveredSnapshot: string[] = [];

  constructor(
    config: Partial<SceneConfig> = {},
    lighting: Partial<LightingConfig> = {},
    lod: Partial<LODStrategy> = {}
  ) {
    this.config = { ...DEFAULT_SCENE_CONFIG, ...config };
    this.lighting = { ...DEFAULT_LIGHTING, ...lighting };
    this.lodStrategy = { ...DEFAULT_LOD, ...lod };

    terrainEngine.addListener({
      onArtifactDiscovered: (loc) => this.handleArtifactDiscovered(loc),
      onHoleMined: (hole) => this.handleHoleMined(hole)
    });
  }

  getConfig(): SceneConfig { return this.config; }
  getLighting(): LightingConfig { return this.lighting; }
  getLODStrategy(): LODStrategy { return this.lodStrategy; }

  private handleHoleMined(hole: MiningHole) {
    const anim: AnimationState = {
      id: `mining_${hole.id}_${Date.now()}`,
      type: 'mining_collapse',
      startTime: performance.now(),
      duration: 450,
      data: {
        cx: hole.centerX,
        cz: hole.centerZ,
        radius: hole.radius,
        depth: hole.depth,
        strata: hole.strataRevealed
      },
      complete: false
    };
    this.animations.set(anim.id, anim);
    this.lastTerrainRevision++;
    this.onTerrainUpdate.forEach(cb => cb());
  }

  private handleArtifactDiscovered(loc: ArtifactLocation) {
    if (!this.spawnedArtifacts.has(loc.id)) {
      this.artifactSpawnQueue.push(loc);
      this.spawnedArtifacts.add(loc.id);
      const anim: AnimationState = {
        id: `spawn_${loc.id}_${Date.now()}`,
        type: 'artifact_spawn',
        startTime: performance.now(),
        duration: 900,
        data: {
          locationId: loc.id,
          artifactId: loc.artifactId,
          x: loc.x, z: loc.z,
          fromY: -3.5, toY: 0.5
        },
        complete: false
      };
      this.animations.set(anim.id, anim);
    }
  }

  triggerRestoreParticles(x: number, y: number, z: number, color: string, count: number = 40) {
    this.particleQueue.push({ x, y, z, color, count });
    const anim: AnimationState = {
      id: `restore_${x}_${z}_${Date.now()}`,
      type: 'particle_burst',
      startTime: performance.now(),
      duration: 2500,
      data: { x, y, z, color, count },
      complete: false
    };
    this.animations.set(anim.id, anim);
  }

  markArtifactRestored(locationId: string, artifactId: string) {
    this.restoredArtifacts.add(locationId);
    const loc = terrainEngine.getArtifactLocation(locationId);
    const def = ARTIFACT_DEFINITIONS[artifactId];
    if (loc && def) {
      const anim: AnimationState = {
        id: `glow_${locationId}_${Date.now()}`,
        type: 'restore_glow',
        startTime: performance.now(),
        duration: 3000,
        data: {
          locationId, artifactId,
          x: loc.x, z: loc.z,
          color: def.glowColor
        },
        complete: false
      };
      this.animations.set(anim.id, anim);
      this.triggerRestoreParticles(loc.x, 0.8, loc.z, def.accentColor, 35);
    }
    terrainEngine.setArtifactRestored(locationId);
    terrainEngine.markDirtyAll();
    this.onTerrainUpdate.forEach(cb => cb());
  }

  isArtifactSpawned(locationId: string): boolean {
    return this.spawnedArtifacts.has(locationId);
  }
  isArtifactRestored(locationId: string): boolean {
    return this.restoredArtifacts.has(locationId);
  }

  consumeSpawnQueue(): ArtifactLocation[] {
    const out = this.artifactSpawnQueue;
    this.artifactSpawnQueue = [];
    return out;
  }

  consumeParticleQueue() {
    const out = this.particleQueue;
    this.particleQueue = [];
    return out;
  }

  getActiveAnimations(): AnimationState[] {
    return Array.from(this.animations.values()).filter(a => !a.complete);
  }

  getAnimationProgress(animId: string): number {
    const a = this.animations.get(animId);
    if (!a) return 1;
    const t = (performance.now() - a.startTime) / a.duration;
    return Math.max(0, Math.min(1, t));
  }

  easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3); }
  easeInOutQuad(t: number): number { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  elasticOut(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  getArtifactSpawnOffset(locationId: string): number {
    const spawnAnim = Array.from(this.animations.values())
      .find(a => a.type === 'artifact_spawn' && (a.data as { locationId: string }).locationId === locationId);
    if (!spawnAnim) return 0.5;
    const t = this.getAnimationProgress(spawnAnim.id);
    const eased = this.elasticOut(t);
    const from = (spawnAnim.data as { fromY: number }).fromY;
    const to = (spawnAnim.data as { toY: number }).toY;
    return from + (to - from) * eased;
  }

  getMiningHoleScale(holeId: number): number {
    const anim = Array.from(this.animations.values())
      .find(a => a.type === 'mining_collapse' && a.id.startsWith(`mining_${holeId}_`));
    if (!anim) return 1;
    const t = this.getAnimationProgress(anim.id);
    return this.easeOutCubic(t);
  }

  tick(dt: number) {
    const now = performance.now();
    let changed = false;
    for (const [id, anim] of this.animations) {
      if (!anim.complete && now - anim.startTime >= anim.duration) {
        anim.complete = true;
        changed = true;
        this.onAnimationComplete.forEach(cb => cb(anim));
      }
    }
    if (changed) {
      setTimeout(() => {
        for (const [id, anim] of this.animations) {
          if (anim.complete && performance.now() - anim.startTime > anim.duration + 5000) {
            this.animations.delete(id);
          }
        }
      }, 5100);
    }

    const currentDiscovered = terrainEngine.getDiscoveredArtifacts().map(l => l.id);
    const changedSet = currentDiscovered.length !== this.discoveredSnapshot.length ||
      currentDiscovered.some((id, i) => id !== this.discoveredSnapshot[i]);
    if (changedSet) {
      this.discoveredSnapshot = currentDiscovered;
      this.onTerrainUpdate.forEach(cb => cb());
    }
  }

  getTerrainRevision(): number { return this.lastTerrainRevision; }

  addTerrainUpdateListener(cb: TerrainUpdateCallback): () => void {
    this.onTerrainUpdate.add(cb);
    return () => this.onTerrainUpdate.delete(cb);
  }

  addAnimationCompleteListener(cb: AnimationCompleteCallback): () => void {
    this.onAnimationComplete.add(cb);
    return () => this.onAnimationComplete.delete(cb);
  }

  getTerrainGeometryData(): {
    size: number;
    resolution: number;
    vertices: { x: number; y: number; z: number; color: THREE.Color }[];
    indices: number[];
  } {
    const size = terrainEngine.getSize();
    const resolution = terrainEngine.getResolution();
    const verts = terrainEngine.getVertices();
    const outVerts: { x: number; y: number; z: number; color: THREE.Color }[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const v = verts[i][j];
        const colStr = terrainEngine.getStratumColorAtGrid(i, j);
        outVerts.push({ x: v.x, y: v.currentHeight, z: v.z, color: new THREE.Color(colStr) });
      }
    }

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const a = i * (resolution + 1) + j;
        const b = a + 1;
        const c = a + (resolution + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    return { size, resolution, vertices: outVerts, indices };
  }

  getVertexColorsFloat32(): Float32Array {
    const resolution = terrainEngine.getResolution();
    const verts = terrainEngine.getVertices();
    const count = (resolution + 1) * (resolution + 1);
    const data = new Float32Array(count * 3);
    let idx = 0;
    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const colStr = terrainEngine.getStratumColorAtGrid(i, j);
        const tmp = new THREE.Color(colStr);
        data[idx++] = tmp.r;
        data[idx++] = tmp.g;
        data[idx++] = tmp.b;
      }
    }
    return data;
  }

  getLODLevel(cameraDistance: number): 0 | 1 | 2 {
    if (cameraDistance < this.lodStrategy.nearDistance) return 0;
    if (cameraDistance < this.lodStrategy.midDistance) return 1;
    return 2;
  }

  getStratumLegendColors(): { name: string; color: string }[] {
    return STRATA_DEFINITIONS.map(s => ({ name: s.name, color: s.baseColor }));
  }
}

export const sceneManager = new SceneManager();
