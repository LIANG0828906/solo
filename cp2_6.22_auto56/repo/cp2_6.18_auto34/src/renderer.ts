import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface PickResult {
  point: THREE.Vector3;
  index: number;
  height: number;
}

export class SceneRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private pointCloud: THREE.Points | null;
  private geometry: THREE.BufferGeometry | null;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private animationId: number;
  private resizeHandler: () => void;
  private clock: THREE.Clock;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    this.camera.position.set(12, 14, 16);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    this.controls.minDistance = 4;
    this.controls.maxDistance = 120;
    this.controls.target.set(0, 0, 0);

    this.pointCloud = null;
    this.geometry = null;

    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(ambient);

    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points = { threshold: 0.25 };
    this.pointer = new THREE.Vector2();

    this.clock = new THREE.Clock();
    this.animationId = -1;

    this.resizeHandler = () => this.onResize();
    window.addEventListener('resize', this.resizeHandler);

    this.startLoop();
  }

  getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  private onResize(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private startLoop(): void {
    const tick = () => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(tick);
    };
    tick();
  }

  setPointCloud(positions: Float32Array, colors: Float32Array, count: number): void {
    if (this.pointCloud) {
      this.scene.remove(this.pointCloud);
      this.geometry?.dispose();
      (this.pointCloud.material as THREE.Material).dispose();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setDrawRange(0, count);

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: false
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.pointCloud = points;
    this.geometry = geometry;
  }

  updatePositionsAndColors(positions: Float32Array, colors: Float32Array): void {
    if (!this.geometry) return;
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    (posAttr.array as Float32Array).set(positions);
    (colAttr.array as Float32Array).set(colors);
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  updateColorsOnly(colors: Float32Array): void {
    if (!this.geometry) return;
    const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
    (colAttr.array as Float32Array).set(colors);
    colAttr.needsUpdate = true;
  }

  pickFromPointer(clientX: number, clientY: number): PickResult | null {
    if (!this.pointCloud) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.pointCloud, false);
    if (hits.length === 0) return null;
    const hit = hits[0];
    const index = hit.index ?? 0;
    const posAttr = this.geometry!.getAttribute('position') as THREE.BufferAttribute;
    const height = (posAttr.array as Float32Array)[index * 3 + 1];
    return {
      point: hit.point.clone(),
      index,
      height
    };
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeHandler);
    if (this.pointCloud) {
      this.scene.remove(this.pointCloud);
      this.geometry?.dispose();
      (this.pointCloud.material as THREE.Material).dispose();
    }
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
