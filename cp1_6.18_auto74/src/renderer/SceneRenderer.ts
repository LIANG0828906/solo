import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { WindDataPoint, PressureLayer, VisualizationMode, HoverInfo } from '../shared/types';

const WIND_SPEED_LOW = new THREE.Color('#4ECDC4');
const WIND_SPEED_HIGH = new THREE.Color('#FF6B6B');
const PRESSURE_COLOR = 0x6BCB77;
const PRESSURE_OPACITY = 0.3;

interface SceneRendererOptions {
  container: HTMLElement;
  onHover?: (info: HoverInfo) => void;
}

export class SceneRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private animationId: number = 0;
  private container: HTMLElement;
  private onHover: (info: HoverInfo) => void;

  private particles: THREE.Points | null = null;
  private pressureMeshes: THREE.Group = new THREE.Group();
  private slicePlane: THREE.Group = new THREE.Group();
  private gridHelper: THREE.GridHelper | null = null;
  private heatmapParticles: THREE.Points | null = null;
  private arrowGroup: THREE.Group = new THREE.Group();

  private windPoints: WindDataPoint[] = [];
  private pressureLayers: PressureLayer[] = [];
  private currentMode: VisualizationMode = 'vector';
  private altitudeLevel: number = 0.5;
  private meta: { maxWindSpeed: number; altitudeRange: [number, number] } = {
    maxWindSpeed: 50,
    altitudeRange: [0, 15000],
  };

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private particleGeometry: THREE.BufferGeometry | null = null;

  constructor(options: SceneRendererOptions) {
    this.container = options.container;
    this.onHover = options.onHover || (() => {});

    this.scene = new THREE.Scene();
    this.scene.background = this.createGradientBackground();

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(60, 40, 60);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.9;
    this.controls.rotateSpeed = 0.7;
    this.controls.minDistance = 15;
    this.controls.maxDistance = 200;
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.5;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points!.threshold = 1.5;
    this.mouse = new THREE.Vector2(-999, -999);

    this.scene.add(this.pressureMeshes);
    this.scene.add(this.slicePlane);
    this.scene.add(this.arrowGroup);

    this.addGrid();
    this.addLights();

    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('resize', this.onResize.bind(this));

    this.animate();
  }

  private createGradientBackground(): THREE.Color {
    return new THREE.Color('#050515');
  }

  private addGrid(): void {
    const grid = new THREE.GridHelper(100, 50, 0x444466, 0x222244);
    grid.position.y = -25;
    (grid.material as THREE.Material).opacity = 0.2;
    (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);
    this.gridHelper = grid;
  }

  private addLights(): void {
    const ambient = new THREE.AmbientLight(0x404060, 1.5);
    this.scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(50, 80, 50);
    this.scene.add(directional);
  }

  setData(windPoints: WindDataPoint[], pressureLayers: PressureLayer[], meta: { maxWindSpeed: number; altitudeRange: [number, number] }): void {
    this.windPoints = windPoints;
    this.pressureLayers = pressureLayers;
    this.meta = meta;
    this.rebuildScene();
  }

  private rebuildScene(): void {
    this.clearSceneObjects();
    this.buildParticles();
    this.buildPressureLayers();
    this.buildSlicePlane();
    this.applyMode();
  }

  private clearSceneObjects(): void {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles.geometry.dispose();
      (this.particles.material as THREE.Material).dispose();
      this.particles = null;
    }
    if (this.heatmapParticles) {
      this.scene.remove(this.heatmapParticles);
      this.heatmapParticles.geometry.dispose();
      (this.heatmapParticles.material as THREE.Material).dispose();
      this.heatmapParticles = null;
    }
    while (this.pressureMeshes.children.length > 0) {
      const child = this.pressureMeshes.children[0];
      this.pressureMeshes.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    while (this.slicePlane.children.length > 0) {
      const child = this.slicePlane.children[0];
      this.slicePlane.remove(child);
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
    while (this.arrowGroup.children.length > 0) {
      const child = this.arrowGroup.children[0];
      this.arrowGroup.remove(child);
      if (child instanceof THREE.ArrowHelper) {
        child.dispose();
      }
    }
    this.particleGeometry = null;
  }

  private buildParticles(): void {
    const count = this.windPoints.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = this.windPoints[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      const t = Math.min(p.speed / this.meta.maxWindSpeed, 1);
      const color = new THREE.Color().lerpColors(WIND_SPEED_LOW, WIND_SPEED_HIGH, t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 2 + t * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geometry, material);
    this.particleGeometry = geometry;
    this.scene.add(this.particles);

    this.buildHeatmapParticles();
  }

  private buildHeatmapParticles(): void {
    if (!this.particleGeometry) return;
    const count = this.windPoints.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const p = this.windPoints[i];
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      const t = Math.min(p.speed / this.meta.maxWindSpeed, 1);
      const r = t;
      const g = 1 - Math.abs(t - 0.5) * 2;
      const b = 1 - t;
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.heatmapParticles = new THREE.Points(geometry, material);
    this.heatmapParticles.visible = false;
    this.scene.add(this.heatmapParticles);
  }

  private buildPressureLayers(): void {
    for (const layer of this.pressureLayers) {
      if (layer.points.length < 3) continue;

      const geometry = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const center = new THREE.Vector3();

      for (const pt of layer.points) {
        center.x += pt.x;
        center.y += pt.y;
        center.z += pt.z;
      }
      center.divideScalar(layer.points.length);

      for (let i = 0; i < layer.points.length; i++) {
        const curr = layer.points[i];
        const next = layer.points[(i + 1) % layer.points.length];
        vertices.push(center.x, center.y, center.z);
        vertices.push(curr.x, curr.y, curr.z);
        vertices.push(next.x, next.y, next.z);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhongMaterial({
        color: PRESSURE_COLOR,
        transparent: true,
        opacity: PRESSURE_OPACITY,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { type: 'pressure', altitude: layer.altitude, pressure: layer.pressure };
      this.pressureMeshes.add(mesh);
    }
  }

  private buildSlicePlane(): void {
    this.updateSlicePlanePosition();
  }

  private updateSlicePlanePosition(): void {
    while (this.slicePlane.children.length > 0) {
      const child = this.slicePlane.children[0];
      this.slicePlane.remove(child);
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }

    const y = -25 + this.altitudeLevel * 50;

    const planeGeo = new THREE.PlaneGeometry(100, 100);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x4ecdc4,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = y;
    this.slicePlane.add(plane);

    const edgeGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(100, 100));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x4ecdc4, linewidth: 2, transparent: true, opacity: 0.5 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.rotation.x = -Math.PI / 2;
    edges.position.y = y;
    this.slicePlane.add(edges);
  }

  private buildArrowField(): void {
    while (this.arrowGroup.children.length > 0) {
      const child = this.arrowGroup.children[0];
      this.arrowGroup.remove(child);
      if (child instanceof THREE.ArrowHelper) {
        child.dispose();
      }
    }

    const step = Math.max(1, Math.floor(this.windPoints.length / 200));
    for (let i = 0; i < this.windPoints.length; i += step) {
      const p = this.windPoints[i];
      const dir = new THREE.Vector3(
        Math.cos((p.direction * Math.PI) / 180),
        0,
        Math.sin((p.direction * Math.PI) / 180)
      ).normalize();
      const length = 1 + (p.speed / this.meta.maxWindSpeed) * 3;
      const t = Math.min(p.speed / this.meta.maxWindSpeed, 1);
      const color = new THREE.Color().lerpColors(WIND_SPEED_LOW, WIND_SPEED_HIGH, t);
      const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(p.x, p.y, p.z), length, color.getHex(), 0.4, 0.2);
      this.arrowGroup.add(arrow);
    }
  }

  setMode(mode: VisualizationMode): void {
    this.currentMode = mode;
    this.applyMode();
  }

  private applyMode(): void {
    if (this.particles) this.particles.visible = this.currentMode === 'vector';
    if (this.heatmapParticles) this.heatmapParticles.visible = this.currentMode === 'heatmap';
    this.arrowGroup.visible = this.currentMode === 'vector';

    if (this.currentMode === 'vector') {
      this.buildArrowField();
    }

    for (const child of this.pressureMeshes.children) {
      (child as THREE.Mesh).visible = this.currentMode === 'pressure';
    }
  }

  setAltitudeLevel(level: number): void {
    this.altitudeLevel = level;
    this.updateSlicePlanePosition();
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.particles && this.particles.visible) {
      const intersects = this.raycaster.intersectObject(this.particles);
      if (intersects.length > 0) {
        const idx = intersects[0].index!;
        if (idx < this.windPoints.length) {
          const p = this.windPoints[idx];
          const altitude = this.meta.altitudeRange[0] + this.altitudeLevel * (this.meta.altitudeRange[1] - this.meta.altitudeRange[0]);
          this.onHover({
            speed: Math.round(p.speed * 10) / 10,
            direction: Math.round(p.direction * 10) / 10,
            pressure: Math.round(1013 - p.altitude * 0.012),
            altitude: Math.round(p.altitude),
            screenX: event.clientX,
            screenY: event.clientY,
            visible: true,
          });
          return;
        }
      }
    }

    if (this.currentMode === 'pressure') {
      const pressureIntersects = this.raycaster.intersectObjects(this.pressureMeshes.children);
      if (pressureIntersects.length > 0) {
        const obj = pressureIntersects[0].object;
        const data = obj.userData;
        this.onHover({
          speed: 0,
          direction: 0,
          pressure: data.pressure,
          altitude: data.altitude,
          screenX: event.clientX,
          screenY: event.clientY,
          visible: true,
        });
        return;
      }
    }

    this.onHover({ speed: 0, direction: 0, pressure: 0, altitude: 0, screenX: 0, screenY: 0, visible: false });
  }

  private onResize(): void {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    this.controls.update();

    if (this.particles && this.particles.visible) {
      const positions = this.particles.geometry.getAttribute('position');
      for (let i = 0; i < this.windPoints.length; i++) {
        const p = this.windPoints[i];
        const dx = Math.cos((p.direction * Math.PI) / 180) * 0.02 * (p.speed / this.meta.maxWindSpeed);
        const dz = Math.sin((p.direction * Math.PI) / 180) * 0.02 * (p.speed / this.meta.maxWindSpeed);
        let nx = positions.getX(i) + dx;
        let nz = positions.getZ(i) + dz;
        if (nx > 50) nx = -50;
        if (nx < -50) nx = 50;
        if (nz > 50) nz = -50;
        if (nz < -50) nz = 50;
        positions.setXYZ(i, nx, positions.getY(i), nz);
      }
      positions.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    window.removeEventListener('resize', this.onResize.bind(this));
    this.controls.dispose();
    this.renderer.dispose();
    this.clearSceneObjects();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
