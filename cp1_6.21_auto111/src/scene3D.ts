import * as THREE from 'three';
import { intersections, getFlowAtTime, getHighFlowIntersections, Intersection } from './trafficData';

export type ViewMode = 'top' | 'follow' | 'roam';

interface ColumnData {
  mesh: THREE.Mesh;
  glow: THREE.Mesh;
  intersection: Intersection;
  targetHeight: number;
  currentHeight: number;
  targetColor: THREE.Color;
  currentColor: THREE.Color;
}

export class Scene3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private columns: ColumnData[] = [];
  private streetLines: THREE.LineSegments | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private currentHour: number = 8;
  private transitionDuration: number = 0.5;
  private viewMode: ViewMode = 'top';
  private selectedColumn: ColumnData | null = null;
  private roamSpeed: number = 0.3;
  private roamTargets: Intersection[] = [];
  private roamIndex: number = 0;
  private roamProgress: number = 0;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private container: HTMLElement;
  private onColumnClick: ((intersection: Intersection) => void) | null = null;
  private isDragging: boolean = false;
  private previousMouse: { x: number; y: number } = { x: 0, y: 0 };
  private cameraAngleTheta: number = 0;
  private cameraAnglePhi: number = 0.5;
  private cameraDistance: number = 22;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0A1A);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 20, 0.01);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();

    this.buildScene();
    this.setupEventListeners();
  }

  private buildScene(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x22D3EE, 0.5, 50);
    pointLight.position.set(0, 10, 0);
    this.scene.add(pointLight);

    this.gridHelper = new THREE.GridHelper(30, 30, 0x1E293B, 0x1E293B);
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.5;
    this.gridHelper.position.y = -0.01;
    this.scene.add(this.gridHelper);

    this.createStreetNetwork();
    this.createColumns();
    this.updateRoamTargets();
  }

  private createStreetNetwork(): void {
    const points: THREE.Vector3[] = [];
    const sortedX = [...intersections].sort((a, b) => a.x - b.x);
    const sortedZ = [...intersections].sort((a, b) => a.z - b.z);

    const cols = 6;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const idx1 = row * cols + col;
        const idx2 = row * cols + col + 1;
        if (idx1 < intersections.length && idx2 < intersections.length) {
          const a = sortedZ[idx1];
          const b = sortedZ[idx2];
          points.push(new THREE.Vector3(a.x, 0.02, a.z));
          points.push(new THREE.Vector3(b.x, 0.02, b.z));
        }
      }
    }

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < 5 - 1; row++) {
        const idx1 = row * cols + col;
        const idx2 = (row + 1) * cols + col;
        if (idx1 < intersections.length && idx2 < intersections.length) {
          const a = sortedX[idx1];
          const b = sortedX[idx2];
          points.push(new THREE.Vector3(a.x, 0.02, a.z));
          points.push(new THREE.Vector3(b.x, 0.02, b.z));
        }
      }
    }

    for (let i = 0; i < intersections.length; i++) {
      for (let j = i + 1; j < intersections.length; j++) {
        const a = intersections[i];
        const b = intersections[j];
        const dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.z - b.z, 2));
        if (dist < 3.5 && Math.random() > 0.5) {
          points.push(new THREE.Vector3(a.x, 0.02, a.z));
          points.push(new THREE.Vector3(b.x, 0.02, b.z));
        }
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x22D3EE,
      transparent: true,
      opacity: 0.4
    });

    this.streetLines = new THREE.LineSegments(geometry, material);
    this.scene.add(this.streetLines);
  }

  private createColumns(): void {
    const baseGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1, 12);
    const glowBaseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1, 12);

    intersections.forEach((intersection) => {
      const initialFlow = getFlowAtTime(intersection, this.currentHour);
      const initialHeight = (initialFlow / 100) * 8;
      const initialColor = this.getFlowColor(initialFlow);

      const material = new THREE.MeshPhongMaterial({
        color: initialColor,
        emissive: initialColor,
        emissiveIntensity: 0.3,
        shininess: 50,
        transparent: true,
        opacity: 0.9
      });

      const mesh = new THREE.Mesh(baseGeometry.clone(), material);
      mesh.scale.y = initialHeight;
      mesh.position.set(intersection.x, initialHeight / 2, intersection.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.intersection = intersection;

      const glowMaterial = new THREE.MeshBasicMaterial({
        color: initialColor,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
      });

      const glow = new THREE.Mesh(glowBaseGeometry.clone(), glowMaterial);
      glow.scale.y = initialHeight * 1.1;
      glow.position.set(intersection.x, initialHeight / 2, intersection.z);

      this.scene.add(mesh);
      this.scene.add(glow);

      this.columns.push({
        mesh,
        glow,
        intersection,
        targetHeight: initialHeight,
        currentHeight: initialHeight,
        targetColor: initialColor.clone(),
        currentColor: initialColor.clone()
      });
    });

    baseGeometry.dispose();
    glowBaseGeometry.dispose();
  }

  private getFlowColor(flow: number): THREE.Color {
    const t = flow / 100;
    const green = new THREE.Color(0x22C55E);
    const yellow = new THREE.Color(0xEAB308);
    const red = new THREE.Color(0xEF4444);

    if (t < 0.5) {
      return green.clone().lerp(yellow, t * 2);
    } else {
      return yellow.clone().lerp(red, (t - 0.5) * 2);
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.renderer.domElement.addEventListener('wheel', this.onWheel.bind(this));
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0 || event.button === 2) {
      this.isDragging = true;
      this.previousMouse = { x: event.clientX, y: event.clientY };
    }
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.isDragging && this.viewMode !== 'follow') {
      const deltaX = event.clientX - this.previousMouse.x;
      const deltaY = event.clientY - this.previousMouse.y;

      this.cameraAngleTheta -= deltaX * 0.01;
      this.cameraAnglePhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.cameraAnglePhi + deltaY * 0.01));

      this.previousMouse = { x: event.clientX, y: event.clientY };
    }
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (this.viewMode !== 'follow') {
      this.cameraDistance = Math.max(8, Math.min(50, this.cameraDistance + event.deltaY * 0.02));
    }
  }

  private onClick(event: MouseEvent): void {
    if (this.viewMode === 'follow') return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.columns.map(c => c.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const columnData = this.columns.find(c => c.mesh === clickedMesh);
      if (columnData && this.onColumnClick) {
        this.selectedColumn = columnData;
        this.onColumnClick(columnData.intersection);
      }
    }
  }

  public setOnColumnClick(callback: (intersection: Intersection) => void): void {
    this.onColumnClick = callback;
  }

  public setTime(hour: number): void {
    this.currentHour = hour;

    this.columns.forEach((column) => {
      const flow = getFlowAtTime(column.intersection, hour);
      column.targetHeight = (flow / 100) * 8;
      column.targetColor = this.getFlowColor(flow);
    });

    this.updateRoamTargets();
  }

  private updateRoamTargets(): void {
    this.roamTargets = getHighFlowIntersections(this.currentHour, 50);
    if (this.roamTargets.length < 3) {
      this.roamTargets = intersections.slice(0, 10);
    }
  }

  public setViewMode(mode: ViewMode): void {
    this.viewMode = mode;

    if (mode === 'top') {
      this.cameraDistance = 22;
      this.cameraAnglePhi = 0.5;
      this.cameraAngleTheta = 0;
      this.cameraTarget.set(0, 0, 0);
    } else if (mode === 'roam') {
      this.roamIndex = 0;
      this.roamProgress = 0;
      this.updateRoamTargets();
    }
  }

  public getViewMode(): ViewMode {
    return this.viewMode;
  }

  public followIntersection(intersection: Intersection): void {
    const column = this.columns.find(c => c.intersection.id === intersection.id);
    if (column) {
      this.selectedColumn = column;
    }
  }

  public update(deltaTime: number): void {
    this.columns.forEach((column) => {
      const lerpFactor = Math.min(1, deltaTime / this.transitionDuration);

      column.currentHeight += (column.targetHeight - column.currentHeight) * lerpFactor;

      column.currentColor.lerp(column.targetColor, lerpFactor);

      column.mesh.scale.y = column.currentHeight;
      column.mesh.position.y = column.currentHeight / 2;

      const mat = column.mesh.material as THREE.MeshPhongMaterial;
      mat.color.copy(column.currentColor);
      mat.emissive.copy(column.currentColor);

      column.glow.scale.y = column.currentHeight * 1.1;
      column.glow.position.y = column.currentHeight / 2;
      const glowMat = column.glow.material as THREE.MeshBasicMaterial;
      glowMat.color.copy(column.currentColor);

      if (this.selectedColumn === column) {
        const pulseScale = 1 + Math.sin(performance.now() * 0.003) * 0.05;
        glowMat.opacity = 0.25 * pulseScale;
      }
    });

    this.updateCamera(deltaTime);
    this.renderer.render(this.scene, this.camera);
  }

  private updateCamera(deltaTime: number): void {
    if (this.viewMode === 'top') {
      const x = this.cameraDistance * Math.sin(this.cameraAnglePhi) * Math.sin(this.cameraAngleTheta);
      const y = this.cameraDistance * Math.cos(this.cameraAnglePhi);
      const z = this.cameraDistance * Math.sin(this.cameraAnglePhi) * Math.cos(this.cameraAngleTheta);

      this.camera.position.lerp(
        new THREE.Vector3(
          this.cameraTarget.x + x,
          this.cameraTarget.y + y,
          this.cameraTarget.z + z
        ),
        0.1
      );
      this.camera.lookAt(this.cameraTarget);
    } else if (this.viewMode === 'follow' && this.selectedColumn) {
      const targetPos = new THREE.Vector3(
        this.selectedColumn.intersection.x + 3,
        this.selectedColumn.currentHeight + 3,
        this.selectedColumn.intersection.z + 3
      );
      this.camera.position.lerp(targetPos, 0.05);
      this.camera.lookAt(
        this.selectedColumn.intersection.x,
        this.selectedColumn.currentHeight / 2,
        this.selectedColumn.intersection.z
      );
    } else if (this.viewMode === 'roam') {
      if (this.roamTargets.length >= 2) {
        this.roamProgress += this.roamSpeed * deltaTime * 0.3;

        if (this.roamProgress >= 1) {
          this.roamProgress = 0;
          this.roamIndex = (this.roamIndex + 1) % this.roamTargets.length;
        }

        const currentTarget = this.roamTargets[this.roamIndex];
        const nextIndex = (this.roamIndex + 1) % this.roamTargets.length;
        const nextTarget = this.roamTargets[nextIndex];

        const t = this.easeInOut(this.roamProgress);
        const camX = currentTarget.x + (nextTarget.x - currentTarget.x) * t;
        const camZ = currentTarget.z + (nextTarget.z - currentTarget.z) * t;

        const radius = 6;
        const angle = performance.now() * 0.0005;
        this.camera.position.set(
          camX + Math.cos(angle) * radius,
          8,
          camZ + Math.sin(angle) * radius
        );
        this.camera.lookAt(camX, 2, camZ);
      }
    }
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  public dispose(): void {
    this.columns.forEach(column => {
      column.mesh.geometry.dispose();
      (column.mesh.material as THREE.Material).dispose();
      column.glow.geometry.dispose();
      (column.glow.material as THREE.Material).dispose();
    });
    if (this.streetLines) {
      this.streetLines.geometry.dispose();
      (this.streetLines.material as THREE.Material).dispose();
    }
    if (this.gridHelper) {
      this.gridHelper.geometry.dispose();
      (this.gridHelper.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  public getCurrentHour(): number {
    return this.currentHour;
  }
}
