import * as THREE from 'three';

export enum ModuleType {
  SOLAR_PANEL = 'solar_panel',
  HABITAT = 'habitat',
  LABORATORY = 'laboratory',
  DOCKING = 'docking',
  THRUSTER = 'thruster',
  GREENHOUSE = 'greenhouse'
}

export interface ModuleConfig {
  type: ModuleType;
  name: string;
  color: number;
  emissiveColor: number;
  description: string;
  shape: 'box' | 'cylinder' | 'sphere' | 'torus' | 'cone';
  powerContribution: number;
  oxygenContribution: number;
}

export const MODULE_CONFIGS: Record<ModuleType, ModuleConfig> = {
  [ModuleType.SOLAR_PANEL]: {
    type: ModuleType.SOLAR_PANEL,
    name: '太阳能板',
    color: 0xffd700,
    emissiveColor: 0xffa500,
    description: '收集太阳能转化为电力，为空间站供能',
    shape: 'box',
    powerContribution: 15,
    oxygenContribution: 0
  },
  [ModuleType.HABITAT]: {
    type: ModuleType.HABITAT,
    name: '居住舱',
    color: 0xffffff,
    emissiveColor: 0xcccccc,
    description: '宇航员生活空间，提供基本居住环境',
    shape: 'cylinder',
    powerContribution: 0,
    oxygenContribution: 0
  },
  [ModuleType.LABORATORY]: {
    type: ModuleType.LABORATORY,
    name: '实验室',
    color: 0x3366ff,
    emissiveColor: 0x0033cc,
    description: '科学研究设施，辅助氧气循环系统',
    shape: 'sphere',
    powerContribution: 0,
    oxygenContribution: 10
  },
  [ModuleType.DOCKING]: {
    type: ModuleType.DOCKING,
    name: '对接舱',
    color: 0x888888,
    emissiveColor: 0x555555,
    description: '飞船对接接口，用于人员和物资运输',
    shape: 'torus',
    powerContribution: 0,
    oxygenContribution: 0
  },
  [ModuleType.THRUSTER]: {
    type: ModuleType.THRUSTER,
    name: '推进器',
    color: 0xff3333,
    emissiveColor: 0xcc0000,
    description: '轨道推进系统，调整空间站姿态',
    shape: 'cone',
    powerContribution: 0,
    oxygenContribution: 0
  },
  [ModuleType.GREENHOUSE]: {
    type: ModuleType.GREENHOUSE,
    name: '种植舱',
    color: 0x33ff66,
    emissiveColor: 0x00cc33,
    description: '植物种植舱，产生氧气并提供食物',
    shape: 'box',
    powerContribution: 0,
    oxygenContribution: 20
  }
};

export interface StationStats {
  power: number;
  oxygen: number;
  integrity: number;
  moduleCount: number;
  connectionCount: number;
}

export interface ModuleInfo {
  id: string;
  type: ModuleType;
  name: string;
  size: string;
  description: string;
  connections: number;
  screenPosition: { x: number; y: number };
}

type StatsCallback = (stats: StationStats) => void;
type ModuleClickCallback = (info: ModuleInfo | null) => void;

export class SpaceModule {
  id: string;
  type: ModuleType;
  mesh: THREE.Group;
  connections: string[] = [];
  config: ModuleConfig;
  private edges: THREE.LineSegments | null = null;
  private originalEdgeColor: number = 0x00ccff;
  private highlightEdgeColor: number = 0x00ffff;
  private isHighlighted: boolean = false;

  constructor(id: string, type: ModuleType, position: THREE.Vector3) {
    this.id = id;
    this.type = type;
    this.config = MODULE_CONFIGS[type];
    this.mesh = new THREE.Group();
    this.buildMesh();
    this.mesh.position.copy(position);
    this.mesh.userData = { moduleId: this.id };
  }

  private buildMesh(): void {
    const config = this.config;
    let geometry: THREE.BufferGeometry;

    switch (config.shape) {
      case 'box':
        if (config.type === ModuleType.SOLAR_PANEL) {
          geometry = new THREE.BoxGeometry(1, 0.1, 1);
        } else {
          geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        }
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.45, 0.45, 1, 32);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(0.4, 0.15, 16, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.4, 1, 32);
        break;
      default:
        geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    }

    const isTransparent = config.type === ModuleType.GREENHOUSE;
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissiveColor,
      emissiveIntensity: 0.2,
      metalness: 0.3,
      roughness: 0.5,
      transparent: isTransparent,
      opacity: isTransparent ? 0.6 : 1.0
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.mesh.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: this.originalEdgeColor,
      transparent: true,
      opacity: 0.8
    });
    this.edges = new THREE.LineSegments(edges, edgeMaterial);
    this.mesh.add(this.edges);
  }

  setHighlight(highlight: boolean): void {
    this.isHighlighted = highlight;
    if (this.edges) {
      const mat = this.edges.material as THREE.LineBasicMaterial;
      mat.color.setHex(highlight ? this.highlightEdgeColor : this.originalEdgeColor);
      (this.edges.material as THREE.LineBasicMaterial).opacity = highlight ? 1.0 : 0.8;
    }
  }

  playPlaceAnimation(): void {
    const duration = 200;
    const startTime = performance.now();
    const originalScale = this.mesh.scale.x;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const scale = originalScale + 0.1 * Math.sin(progress * Math.PI);
      this.mesh.scale.setScalar(scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.mesh.scale.setScalar(originalScale);
      }
    };
    animate();
  }

  rotate90Degrees(): void {
    const targetRotation = this.mesh.rotation.y + Math.PI / 2;
    const startRotation = this.mesh.rotation.y;
    const duration = 300;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.mesh.rotation.y = startRotation + (targetRotation - startRotation) * eased;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  getBounds(): THREE.Box3 {
    return new THREE.Box3().setFromObject(this.mesh);
  }

  getWorldPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.mesh.getWorldPosition(pos);
    return pos;
  }
}

export class ModuleManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private modules: Map<string, SpaceModule> = new Map();
  private pipes: Map<string, THREE.Mesh> = new Map();
  private previewModule: THREE.Group | null = null;
  private previewType: ModuleType | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private selectedModuleId: string | null = null;
  private moduleIdCounter: number = 0;
  private onStatsUpdate: StatsCallback | null = null;
  private onModuleClick: ModuleClickCallback | null = null;
  private isPlacing: boolean = false;
  private domElement: HTMLElement;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  setStatsCallback(callback: StatsCallback): void {
    this.onStatsUpdate = callback;
  }

  setModuleClickCallback(callback: ModuleClickCallback): void {
    this.onModuleClick = callback;
  }

  createInitialModule(): void {
    this.addModule(ModuleType.HABITAT, new THREE.Vector3(0, 0, 0));
  }

  startPlacing(type: ModuleType): void {
    this.stopPlacing();
    this.previewType = type;
    this.isPlacing = true;

    const config = MODULE_CONFIGS[type];
    this.previewModule = this.createPreviewMesh(config);
    this.previewModule.visible = false;
    this.scene.add(this.previewModule);
  }

  stopPlacing(): void {
    if (this.previewModule) {
      this.scene.remove(this.previewModule);
      this.previewModule = null;
    }
    this.previewType = null;
    this.isPlacing = false;
  }

  private createPreviewMesh(config: ModuleConfig): THREE.Group {
    const group = new THREE.Group();
    let geometry: THREE.BufferGeometry;

    switch (config.shape) {
      case 'box':
        if (config.type === ModuleType.SOLAR_PANEL) {
          geometry = new THREE.BoxGeometry(1, 0.1, 1);
        } else {
          geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        }
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.45, 0.45, 1, 32);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(0.4, 0.15, 16, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(0.4, 1, 32);
        break;
      default:
        geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    }

    const isTransparent = config.type === ModuleType.GREENHOUSE;
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissiveColor,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: isTransparent ? 0.4 : 0.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9
    });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    group.add(edgeLines);

    return group;
  }

  handleMouseMove(normalizedX: number, normalizedY: number): void {
    if (!this.isPlacing || !this.previewModule) return;

    this.mouse.x = normalizedX;
    this.mouse.y = normalizedY;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const moduleMeshes = Array.from(this.modules.values()).map(m => m.mesh);
    const intersects = this.raycaster.intersectObjects(moduleMeshes, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const normal = hit.face?.normal.clone() || new THREE.Vector3(0, 1, 0);
      normal.transformDirection(hit.object.matrixWorld);

      let hitModule: SpaceModule | null = null;
      for (const mod of this.modules.values()) {
        if (mod.mesh === hit.object || mod.mesh.children.includes(hit.object as THREE.Mesh)) {
          hitModule = mod;
          break;
        }
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj === mod.mesh) {
            hitModule = mod;
            break;
          }
          obj = obj.parent;
        }
        if (hitModule) break;
      }

      if (hitModule) {
        const position = hit.point.clone().add(normal.multiplyScalar(0.55));
        this.snapToGrid(position);
        this.previewModule.position.copy(position);
        this.previewModule.visible = true;
      } else {
        this.previewModule.visible = false;
      }
    } else {
      this.previewModule.visible = false;
    }
  }

  handleLeftClick(normalizedX: number, normalizedY: number): boolean {
    if (this.isPlacing && this.previewModule && this.previewModule.visible && this.previewType) {
      const position = this.previewModule.position.clone();
      this.addModule(this.previewType, position);
      this.stopPlacing();
      return true;
    }

    this.mouse.x = normalizedX;
    this.mouse.y = normalizedY;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const moduleMeshes = Array.from(this.modules.values()).map(m => m.mesh);
    const intersects = this.raycaster.intersectObjects(moduleMeshes, true);

    if (intersects.length > 0) {
      let hitModule: SpaceModule | null = null;
      for (const mod of this.modules.values()) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj) {
          if (obj === mod.mesh) {
            hitModule = mod;
            break;
          }
          obj = obj.parent;
        }
        if (hitModule) break;
      }

      this.clearSelection();
      if (hitModule) {
        this.selectModule(hitModule.id);
        return true;
      }
    } else {
      this.clearSelection();
    }

    return false;
  }

  handleRightClick(normalizedX: number, normalizedY: number): { moduleId: string; screenX: number; screenY: number } | null {
    this.mouse.x = normalizedX;
    this.mouse.y = normalizedY;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const moduleMeshes = Array.from(this.modules.values()).map(m => m.mesh);
    const intersects = this.raycaster.intersectObjects(moduleMeshes, true);

    if (intersects.length > 0) {
      for (const mod of this.modules.values()) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj) {
          if (obj === mod.mesh) {
            this.selectModule(mod.id);
            return {
              moduleId: mod.id,
              screenX: (normalizedX * 0.5 + 0.5) * window.innerWidth,
              screenY: (-normalizedY * 0.5 + 0.5) * window.innerHeight
            };
          }
          obj = obj.parent;
        }
      }
    }
    return null;
  }

  private selectModule(id: string): void {
    this.clearSelection();
    const mod = this.modules.get(id);
    if (mod) {
      mod.setHighlight(true);
      this.selectedModuleId = id;
      this.updateModuleClickCallback(mod);
    }
  }

  clearSelection(): void {
    if (this.selectedModuleId) {
      const mod = this.modules.get(this.selectedModuleId);
      if (mod) {
        mod.setHighlight(false);
      }
      this.selectedModuleId = null;
    }
    if (this.onModuleClick) {
      this.onModuleClick(null);
    }
  }

  private updateModuleClickCallback(mod: SpaceModule): void {
    if (!this.onModuleClick) return;

    const worldPos = mod.getWorldPosition();
    const projected = worldPos.clone().project(this.camera);

    const info: ModuleInfo = {
      id: mod.id,
      type: mod.type,
      name: mod.config.name,
      size: '1 单位',
      description: mod.config.description,
      connections: mod.connections.length,
      screenPosition: {
        x: (projected.x * 0.5 + 0.5) * window.innerWidth,
        y: (-projected.y * 0.5 + 0.5) * window.innerHeight
      }
    };
    this.onModuleClick(info);
  }

  updateSelectedModulePosition(): void {
    if (this.selectedModuleId && this.onModuleClick) {
      const mod = this.modules.get(this.selectedModuleId);
      if (mod) {
        this.updateModuleClickCallback(mod);
      }
    }
  }

  private snapToGrid(position: THREE.Vector3): void {
    const gridSize = 0.5;
    position.x = Math.round(position.x / gridSize) * gridSize;
    position.y = Math.round(position.y / gridSize) * gridSize;
    position.z = Math.round(position.z / gridSize) * gridSize;
  }

  private addModule(type: ModuleType, position: THREE.Vector3): SpaceModule | null {
    if (this.isPositionOccupied(position)) {
      return null;
    }

    this.snapToGrid(position);
    const id = `module_${++this.moduleIdCounter}`;
    const module = new SpaceModule(id, type, position);
    this.modules.set(id, module);
    this.scene.add(module.mesh);
    module.playPlaceAnimation();
    this.createConnectionsForModule(module);
    this.updateStats();

    return module;
  }

  private isPositionOccupied(position: THREE.Vector3): boolean {
    const posKey = this.getPositionKey(position);
    for (const mod of this.modules.values()) {
      const modKey = this.getPositionKey(mod.getPosition());
      if (modKey === posKey) {
        return true;
      }
    }
    return false;
  }

  private getPositionKey(position: THREE.Vector3): string {
    return `${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`;
  }

  private createConnectionsForModule(newModule: SpaceModule): void {
    const newPos = newModule.getPosition();
    const directions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1)
    ];

    for (const mod of this.modules.values()) {
      if (mod.id === newModule.id) continue;

      const modPos = mod.getPosition();
      const distance = newPos.distanceTo(modPos);

      if (Math.abs(distance - 1.0) < 0.1) {
        let isNeighbor = false;
        for (const dir of directions) {
          const checkPos = newPos.clone().add(dir.clone().multiplyScalar(1));
          if (this.getPositionKey(checkPos) === this.getPositionKey(modPos)) {
            isNeighbor = true;
            break;
          }
        }

        if (isNeighbor || true) {
          this.createPipe(newModule, mod);
          if (!newModule.connections.includes(mod.id)) {
            newModule.connections.push(mod.id);
          }
          if (!mod.connections.includes(newModule.id)) {
            mod.connections.push(newModule.id);
          }
        }
      }
    }
  }

  private createPipe(moduleA: SpaceModule, moduleB: SpaceModule): void {
    const pipeId = [moduleA.id, moduleB.id].sort().join('_');
    if (this.pipes.has(pipeId)) return;

    const posA = moduleA.getWorldPosition();
    const posB = moduleB.getWorldPosition();

    const direction = new THREE.Vector3().subVectors(posB, posA);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);

    const geometry = new THREE.CylinderGeometry(0.1, 0.1, length, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      emissive: 0x2244aa,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.6
    });

    const pipe = new THREE.Mesh(geometry, material);
    pipe.position.copy(midpoint);

    const up = new THREE.Vector3(0, 1, 0);
    direction.normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
    pipe.quaternion.copy(quaternion);

    pipe.userData = { pipeId };
    this.scene.add(pipe);
    this.pipes.set(pipeId, pipe);
  }

  removeModule(id: string): void {
    const module = this.modules.get(id);
    if (!module) return;

    const connectedIds = [...module.connections];

    for (const connectedId of connectedIds) {
      const connected = this.modules.get(connectedId);
      if (connected) {
        connected.connections = connected.connections.filter(cid => cid !== id);
      }
      const pipeId = [id, connectedId].sort().join('_');
      const pipe = this.pipes.get(pipeId);
      if (pipe) {
        this.scene.remove(pipe);
        this.pipes.delete(pipeId);
      }
    }

    this.scene.remove(module.mesh);
    this.modules.delete(id);

    if (this.selectedModuleId === id) {
      this.selectedModuleId = null;
      if (this.onModuleClick) {
        this.onModuleClick(null);
      }
    }

    this.updateStats();
  }

  rotateModule(id: string): void {
    const module = this.modules.get(id);
    if (module) {
      module.rotate90Degrees();
    }
  }

  getModuleIds(): string[] {
    return Array.from(this.modules.keys());
  }

  private updateStats(): void {
    if (!this.onStatsUpdate) return;

    let solarCount = 0;
    let greenhouseCount = 0;
    let labCount = 0;
    let totalConnections = 0;

    for (const mod of this.modules.values()) {
      switch (mod.type) {
        case ModuleType.SOLAR_PANEL:
          solarCount++;
          break;
        case ModuleType.GREENHOUSE:
          greenhouseCount++;
          break;
        case ModuleType.LABORATORY:
          labCount++;
          break;
      }
      totalConnections += mod.connections.length;
    }

    totalConnections = Math.floor(totalConnections / 2);
    const moduleCount = this.modules.size;

    const stats: StationStats = {
      power: Math.min(100, solarCount * MODULE_CONFIGS[ModuleType.SOLAR_PANEL].powerContribution),
      oxygen: Math.min(100, greenhouseCount * MODULE_CONFIGS[ModuleType.GREENHOUSE].oxygenContribution + labCount * MODULE_CONFIGS[ModuleType.LABORATORY].oxygenContribution),
      integrity: Math.min(100, moduleCount > 0 ? (totalConnections / moduleCount) * 50 + moduleCount * 2 : 0),
      moduleCount,
      connectionCount: totalConnections
    };

    this.onStatsUpdate(stats);
  }

  getPreviewType(): ModuleType | null {
    return this.previewType;
  }

  isInPlacingMode(): boolean {
    return this.isPlacing;
  }
}
