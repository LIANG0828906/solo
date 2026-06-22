import * as THREE from 'three';
import { createStars, createMilkyWay, StarMeshData } from './stars';
import { createConstellations, ConstellationLineData, findStarByGlobalIndex } from './constellations';
import { createControls, ControlState } from './controls';

const INITIAL_CAMERA_POSITION = new THREE.Vector3(0, 50, 350);
const INITIAL_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const BASE_ROTATION_SPEED = 0.02;

class StarOrbitSimulator {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: ControlState;

  private starsData!: StarMeshData;
  private constellationsData!: ConstellationLineData;
  private milkyWay!: THREE.Points;
  private skyDome!: THREE.Group;

  private clock: THREE.Clock;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private tooltip: HTMLElement;

  private isResetting: boolean = false;
  private resetStartTime: number = 0;
  private resetStartPosition: THREE.Vector3 = new THREE.Vector3();
  private resetStartTarget: THREE.Vector3 = new THREE.Vector3();

  private isDragging: boolean = false;
  private previousMouse: THREE.Vector2 = new THREE.Vector2();
  private cameraTheta: number = 0;
  private cameraPhi: number = 0.3;
  private cameraDistance: number = 350;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  private rotationAngle: number = 0;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.tooltip = document.getElementById('tooltip')!;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.controls = createControls();

    this.init();
  }

  private init(): void {
    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupEventListeners();
    this.setupControlCallbacks();
    this.animate();
  }

  private setupRenderer(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);
  }

  private setupCamera(): void {
    this.updateCameraPosition();
    this.camera.lookAt(this.cameraTarget);
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraDistance * Math.cos(this.cameraPhi);
    const z = this.cameraDistance * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    this.camera.position.set(
      this.cameraTarget.x + x,
      this.cameraTarget.y + y,
      this.cameraTarget.z + z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  private setupScene(): void {
    this.skyDome = new THREE.Group();
    this.scene.add(this.skyDome);

    this.starsData = createStars();
    this.skyDome.add(this.starsData.mesh);

    this.constellationsData = createConstellations();
    this.skyDome.add(this.constellationsData.group);

    this.milkyWay = createMilkyWay();
    this.skyDome.add(this.milkyWay);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    this.scene.add(ambientLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));

    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mouseleave', this.onMouseLeave.bind(this));

    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));
    document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this));

    this.renderer.domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.onTouchEnd.bind(this));

    this.renderer.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
  }

  private setupControlCallbacks(): void {
    this.controls.onChange(() => {
      this.constellationsData.group.visible = this.controls.showConstellations;
    });

    this.controls.resetView = this.resetView.bind(this);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.checkStarHover(event.clientX, event.clientY);
  }

  private onMouseLeave(): void {
    this.hideTooltip();
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.isDragging = true;
      this.previousMouse.set(event.clientX, event.clientY);
      this.renderer.domElement.style.cursor = 'grabbing';
    }
  }

  private onDocumentMouseMove(event: MouseEvent): void {
    if (!this.isDragging || this.isResetting) return;

    const deltaX = event.clientX - this.previousMouse.x;
    const deltaY = event.clientY - this.previousMouse.y;

    this.cameraTheta -= deltaX * 0.005;
    this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi + deltaY * 0.005));

    this.updateCameraPosition();
    this.previousMouse.set(event.clientX, event.clientY);
  }

  private onDocumentMouseUp(): void {
    this.isDragging = false;
    this.renderer.domElement.style.cursor = 'default';
  }

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      event.preventDefault();
      this.isDragging = true;
      this.previousMouse.set(event.touches[0].clientX, event.touches[0].clientY);
      this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
      this.checkStarHover(event.touches[0].clientX, event.touches[0].clientY);
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      event.preventDefault();
      if (this.isDragging && !this.isResetting) {
        const deltaX = event.touches[0].clientX - this.previousMouse.x;
        const deltaY = event.touches[0].clientY - this.previousMouse.y;

        this.cameraTheta -= deltaX * 0.005;
        this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi + deltaY * 0.005));

        this.updateCameraPosition();
        this.previousMouse.set(event.touches[0].clientX, event.touches[0].clientY);
      }
      this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
      this.checkStarHover(event.touches[0].clientX, event.touches[0].clientY);
    }
  }

  private onTouchEnd(): void {
    this.isDragging = false;
    this.hideTooltip();
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.cameraDistance = Math.max(150, Math.min(600, this.cameraDistance + event.deltaY * 0.5));
    this.updateCameraPosition();
  }

  private checkStarHover(clientX: number, clientY: number): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObject(this.starsData.mesh);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const starIndex = intersection.index;

      if (starIndex !== undefined) {
        const starInfo = findStarByGlobalIndex(starIndex);
        if (starInfo) {
          this.showTooltip(
            clientX,
            clientY,
            `${starInfo.constellation} · ${starInfo.star.chineseName}`,
            `${starInfo.star.westernName} (${starInfo.star.magnitude.toFixed(2)}等)`
          );
          return;
        }
      }
    }
    this.hideTooltip();
  }

  private showTooltip(x: number, y: number, line1: string, line2: string): void {
    this.tooltip.innerHTML = `<div>${line1}</div><div style="opacity: 0.7; font-size: 11px; margin-top: 2px;">${line2}</div>`;
    this.tooltip.style.left = `${x + 15}px`;
    this.tooltip.style.top = `${y + 15}px`;
    this.tooltip.classList.add('visible');

    const rect = this.tooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.tooltip.style.left = `${x - rect.width - 15}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.tooltip.style.top = `${y - rect.height - 15}px`;
    }
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove('visible');
  }

  private resetView(): void {
    this.isResetting = true;
    this.resetStartTime = performance.now();
    this.resetStartPosition.copy(this.camera.position);
    this.resetStartTarget.copy(this.cameraTarget);
  }

  private updateResetAnimation(currentTime: number): void {
    const elapsed = (currentTime - this.resetStartTime) / 1000;
    const duration = 0.8;

    if (elapsed >= duration) {
      this.isResetting = false;
      this.cameraTheta = 0;
      this.cameraPhi = 0.3;
      this.cameraDistance = 350;
      this.cameraTarget.copy(INITIAL_CAMERA_TARGET);
      this.updateCameraPosition();
      return;
    }

    const t = elapsed / duration;
    const easeOut = 1 - Math.pow(1 - t, 3);

    this.camera.position.lerpVectors(this.resetStartPosition, INITIAL_CAMERA_POSITION, easeOut);
    this.cameraTarget.lerpVectors(this.resetStartTarget, INITIAL_CAMERA_TARGET, easeOut);
    this.camera.lookAt(this.cameraTarget);

    this.cameraTheta = Math.atan2(
      this.camera.position.z - this.cameraTarget.z,
      this.camera.position.x - this.cameraTarget.x
    );
    const dx = this.camera.position.x - this.cameraTarget.x;
    const dz = this.camera.position.z - this.cameraTarget.z;
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    this.cameraPhi = Math.atan2(horizontalDist, this.camera.position.y - this.cameraTarget.y);
    this.cameraDistance = this.camera.position.distanceTo(this.cameraTarget);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();
    const currentTime = performance.now();

    if (!this.isResetting) {
      this.rotationAngle += BASE_ROTATION_SPEED * this.controls.rotationSpeed * deltaTime;
      this.skyDome.rotation.y = this.rotationAngle;
    }

    if (this.isResetting) {
      this.updateResetAnimation(currentTime);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new StarOrbitSimulator();
});
