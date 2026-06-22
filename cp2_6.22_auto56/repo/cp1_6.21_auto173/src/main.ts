import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParticleSystem } from './particleSystem';
import { ControlPanel } from './controls';
import {
  createGround,
  createObstacles,
  createWindArrow,
  updateWindArrow,
  FPSCounter,
  updateParticleCount,
  hideLoadingOverlay,
  setupLights,
  setupFog
} from './sceneUtils';
import './style.css';

class SandstormApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private particleSystem: ParticleSystem;
  private fpsCounter: FPSCounter;
  private windArrow: THREE.Group;
  private clock: THREE.Clock;
  private targetWindDirection: number;
  private currentWindDirection: number;

  constructor() {
    this.clock = new THREE.Clock();
    this.targetWindDirection = 45;
    this.currentWindDirection = 45;
    
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();
    
    setupLights(this.scene);
    setupFog(this.scene);
    
    createGround(this.scene);
    const obstacles = createObstacles(this.scene, 10);
    
    this.windArrow = createWindArrow(this.scene);
    
    this.particleSystem = new ParticleSystem(this.scene, {
      particleCount: 10000,
      stormIntensity: 1.5,
      windDirection: 45,
      primaryColor: '#C2955A'
    });
    
    this.particleSystem.setObstacles(obstacles);
    
    new ControlPanel('control-panel', {
      onIntensityChange: (value) => this.particleSystem.setStormIntensity(value),
      onWindDirectionChange: (value) => {
        this.targetWindDirection = value;
        this.particleSystem.setWindDirection(value);
      },
      onColorChange: (color) => this.particleSystem.setPrimaryColor(color)
    }, {
      stormIntensity: 1.5,
      windDirection: 45,
      primaryColor: '#C2955A'
    });
    
    this.fpsCounter = new FPSCounter('fps-counter');
    updateParticleCount('particle-count', this.particleSystem.getParticleCount());
    
    this.bindResize();
    
    setTimeout(() => {
      hideLoadingOverlay('loading-overlay');
    }, 500);
    
    this.animate();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1A1A2E);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const canvas = document.getElementById('canvas');
    if (!canvas) throw new Error('Canvas element not found');
    
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(25, 15, 25);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    if (!canvas) throw new Error('Canvas element not found');
    
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    
    const app = document.getElementById('app');
    const width = app?.clientWidth || window.innerWidth;
    const height = window.innerHeight;
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x1A1A2E);
    
    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 40;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 5, 0);
    
    return controls;
  }

  private bindResize(): void {
    window.addEventListener('resize', () => {
      const app = document.getElementById('app');
      const width = app?.clientWidth || window.innerWidth;
      const height = window.innerHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(width, height);
    });
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    this.particleSystem.update(deltaTime);
    
    const windDiff = this.targetWindDirection - this.currentWindDirection;
    if (Math.abs(windDiff) > 180) {
      this.currentWindDirection += windDiff > 0 ? 360 : -360;
    }
    this.currentWindDirection += (this.targetWindDirection - this.currentWindDirection) * deltaTime * 2;
    
    updateWindArrow(this.windArrow, this.currentWindDirection);
    
    this.controls.update();
    this.fpsCounter.update();
    this.renderer.render(this.scene, this.camera);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SandstormApp();
});
