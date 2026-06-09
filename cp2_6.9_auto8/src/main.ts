import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CollisionSimulator, SimulatorParams, SimulatorState } from './CollisionSimulator';
import { UI } from './UI';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private simulator: CollisionSimulator;
  private ui: UI;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private ambientLight: THREE.AmbientLight;
  private pointLight1: THREE.PointLight;
  private pointLight2: THREE.PointLight;

  constructor() {
    this.clock = new THREE.Clock();
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e27);
    this.scene.fog = new THREE.Fog(0x0a0e27, 20, 100);
    
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      throw new Error('Cannot find #app element');
    }
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 15);
    this.camera.lookAt(0, 0, 0);
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    appContainer.appendChild(this.renderer.domElement);
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.enablePan = true;
    
    this.ambientLight = new THREE.AmbientLight(0x404050, 0.5);
    this.scene.add(this.ambientLight);
    
    this.pointLight1 = new THREE.PointLight(0xffdd55, 2, 20);
    this.pointLight1.position.set(-5, 0, 0);
    this.pointLight1.castShadow = true;
    this.scene.add(this.pointLight1);
    
    this.pointLight2 = new THREE.PointLight(0x4488ff, 2, 20);
    this.pointLight2.position.set(5, 0, 0);
    this.pointLight2.castShadow = true;
    this.scene.add(this.pointLight2);
    
    const simulatorParams: SimulatorParams = {
      G: 0.05,
      simulationSpeed: 1,
      particleSize: 0.08,
      showTrails: false
    };
    
    this.simulator = new CollisionSimulator(this.scene, simulatorParams);
    
    this.ui = new UI({
      simulator: this.simulator,
      camera: this.camera,
      renderer: this.renderer,
      onStartStop: () => this.toggleSimulation(),
      onReset: () => this.resetSimulation()
    });
    
    window.addEventListener('resize', () => this.onWindowResize());
    
    this.animate();
  }

  private toggleSimulation(): void {
    if (this.simulator.isRunning) {
      this.simulator.stop();
      this.ui.setHandlesVisible(true);
    } else {
      if (this.simulator.checkLock()) {
        this.simulator.start();
        this.ui.setHandlesVisible(false);
      } else {
        alert('请先将两个星系移动到引力锁定范围内（距离<1.5）');
      }
    }
  }

  private resetSimulation(): void {
    this.simulator.reset();
    this.ui.resetVelocitySliders();
    this.ui.setHandlesVisible(true);
    this.ui.updateState(this.simulator.getState());
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const delta = Math.min(this.clock.getDelta(), 0.1);
    
    this.controls.update();
    
    const state: SimulatorState = this.simulator.update(delta);
    
    this.pointLight1.position.copy(this.simulator.galaxy1.position);
    this.pointLight2.position.copy(this.simulator.galaxy2.position);
    
    const dist = this.simulator.galaxy1.position.distanceTo(this.simulator.galaxy2.position);
    const intensity = Math.max(0.5, 3 - dist * 0.3);
    this.pointLight1.intensity = intensity;
    this.pointLight2.intensity = intensity;
    
    this.ui.updateState(state);
    this.ui.updateSliderAnimations();
    
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.simulator.dispose();
    this.ui.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    
    window.removeEventListener('resize', () => this.onWindowResize());
  }
}

const app = new App();

window.addEventListener('beforeunload', () => {
  app.dispose();
});
