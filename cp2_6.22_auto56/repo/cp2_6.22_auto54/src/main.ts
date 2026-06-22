import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { StarField, StarOfficial } from './StarField';
import { InteractivePanel } from './InteractivePanel';

class StarMapApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private starField: StarField;
  private panel: InteractivePanel;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredOfficial: StarOfficial | null = null;
  private selectedOfficial: StarOfficial | null = null;
  private clock: THREE.Clock;

  private flyToActive: boolean = false;
  private flyToStart: number = 0;
  private flyToDuration: number = 800;
  private flyToFromPos: THREE.Vector3 = new THREE.Vector3();
  private flyToToPos: THREE.Vector3 = new THREE.Vector3();
  private flyToFromTarget: THREE.Vector3 = new THREE.Vector3();
  private flyToToTarget: THREE.Vector3 = new THREE.Vector3();

  private allPoints: THREE.Points[] = [];

  constructor() {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initCamera();
    this.starField = new StarField(this.scene);
    this.initRenderer();
    this.initControls();
    this.initLights();

    this.panel = new InteractivePanel(this.starField);

    this.collectAllPoints();
    this.bindEvents();
    this.animate();
  }

  private initCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 40, 220);
  }

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0a0a1a, 1);

    const container = document.getElementById('canvas-container')!;
    container.appendChild(this.renderer.domElement);

    const labelContainer = document.getElementById('label-container')!;
    if (labelContainer.parentNode) {
      labelContainer.parentNode.removeChild(labelContainer);
    }
    container.appendChild(this.starField.labelRenderer.domElement);
  }

  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = 130;
    this.controls.maxDistance = 400;
    this.controls.enablePan = false;
  }

  private initLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x6688ff, 0.4, 500);
    pointLight1.position.set(100, 100, 100);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff8866, 0.2, 500);
    pointLight2.position.set(-100, -50, 100);
    this.scene.add(pointLight2);
  }

  private collectAllPoints(): void {
    this.starField.starOfficials.forEach(official => {
      this.allPoints.push(official.points);
    });
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.handleResize());

    this.renderer.domElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.renderer.domElement.addEventListener('click', (e) => this.handleClick(e));

    this.panel.onSelect((official: StarOfficial) => this.flyToStarOfficial(official));
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.starField.resize(width, height);
  }

  private handleMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.allPoints, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      let official: StarOfficial | null = null;

      for (let i = 0; i < this.starField.starOfficials.length; i++) {
        const off = this.starField.starOfficials[i];
        if (off.points === hit.object) {
          official = off;
          break;
        }
      }

      if (official && official !== this.hoveredOfficial) {
        this.hoveredOfficial = official;
        if (this.selectedOfficial === null || this.selectedOfficial !== official) {
          this.starField.hoverStarOfficial(official);
        }
        document.body.style.cursor = 'pointer';
      }
    } else if (this.hoveredOfficial !== null) {
      if (this.selectedOfficial === null || this.selectedOfficial !== this.hoveredOfficial) {
        this.starField.hoverStarOfficial(null);
      }
      this.hoveredOfficial = null;
      document.body.style.cursor = 'default';
    }
  }

  private handleClick(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.allPoints, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      let official: StarOfficial | null = null;

      for (let i = 0; i < this.starField.starOfficials.length; i++) {
        const off = this.starField.starOfficials[i];
        if (off.points === hit.object) {
          official = off;
          break;
        }
      }

      if (official) {
        this.selectOfficial(official);
      }
    }
  }

  private selectOfficial(official: StarOfficial): void {
    this.selectedOfficial = official;
    this.starField.highlightStarOfficial(official);
    this.panel.showPanel(official);
  }

  private flyToStarOfficial(official: StarOfficial): void {
    const center = this.starField.getCenterPosition(official);
    const direction = center.clone().normalize();
    const distance = 180;

    this.flyToFromPos.copy(this.camera.position);
    this.flyToToPos.copy(direction.multiplyScalar(distance));

    this.flyToFromTarget.copy(this.controls.target);
    this.flyToToTarget.copy(center);

    this.flyToStart = performance.now();
    this.flyToActive = true;
    this.controls.enabled = false;

    this.selectedOfficial = official;
    this.starField.highlightStarOfficial(official);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private updateFlyTo(): void {
    if (!this.flyToActive) return;

    const now = performance.now();
    const elapsed = now - this.flyToStart;
    const t = Math.min(elapsed / this.flyToDuration, 1);
    const eased = this.easeInOutCubic(t);

    this.camera.position.lerpVectors(this.flyToFromPos, this.flyToToPos, eased);
    this.controls.target.lerpVectors(this.flyToFromTarget, this.flyToToTarget, eased);

    if (t >= 1) {
      this.flyToActive = false;
      this.controls.enabled = true;
      if (this.selectedOfficial) {
        this.panel.showPanel(this.selectedOfficial);
      }
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const time = performance.now();

    this.starField.animate(time);
    this.updateFlyTo();

    if (!this.flyToActive) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
    this.starField.labelRenderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new StarMapApp();
});
