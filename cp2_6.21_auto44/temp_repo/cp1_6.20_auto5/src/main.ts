import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NebulaParticles } from './nebulalParticles';
import { UIControls } from './controls';
import { setTheme, ColorTheme } from './colorThemes';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private nebulaParticles: NebulaParticles;
  private uiControls: UIControls;
  private clock: THREE.Clock;
  private container: HTMLElement;

  constructor() {
    this.clock = new THREE.Clock();
    this.container = document.getElementById('canvas-container') as HTMLElement;

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();

    this.nebulaParticles = new NebulaParticles(this.scene, 8000);

    this.uiControls = new UIControls({
      onParticleCountChange: (count: number) => this.nebulaParticles.setParticleCount(count),
      onRotationSpeedChange: (speed: number) => this.nebulaParticles.setRotationSpeed(speed),
      onThemeChange: (theme: ColorTheme) => setTheme(theme)
    });

    this.nebulaParticles.setRotationSpeed(this.uiControls.getRotationSpeed());

    window.addEventListener('resize', this.onResize.bind(this));

    this.animate();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.002);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 50, 150);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 30;
    controls.maxDistance = 500;
    controls.enablePan = false;
    return controls;
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();

    this.nebulaParticles.update(deltaTime);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

new App();
