import * as THREE from 'three';
import { EventEmitter } from 'node:events';
import { FragmentEngine, Fragment } from '../fragments/FragmentEngine';
import SceneManager from '../scene/SceneManager';

export interface SymbolConfig {
  id: number;
  name: string;
  fragmentCount: number;
  color: number;
}

export interface SymbolCompletedEvent {
  symbolId: number;
  symbolName: string;
  group: THREE.Group;
  completedAt: number;
}

const SYMBOL_CONFIGS: SymbolConfig[] = [
  { id: 0, name: '螺旋纹', fragmentCount: 3, color: 0xff6b6b },
  { id: 1, name: '三角纹', fragmentCount: 3, color: 0x4ecdc4 },
  { id: 2, name: '圆圈纹', fragmentCount: 2, color: 0x45b7d1 },
  { id: 3, name: '波浪纹', fragmentCount: 4, color: 0x96ceb4 },
  { id: 4, name: '太阳纹', fragmentCount: 3, color: 0xffeaa7 },
];

const GOLD_COLOR = 0xffd700;
const LIGHT_DISTANCE = 3;
const PULSE_FREQUENCY = 2;
const PULSE_MIN_INTENSITY = 0.3;
const PULSE_MAX_INTENSITY = 1.0;
const RIPPLE_RING_COUNT = 3;
const RIPPLE_START_RADIUS = 0.5;
const RIPPLE_END_RADIUS = 3;
const RIPPLE_DURATION = 3000;
const RIPPLE_OPACITY_START = 1;
const RIPPLE_OPACITY_END = 0;

export class SymbolDetector extends EventEmitter {
  private fragmentEngine: FragmentEngine;
  private sceneManager: SceneManager;
  private completedSymbols: Set<number>;
  private activeEffects: Map<number, {
    pointLight: THREE.PointLight;
    originalMaterials: Map<THREE.Mesh, THREE.MeshStandardMaterial>;
    rippleMeshes: THREE.Mesh[];
    animationFrameId: number | null;
    startTime: number;
  }>;
  private boundHandleFragmentsMerged: (data: {
    fragmentA: Fragment;
    fragmentB: Fragment;
    group: THREE.Group;
    symbolId: number;
  }) => void;

  constructor(fragmentEngine: FragmentEngine, sceneManager: SceneManager) {
    super();
    this.fragmentEngine = fragmentEngine;
    this.sceneManager = sceneManager;
    this.completedSymbols = new Set();
    this.activeEffects = new Map();
    this.boundHandleFragmentsMerged = this.handleFragmentsMerged.bind(this);
    this.fragmentEngine.on('fragmentsMerged', this.boundHandleFragmentsMerged);
  }

  private handleFragmentsMerged(data: {
    fragmentA: Fragment;
    fragmentB: Fragment;
    group: THREE.Group;
    symbolId: number;
  }): void {
    const { symbolId, group } = data;
    if (this.completedSymbols.has(symbolId)) {
      return;
    }
    if (this.isSymbolComplete(symbolId)) {
      this.completedSymbols.add(symbolId);
      this.playCompletionEffects(symbolId, group);
      const config = SYMBOL_CONFIGS[symbolId];
      this.emit('symbolCompleted', {
        symbolId,
        symbolName: config?.name ?? '',
        group,
        completedAt: Date.now(),
      } as SymbolCompletedEvent);
    }
  }

  private isSymbolComplete(symbolId: number): boolean {
    const fragments = this.fragmentEngine.getFragments();
    const symbolFragments = fragments.filter(f => f.symbolId === symbolId);
    const config = SYMBOL_CONFIGS[symbolId];
    if (!config || symbolFragments.length < config.fragmentCount) {
      return false;
    }
    const firstFragment = symbolFragments[0];
    if (!firstFragment) {
      return false;
    }
    const targetGroup = firstFragment.group;
    if (!targetGroup) {
      return false;
    }
    return symbolFragments.every(f => f.group === targetGroup);
  }

  private playCompletionEffects(symbolId: number, group: THREE.Group): void {
    const pointLight = this.createPointLight();
    group.add(pointLight);
    const originalMaterials = this.enableEmissiveMaterial(group);
    const rippleMeshes = this.createRippleMeshes(group);
    const startTime = performance.now();
    const animationFrameId = this.startEffectAnimation(
      symbolId,
      group,
      pointLight,
      rippleMeshes,
      startTime
    );
    this.activeEffects.set(symbolId, {
      pointLight,
      originalMaterials,
      rippleMeshes,
      animationFrameId,
      startTime,
    });
  }

  private createPointLight(): THREE.PointLight {
    const pointLight = new THREE.PointLight(GOLD_COLOR, PULSE_MAX_INTENSITY, LIGHT_DISTANCE);
    pointLight.position.set(0, 0.5, 0);
    return pointLight;
  }

  private enableEmissiveMaterial(group: THREE.Group): Map<THREE.Mesh, THREE.MeshStandardMaterial> {
    const originalMaterials = new Map<THREE.Mesh, THREE.MeshStandardMaterial>();
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        originalMaterials.set(child, material.clone());
        material.emissive = new THREE.Color(GOLD_COLOR);
        material.emissiveIntensity = 0.5;
        material.needsUpdate = true;
      }
    });
    return originalMaterials;
  }

  private createRippleMeshes(_group: THREE.Group): THREE.Mesh[] {
    const rippleMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < RIPPLE_RING_COUNT; i++) {
      const geometry = new THREE.RingGeometry(
        RIPPLE_START_RADIUS,
        RIPPLE_START_RADIUS + 0.1,
        64
      );
      const material = new THREE.MeshBasicMaterial({
        color: GOLD_COLOR,
        transparent: true,
        opacity: RIPPLE_OPACITY_START,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0.02, 0);
      mesh.userData.ringIndex = i;
      this.sceneManager.addMesh(mesh);
      rippleMeshes.push(mesh);
    }
    return rippleMeshes;
  }

  private startEffectAnimation(
    symbolId: number,
    group: THREE.Group,
    pointLight: THREE.PointLight,
    rippleMeshes: THREE.Mesh[],
    startTime: number
  ): number {
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const pulseTime = elapsed / 1000;
      const pulsePhase = pulseTime * PULSE_FREQUENCY * Math.PI * 2;
      const pulseIntensity = PULSE_MIN_INTENSITY +
        (PULSE_MAX_INTENSITY - PULSE_MIN_INTENSITY) *
        (0.5 + 0.5 * Math.sin(pulsePhase));
      pointLight.intensity = pulseIntensity;
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.emissive) {
            material.emissiveIntensity = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(pulsePhase));
          }
        }
      });
      const rippleProgress = Math.min(elapsed / RIPPLE_DURATION, 1);
      rippleMeshes.forEach((mesh, index) => {
        const ringOffset = index / RIPPLE_RING_COUNT;
        const ringProgress = Math.max(0, Math.min(1, (rippleProgress - ringOffset * 0.3) / 0.7));
        const radius = RIPPLE_START_RADIUS +
          (RIPPLE_END_RADIUS - RIPPLE_START_RADIUS) * ringProgress;
        const opacity = RIPPLE_OPACITY_START +
          (RIPPLE_OPACITY_END - RIPPLE_OPACITY_START) * ringProgress;
        const newGeometry = new THREE.RingGeometry(radius, radius + 0.1, 64);
        mesh.geometry.dispose();
        mesh.geometry = newGeometry;
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = opacity;
        const worldPos = new THREE.Vector3();
        group.getWorldPosition(worldPos);
        mesh.position.set(worldPos.x, 0.02, worldPos.z);
      });
      if (elapsed < RIPPLE_DURATION) {
        const frameId = requestAnimationFrame(animate);
        const effectData = this.activeEffects.get(symbolId);
        if (effectData) {
          effectData.animationFrameId = frameId;
        }
      } else {
        this.cleanupEffects(symbolId);
      }
    };
    return requestAnimationFrame(animate);
  }

  private cleanupEffects(symbolId: number): void {
    const effectData = this.activeEffects.get(symbolId);
    if (!effectData) {
      return;
    }
    const { pointLight, originalMaterials, rippleMeshes, animationFrameId } = effectData;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    if (pointLight.parent) {
      pointLight.parent.remove(pointLight);
    }
    pointLight.dispose();
    originalMaterials.forEach((originalMaterial, mesh) => {
      const currentMaterial = mesh.material as THREE.MeshStandardMaterial;
      currentMaterial.emissive = originalMaterial.emissive;
      currentMaterial.emissiveIntensity = originalMaterial.emissiveIntensity;
      currentMaterial.needsUpdate = true;
    });
    rippleMeshes.forEach((mesh) => {
      this.sceneManager.removeMesh(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.activeEffects.delete(symbolId);
  }

  public getCompletedSymbols(): number[] {
    return Array.from(this.completedSymbols);
  }

  public getSymbolProgress(symbolId: number): number {
    const config = SYMBOL_CONFIGS[symbolId];
    if (!config) {
      return 0;
    }
    const fragments = this.fragmentEngine.getFragments();
    const symbolFragments = fragments.filter(f => f.symbolId === symbolId);
    if (symbolFragments.length === 0) {
      return 0;
    }
    const firstFragment = symbolFragments[0];
    if (!firstFragment) {
      return 0;
    }
    const targetGroup = firstFragment.group;
    if (!targetGroup) {
      return 0;
    }
    const mergedCount = symbolFragments.filter(f => f.group === targetGroup).length;
    return mergedCount / config.fragmentCount;
  }

  public getSymbolConfig(symbolId: number): SymbolConfig | undefined {
    return SYMBOL_CONFIGS[symbolId];
  }

  public getAllSymbolConfigs(): SymbolConfig[] {
    return [...SYMBOL_CONFIGS];
  }

  public dispose(): void {
    const symbolIds = Array.from(this.activeEffects.keys());
    for (const symbolId of symbolIds) {
      this.cleanupEffects(symbolId);
    }
    this.fragmentEngine.removeListener('fragmentsMerged', this.boundHandleFragmentsMerged);
    this.completedSymbols.clear();
  }
}
