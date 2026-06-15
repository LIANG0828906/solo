import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OceanSystem } from './ocean';
import { UIManager } from './ui';

class App {
  private container!: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private clock!: THREE.Clock;
  private oceanSystem!: OceanSystem;
  private uiManager!: UIManager;
  private animationId: number | null = null;

  private defaultCamPos = new THREE.Vector3(0, 45, 28);
  private defaultTarget = new THREE.Vector3(0, 0, 0);

  private readonly MAX_PARTICLES = 1500;
  private readonly MIN_FPS = 40;

  constructor() {
    this.init();
    this.animate();
  }

  private init(): void {
    this.container = document.getElementById('canvas-container')!;
    if (!this.container) {
      throw new Error('找不到 canvas-container 容器');
    }

    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLights();
    this.initOcean();
    this.initUI();
    this.checkPerformanceConstraints();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0F172A);
    this.scene.fog = new THREE.Fog(0x0F172A, 55, 90);
  }

  private initCamera(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    this.camera.position.copy(this.defaultCamPos);
    this.camera.lookAt(this.defaultTarget);
  }

  private initRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.75;
    this.controls.rotateSpeed = 0.8;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 0.6;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 60;
    this.controls.minPolarAngle = 0.1;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.target.copy(this.defaultTarget);
    this.controls.update();
  }

  private initLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 0.95);
    sun.position.set(25, 40, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 120;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x88aaff, 0.35);
    fill.position.set(-20, 15, -25);
    this.scene.add(fill);
  }

  private initOcean(): void {
    this.oceanSystem = new OceanSystem(this.scene, {
      oceanRadius: 20,
      gridResolution: 64,
      particlesPerCurrent: 200,
      maxTotalParticles: this.MAX_PARTICLES
    });
  }

  private initUI(): void {
    this.uiManager = new UIManager(
      this.oceanSystem,
      this.camera,
      this.renderer,
      {
        onSpeedChange: (speed: number) => {
          this.oceanSystem.setSpeedMultiplier(speed);
        },
        onTemperatureToggle: (show: boolean) => {
          this.oceanSystem.setShowTemperature(show);
        },
        onResetView: () => {
          this.resetView();
        }
      }
    );
  }

  private checkPerformanceConstraints(): void {
    const particleCount = this.oceanSystem.getTotalParticleCount();
    const maxParticles = this.oceanSystem.getMaxParticles();

    console.log(`性能检查：粒子数 ${particleCount}/${maxParticles}`);
    console.assert(
      particleCount <= this.MAX_PARTICLES,
      `粒子总数超出约束: ${particleCount} > ${this.MAX_PARTICLES}`
    );
  }

  private resetView(): void {
    const duration = 600;
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = this.defaultCamPos.clone();
    const endTarget = this.defaultTarget.clone();
    const startTime = performance.now();

    const animateReset = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animateReset);
      }
    };

    requestAnimationFrame(animateReset);
  }

  private onResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.clock ? this.clock.getDelta() : (this.clock = new THREE.Clock(), 0.016);

    this.controls.update();
    this.oceanSystem.update(delta);
    this.uiManager.update();
    this.renderer.render(this.scene, this.camera);

    const fps = this.uiManager.getCurrentFPS();
    if (fps > 0 && fps < this.MIN_FPS) {
      if (this.renderer.getPixelRatio() > 1) {
        this.renderer.setPixelRatio(1);
      }
    }
  };

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    new App();
  } catch (e) {
    console.error('应用初始化失败:', e);
  }
});
