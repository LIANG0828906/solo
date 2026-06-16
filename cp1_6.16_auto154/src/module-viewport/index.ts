import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BuildingBlock, WindParams, SimulationResult, Streamline, VelocityGrid } from '../types';

export class ViewportModule {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private gridGroup: THREE.Group;
  private buildingsGroup: THREE.Group;
  private windArrowGroup: THREE.Group;
  private streamlinesGroup: THREE.Group;
  private contourGroup: THREE.Group;
  private handlesGroup: THREE.Group;

  private buildingMeshes: Map<string, THREE.Mesh> = new Map();
  private labelSprites: Map<string, THREE.Sprite> = new Map();
  private dragPlane: THREE.Plane;

  private onBuildingChange?: (id: string, updates: Partial<BuildingBlock>) => void;
  private onBuildingClick?: (id: string | null) => void;
  private onMouseMoveGround?: (x: number, z: number) => void;
  private onGroundClick?: (x: number, z: number) => void;

  private isDragging = false;
  private dragTarget: THREE.Mesh | null = null;
  private dragType: 'move' | 'resize-x' | 'resize-z' | 'resize-h' | null = null;
  private dragStartWorld = new THREE.Vector3();
  private dragStartBuilding: BuildingBlock | null = null;
  private offset = new THREE.Vector3();
  private handleMeshes: Map<string, THREE.Mesh> = new Map();
  private hoveredHandle: string | null = null;

  private animationId: number = 0;
  private fpsCallback?: (fps: number) => void;
  private frameCount = 0;
  private lastFpsTime = performance.now();
  private currentWindSpeed = 5;

  constructor(container: HTMLElement) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A1929);
    this.scene.fog = new THREE.Fog(0x0A1929, 25, 60);

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    this.camera.position.set(16, 18, 16);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.set(0, 0, 0);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.gridGroup = new THREE.Group();
    this.buildingsGroup = new THREE.Group();
    this.windArrowGroup = new THREE.Group();
    this.streamlinesGroup = new THREE.Group();
    this.contourGroup = new THREE.Group();
    this.handlesGroup = new THREE.Group();

    this.scene.add(this.gridGroup);
    this.scene.add(this.buildingsGroup);
    this.scene.add(this.windArrowGroup);
    this.scene.add(this.streamlinesGroup);
    this.scene.add(this.contourGroup);
    this.scene.add(this.handlesGroup);

    this.setupLights();
    this.setupGroundGrid();
    this.setupBoundary();
    this.setupWindArrow();
    this.bindEvents();
    this.animate();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x54728A, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    dirLight.position.set(10, 18, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x4FC3F7, 0.3);
    fillLight.position.set(-8, 10, -6);
    this.scene.add(fillLight);
  }

  private setupGroundGrid(): void {
    const planeGeo = new THREE.PlaneGeometry(22, 22);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x14283D,
      roughness: 0.9,
      metalness: 0.1,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    plane.name = 'ground';
    this.gridGroup.add(plane);

    const gridSize = 20;
    const gridDiv = 20;

    const thinGrid = new THREE.GridHelper(gridSize, gridDiv, 0x2A4460, 0x1E3450);
    thinGrid.position.y = 0.005;
    (thinGrid.material as THREE.Material).opacity = 0.7;
    (thinGrid.material as THREE.Material).transparent = true;
    this.gridGroup.add(thinGrid);

    const thickGrid = new THREE.GridHelper(gridSize, 4, 0x3D5C7A, 0x3D5C7A);
    thickGrid.position.y = 0.006;
    (thickGrid.material as THREE.Material).opacity = 0.5;
    (thickGrid.material as THREE.Material).transparent = true;
    this.gridGroup.add(thickGrid);

    const checkersTexture = this.createCheckerTexture();
    const checkerPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshBasicMaterial({
        map: checkersTexture,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      })
    );
    checkerPlane.rotation.x = -Math.PI / 2;
    checkerPlane.position.y = 0.01;
    this.gridGroup.add(checkerPlane);
  }

  private createCheckerTexture(): THREE.Texture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cellSize = size / 20;
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#FFFFFF' : '#80A0C0';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
  }

  private setupBoundary(): void {
    const geo = new THREE.BufferGeometry();
    const half = 10;
    const h = 8;
    const verts: number[] = [];

    const edges = [
      [-half, 0, -half, half, 0, -half],
      [half, 0, -half, half, 0, half],
      [half, 0, half, -half, 0, half],
      [-half, 0, half, -half, 0, -half],
      [-half, h, -half, half, h, -half],
      [half, h, -half, half, h, half],
      [half, h, half, -half, h, half],
      [-half, h, half, -half, h, -half],
      [-half, 0, -half, -half, h, -half],
      [half, 0, -half, half, h, -half],
      [half, 0, half, half, h, half],
      [-half, 0, half, -half, h, half],
    ];

    for (const e of edges) {
      const dashCount = 12;
      for (let d = 0; d < dashCount; d += 2) {
        const t1 = d / dashCount;
        const t2 = (d + 1) / dashCount;
        verts.push(
          e[0] + (e[3] - e[0]) * t1, e[1] + (e[4] - e[1]) * t1, e[2] + (e[5] - e[2]) * t1,
          e[0] + (e[3] - e[0]) * t2, e[1] + (e[4] - e[1]) * t2, e[2] + (e[5] - e[2]) * t2
        );
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x4FC3F7, transparent: true, opacity: 0.5 });
    const lines = new THREE.LineSegments(geo, mat);
    this.gridGroup.add(lines);
  }

  private setupWindArrow(): void {
    const group = new THREE.Group();

    const shaftLen = 3;
    const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, shaftLen, 12);
    const shaftMat = new THREE.MeshBasicMaterial({
      color: 0x4FC3F7,
      transparent: true,
      opacity: 0.85,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.x = -shaftLen / 2;
    group.add(shaft);

    const arrowGeo = new THREE.ConeGeometry(0.25, 0.6, 12);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x81D4FA,
      transparent: true,
      opacity: 0.9,
    });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.z = -Math.PI / 2;
    arrow.position.x = 0.3;
    group.add(arrow);

    const ringGeo = new THREE.RingGeometry(1.2, 1.25, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4FC3F7,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    group.position.y = 5.5;
    this.windArrowGroup.add(group);
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;

    window.addEventListener('resize', this.onResize);

    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('pointerleave', this.onPointerUp);
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private updateMouse(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerMove = (e: PointerEvent): void => {
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const hit = this.rayIntersectGround();
    if (hit) {
      this.onMouseMoveGround?.(hit.x, hit.z);
    }

    if (this.isDragging && this.dragTarget && this.dragStartBuilding) {
      const planeHit = this.rayPlaneIntersect(this.dragPlane);
      if (planeHit) {
        this.handleDrag(planeHit);
      }
      return;
    }

    const handleHit = this.raycaster.intersectObjects(Array.from(this.handleMeshes.values()));
    if (handleHit.length > 0) {
      const name = handleHit[0].object.name;
      if (name !== this.hoveredHandle) {
        this.setHandleHover(name);
      }
    } else if (this.hoveredHandle) {
      this.setHandleHover(null);
    }
  };

  private setHandleHover(name: string | null): void {
    if (this.hoveredHandle && this.handleMeshes.has(this.hoveredHandle)) {
      const mat = this.handleMeshes.get(this.hoveredHandle)!.material as THREE.MeshStandardMaterial;
      mat.color.setHex(0xFFC107);
      mat.emissive.setHex(0x000000);
    }
    this.hoveredHandle = name;
    if (name && this.handleMeshes.has(name)) {
      const mat = this.handleMeshes.get(name)!.material as THREE.MeshStandardMaterial;
      mat.emissive.setHex(0xFFA000);
      mat.emissiveIntensity = 0.5;
    }
    this.updateCursor();
  }

  private updateCursor(): void {
    const dom = this.renderer.domElement;
    if (this.hoveredHandle === 'move' || this.dragType === 'move') {
      dom.style.cursor = 'move';
    } else if (this.hoveredHandle === 'resize-x' || this.dragType === 'resize-x') {
      dom.style.cursor = 'ew-resize';
    } else if (this.hoveredHandle === 'resize-z' || this.dragType === 'resize-z') {
      dom.style.cursor = 'ns-resize';
    } else if (this.hoveredHandle === 'resize-h' || this.dragType === 'resize-h') {
      dom.style.cursor = 'ns-resize';
    } else if (this.isDragging) {
      dom.style.cursor = 'grabbing';
    } else {
      dom.style.cursor = 'default';
    }
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const handleHit = this.raycaster.intersectObjects(Array.from(this.handleMeshes.values()));
    if (handleHit.length > 0) {
      const name = handleHit[0].object.name;
      if (name === 'move') this.dragType = 'move';
      else if (name === 'resize-x') this.dragType = 'resize-x';
      else if (name === 'resize-z') this.dragType = 'resize-z';
      else if (name === 'resize-h') this.dragType = 'resize-h';

      this.isDragging = true;
      this.dragTarget = handleHit[0].object as THREE.Mesh;
      this.controls.enabled = false;

      const planeHit = this.rayPlaneIntersect(this.dragType === 'resize-h'
        ? new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
        : this.dragPlane);

      if (planeHit) {
        this.dragStartWorld.copy(planeHit);
      }
      this.updateCursor();
      return;
    }

    const buildingHit = this.raycaster.intersectObjects(Array.from(this.buildingMeshes.values()));
    if (buildingHit.length > 0) {
      const mesh = buildingHit[0].object as THREE.Mesh;
      const id = mesh.userData.buildingId;
      this.onBuildingClick?.(id);
      this.isDragging = true;
      this.dragTarget = mesh;
      this.dragType = 'move';
      this.controls.enabled = false;
      const planeHit = this.rayPlaneIntersect(this.dragPlane);
      if (planeHit && this.dragStartBuilding) {
        this.offset.copy(planeHit).sub(new THREE.Vector3(
          this.dragStartBuilding.x,
          0,
          this.dragStartBuilding.z
        ));
      }
      this.updateCursor();
      return;
    }

    const groundHit = this.rayIntersectGround();
    if (groundHit) {
      this.onBuildingClick?.(null);
      if (e.detail === 2) {
        this.onGroundClick?.(groundHit.x, groundHit.z);
      }
    }
  };

  private onPointerUp = (): void => {
    this.isDragging = false;
    this.dragTarget = null;
    this.dragType = null;
    this.dragStartBuilding = null;
    this.controls.enabled = true;
    this.updateCursor();
  };

  private rayIntersectGround(): THREE.Vector3 | null {
    const ground = this.gridGroup.children.find((c) => c.name === 'ground');
    if (!ground) return null;
    const hits = this.raycaster.intersectObject(ground);
    if (hits.length > 0) return hits[0].point;
    return null;
  }

  private rayPlaneIntersect(plane: THREE.Plane): THREE.Vector3 | null {
    const point = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(plane, point);
    return hit ? point : null;
  }

  private handleDrag(current: THREE.Vector3): void {
    if (!this.dragStartBuilding || !this.onBuildingChange) return;

    const dx = current.x - this.dragStartWorld.x;
    const dz = current.z - this.dragStartWorld.z;
    const dy = current.y - this.dragStartWorld.y;
    const id = this.dragStartBuilding.id;

    if (this.dragType === 'move') {
      const newX = this.clamp(this.dragStartBuilding.x + dx - this.offset.x, -9, 9);
      const newZ = this.clamp(this.dragStartBuilding.z + dz - this.offset.z, -9, 9);
      this.onBuildingChange(id, { x: newX, z: newZ });
    } else if (this.dragType === 'resize-x') {
      const newW = this.clamp(this.dragStartBuilding.width + dx * 2, 0.8, 8);
      this.onBuildingChange(id, { width: newW });
    } else if (this.dragType === 'resize-z') {
      const newD = this.clamp(this.dragStartBuilding.depth + dz * 2, 0.8, 8);
      this.onBuildingChange(id, { depth: newD });
    } else if (this.dragType === 'resize-h') {
      const dist = current.distanceTo(new THREE.Vector3(
        this.dragStartBuilding.x,
        0,
        this.dragStartBuilding.z
      ));
      const startDist = this.dragStartWorld.distanceTo(new THREE.Vector3(
        this.dragStartBuilding.x,
        0,
        this.dragStartBuilding.z
      ));
      const newH = this.clamp(this.dragStartBuilding.height + (dist - startDist) * 0.8, 0.5, 10);
      this.onBuildingChange(id, { height: newH });
    }
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  setBuildingChangeCallback(cb: (id: string, updates: Partial<BuildingBlock>) => void): void {
    this.onBuildingChange = cb;
  }

  setBuildingClickCallback(cb: (id: string | null) => void): void {
    this.onBuildingClick = cb;
  }

  setMouseMoveCallback(cb: (x: number, z: number) => void): void {
    this.onMouseMoveGround = cb;
  }

  setGroundDblClickCallback(cb: (x: number, z: number) => void): void {
    this.onGroundClick = cb;
  }

  setFPSCallback(cb: (fps: number) => void): void {
    this.fpsCallback = cb;
  }

  setBuildings(buildings: BuildingBlock[], selectedId: string | null): void {
    const existingIds = new Set(this.buildingMeshes.keys());
    const newIds = new Set(buildings.map((b) => b.id));

    for (const id of existingIds) {
      if (!newIds.has(id)) {
        const mesh = this.buildingMeshes.get(id)!;
        this.buildingsGroup.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.buildingMeshes.delete(id);

        const sprite = this.labelSprites.get(id);
        if (sprite) {
          this.buildingsGroup.remove(sprite);
          sprite.material.dispose();
          (sprite.material as THREE.SpriteMaterial).map?.dispose();
          this.labelSprites.delete(id);
        }
      }
    }

    for (const b of buildings) {
      if (!this.buildingMeshes.has(b.id)) {
        this.createBuildingMesh(b);
      }
      this.updateBuildingMesh(b, b.id === selectedId);
    }

    this.updateHandles(buildings.find((b) => b.id === selectedId) || null);
  }

  private createBuildingMesh(b: BuildingBlock): void {
    const geo = new THREE.BoxGeometry(b.width, b.height, b.depth);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(b.color),
      roughness: 0.55,
      metalness: 0.15,
      transparent: true,
      opacity: 0.92,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.buildingId = b.id;

    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1A237E, transparent: true, opacity: 0.5 });
    const wire = new THREE.LineSegments(edges, lineMat);
    mesh.add(wire);

    this.buildingMeshes.set(b.id, mesh);
    this.buildingsGroup.add(mesh);

    const sprite = this.createLabelSprite(b);
    this.labelSprites.set(b.id, sprite);
    this.buildingsGroup.add(sprite);
  }

  private createLabelSprite(b: BuildingBlock): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(10, 25, 41, 0.88)';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 3;
    this.roundRect(ctx, 4, 4, 248, 72, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E3F2FD';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const txt = `${b.width.toFixed(1)}×${b.depth.toFixed(1)}×${b.height.toFixed(1)}m`;
    ctx.fillText(txt, 128, 40);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3, 0.95, 1);
    sprite.renderOrder = 999;
    return sprite;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private updateLabelSprite(b: BuildingBlock): void {
    const sprite = this.labelSprites.get(b.id);
    if (!sprite) return;

    const canvas = (sprite.material as THREE.SpriteMaterial).map as THREE.CanvasTexture;
    const ctx = canvas.image.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.image.width, canvas.image.height);
    ctx.fillStyle = 'rgba(10, 25, 41, 0.88)';
    ctx.strokeStyle = '#4FC3F7';
    ctx.lineWidth = 3;
    this.roundRect(ctx, 4, 4, 248, 72, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E3F2FD';
    ctx.font = 'bold 26px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const txt = `${b.width.toFixed(1)}×${b.depth.toFixed(1)}×${b.height.toFixed(1)}m`;
    ctx.fillText(txt, 128, 40);
    canvas.needsUpdate = true;

    sprite.position.set(b.x, b.height + 1.1, b.z);
  }

  private updateBuildingMesh(b: BuildingBlock, selected: boolean): void {
    const mesh = this.buildingMeshes.get(b.id);
    if (!mesh) return;

    mesh.geometry.dispose();
    mesh.geometry = new THREE.BoxGeometry(b.width, b.height, b.depth);
    mesh.position.set(b.x, b.height / 2, b.z);

    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.color.set(b.color);

    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const wire = mesh.children[0] as THREE.LineSegments;
    wire.geometry.dispose();
    wire.geometry = edges;
    const wireMat = wire.material as THREE.LineBasicMaterial;
    wireMat.color.set(selected ? 0x4FC3F7 : 0x1A237E);

    if (selected) {
      mat.emissive.set(0x1976D2);
      mat.emissiveIntensity = 0.25;
    } else {
      mat.emissive.set(0x000000);
      mat.emissiveIntensity = 0;
    }

    this.updateLabelSprite(b);
  }

  private updateHandles(b: BuildingBlock | null): void {
    this.handlesGroup.clear();
    this.handleMeshes.clear();
    this.hoveredHandle = null;

    if (!b) return;

    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xFFC107,
      emissive: 0x000000,
      metalness: 0.3,
      roughness: 0.4,
    });

    const moveGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.12, 16);
    const moveMesh = new THREE.Mesh(moveGeo, handleMat.clone());
    moveMesh.position.set(b.x, 0.08, b.z);
    moveMesh.name = 'move';
    this.handlesGroup.add(moveMesh);
    this.handleMeshes.set('move', moveMesh);

    const xGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const xMesh = new THREE.Mesh(xGeo, handleMat.clone());
    xMesh.position.set(b.x + b.width / 2, b.height / 2, b.z);
    xMesh.name = 'resize-x';
    this.handlesGroup.add(xMesh);
    this.handleMeshes.set('resize-x', xMesh);

    const zMesh = new THREE.Mesh(xGeo, handleMat.clone());
    zMesh.position.set(b.x, b.height / 2, b.z + b.depth / 2);
    zMesh.name = 'resize-z';
    this.handlesGroup.add(zMesh);
    this.handleMeshes.set('resize-z', zMesh);

    const hMesh = new THREE.Mesh(xGeo, handleMat.clone());
    hMesh.position.set(b.x, b.height + 0.15, b.z);
    hMesh.name = 'resize-h';
    this.handlesGroup.add(hMesh);
    this.handleMeshes.set('resize-h', hMesh);
  }

  setDragStartBuilding(b: BuildingBlock): void {
    this.dragStartBuilding = { ...b };
    this.dragStartWorld.set(b.x, 0, b.z);
  }

  updateWindArrow(params: WindParams): void {
    const group = this.windArrowGroup.children[0];
    if (!group) return;
    this.currentWindSpeed = params.speed;
    const lenFactor = 0.5 + (params.speed / 20) * 1.2;
    group.scale.set(lenFactor, 1, lenFactor);
    group.rotation.y = -(params.direction * Math.PI) / 180;
  }

  private getVelocityColor(ratio: number): THREE.Color {
    const t = Math.max(0, Math.min(1, ratio));
    const r = Math.round(30 + (229 - 30) * t);
    const g = Math.round(136 + (57 - 136) * t);
    const b = Math.round(229 + (53 - 229) * t);
    return new THREE.Color(`rgb(${r},${g},${b})`);
  }

  renderStreamlines(streamlines: Streamline[], baseSpeed: number): void {
    this.clearStreamlines();

    const maxSpeed = Math.max(baseSpeed * 1.5, 0.001);
    const positions: number[] = [];
    const colors: number[] = [];

    for (const sl of streamlines) {
      for (let i = 0; i < sl.points.length - 1; i++) {
        const p1 = sl.points[i];
        const p2 = sl.points[i + 1];
        positions.push(p1.x, 0.15, p1.z, p2.x, 0.15, p2.z);

        const ratio = sl.velocity / maxSpeed;
        const c = this.getVelocityColor(ratio);
        colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
      }
    }

    if (positions.length === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      linewidth: 1,
    });

    const lines = new THREE.LineSegments(geo, mat);
    lines.name = 'streamlines';
    this.streamlinesGroup.add(lines);
  }

  renderContour(grid: VelocityGrid, baseSpeed: number): void {
    this.clearContour();

    const maxSpeed = Math.max(baseSpeed * 1.5, 0.001);
    const geo = new THREE.BufferGeometry();
    const verts: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < grid.sizeX - 1; i++) {
      for (let j = 0; j < grid.sizeZ - 1; j++) {
        const x0 = grid.minX + i * grid.step;
        const z0 = grid.minZ + j * grid.step;
        const x1 = x0 + grid.step;
        const z1 = z0 + grid.step;

        const p = [
          [x0, z0, grid.velocities[i][j].magnitude],
          [x1, z0, grid.velocities[i + 1][j].magnitude],
          [x1, z1, grid.velocities[i + 1][j + 1].magnitude],
          [x0, z1, grid.velocities[i][j + 1].magnitude],
        ];

        const idxBase = verts.length / 3;
        for (const [vx, vz, vmag] of p) {
          verts.push(vx, 0.1, vz);
          const c = this.getVelocityColor(vmag / maxSpeed);
          colors.push(c.r, c.g, c.b);
        }

        indices.push(idxBase, idxBase + 1, idxBase + 2);
        indices.push(idxBase, idxBase + 2, idxBase + 3);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'contour';
    this.contourGroup.add(mesh);
  }

  clearStreamlines(): void {
    while (this.streamlinesGroup.children.length > 0) {
      const obj = this.streamlinesGroup.children[0];
      this.streamlinesGroup.remove(obj);
      if ((obj as THREE.LineSegments).geometry) (obj as THREE.LineSegments).geometry.dispose();
      if ((obj as THREE.LineSegments).material) {
        const mat = (obj as THREE.LineSegments).material as THREE.Material;
        mat.dispose();
      }
    }
  }

  clearContour(): void {
    while (this.contourGroup.children.length > 0) {
      const obj = this.contourGroup.children[0];
      this.contourGroup.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material as THREE.Material;
        mat.dispose();
      }
    }
  }

  showVisualization(mode: 'streamline' | 'contour', result: SimulationResult | null): void {
    this.clearStreamlines();
    this.clearContour();

    if (!result) return;

    if (mode === 'streamline') {
      this.renderStreamlines(result.streamlines, result.avgVelocity);
    } else {
      this.renderContour(result.velocityGrid, result.avgVelocity);
    }
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();

    const time = performance.now() * 0.001;
    this.windArrowGroup.rotation.y = Math.sin(time * (0.4 + this.currentWindSpeed * 0.03)) * 0.05;

    this.renderer.render(this.scene, this.camera);

    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.fpsCallback?.(fps);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  };

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('pointerleave', this.onPointerUp);
    this.renderer.dispose();
    this.controls.dispose();
    if (this.container.contains(dom)) this.container.removeChild(dom);
  }
}
