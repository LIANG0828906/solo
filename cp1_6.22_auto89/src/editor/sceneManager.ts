import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { BuildingType, BuildingParams, HistoryAction } from '@/types';
import { BuildingFactory } from './buildingFactory';

type SelectionCallback = (params: BuildingParams | null) => void;
type TimeChangeCallback = (time: number) => void;

interface AnimatedBuilding {
  group: THREE.Group;
  startY: number;
  targetY: number;
  startTime: number;
  duration: number;
  direction: 'in' | 'out';
}

interface AnimatedPosition {
  group: THREE.Group;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startTime: number;
  duration: number;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private orbitControls: OrbitControls;
  private transformControls: TransformControls;
  private buildingFactory: BuildingFactory;

  private buildings: Map<string, THREE.Group> = new Map();
  private buildingParams: Map<string, BuildingParams> = new Map();
  private selectedId: string | null = null;
  private timeOfDay: number = 12;

  private directionalLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private skyboxMesh: THREE.Mesh;

  private history: HistoryAction[] = [];
  private readonly MAX_HISTORY = 20;
  private historyIndex: number = -1;

  private animatedBuildings: AnimatedBuilding[] = [];
  private animatedPositions: AnimatedPosition[] = [];

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private onSelectionChange: SelectionCallback | null = null;
  private onTimeChange: TimeChangeCallback | null = null;

  private skyboxRotation: number = 0;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.buildingFactory = new BuildingFactory();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(80, 60, 80);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.maxPolarAngle = Math.PI / 2.1;
    this.orbitControls.minDistance = 30;
    this.orbitControls.maxDistance = 300;
    this.orbitControls.target.set(0, 0, 0);

    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.addEventListener('dragging-changed', (event: any) => {
      this.orbitControls.enabled = !event.value;
    });
    this.transformControls.addEventListener('objectChange', () => {
      this.syncTransformToParams();
    });
    this.scene.add(this.transformControls);

    this.setupGround();
    this.setupSkybox();
    this.setupLights();
    this.setupEventListeners(container);

    window.addEventListener('resize', () => this.onResize(container));
  }

  private setupGround(): void {
    const groundGeo = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a2340,
      roughness: 0.9,
      metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(400, 20, 0x64b5f6, 0x64b5f6);
    (gridHelper.material as THREE.Material).opacity = 0.3;
    (gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(gridHelper);
  }

  private setupSkybox(): void {
    const skyGeo = new THREE.SphereGeometry(800, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87ceeb) },
        bottomColor: { value: new THREE.Color(0xe6e6fa) },
        offset: { value: 33 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    this.skyboxMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyboxMesh);
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(50, 80, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -150;
    this.directionalLight.shadow.camera.right = 150;
    this.directionalLight.shadow.camera.top = 150;
    this.directionalLight.shadow.camera.bottom = -150;
    this.directionalLight.shadow.bias = -0.0001;
    this.scene.add(this.directionalLight);

    this.updateTimeOfDay(this.timeOfDay);
  }

  private setupEventListeners(container: HTMLElement): void {
    container.addEventListener('pointerdown', (event) => {
      if ((event.target as HTMLElement).tagName === 'CANVAS') {
        this.handleClick(event, container);
      }
    });

    window.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        this.undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        this.duplicateSelected();
      }
      if (event.key === 'Escape') {
        this.deselectBuilding();
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (this.selectedId && document.activeElement?.tagName !== 'INPUT') {
          this.removeBuilding(this.selectedId);
        }
      }
      if (event.key === 'w' || event.key === 'W') {
        if (this.selectedId) this.transformControls.setMode('translate');
      }
      if (event.key === 'e' || event.key === 'E') {
        if (this.selectedId) this.transformControls.setMode('rotate');
      }
      if (event.key === 'r' || event.key === 'R') {
        if (this.selectedId) this.transformControls.setMode('scale');
      }
    });
  }

  private handleClick(event: PointerEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const buildingMeshes: THREE.Object3D[] = [];
    this.buildings.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          buildingMeshes.push(child);
        }
      });
    });

    const intersects = this.raycaster.intersectObjects(buildingMeshes, false);

    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.userData.buildingId) {
        obj = obj.parent;
      }
      if (obj && obj.userData.buildingId) {
        this.selectBuilding(obj.userData.buildingId);
      }
    } else {
      this.deselectBuilding();
    }
  }

  private onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  private syncTransformToParams(): void {
    if (!this.selectedId) return;
    const group = this.buildings.get(this.selectedId);
    if (!group) return;

    const params = this.buildingParams.get(this.selectedId);
    if (!params) return;

    const before: BuildingParams = { ...params };

    params.position.x = group.position.x;
    params.position.y = group.position.y;
    params.position.z = group.position.z;
    params.rotationY = group.rotation.y;

    const scale = group.scale;
    params.size.w = Math.max(1, params.size.w * scale.x);
    params.size.h = Math.max(1, params.size.h * scale.y);
    params.size.d = Math.max(1, params.size.d * scale.z);
    group.scale.set(1, 1, 1);

    group.userData.params = { ...params };

    this.pushHistory({ type: 'modify', before, after: { ...params } });

    if (this.onSelectionChange) {
      this.onSelectionChange(params);
    }
  }

  generateId(): string {
    return 'b_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  addBuilding(type: BuildingType, customParams?: Partial<BuildingParams>, animate: boolean = true): BuildingParams | null {
    if (this.buildings.size >= 50) {
      return null;
    }

    const id = this.generateId();
    const size = this.buildingFactory.getDefaultSize(type);
    const color = this.buildingFactory.getRandomColor();

    let posX = 0, posZ = 0;
    if (!customParams?.position) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 60;
      posX = Math.cos(angle) * radius;
      posZ = Math.sin(angle) * radius;
    }

    const params: BuildingParams = {
      id,
      type,
      position: customParams?.position || { x: posX, y: 0, z: posZ },
      size: customParams?.size || size,
      rotationY: customParams?.rotationY || 0,
      color: customParams?.color || color
    };

    const group = this.buildingFactory.createMesh(params);
    this.buildings.set(id, group);
    this.buildingParams.set(id, params);

    if (animate) {
      group.position.y = -params.size.h - 5;
      const targetY = params.position.y;
      params.position.y = -params.size.h - 5;

      this.animatedBuildings.push({
        group,
        startY: -params.size.h - 5,
        targetY: targetY,
        startTime: performance.now(),
        duration: 600,
        direction: 'in'
      });
      params.position.y = targetY;
    }

    this.scene.add(group);
    this.pushHistory({ type: 'add', after: { ...params } });

    return params;
  }

  removeBuilding(id: string): void {
    const group = this.buildings.get(id);
    const params = this.buildingParams.get(id);
    if (!group || !params) return;

    if (this.selectedId === id) {
      this.deselectBuilding();
    }

    this.pushHistory({ type: 'remove', before: { ...params } });

    this.animatedBuildings.push({
      group,
      startY: group.position.y,
      targetY: -params.size.h - 10,
      startTime: performance.now(),
      duration: 400,
      direction: 'out'
    });

    setTimeout(() => {
      this.scene.remove(group);
      this.buildings.delete(id);
      this.buildingParams.delete(id);
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
    }, 400);
  }

  updateBuilding(id: string, updates: Partial<BuildingParams>): void {
    const params = this.buildingParams.get(id);
    const group = this.buildings.get(id);
    if (!params || !group) return;

    const before: BuildingParams = { ...params };
    Object.assign(params, updates);

    if (updates.position) {
      group.position.set(params.position.x, params.position.y, params.position.z);
    }
    if (updates.rotationY !== undefined) {
      group.rotation.y = params.rotationY;
    }
    if (updates.size || updates.color || updates.type) {
      this.scene.remove(group);
      const newGroup = this.buildingFactory.createMesh(params);
      this.buildings.set(id, newGroup);
      this.scene.add(newGroup);
      if (this.selectedId === id) {
        this.transformControls.attach(newGroup);
      }
    }

    group.userData.params = { ...params };
    this.pushHistory({ type: 'modify', before, after: { ...params } });

    if (this.selectedId === id && this.onSelectionChange) {
      this.onSelectionChange(params);
    }
  }

  selectBuilding(id: string): void {
    if (this.selectedId === id) return;
    const group = this.buildings.get(id);
    if (!group) return;

    this.selectedId = id;
    this.transformControls.attach(group);

    const params = this.buildingParams.get(id);
    if (params && this.onSelectionChange) {
      this.onSelectionChange(params);
    }
  }

  deselectBuilding(): void {
    this.selectedId = null;
    this.transformControls.detach();
    if (this.onSelectionChange) {
      this.onSelectionChange(null);
    }
  }

  getSelectedBuilding(): BuildingParams | null {
    if (!this.selectedId) return null;
    return this.buildingParams.get(this.selectedId) || null;
  }

  duplicateSelected(): void {
    if (!this.selectedId) return;
    const params = this.buildingParams.get(this.selectedId);
    if (!params) return;
    if (this.buildings.size >= 50) return;

    const offsetX = 5 + (Math.random() - 0.5) * 2;
    const offsetZ = 5 + (Math.random() - 0.5) * 2;

    const newParams = this.addBuilding(params.type, {
      position: {
        x: params.position.x,
        y: params.position.y,
        z: params.position.z
      },
      size: { ...params.size },
      rotationY: params.rotationY,
      color: params.color
    }, false);

    if (newParams) {
      const group = this.buildings.get(newParams.id);
      if (group) {
        this.animatedPositions.push({
          group,
          startPos: group.position.clone(),
          targetPos: new THREE.Vector3(
            params.position.x + offsetX,
            params.position.y,
            params.position.z + offsetZ
          ),
          startTime: performance.now(),
          duration: 300
        });
      }
      newParams.position.x += offsetX;
      newParams.position.z += offsetZ;
      this.pushHistory({ type: 'duplicate', after: { ...newParams } });
      this.selectBuilding(newParams.id);
    }
  }

  private pushHistory(action: HistoryAction): void {
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(action);
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo(): void {
    if (this.historyIndex < 0) return;

    const action = this.history[this.historyIndex];
    this.historyIndex--;

    switch (action.type) {
      case 'add':
      case 'duplicate':
        if (action.after) {
          this.undoRemoveBuilding(action.after.id);
        }
        break;
      case 'remove':
        if (action.before) {
          this.undoAddBuilding(action.before);
        }
        break;
      case 'modify':
        if (action.before) {
          this.undoUpdateBuilding(action.before);
        }
        break;
    }
  }

  private undoRemoveBuilding(id: string): void {
    const group = this.buildings.get(id);
    const params = this.buildingParams.get(id);
    if (!group || !params) return;

    if (this.selectedId === id) {
      this.deselectBuilding();
    }

    this.animatedBuildings.push({
      group,
      startY: group.position.y,
      targetY: -params.size.h - 10,
      startTime: performance.now(),
      duration: 400,
      direction: 'out'
    });

    setTimeout(() => {
      this.scene.remove(group);
      this.buildings.delete(id);
      this.buildingParams.delete(id);
    }, 400);
  }

  private undoAddBuilding(params: BuildingParams): void {
    if (this.buildings.size >= 50) return;

    const group = this.buildingFactory.createMesh(params);
    this.buildings.set(params.id, group);
    this.buildingParams.set(params.id, { ...params });

    group.position.y = -params.size.h - 5;
    this.scene.add(group);

    this.animatedBuildings.push({
      group,
      startY: -params.size.h - 5,
      targetY: params.position.y,
      startTime: performance.now(),
      duration: 600,
      direction: 'in'
    });
  }

  private undoUpdateBuilding(params: BuildingParams): void {
    const group = this.buildings.get(params.id);
    if (!group) return;

    Object.assign(this.buildingParams.get(params.id)!, params);
    this.scene.remove(group);
    const newGroup = this.buildingFactory.createMesh(params);
    this.buildings.set(params.id, newGroup);
    this.scene.add(newGroup);

    if (this.selectedId === params.id) {
      this.transformControls.attach(newGroup);
      if (this.onSelectionChange) {
        this.onSelectionChange(params);
      }
    }
  }

  setSelectionCallback(callback: SelectionCallback): void {
    this.onSelectionChange = callback;
  }

  setTimeChangeCallback(callback: TimeChangeCallback): void {
    this.onTimeChange = callback;
  }

  updateTimeOfDay(time: number): void {
    this.timeOfDay = Math.max(6, Math.min(20, time));

    const t = (this.timeOfDay - 6) / 14;

    let skyTop: THREE.Color;
    let skyBottom: THREE.Color;
    let lightColor: THREE.Color;
    let ambientIntensity: number;
    let lightIntensity: number;

    if (t < 0.2) {
      const lt = t / 0.2;
      skyTop = new THREE.Color().lerpColors(
        new THREE.Color(0xffa07a),
        new THREE.Color(0x87ceeb),
        lt
      );
      skyBottom = new THREE.Color().lerpColors(
        new THREE.Color(0xffd4b8),
        new THREE.Color(0xe6e6fa),
        lt
      );
      lightColor = new THREE.Color().lerpColors(
        new THREE.Color(0xffa07a),
        new THREE.Color(0xffffff),
        lt
      );
      ambientIntensity = 0.3 + lt * 0.2;
      lightIntensity = 0.6 + lt * 0.4;
    } else if (t < 0.8) {
      const lt = (t - 0.2) / 0.6;
      skyTop = new THREE.Color().lerpColors(
        new THREE.Color(0x87ceeb),
        new THREE.Color(0x87ceeb),
        lt
      );
      skyBottom = new THREE.Color().lerpColors(
        new THREE.Color(0xe6e6fa),
        new THREE.Color(0xdcd0ff),
        lt
      );
      lightColor = new THREE.Color(0xffffff);
      ambientIntensity = 0.5;
      lightIntensity = 1.0;
    } else {
      const lt = (t - 0.8) / 0.2;
      skyTop = new THREE.Color().lerpColors(
        new THREE.Color(0x87ceeb),
        new THREE.Color(0x6a4e8a),
        lt
      );
      skyBottom = new THREE.Color().lerpColors(
        new THREE.Color(0xdcd0ff),
        new THREE.Color(0xe8a0a0),
        lt
      );
      lightColor = new THREE.Color().lerpColors(
        new THREE.Color(0xffffff),
        new THREE.Color(0xff8c69),
        lt
      );
      ambientIntensity = 0.5 - lt * 0.2;
      lightIntensity = 1.0 - lt * 0.4;
    }

    const mat = this.skyboxMesh.material as THREE.ShaderMaterial;
    mat.uniforms.topColor.value.copy(skyTop);
    mat.uniforms.bottomColor.value.copy(skyBottom);

    const sunAngle = Math.PI * t;
    const sunHeight = Math.sin(sunAngle) * 100;
    const sunDist = Math.cos(sunAngle) * 100;
    this.directionalLight.position.set(sunDist, Math.max(sunHeight, 10), 50);
    this.directionalLight.color.copy(lightColor);
    this.directionalLight.intensity = lightIntensity;
    this.ambientLight.intensity = ambientIntensity;

    if (this.onTimeChange) {
      this.onTimeChange(this.timeOfDay);
    }
  }

  getTimeOfDay(): number {
    return this.timeOfDay;
  }

  getBuildingsCount(): number {
    return this.buildings.size;
  }

  getBuildingParams(id: string): BuildingParams | undefined {
    return this.buildingParams.get(id);
  }

  getAllBuildingParams(): BuildingParams[] {
    return Array.from(this.buildingParams.values());
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getOrbitControls(): OrbitControls {
    return this.orbitControls;
  }

  private elasticOut(t: number): number {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  render(): void {
    const now = performance.now();

    this.skyboxRotation += 0.0005;
    this.skyboxMesh.rotation.y = this.skyboxRotation;

    this.animatedBuildings = this.animatedBuildings.filter((anim) => {
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const eased = anim.direction === 'in' ? this.elasticOut(progress) : this.easeOutCubic(progress);

      anim.group.position.y = anim.startY + (anim.targetY - anim.startY) * eased;

      if (progress >= 1) {
        anim.group.position.y = anim.targetY;
        const params = anim.group.userData.params as BuildingParams;
        if (params) {
          params.position.y = anim.targetY;
        }
        return false;
      }
      return true;
    });

    this.animatedPositions = this.animatedPositions.filter((anim) => {
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);
      const eased = this.easeOutCubic(progress);

      anim.group.position.lerpVectors(anim.startPos, anim.targetPos, eased);

      if (progress >= 1) {
        anim.group.position.copy(anim.targetPos);
        const params = anim.group.userData.params as BuildingParams;
        if (params) {
          params.position.x = anim.targetPos.x;
          params.position.y = anim.targetPos.y;
          params.position.z = anim.targetPos.z;
        }
        return false;
      }
      return true;
    });

    this.orbitControls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
