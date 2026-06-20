import * as THREE from 'three';
import type {
  ToolType,
  CameraMode,
  ParticleSnapshot,
  WorkerResponse,
  BrushCommand,
} from '@/types';
import {
  hexToRgb,
  lerp,
  easeInOutCubic,
  DEFAULT_PARTICLE_COLOR,
  DEFAULT_COLOR_PALETTE,
} from '@/utils/helpers';
import ParticleWorker from './ParticleWorker.ts?worker';

const PARTICLE_COUNT = 8000;
const CUBE_SIZE = 10;
const ANIMATION_DURATION = 200;
const CAMERA_TRANSITION_DURATION = 1000;
const RESET_DURATION = 800;

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera | THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;

  private positions: Float32Array;
  private targetPositions: Float32Array;
  private colors: Float32Array;
  private targetColors: Float32Array;
  private initialPositions: Float32Array;
  private initialColors: Float32Array;

  private isAnimating = false;
  private animationStartTime = 0;
  private startPositions: Float32Array;
  private startColors: Float32Array;

  private cameraMode: CameraMode = 'orthographic';
  private cameraTransition = false;
  private cameraTransitionStart = 0;
  private cameraStartParams: {
    position: THREE.Vector3;
    fov?: number;
    zoom?: number;
  } = { position: new THREE.Vector3() };
  private cameraTargetParams: {
    position: THREE.Vector3;
    fov?: number;
    zoom?: number;
  } = { position: new THREE.Vector3() };

  private isResetting = false;
  private resetStartTime = 0;
  private resetStartPositions: Float32Array;

  private isDragging = false;
  private previousMouse = new THREE.Vector2();
  private cameraAngle = { theta: Math.PI / 4, phi: Math.PI / 4 };
  private cameraDistance = 20;

  private worker: Worker;
  private workerBusy = false;
  private pendingCommand: BrushCommand | null = null;

  private container: HTMLElement;
  private onCameraModeChange?: (mode: CameraMode) => void;

  constructor(container: HTMLElement, onCameraModeChange?: (mode: CameraMode) => void) {
    this.container = container;
    this.onCameraModeChange = onCameraModeChange;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    this.colors = new Float32Array(PARTICLE_COUNT * 3);
    this.targetColors = new Float32Array(PARTICLE_COUNT * 3);
    this.initialPositions = new Float32Array(PARTICLE_COUNT * 3);
    this.initialColors = new Float32Array(PARTICLE_COUNT * 3);
    this.startPositions = new Float32Array(PARTICLE_COUNT * 3);
    this.startColors = new Float32Array(PARTICLE_COUNT * 3);
    this.resetStartPositions = new Float32Array(PARTICLE_COUNT * 3);

    this.generateInitialParticles();

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);

    this.camera = this.createOrthographicCamera();
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x1a1a2e, 1);
    container.appendChild(this.renderer.domElement);

    this.worker = new ParticleWorker();
    this.worker.onmessage = this.handleWorkerMessage.bind(this);

    this.addEventListeners();
    this.animate();
  }

  private generateInitialParticles(): void {
    const rgb = hexToRgb(DEFAULT_PARTICLE_COLOR);
    const halfSize = CUBE_SIZE / 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const layer = Math.cbrt(PARTICLE_COUNT);
      const x = ((i % layer) / (layer - 1) - 0.5) * CUBE_SIZE + (Math.random() - 0.5) * 0.3;
      const y =
        (Math.floor(i / layer) % layer) / (layer - 1) * CUBE_SIZE -
        halfSize +
        (Math.random() - 0.5) * 0.3;
      const z =
        Math.floor(i / (layer * layer)) / (layer - 1) * CUBE_SIZE -
        halfSize +
        (Math.random() - 0.5) * 0.3;

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;
      this.targetPositions[i3] = x;
      this.targetPositions[i3 + 1] = y;
      this.targetPositions[i3 + 2] = z;
      this.initialPositions[i3] = x;
      this.initialPositions[i3 + 1] = y;
      this.initialPositions[i3 + 2] = z;

      this.colors[i3] = rgb.r;
      this.colors[i3 + 1] = rgb.g;
      this.colors[i3 + 2] = rgb.b;
      this.targetColors[i3] = rgb.r;
      this.targetColors[i3 + 1] = rgb.g;
      this.targetColors[i3 + 2] = rgb.b;
      this.initialColors[i3] = rgb.r;
      this.initialColors[i3 + 1] = rgb.g;
      this.initialColors[i3 + 2] = rgb.b;
    }
  }

  private createOrthographicCamera(): THREE.OrthographicCamera {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const frustumSize = 15;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    return camera;
  }

  private createPerspectiveCamera(): THREE.PerspectiveCamera {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    return camera;
  }

  private updateCameraPosition(): void {
    const { theta, phi } = this.cameraAngle;
    const { cameraDistance } = this;
    const x = cameraDistance * Math.sin(phi) * Math.cos(theta);
    const y = cameraDistance * Math.cos(phi);
    const z = cameraDistance * Math.sin(phi) * Math.sin(theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  private addEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      this.isDragging = true;
      this.previousMouse.set(e.clientX, e.clientY);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousMouse.x;
    const deltaY = e.clientY - this.previousMouse.y;

    if (e.shiftKey) {
      this.cameraAngle.theta += deltaX * 0.01;
      this.cameraAngle.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraAngle.phi + deltaY * 0.01));
      this.updateCameraPosition();
    }

    this.previousMouse.set(e.clientX, e.clientY);
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.cameraDistance = Math.max(8, Math.min(50, this.cameraDistance + e.deltaY * 0.05));
    this.updateCameraPosition();
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (this.camera instanceof THREE.OrthographicCamera) {
      const aspect = width / height;
      const frustumSize = 15;
      this.camera.left = (frustumSize * aspect) / -2;
      this.camera.right = (frustumSize * aspect) / 2;
      this.camera.top = frustumSize / 2;
      this.camera.bottom = frustumSize / -2;
    } else {
      this.camera.aspect = width / height;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private handleWorkerMessage(e: MessageEvent<WorkerResponse>): void {
    const { type, payload } = e.data;
    this.workerBusy = false;

    switch (type) {
      case 'positionsUpdated':
        if (payload.positions && payload.colors) {
          this.startAnimation(payload.positions, payload.colors);
        }
        break;
      case 'resetComplete':
        if (payload.positions && payload.colors) {
          this.startResetAnimation(payload.positions, payload.colors);
        }
        break;
      case 'lerpComplete':
        if (payload.positions && payload.colors) {
          this.updateParticleData(payload.positions, payload.colors);
        }
        break;
    }

    if (this.pendingCommand) {
      this.sendBrushCommand(this.pendingCommand);
      this.pendingCommand = null;
    }
  }

  private startAnimation(targetPos: Float32Array, targetCol: Float32Array): void {
    this.startPositions.set(this.positions);
    this.startColors.set(this.colors);
    this.targetPositions.set(targetPos);
    this.targetColors.set(targetCol);
    this.isAnimating = true;
    this.animationStartTime = performance.now();
  }

  private startResetAnimation(targetPos: Float32Array, targetCol: Float32Array): void {
    this.resetStartPositions.set(this.positions);
    this.targetPositions.set(targetPos);
    this.targetColors.set(targetCol);
    this.isResetting = true;
    this.resetStartTime = performance.now();
  }

  private updateParticleData(positions: Float32Array, colors: Float32Array): void {
    this.positions.set(positions);
    this.colors.set(colors);
    this.targetPositions.set(positions);
    this.targetColors.set(colors);
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public applyBrush(
    tool: ToolType,
    screenX: number,
    screenY: number,
    brushSize: number,
    brushStrength: number
  ): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndcX = ((screenX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((screenY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersect);

    const command: BrushCommand = {
      type: tool,
      centerX: intersect.x,
      centerY: intersect.y,
      centerZ: intersect.z,
      radius: brushSize,
      strength: tool === 'spray' ? brushStrength : brushStrength * 0.5,
      colorPalette: DEFAULT_COLOR_PALETTE,
    };

    if (this.workerBusy) {
      this.pendingCommand = command;
    } else {
      this.sendBrushCommand(command);
    }
  }

  private sendBrushCommand(command: BrushCommand): void {
    this.workerBusy = true;
    this.worker.postMessage({
      type: 'applyBrush',
      payload: {
        positions: new Float32Array(this.targetPositions),
        colors: new Float32Array(this.targetColors),
        command,
      },
    });
  }

  public resetScene(): void {
    this.worker.postMessage({
      type: 'resetParticles',
      payload: {
        initialPositions: this.initialPositions,
        initialColors: this.initialColors,
      },
    });
  }

  public toggleCameraMode(): void {
    this.cameraTransition = true;
    this.cameraTransitionStart = performance.now();

    this.cameraStartParams.position.copy(this.camera.position);
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.cameraStartParams.fov = this.camera.fov;
    } else {
      this.cameraStartParams.zoom = this.camera.zoom;
    }

    const oldCamera = this.camera;
    this.scene.remove(oldCamera);

    const { theta, phi } = this.cameraAngle;
    const { cameraDistance } = this;
    const x = cameraDistance * Math.sin(phi) * Math.cos(theta);
    const y = cameraDistance * Math.cos(phi);
    const z = cameraDistance * Math.sin(phi) * Math.sin(theta);

    if (this.cameraMode === 'orthographic') {
      this.camera = this.createPerspectiveCamera();
      this.cameraMode = 'perspective';
    } else {
      this.camera = this.createOrthographicCamera();
      this.cameraMode = 'orthographic';
    }

    this.camera.position.copy(oldCamera.position);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    this.scene.add(this.camera);

    this.cameraTargetParams.position.set(x, y, z);
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.cameraTargetParams.fov = 60;
    } else {
      this.cameraTargetParams.zoom = 1;
    }

    this.onCameraModeChange?.(this.cameraMode);
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  public getSnapshot(): ParticleSnapshot {
    return {
      timestamp: Date.now(),
      positions: new Float32Array(this.targetPositions),
      colors: new Float32Array(this.targetColors),
    };
  }

  public setSnapshot(snapshot: ParticleSnapshot): void {
    this.updateParticleData(snapshot.positions, snapshot.colors);
  }

  public lerpToSnapshot(snapshotA: ParticleSnapshot, snapshotB: ParticleSnapshot, t: number): void {
    this.worker.postMessage({
      type: 'lerpSnapshots',
      payload: { snapshotA, snapshotB, t },
    });
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const now = performance.now();

    if (this.isAnimating) {
      const elapsed = now - this.animationStartTime;
      const t = Math.min(1, elapsed / ANIMATION_DURATION);
      const easedT = easeInOutCubic(t);

      for (let i = 0; i < this.positions.length; i++) {
        this.positions[i] = lerp(this.startPositions[i], this.targetPositions[i], easedT);
        this.colors[i] = lerp(this.startColors[i], this.targetColors[i], easedT);
      }

      const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      if (t >= 1) {
        this.isAnimating = false;
      }
    }

    if (this.isResetting) {
      const elapsed = now - this.resetStartTime;
      const t = Math.min(1, elapsed / RESET_DURATION);
      const easedT = easeInOutCubic(t);

      for (let i = 0; i < this.positions.length; i += 3) {
        const dist = Math.sqrt(
          this.resetStartPositions[i] * this.resetStartPositions[i] +
            this.resetStartPositions[i + 1] * this.resetStartPositions[i + 1] +
            this.resetStartPositions[i + 2] * this.resetStartPositions[i + 2]
        );
        const delay = Math.min(1, dist / 15);
        const localT = Math.max(0, Math.min(1, (t - delay * 0.5) / (1 - delay * 0.5)));
        const localEased = easeInOutCubic(localT);

        this.positions[i] = lerp(this.resetStartPositions[i], this.targetPositions[i], localEased);
        this.positions[i + 1] = lerp(
          this.resetStartPositions[i + 1],
          this.targetPositions[i + 1],
          localEased
        );
        this.positions[i + 2] = lerp(
          this.resetStartPositions[i + 2],
          this.targetPositions[i + 2],
          localEased
        );
      }

      for (let i = 0; i < this.colors.length; i++) {
        this.colors[i] = lerp(this.colors[i], this.targetColors[i], easedT);
      }

      const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      if (t >= 1) {
        this.isResetting = false;
      }
    }

    if (this.cameraTransition) {
      const elapsed = now - this.cameraTransitionStart;
      const t = Math.min(1, elapsed / CAMERA_TRANSITION_DURATION);
      const easedT = easeInOutCubic(t);

      this.camera.position.lerpVectors(
        this.cameraStartParams.position,
        this.cameraTargetParams.position,
        easedT
      );
      this.camera.lookAt(0, 0, 0);

      if (this.camera instanceof THREE.PerspectiveCamera && this.cameraTargetParams.fov !== undefined) {
        this.camera.fov = lerp(this.cameraStartParams.fov || 50, this.cameraTargetParams.fov, easedT);
        this.camera.updateProjectionMatrix();
      }

      if (t >= 1) {
        this.cameraTransition = false;
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    this.worker.terminate();
    this.renderer.dispose();
    this.geometry.dispose();
    this.material.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
