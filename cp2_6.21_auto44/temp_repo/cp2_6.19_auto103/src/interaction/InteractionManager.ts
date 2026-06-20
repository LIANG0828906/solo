import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { SceneRenderer, PlanetMeshEntry } from '../renderers/SceneRenderer';
import type { PlanetData } from '../planets/PlanetSystem';
import { getPlanetByName } from '../planets/PlanetSystem';
import { DataPanel } from '../ui/DataPanel';

export interface InteractionManagerOptions {
  container: HTMLElement;
  camera: THREE.PerspectiveCamera;
  renderer: SceneRenderer;
}

export class InteractionManager {
  private container: HTMLElement;
  private camera: THREE.PerspectiveCamera;
  private sceneRenderer: SceneRenderer;
  private labelRenderer: CSS2DRenderer;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private labels: Map<string, CSS2DObject> = new Map();
  private dataPanel: DataPanel;
  private hoveredPlanet: PlanetMeshEntry | null = null;
  private focusedPlanet: PlanetMeshEntry | null = null;
  private focusStartTime = 0;
  private focusDuration = 1000;
  private cameraStartQuat = new THREE.Quaternion();
  private cameraEndQuat = new THREE.Quaternion();
  private keys: Set<string> = new Set();
  private mouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private cameraTheta = 0;
  private cameraPhi = Math.PI / 3;
  private cameraRadius = 60;
  private cameraTarget = new THREE.Vector3(0, 0, 0);

  constructor(options: InteractionManagerOptions) {
    this.container = options.container;
    this.camera = options.camera;
    this.sceneRenderer = options.renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);

    this.dataPanel = new DataPanel(this.container);

    this.createLabels();
    this.setupEventListeners();
    this.updateCameraPosition();
  }

  private createLabels(): void {
    this.sceneRenderer.planets.forEach((entry) => {
      const div = document.createElement('div');
      div.style.cssText = `
        color: white;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: rgba(0, 0, 0, 0.4);
        padding: 4px 10px;
        border-radius: 6px;
        white-space: nowrap;
        backdrop-filter: blur(4px);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        user-select: none;
      `;
      div.textContent = entry.data.name;
      const label = new CSS2DObject(div);
      label.position.set(0, entry.data.radius + 0.8, 0);
      entry.mesh.add(label);
      this.labels.set(entry.data.name, label);
    });
  }

  private setupEventListeners(): void {
    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.container.addEventListener('click', this.onClick);
    window.addEventListener('resize', this.onResize);
  }

  private onMouseDown = (e: MouseEvent): void => {
    this.mouseDown = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.focusedPlanet = null;
  };

  private onMouseUp = (): void => {
    this.mouseDown = false;
  };

  private updateMouse(e: MouseEvent): void {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onMouseMove = (e: MouseEvent): void => {
    this.updateMouse(e);

    if (this.mouseDown) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.cameraTheta -= dx * 0.005;
      this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi - dy * 0.005));
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.focusedPlanet = null;
    }

    this.checkHover();
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    this.cameraRadius = Math.max(5, Math.min(200, this.cameraRadius * factor));
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key.toLowerCase());
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onClick = (e: MouseEvent): void => {
    if (this.dataPanel.isClickedInside(e.target)) {
      return;
    }

    this.updateMouse(e);
    const planet = this.pickPlanet();
    if (planet) {
      const data = getPlanetByName(planet.data.name);
      if (data) {
        this.dataPanel.show(data);
      }
    } else if (this.dataPanel.getIsVisible()) {
      this.dataPanel.hide();
    }
  };

  private onResize = (): void => {
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private pickPlanet(): PlanetMeshEntry | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.sceneRenderer.planets.map((p) => p.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      return this.sceneRenderer.planets.find((p) => p.mesh === mesh) || null;
    }
    return null;
  }

  private checkHover(): void {
    const planet = this.pickPlanet();

    if (planet !== this.hoveredPlanet) {
      if (this.hoveredPlanet) {
        this.setPlanetEmissive(this.hoveredPlanet, 0.05);
        this.container.style.cursor = 'default';
      }
      if (planet) {
        this.setPlanetEmissive(planet, 0.5, 200);
        this.container.style.cursor = 'pointer';
      }
      this.hoveredPlanet = planet;
    }
  }

  private setPlanetEmissive(entry: PlanetMeshEntry, targetIntensity: number, duration: number = 0): void {
    const mat = entry.mesh.material as THREE.MeshStandardMaterial;
    if (duration <= 0) {
      mat.emissiveIntensity = targetIntensity;
      return;
    }

    const startIntensity = mat.emissiveIntensity;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      mat.emissiveIntensity = startIntensity + (targetIntensity - startIntensity) * progress;
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  private updateCameraPosition(): void {
    const x = this.cameraTarget.x + this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraTarget.y + this.cameraRadius * Math.cos(this.cameraPhi);
    const z = this.cameraTarget.z + this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.cameraTarget);
  }

  private handleKeyboardMovement(deltaTime: number): void {
    const speed = (this.keys.has('shift') ? 3 : 1) * 60 * deltaTime;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (this.keys.has('w')) {
      this.cameraTarget.add(forward.clone().multiplyScalar(speed));
    }
    if (this.keys.has('s')) {
      this.cameraTarget.add(forward.clone().multiplyScalar(-speed));
    }
    if (this.keys.has('a')) {
      this.cameraTarget.add(right.clone().multiplyScalar(-speed));
    }
    if (this.keys.has('d')) {
      this.cameraTarget.add(right.clone().multiplyScalar(speed));
    }
  }

  private checkAutoFocus(): void {
    if (this.mouseDown) return;

    let nearest: PlanetMeshEntry | null = null;
    let nearestDist = Infinity;

    for (const entry of this.sceneRenderer.planets) {
      const dist = this.camera.position.distanceTo(entry.mesh.position);
      if (dist < 20 && dist < nearestDist) {
        nearest = entry;
        nearestDist = dist;
      }
    }

    if (nearest !== this.focusedPlanet && nearest) {
      this.focusedPlanet = nearest;
      this.focusStartTime = performance.now();
      this.cameraStartQuat.copy(this.camera.quaternion);
      const dir = new THREE.Vector3().subVectors(nearest.mesh.position, this.camera.position).normalize();
      const targetCamera = this.camera.clone();
      targetCamera.lookAt(nearest.mesh.position);
      this.cameraEndQuat.copy(targetCamera.quaternion);
    }

    if (nearest === null && this.focusedPlanet) {
      this.focusedPlanet = null;
    }
  }

  private updateFocusAnimation(): void {
    if (!this.focusedPlanet) return;

    const elapsed = performance.now() - this.focusStartTime;
    const progress = Math.min(elapsed / this.focusDuration, 1);
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    this.camera.quaternion.slerpQuaternions(this.cameraStartQuat, this.cameraEndQuat, eased);

    const label = this.labels.get(this.focusedPlanet.data.name);
    if (label && label.element instanceof HTMLElement) {
      label.element.style.opacity = String(0.3 + 0.7 * eased);
    }
  }

  private updateLabelsVisibility(): void {
    for (const entry of this.sceneRenderer.planets) {
      const label = this.labels.get(entry.data.name);
      if (!label || !(label.element instanceof HTMLElement)) continue;

      const dist = this.camera.position.distanceTo(entry.mesh.position);
      if (this.focusedPlanet?.data.name === entry.data.name) {
        continue;
      }
      label.element.style.opacity = dist < 25 ? '0.7' : '0';
    }
  }

  public update(deltaTime: number): void {
    this.handleKeyboardMovement(deltaTime);
    this.checkAutoFocus();

    if (!this.focusedPlanet) {
      this.updateCameraPosition();
    } else {
      this.updateFocusAnimation();
    }

    this.updateLabelsVisibility();
    this.labelRenderer.render(this.sceneRenderer.scene, this.camera);
  }

  public dispose(): void {
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.container.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.onResize);
    this.labelRenderer.domElement.remove();
    this.dataPanel.dispose();
  }
}
