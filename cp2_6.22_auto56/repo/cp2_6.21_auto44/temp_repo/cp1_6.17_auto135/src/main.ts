import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { parseData, type DatasetKey } from './dataParser';
import { BarChartRenderer } from './barChartRenderer';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private barChartRenderer: BarChartRenderer;
  private container: HTMLElement;
  private baseRing: THREE.Mesh | null = null;
  private tickMarks: THREE.Line[] = [];
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private isMobile: boolean = false;
  private targetCameraPosition: THREE.Vector3 | null = null;
  private cameraFlyDuration: number = 0;
  private cameraFlyProgress: number = 0;
  private cameraStartPosition: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 | null = null;
  private startLookAt: THREE.Vector3 = new THREE.Vector3();
  private isCameraFlying: boolean = false;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 200, 400);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 150;
    this.controls.maxDistance = 800;
    this.controls.maxPolarAngle = Math.PI / 2.2;

    this.barChartRenderer = new BarChartRenderer(this.scene, {
      radius: 100,
    });
    this.barChartRenderer.setCamera(this.camera);

    this.setupLighting();
    this.createBaseRing();
    this.createTickMarks();
    this.setupEventListeners();
    this.loadDataset('economy');
    this.checkResponsive();
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 200, 100);
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x4a90d9, 0.3);
    fillLight.position.set(-100, 100, -100);
    this.scene.add(fillLight);
  }

  private createBaseRing(): void {
    const radius = this.isMobile ? 80 : 120;
    const tubeRadius = 2.5;
    const tubularSegments = 64;

    const geometry = new THREE.TorusGeometry(radius, tubeRadius, 16, tubularSegments);
    const material = new THREE.MeshPhongMaterial({
      color: 0x34495e,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    if (this.baseRing) {
      this.scene.remove(this.baseRing);
      this.baseRing.geometry.dispose();
      (this.baseRing.material as THREE.Material).dispose();
    }

    this.baseRing = new THREE.Mesh(geometry, material);
    this.baseRing.rotation.x = -Math.PI / 2;
    this.baseRing.position.y = -2;
    this.scene.add(this.baseRing);
  }

  private createTickMarks(): void {
    this.tickMarks.forEach((line) => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.tickMarks = [];

    const radius = this.isMobile ? 80 : 120;
    const innerRadius = radius - 8;
    const outerRadius = radius + 8;

    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 * Math.PI) / 180;

      const points = [
        new THREE.Vector3(Math.cos(angle) * innerRadius, 0, Math.sin(angle) * innerRadius),
        new THREE.Vector3(Math.cos(angle) * outerRadius, 0, Math.sin(angle) * outerRadius),
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        linewidth: 0.5,
      });

      const line = new THREE.Line(geometry, material);
      line.userData.baseAngle = angle;
      this.scene.add(line);
      this.tickMarks.push(line);
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      this.barChartRenderer.handleMouseMove(e, this.container);
    });

    this.renderer.domElement.addEventListener('click', () => {
      this.barChartRenderer.handleClick();
    });

    this.renderer.domElement.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this.barChartRenderer.handleDoubleClick();
    });

    this.barChartRenderer.on('bar:doubleClick', ({ data, index }) => {
      this.flyToBar(index);
      console.log('Double clicked:', data.name, data.value);
    });

    const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement;
    if (datasetSelect) {
      datasetSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value as DatasetKey;
        this.loadDataset(value, true);
      });
    }
  }

  private flyToBar(index: number): void {
    const barPos = this.barChartRenderer.getBarPosition(index);

    const offsetDistance = this.isMobile ? 200 : 150;
    const offsetHeight = this.isMobile ? 100 : 80;

    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, new THREE.Vector3(0, 0, 0))
      .normalize();

    const targetPos = barPos
      .clone()
      .add(direction.multiplyScalar(offsetDistance))
      .add(new THREE.Vector3(0, offsetHeight, 0));

    this.cameraStartPosition.copy(this.camera.position);
    this.targetCameraPosition = targetPos;
    this.startLookAt.copy(this.controls.target);
    this.targetLookAt = barPos.clone().add(new THREE.Vector3(0, 30, 0));
    this.cameraFlyDuration = 0.8;
    this.cameraFlyProgress = 0;
    this.isCameraFlying = true;
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private loadDataset(key: DatasetKey, animate: boolean = false): void {
    const data = parseData(key);
    if (animate) {
      this.barChartRenderer.transitionToData(data);
    } else {
      this.barChartRenderer.render(data);
    }
  }

  private checkResponsive(): void {
    const width = window.innerWidth;
    const wasMobile = this.isMobile;
    this.isMobile = width < 768;

    if (wasMobile !== this.isMobile) {
      this.applyResponsiveSettings();
    }
  }

  private applyResponsiveSettings(): void {
    if (this.isMobile) {
      this.camera.position.set(0, 250, 600);
      this.barChartRenderer.setHeightScale(0.5);
      this.barChartRenderer.setRadius(60);
      this.controls.minDistance = 300;
      this.controls.maxDistance = 1000;
    } else {
      this.camera.position.set(0, 200, 400);
      this.barChartRenderer.setHeightScale(1);
      this.barChartRenderer.setRadius(100);
      this.controls.minDistance = 150;
      this.controls.maxDistance = 800;
    }

    this.createBaseRing();
    this.createTickMarks();
  }

  private onWindowResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.checkResponsive();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();

    if (this.isCameraFlying && this.targetCameraPosition && this.targetLookAt) {
      this.cameraFlyProgress += delta / this.cameraFlyDuration;
      if (this.cameraFlyProgress >= 1) {
        this.cameraFlyProgress = 1;
        this.isCameraFlying = false;
        this.controls.enabled = true;
      } else {
        this.controls.enabled = false;
      }

      const t = this.easeInOut(this.cameraFlyProgress);
      this.camera.position.lerpVectors(
        this.cameraStartPosition,
        this.targetCameraPosition,
        t
      );
      const currentLookAt = new THREE.Vector3().lerpVectors(
        this.startLookAt,
        this.targetLookAt,
        t
      );
      this.controls.target.copy(currentLookAt);
    }

    const rotationSpeed = 0.15;
    this.tickMarks.forEach((line) => {
      const baseAngle = (line.userData as { baseAngle: number }).baseAngle || 0;
      const newAngle = baseAngle + this.clock.elapsedTime * rotationSpeed;
      const radius = this.isMobile ? 80 : 120;
      const innerRadius = radius - 8;
      const outerRadius = radius + 8;

      const positions = line.geometry.attributes.position.array as Float32Array;
      positions[0] = Math.cos(newAngle) * innerRadius;
      positions[2] = Math.sin(newAngle) * innerRadius;
      positions[3] = Math.cos(newAngle) * outerRadius;
      positions[5] = Math.sin(newAngle) * outerRadius;
      line.geometry.attributes.position.needsUpdate = true;
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.barChartRenderer.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.baseRing) {
      this.baseRing.geometry.dispose();
      (this.baseRing.material as THREE.Material).dispose();
    }
    this.tickMarks.forEach((line) => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});

export { App };
