import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { dataProvider, RockLayer, MineralNode } from './DataProvider';
import { eventBus } from './eventBus';

const SURFACE_RADIUS = 50;
const MAX_DEPTH = 100;
const GRID_RESOLUTION = 64;

class SceneManager {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;

  private surface: THREE.Mesh | null = null;
  private drillMarker: THREE.Mesh | null = null;
  private drillMarkerTarget: THREE.Vector3 = new THREE.Vector3(0, 0.1, 0);
  private drillMarkerVisible: number = 1;
  private layerMeshes: Map<string, THREE.Mesh> = new Map();
  private layerTransitionProgress: Map<string, number> = new Map();
  private mineralInstancedMesh: THREE.InstancedMesh | null = null;
  private mineralBaseData: { id: string; matrix: THREE.Matrix4; color: THREE.Color; baseScale: number }[] = [];
  private mineralVisibleAlpha: Map<string, number> = new Map();
  private mineralDummy: THREE.Object3D = new THREE.Object3D();

  private sectionIndicator: THREE.Group | null = null;
  private sectionActive: boolean = false;
  private sectionPosition: number = 0;
  private sectionAxis: 'x' | 'z' = 'x';
  private sectionFade: number = 0;
  private draggingSection: boolean = false;

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private isMouseDown: boolean = false;
  private mouseDownPos: THREE.Vector2 = new THREE.Vector2();

  private minDepth: number = 0;
  private maxDepth: number = 100;
  private animationFrameId: number = 0;

  private resizeHandler: () => void;
  private pointerDownHandler: (e: PointerEvent) => void;
  private pointerMoveHandler: (e: PointerEvent) => void;
  private pointerUpHandler: (e: PointerEvent) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.Fog(0x0a0a1a, 120, 250);

    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 500);
    this.camera.position.set(0, 120, 120);
    this.camera.lookAt(0, -30, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 40;
    this.controls.maxDistance = 300;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.target.set(0, -20, 0);

    this.clock = new THREE.Clock();

    this.setupLights();
    this.createSurface();
    this.createDrillMarker();
    this.createLayers();
    this.createMinerals();
    this.createSectionIndicator();

    this.resizeHandler = this.onResize.bind(this);
    this.pointerDownHandler = this.onPointerDown.bind(this);
    this.pointerMoveHandler = this.onPointerMove.bind(this);
    this.pointerUpHandler = this.onPointerUp.bind(this);

    window.addEventListener('resize', this.resizeHandler);
    this.renderer.domElement.addEventListener('pointerdown', this.pointerDownHandler);
    this.renderer.domElement.addEventListener('pointermove', this.pointerMoveHandler);
    this.renderer.domElement.addEventListener('pointerup', this.pointerUpHandler);

    this.setupEventListeners();
    this.animate();
    this.broadcastStatistics();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(80, 120, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.left = -80;
    dirLight.shadow.camera.right = 80;
    dirLight.shadow.camera.top = 80;
    dirLight.shadow.camera.bottom = -80;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x6699ff, 0.3);
    fillLight.position.set(-60, 40, -40);
    this.scene.add(fillLight);

    const pointLight = new THREE.PointLight(0x00ccff, 0.5, 150);
    pointLight.position.set(0, -50, 0);
    this.scene.add(pointLight);
  }

  private createSurfaceTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const nx = x / size, ny = y / size;
        const noise = this.hashNoise(x * 0.7 + 13, y * 0.7 + 29) * 0.35 +
                      this.hashNoise(x * 0.15 + 7, y * 0.15 + 11) * 0.65;
        const dist = Math.sqrt(Math.pow(nx - 0.5, 2) + Math.pow(ny - 0.5, 2));
        const t = Math.min(1, dist * 2.2);
        const gBase = 60 + noise * 40;
        const bBase = 100 + noise * 50;
        const r = Math.floor(gBase * (1 - t) + (100 + noise * 50) * t);
        const g = Math.floor(bBase * (1 - t) + (50 + noise * 30) * t);
        const b = Math.floor(30 * (1 - t) + 20 * t);
        img.data[idx] = Math.min(255, Math.max(0, r));
        img.data[idx + 1] = Math.min(255, Math.max(0, g));
        img.data[idx + 2] = Math.min(255, Math.max(0, b));
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    return texture;
  }

  private hashNoise(x: number, y: number): number {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return s - Math.floor(s);
  }

  private createSurface(): void {
    const geometry = new THREE.CircleGeometry(SURFACE_RADIUS, 128);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      if (dist < SURFACE_RADIUS - 0.1) {
        const n = this.hashNoise(x * 0.15 + 100, y * 0.15 + 200) * 0.8 +
                  this.hashNoise(x * 0.05, y * 0.05) * 2.0;
        positions.setZ(i, n - 0.5);
      }
    }
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      map: this.createSurfaceTexture(),
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    this.surface = new THREE.Mesh(geometry, material);
    this.surface.rotation.x = -Math.PI / 2;
    this.surface.receiveShadow = true;
    this.surface.name = 'surface';
    this.scene.add(this.surface);

    const gridHelper = new THREE.RingGeometry(SURFACE_RADIUS - 0.3, SURFACE_RADIUS, 128);
    const gridMat = new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const border = new THREE.Mesh(gridHelper, gridMat);
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.05;
    this.scene.add(border);
  }

  private createDrillMarker(): void {
    const geometry = new THREE.SphereGeometry(1.2, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.75
    });
    this.drillMarker = new THREE.Mesh(geometry, material);
    this.drillMarker.position.copy(this.drillMarkerTarget);
    this.drillMarker.name = 'drillMarker';
    this.scene.add(this.drillMarker);

    const ringGeo = new THREE.RingGeometry(1.5, 2.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6666,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.drillMarker.add(ring);
  }

  private createLayerGeometry(layer: RockLayer): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(SURFACE_RADIUS * 2, SURFACE_RADIUS * 2, GRID_RESOLUTION, GRID_RESOLUTION);
    const positions = geometry.attributes.position;
    const colors: number[] = [];
    const color = new THREE.Color(layer.color);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const dist = Math.sqrt(x * x + z * z);
      let y: number;
      if (dist > SURFACE_RADIUS) {
        y = layer.topDepth;
        positions.setZ(i, -MAX_DEPTH * 0.5);
        colors.push(0, 0, 0);
      } else {
        const topY = dataProvider.getLayerTopDepth(layer.id, x, z);
        const bottomY = dataProvider.getLayerBottomDepth(layer.id, x, z);
        y = (topY + bottomY) * 0.5;
        positions.setZ(i, -(bottomY - topY) * 0.5);
        const tint = 0.85 + this.hashNoise(x * 0.1, z * 0.1) * 0.3;
        colors.push(color.r * tint, color.g * tint, color.b * tint);
      }
      positions.setY(i, -y);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const sideGeo = new THREE.BufferGeometry();
    const sidePositions: number[] = [];
    const sideColors: number[] = [];
    const segments = 128;
    for (let s = 0; s < segments; s++) {
      const a1 = (s / segments) * Math.PI * 2;
      const a2 = ((s + 1) / segments) * Math.PI * 2;
      const x1 = Math.cos(a1) * SURFACE_RADIUS;
      const z1 = Math.sin(a1) * SURFACE_RADIUS;
      const x2 = Math.cos(a2) * SURFACE_RADIUS;
      const z2 = Math.sin(a2) * SURFACE_RADIUS;
      const t1 = -dataProvider.getLayerTopDepth(layer.id, x1, z1);
      const b1 = -dataProvider.getLayerBottomDepth(layer.id, x1, z1);
      const t2 = -dataProvider.getLayerTopDepth(layer.id, x2, z2);
      const b2 = -dataProvider.getLayerBottomDepth(layer.id, x2, z2);
      sidePositions.push(x1, t1, z1, x2, t2, z2, x1, b1, z1);
      sidePositions.push(x2, t2, z2, x2, b2, z2, x1, b1, z1);
      for (let k = 0; k < 6; k++) {
        const tint = 0.7 + Math.random() * 0.2;
        sideColors.push(color.r * tint, color.g * tint, color.b * tint);
      }
    }
    sideGeo.setAttribute('position', new THREE.Float32BufferAttribute(sidePositions, 3));
    sideGeo.setAttribute('color', new THREE.Float32BufferAttribute(sideColors, 3));
    sideGeo.computeVertexNormals();

    const merged = this.mergeGeometries([geometry, sideGeo]);
    return merged;
  }

  private mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    let indexOffset = 0;

    geometries.forEach(geo => {
      const pos = geo.attributes.position;
      const norm = geo.attributes.normal;
      const col = geo.attributes.color;
      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        if (norm) normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
        if (col) colors.push(col.getX(i), col.getY(i), col.getZ(i));
        else colors.push(1, 1, 1);
      }
      if (geo.index) {
        for (let i = 0; i < geo.index.count; i++) {
          indices.push(geo.index.getX(i) + indexOffset);
        }
      } else {
        for (let i = 0; i < pos.count; i++) {
          indices.push(i + indexOffset);
        }
      }
      indexOffset += pos.count;
    });

    const result = new THREE.BufferGeometry();
    result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    result.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    result.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    result.setIndex(indices);
    return result;
  }

  private createLayers(): void {
    this.layerMeshes.forEach(m => {
      this.scene.remove(m);
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    this.layerMeshes.clear();
    this.layerTransitionProgress.clear();

    const layers = dataProvider.getLayers();
    layers.forEach(layer => {
      const geometry = this.createLayerGeometry(layer);
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: layer.opacity,
        side: THREE.DoubleSide,
        roughness: 0.85,
        metalness: 0.05,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = layer.id;
      mesh.userData.layerId = layer.id;
      this.scene.add(mesh);
      this.layerMeshes.set(layer.id, mesh);
      this.layerTransitionProgress.set(layer.id, 1);
    });
  }

  private createMinerals(): void {
    if (this.mineralInstancedMesh) {
      this.scene.remove(this.mineralInstancedMesh);
      this.mineralInstancedMesh.geometry.dispose();
      (this.mineralInstancedMesh.material as THREE.Material).dispose();
    }
    this.mineralBaseData = [];
    this.mineralVisibleAlpha.clear();

    const minerals = dataProvider.getMinerals();
    const geometry = new THREE.IcosahedronGeometry(1, 3);
    const material = new THREE.MeshStandardMaterial({
      vertexColors: false,
      emissive: 0xffffff,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true
    });

    this.mineralInstancedMesh = new THREE.InstancedMesh(geometry, material, minerals.length);
    this.mineralInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const colors = new Float32Array(minerals.length * 3);

    minerals.forEach((m, index) => {
      const matrix = new THREE.Matrix4();
      const color = new THREE.Color(m.color);
      this.mineralDummy.position.set(m.position.x, m.position.y, m.position.z);
      this.mineralDummy.scale.setScalar(m.radius);
      this.mineralDummy.updateMatrix();
      matrix.copy(this.mineralDummy.matrix);

      this.mineralBaseData.push({
        id: m.id,
        matrix: matrix,
        color: color.clone(),
        baseScale: m.radius
      });
      this.mineralInstancedMesh!.setMatrixAt(index, matrix);
      this.mineralInstancedMesh!.setColorAt(index, color);
      this.mineralVisibleAlpha.set(m.id, 1);
    });

    this.mineralInstancedMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    for (let i = 0; i < minerals.length; i++) {
      const c = new THREE.Color(minerals[i].color);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    this.mineralInstancedMesh.instanceColor.needsUpdate = true;
    this.mineralInstancedMesh.instanceMatrix.needsUpdate = true;
    this.mineralInstancedMesh.name = 'minerals';
    this.scene.add(this.mineralInstancedMesh);
  }

  private createSectionIndicator(): void {
    this.sectionIndicator = new THREE.Group();
    const planeSize = SURFACE_RADIUS * 1.8;
    const planeGeoXZ = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const planeYZ = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, MAX_DEPTH * 1.2), planeMat.clone());
    planeYZ.rotation.y = Math.PI / 2;
    planeYZ.position.y = -MAX_DEPTH * 0.5;
    planeYZ.name = 'sectionYZ';

    const planeXY = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, MAX_DEPTH * 1.2), planeMat.clone());
    planeXY.rotation.x = Math.PI / 2;
    planeXY.rotation.z = Math.PI / 2;
    planeXY.position.y = -MAX_DEPTH * 0.5;
    planeXY.name = 'sectionXY';

    const planeXZ = new THREE.Mesh(planeGeoXZ, planeMat.clone());
    planeXZ.rotation.x = -Math.PI / 2;
    planeXZ.name = 'sectionXZ';

    this.sectionIndicator.add(planeYZ, planeXY, planeXZ);
    this.scene.add(this.sectionIndicator);
  }

  private setupEventListeners(): void {
    eventBus.on('depthRangeChanged', (min: number, max: number) => {
      this.minDepth = min;
      this.maxDepth = max;
    });

    eventBus.on('layerVisibilityChanged', (layerId: string, visible: boolean) => {
      dataProvider.setLayerVisibility(layerId, visible);
    });

    eventBus.on('regionChanged', (regionId: string) => {
      dataProvider.selectRegion(regionId);
      this.createLayers();
      this.createMinerals();
      this.broadcastStatistics();
    });

    eventBus.on('resetView', () => {
      this.camera.position.set(0, 120, 120);
      this.controls.target.set(0, -20, 0);
      this.controls.update();
    });
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private updateMouse(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    this.updateMouse(e);
    this.isMouseDown = true;
    this.mouseDownPos.set(this.mouse.x, this.mouse.y);
  }

  private onPointerMove(e: PointerEvent): void {
    this.updateMouse(e);
    if (this.draggingSection && this.sectionIndicator) {
      const planeYZ = this.sectionIndicator.children.find(c => c.name === 'sectionYZ');
      const planeXY = this.sectionIndicator.children.find(c => c.name === 'sectionXY');
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersect = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(dragPlane, intersect)) {
        if (this.sectionAxis === 'x') {
          this.sectionPosition = Math.max(-SURFACE_RADIUS + 2, Math.min(SURFACE_RADIUS - 2, intersect.x));
          if (planeYZ) planeYZ.position.x = this.sectionPosition;
        } else {
          this.sectionPosition = Math.max(-SURFACE_RADIUS + 2, Math.min(SURFACE_RADIUS - 2, intersect.z));
          if (planeXY) planeXY.position.z = this.sectionPosition;
        }
        this.sectionFade = 1;
        this.sectionActive = true;
      }
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (e.button !== 0) return;
    this.updateMouse(e);
    const didMove = this.mouse.distanceTo(this.mouseDownPos) > 0.02;
    this.isMouseDown = false;

    if (this.draggingSection) {
      this.draggingSection = false;
      this.sectionActive = false;
      return;
    }

    if (didMove) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.sectionIndicator) {
      const planes = [
        this.sectionIndicator.children.find(c => c.name === 'sectionYZ'),
        this.sectionIndicator.children.find(c => c.name === 'sectionXY')
      ].filter(Boolean) as THREE.Mesh[];
      const hits = this.raycaster.intersectObjects(planes, false);
      if (hits.length > 0) {
        this.draggingSection = true;
        const hitName = hits[0].object.name;
        this.sectionAxis = hitName === 'sectionYZ' ? 'x' : 'z';
        return;
      }
    }

    if (this.mineralInstancedMesh) {
      const hits = this.raycaster.intersectObject(this.mineralInstancedMesh, false);
      if (hits.length > 0 && hits[0].instanceId !== undefined) {
        const idx = hits[0].instanceId;
        if (this.mineralBaseData[idx]) {
          const id = this.mineralBaseData[idx].id;
          const mineral = dataProvider.getMineralById(id);
          if (mineral) {
            eventBus.emit('mineralClicked', mineral);
          }
        }
        return;
      }
    }

    if (this.surface) {
      const hits = this.raycaster.intersectObject(this.surface, false);
      if (hits.length > 0) {
        const point = hits[0].point;
        const dist = Math.sqrt(point.x * point.x + point.z * point.z);
        if (dist <= SURFACE_RADIUS) {
          this.drillMarkerTarget.set(point.x, 0.1, point.z);
          eventBus.emit('drillPositionChanged', { x: point.x, z: point.z });
        }
      }
    }
  }

  private updateDrillMarker(dt: number): void {
    if (!this.drillMarker) return;
    this.drillMarker.position.lerp(this.drillMarkerTarget, Math.min(1, dt * 10));
    const pulse = 1 + Math.sin(this.clock.elapsedTime * 3) * 0.15;
    this.drillMarker.scale.setScalar(pulse);
    const mat = this.drillMarker.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.55 + Math.sin(this.clock.elapsedTime * 2) * 0.2;
  }

  private updateLayerTransitions(dt: number): void {
    const layers = dataProvider.getLayers();
    layers.forEach(layer => {
      const mesh = this.layerMeshes.get(layer.id);
      if (!mesh) return;
      const current = this.layerTransitionProgress.get(layer.id) ?? 1;
      const target = layer.visible ? 1 : 0;
      const newVal = current + (target - current) * Math.min(1, dt * 1.5);
      this.layerTransitionProgress.set(layer.id, newVal);
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = layer.opacity * newVal;
      mesh.visible = newVal > 0.01;
    });
  }

  private updateMinerals(dt: number): void {
    if (!this.mineralInstancedMesh) return;
    const t = this.clock.elapsedTime;

    this.mineralBaseData.forEach((data, index) => {
      const id = data.id;
      const mineral = dataProvider.getMineralById(id);
      if (!mineral) return;

      const inDepth = mineral.depth >= this.minDepth && mineral.depth <= this.maxDepth;
      const layerVisible = dataProvider.getLayers().find(l => l.id === mineral.layerId)?.visible ?? true;
      const shouldBeVisible = inDepth && layerVisible;

      const currentAlpha = this.mineralVisibleAlpha.get(id) ?? 1;
      const targetAlpha = shouldBeVisible ? 1 : 0;
      const newAlpha = currentAlpha + (targetAlpha - currentAlpha) * Math.min(1, dt * 3);
      this.mineralVisibleAlpha.set(id, newAlpha);

      const pulse = 1 + Math.sin(t * (2 * Math.PI / mineral.pulsePeriod) + mineral.pulsePhase) * mineral.pulseAmplitude;
      const scale = data.baseScale * pulse;

      this.mineralDummy.position.copy(mineral.position as unknown as THREE.Vector3);
      this.mineralDummy.scale.setScalar(scale);
      this.mineralDummy.updateMatrix();
      this.mineralInstancedMesh!.setMatrixAt(index, this.mineralDummy.matrix);

      const grayCol = new THREE.Color(0x666666);
      const finalCol = data.color.clone().lerp(grayCol, 1 - newAlpha);
      this.mineralInstancedMesh!.setColorAt(index, finalCol);
    });

    this.mineralInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.mineralInstancedMesh.instanceColor) {
      this.mineralInstancedMesh.instanceColor.needsUpdate = true;
    }
  }

  private updateSectionIndicator(dt: number): void {
    if (!this.sectionIndicator) return;

    const targetFade = this.sectionActive || this.draggingSection ? 1 : 0;
    this.sectionFade += (targetFade - this.sectionFade) * Math.min(1, dt * 2.5);

    this.sectionIndicator.children.forEach(child => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (child.name === 'sectionYZ') {
        mat.opacity = 0.3 * this.sectionFade;
        mesh.visible = true;
      } else if (child.name === 'sectionXY') {
        mat.opacity = 0.3 * this.sectionFade;
        mesh.visible = true;
      } else if (child.name === 'sectionXZ') {
        mat.opacity = 0;
      }
    });
  }

  private applySectionClipping(): void {
    this.layerMeshes.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (this.sectionFade > 0.1) {
        const clipPlanes: THREE.Plane[] = [];
        if (this.sectionAxis === 'x') {
          const dir = this.camera.position.x > this.sectionPosition ? -1 : 1;
          clipPlanes.push(new THREE.Plane(new THREE.Vector3(dir, 0, 0), -dir * this.sectionPosition));
        } else {
          const dir = this.camera.position.z > this.sectionPosition ? -1 : 1;
          clipPlanes.push(new THREE.Plane(new THREE.Vector3(0, 0, dir), -dir * this.sectionPosition));
        }
        mat.clippingPlanes = clipPlanes;
        mat.clipShadows = true;
      } else {
        mat.clippingPlanes = [];
      }
    });
    this.renderer.localClippingEnabled = this.sectionFade > 0.1;
  }

  private broadcastStatistics(): void {
    eventBus.emit('statisticsUpdated', dataProvider.getStatistics());
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    const dt = Math.min(0.05, this.clock.getDelta());

    this.controls.update();
    this.updateDrillMarker(dt);
    this.updateLayerTransitions(dt);
    this.updateMinerals(dt);
    this.updateSectionIndicator(dt);
    this.applySectionClipping();

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.resizeHandler);
    this.renderer.domElement.removeEventListener('pointerdown', this.pointerDownHandler);
    this.renderer.domElement.removeEventListener('pointermove', this.pointerMoveHandler);
    this.renderer.domElement.removeEventListener('pointerup', this.pointerUpHandler);

    this.controls.dispose();
    this.renderer.dispose();

    this.layerMeshes.forEach(m => {
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });

    if (this.mineralInstancedMesh) {
      this.mineralInstancedMesh.geometry.dispose();
      (this.mineralInstancedMesh.material as THREE.Material).dispose();
    }

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export default SceneManager;
