import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class SceneManager {
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  renderer!: THREE.WebGLRenderer;
  controls!: OrbitControls;
  raycaster: THREE.Raycaster = new THREE.Raycaster();
  mouse: THREE.Vector2 = new THREE.Vector2();
  drawingPlane!: THREE.Plane;
  private animationFrameId: number | null = null;
  private onRenderCallbacks: (() => void)[] = [];

  init(container: HTMLElement): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3, 6);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.maxDistance = 50;
    this.controls.minDistance = 1;
    this.controls.mouseButtons = {
      LEFT: null as any,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    };

    this.drawingPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.createGrid();
    this.setupLights();
    this.setupResizeHandler();
    this.startRenderLoop();
  }

  private createGrid(): void {
    const gridHelper = new THREE.GridHelper(20, 20, 0x4A90D9, 0x4A90D9);
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.controls.update();
      this.onRenderCallbacks.forEach(cb => cb());
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  onRender(callback: () => void): void {
    this.onRenderCallbacks.push(callback);
  }

  offRender(callback: () => void): void {
    const index = this.onRenderCallbacks.indexOf(callback);
    if (index > -1) {
      this.onRenderCallbacks.splice(index, 1);
    }
  }

  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
    if (object instanceof THREE.LineSegments) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose());
      } else {
        object.material.dispose();
      }
    }
  }

  clearDynamicObjects(): void {
    const toRemove: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (obj.userData.dynamic) {
        toRemove.push(obj);
      }
    });
    toRemove.forEach(obj => this.removeObject(obj));
  }

  getIntersectionPoint(event: MouseEvent): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const point = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.drawingPlane, point);
    
    return point;
  }

  getRaycasterIntersects(event: MouseEvent, objects: THREE.Object3D[]): THREE.Intersection[] {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  captureThumbnail(width: number = 160, height: number = 100): string {
    this.renderer.render(this.scene, this.camera);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(this.renderer.domElement, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  }

  dispose(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.dispose();
  }
}

export const sceneManager = new SceneManager();
