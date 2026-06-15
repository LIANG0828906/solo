import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createMolecule,
  getAtomType,
  type MoleculeData,
  type MoleculeName
} from './moleculeFactory';
import { UI } from './ui';

interface AtomMeshUserData {
  isAtom: true;
  atomType: string;
  originalScale: THREE.Vector3;
}

interface BondMeshUserData {
  isBond: true;
  originalScale: THREE.Vector3;
}

class MoleculeViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private moleculeGroup: THREE.Group;
  private ui: UI;

  private atomMaterials: Map<string, THREE.MeshStandardMaterial>;
  private bondMaterial: THREE.MeshStandardMaterial;
  private atomGeometry: THREE.SphereGeometry;
  private bondGeometry: THREE.CylinderGeometry;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private atomMeshes: THREE.Mesh[];

  private rotationSpeed: number;
  private isDragging: boolean;
  private dragEndTime: number;
  private inertiaVelocity: THREE.Vector2;
  private lastMousePos: THREE.Vector2;

  private scaleAnimation: { active: boolean; startTime: number; duration: number } | null;

  private clock: THREE.Clock;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.atomMaterials = new Map();
    this.atomMeshes = [];
    this.rotationSpeed = 50;
    this.isDragging = false;
    this.dragEndTime = 0;
    this.inertiaVelocity = new THREE.Vector2();
    this.lastMousePos = new THREE.Vector2();
    this.scaleAnimation = null;
    this.clock = new THREE.Clock();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();
    this.moleculeGroup = new THREE.Group();
    this.scene.add(this.moleculeGroup);

    this.atomGeometry = new THREE.SphereGeometry(1, 16, 16);
    this.bondGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    this.bondMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.7,
      metalness: 0.3,
      roughness: 0.7
    });

    this.ui = new UI({
      onMoleculeChange: (name) => this.loadMolecule(name),
      onSpeedChange: (speed) => this.setRotationSpeed(speed),
      onReset: () => this.resetView()
    });

    this.setupLights();
    this.bindEvents();
    this.loadMolecule(this.ui.getCurrentMolecule());
    this.animate();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);
    scene.background = texture;
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(6, 4, 8);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 30;
    return controls;
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 10, 7);
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x88aaff, 0.3);
    directionalLight2.position.set(-5, 5, -5);
    this.scene.add(directionalLight2);
  }

  private getAtomMaterial(type: string): THREE.MeshStandardMaterial {
    if (!this.atomMaterials.has(type)) {
      const atomType = getAtomType(type);
      const material = new THREE.MeshStandardMaterial({
        color: atomType.color,
        metalness: 0.2,
        roughness: 0.5
      });
      this.atomMaterials.set(type, material);
    }
    return this.atomMaterials.get(type)!;
  }

  private clearMolecule(): void {
    while (this.moleculeGroup.children.length > 0) {
      const child = this.moleculeGroup.children[0];
      this.moleculeGroup.remove(child);
    }
    this.atomMeshes = [];
  }

  private buildMolecule(data: MoleculeData): void {
    this.clearMolecule();
    this.moleculeGroup.scale.set(0, 0, 0);

    const tempObject = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < data.atoms.length; i++) {
      const atom = data.atoms[i];
      const atomType = getAtomType(atom.type);
      const material = this.getAtomMaterial(atom.type);
      const mesh = new THREE.Mesh(this.atomGeometry, material);
      mesh.scale.setScalar(atomType.radius);
      mesh.position.set(atom.position[0], atom.position[1], atom.position[2]);
      const userData: AtomMeshUserData = {
        isAtom: true,
        atomType: atom.type,
        originalScale: new THREE.Vector3().copy(mesh.scale)
      };
      mesh.userData = userData;
      this.moleculeGroup.add(mesh);
      this.atomMeshes.push(mesh);
    }

    for (const bond of data.bonds) {
      const fromAtom = data.atoms[bond.from];
      const toAtom = data.atoms[bond.to];
      const from = new THREE.Vector3(fromAtom.position[0], fromAtom.position[1], fromAtom.position[2]);
      const to = new THREE.Vector3(toAtom.position[0], toAtom.position[1], toAtom.position[2]);

      const direction = new THREE.Vector3().subVectors(to, from);
      const length = direction.length();
      const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

      const cylinder = new THREE.Mesh(this.bondGeometry, this.bondMaterial);
      cylinder.scale.set(1, length, 1);
      cylinder.position.copy(midpoint);

      direction.normalize();
      tempObject.position.copy(midpoint);
      tempObject.lookAt(midpoint.clone().add(direction));
      tempObject.rotateX(Math.PI / 2);
      cylinder.quaternion.copy(tempObject.quaternion);

      const userData: BondMeshUserData = {
        isBond: true,
        originalScale: new THREE.Vector3().copy(cylinder.scale)
      };
      cylinder.userData = userData;
      this.moleculeGroup.add(cylinder);
    }

    this.moleculeGroup.position.set(0, 0, 0);
    this.scaleAnimation = {
      active: true,
      startTime: performance.now(),
      duration: 500
    };
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  private updateScaleAnimation(): void {
    if (!this.scaleAnimation?.active) return;

    const elapsed = performance.now() - this.scaleAnimation.startTime;
    let progress = Math.min(elapsed / this.scaleAnimation.duration, 1);
    const scale = this.easeOutBack(progress);
    this.moleculeGroup.scale.setScalar(scale);

    if (progress >= 1) {
      this.scaleAnimation.active = false;
      this.scaleAnimation = null;
    }
  }

  public loadMolecule(name: MoleculeName): void {
    const data = createMolecule(name);
    this.buildMolecule(data);
  }

  public setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
  }

  public resetView(): void {
    this.camera.position.set(6, 4, 8);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.moleculeGroup.rotation.set(0, 0, 0);
    this.ui.hideAtomInfo();
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.onResize());

    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMousePos.set(e.clientX, e.clientY);
      this.inertiaVelocity.set(0, 0);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.lastMousePos.x;
        const dy = e.clientY - this.lastMousePos.y;
        this.inertiaVelocity.set(dx, dy);
        this.lastMousePos.set(e.clientX, e.clientY);
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.lastMousePos.x;
        const dy = e.clientY - this.lastMousePos.y;
        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
          this.inertiaVelocity.set(dx, dy);
        }
        this.isDragging = false;
        this.dragEndTime = performance.now();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.dragEndTime = performance.now();
      }
    });

    canvas.addEventListener('click', (e) => {
      this.onCanvasClick(e);
    });
  }

  private onCanvasClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.atomMeshes, false);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const userData = mesh.userData as AtomMeshUserData;
      if (userData.isAtom) {
        this.ui.showAtomInfo(userData.atomType);
      }
    }
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    this.updateScaleAnimation();

    if (this.rotationSpeed > 0) {
      const radiansPerSecond = (this.rotationSpeed / 100) * (Math.PI / 2);
      this.moleculeGroup.rotation.y += radiansPerSecond * delta;
    }

    if (!this.isDragging) {
      const elapsed = performance.now() - this.dragEndTime;
      if (elapsed < 500 && (this.inertiaVelocity.lengthSq() > 0.01)) {
        const factor = 1 - elapsed / 500;
        const dampingFactor = 0.1 * factor;
        this.controls.rotateLeft(-this.inertiaVelocity.x * dampingFactor * 0.01);
        this.controls.rotateUp(this.inertiaVelocity.y * dampingFactor * 0.01);
        this.inertiaVelocity.multiplyScalar(0.95);
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

new MoleculeViewer();
