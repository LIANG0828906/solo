import * as THREE from 'three';
import { AstrolabeModel } from './AstrolabeModel';
import { ControlPanel } from './ControlPanel';

class AstrolabeApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private model: AstrolabeModel;
  private controlPanel: ControlPanel;
  private clock: THREE.Clock;
  private cameraDistance: number = 100;
  private cameraAngle: number = 0;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 40, 100);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.setupLights();

    this.model = new AstrolabeModel();
    this.scene.add(this.model.group);

    this.controlPanel = new ControlPanel(
      container,
      this.model,
      () => { }
    );

    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.onResize.bind(this));

    this.animate();
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 80, 50);
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x6B8EAA, 0.4);
    fillLight.position.set(-50, 30, -50);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xB8860B, 0.5, 200);
    rimLight.position.set(0, 0, -80);
    this.scene.add(rimLight);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateCamera(): void {
    const elevation = (this.model.getCameraElevation() * Math.PI) / 180;
    const y = this.cameraDistance * Math.sin(elevation);
    const r = this.cameraDistance * Math.cos(elevation);
    const x = r * Math.sin(this.cameraAngle);
    const z = r * Math.cos(this.cameraAngle);
    this.camera.position.set(x, y + 20, z);
    this.camera.lookAt(0, 0, 0);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    this.cameraAngle += delta * 0.05;

    this.model.update(delta);
    this.updateCamera();
    this.controlPanel.updateCoordinateDisplay();

    this.renderer.render(this.scene, this.camera);
  };
}

const container = document.getElementById('app');
if (container) {
  new AstrolabeApp(container);
}
