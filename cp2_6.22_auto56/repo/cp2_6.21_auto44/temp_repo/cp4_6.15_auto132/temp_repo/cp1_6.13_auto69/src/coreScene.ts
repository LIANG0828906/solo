import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CoreScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private mesh: THREE.Mesh | null = null;
  private container: HTMLElement | null = null;
  private animationId: number = 0;
  private autoRotateSpeed: number = 0.003;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  initScene(canvas: HTMLCanvasElement): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera.fov = 50;
    this.camera.aspect = width / height;
    this.camera.near = 0.1;
    this.camera.far = 1000;
    this.camera.position.set(0, 0, 6);
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x1a1a2e, 1);

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 15;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;

    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00aaff, 1, 100);
    pointLight1.position.set(5, 5, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff6600, 0.5, 100);
    pointLight2.position.set(-5, -3, 3);
    this.scene.add(pointLight2);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setMesh(mesh: THREE.Mesh): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }
    this.mesh = mesh;
    this.scene.add(mesh);
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  startAnimationLoop(updateCallback?: (delta: number) => void): void {
    const clock = new THREE.Clock();
    
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
      if (updateCallback) {
        updateCallback(delta);
      }
      
      this.render();
    };
    
    animate();
  }

  stopAnimationLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  renderThumbnail(width: number, height: number): string {
    const originalSize = {
      width: this.renderer.getSize(new THREE.Vector2()).x,
      height: this.renderer.getSize(new THREE.Vector2()).y,
    };

    this.renderer.setSize(width, height, false);
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    this.renderer.setSize(originalSize.width, originalSize.height, false);

    return dataUrl;
  }

  dispose(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.stopAnimationLoop();
    this.controls.dispose();
    this.renderer.dispose();
  }
}
