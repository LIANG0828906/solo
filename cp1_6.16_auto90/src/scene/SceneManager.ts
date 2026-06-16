import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class SceneManager {
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public renderer!: THREE.WebGLRenderer;
  public controls!: OrbitControls;
  public floor!: THREE.Mesh;
  public ambientLight!: THREE.AmbientLight;
  public directionalLight!: THREE.DirectionalLight;
  public spotLight!: THREE.SpotLight;

  private container: HTMLElement | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  private readonly FOG_COLOR = 0x2d1f14;
  private readonly FLOOR_COLOR = 0xd4c4a8;
  private readonly GRID_COLOR = 0x8b7355;
  private readonly CAMERA_POSITION = new THREE.Vector3(0, 8, 12);
  private readonly FLOOR_SIZE = 30;
  private readonly FLOOR_SEGMENTS = 30;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  public init(container: HTMLElement): void {
    this.container = container;

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLights();
    this.initFloor();
    this.initBackground();

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(this.FOG_COLOR, 10, 40);
  }

  private initCamera(): void {
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.getAspectRatio(),
      0.1,
      100
    );
    this.camera.position.copy(this.CAMERA_POSITION);
    this.camera.lookAt(0, 0, 0);
  }

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.getContainerSize().width, this.getContainerSize().height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container!.appendChild(this.renderer.domElement);
  }

  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private initLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 15, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;
    this.scene.add(this.directionalLight);

    this.spotLight = new THREE.SpotLight(0xfff4e8, 1.5);
    this.spotLight.position.set(0, 20, 0);
    this.spotLight.angle = Math.PI / 5;
    this.spotLight.penumbra = 0.3;
    this.spotLight.decay = 2;
    this.spotLight.distance = 50;
    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 2048;
    this.spotLight.shadow.mapSize.height = 2048;
    this.spotLight.shadow.camera.near = 1;
    this.spotLight.shadow.camera.far = 40;
    this.scene.add(this.spotLight);
  }

  private initFloor(): void {
    const floorGeometry = new THREE.PlaneGeometry(
      this.FLOOR_SIZE,
      this.FLOOR_SIZE,
      this.FLOOR_SEGMENTS,
      this.FLOOR_SEGMENTS
    );

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const size = 512;
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = `#${this.padHex(this.FLOOR_COLOR.toString(16), 6)}`;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = `#${this.padHex(this.GRID_COLOR.toString(16), 6)}`;
    ctx.lineWidth = 2;
    const gridSize = size / this.FLOOR_SEGMENTS;

    for (let i = 0; i <= this.FLOOR_SEGMENTS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(size, i * gridSize);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const floorMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
  }

  private initBackground(): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 512;

    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 350);
    gradient.addColorStop(0, '#3d2914');
    gradient.addColorStop(0.5, '#2d1f14');
    gradient.addColorStop(1, '#0a0502');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  public addMesh(mesh: THREE.Mesh): void {
    this.scene.add(mesh);
  }

  public removeMesh(mesh: THREE.Mesh): void {
    this.scene.remove(mesh);
  }

  public raycast(
    clientX: number,
    clientY: number,
    objects: THREE.Mesh[]
  ): THREE.Intersection[] {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(objects, false);
  }

  public getFirstIntersection(
    clientX: number,
    clientY: number,
    objects: THREE.Mesh[]
  ): THREE.Intersection | null {
    const intersections = this.raycast(clientX, clientY, objects);
    return intersections.length > 0 ? (intersections[0] as THREE.Intersection) : null;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.animate);
    this.render();
  };

  public render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private getContainerSize(): { width: number; height: number } {
    if (!this.container) {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    };
  }

  private getAspectRatio(): number {
    const size = this.getContainerSize();
    return size.width / size.height;
  }

  private handleResize = (): void => {
    if (!this.renderer || !this.camera) return;

    const size = this.getContainerSize();
    this.camera.aspect = size.width / size.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(size.width, size.height);
  };

  public getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public resetCamera(): void {
    this.camera.position.copy(this.CAMERA_POSITION);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private padHex(str: string, length: number): string {
    while (str.length < length) {
      str = '0' + str;
    }
    return str;
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);

    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    this.container = null;
  }
}

export default SceneManager;
