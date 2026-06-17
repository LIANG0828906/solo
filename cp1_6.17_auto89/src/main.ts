import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MoleculeRenderer } from './MoleculeRenderer';
import { UIManager } from './UIManager';
import { MoleculeData } from './MoleculeParser';

class MoleculeViewerApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private moleculeRenderer: MoleculeRenderer;
  private uiManager: UIManager;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  
  private autoRotate: boolean = true;
  private autoRotateSpeed: number = 0.005;
  private isDragging: boolean = false;
  private animationFrameId: number = 0;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1E1E2E);
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 8);
    
    const canvas = document.getElementById('scene') as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 20;
    this.controls.autoRotate = false;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.moleculeRenderer = new MoleculeRenderer(this.scene);
    
    this.uiManager = new UIManager(
      this.moleculeRenderer,
      (data: MoleculeData) => this.onMoleculeChanged(data),
      (atomIndex: number, newType: string) => this.onAtomModified(atomIndex, newType)
    );
    
    this.setupLights();
    this.setupEventListeners();
    this.loadDefaultMolecule();
    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 10, 10);
    this.scene.add(mainLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.2);
    backLight.position.set(-10, -5, -10);
    this.scene.add(backLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.autoRotate = false;
      }
    });
    
    this.renderer.domElement.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isDragging = false;
      }
    });
    
    this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));
    
    this.controls.addEventListener('start', () => {
      this.autoRotate = false;
    });
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private onMouseClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const atomMeshes = this.moleculeRenderer.getAtomMeshes().map(a => a.mesh);
    const intersects = this.raycaster.intersectObjects(atomMeshes);
    
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      const atomIndex = clickedMesh.userData.atomIndex;
      if (atomIndex !== undefined) {
        this.uiManager.selectAtom(atomIndex);
      }
    } else {
      this.uiManager.selectAtom(null);
    }
  }

  private loadDefaultMolecule(): void {
    this.uiManager.loadMolecule('H2O');
  }

  private onMoleculeChanged(_data: MoleculeData): void {
    this.uiManager.refreshAtomInfo();
  }

  private onAtomModified(_atomIndex: number, _newType: string): void {
    this.uiManager.refreshAtomInfo();
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    if (this.autoRotate) {
      const group = this.moleculeRenderer.getGroup();
      group.rotation.y += this.autoRotateSpeed;
    }
    
    this.controls.update();
    
    this.renderer.render(this.scene, this.camera);
    
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.controls.dispose();
    this.moleculeRenderer.dispose();
    this.renderer.dispose();
  }

  getFPS(): number {
    return this.fps;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new MoleculeViewerApp();
  (window as any).moleculeApp = app;
});
