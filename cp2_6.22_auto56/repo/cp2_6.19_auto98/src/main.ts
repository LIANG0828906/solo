import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadData, sortData, filterByCategories, DataPoint, SortMode } from './dataLoader';
import { CityBuilder } from './cityBuilder';
import { InteractionManager } from './interaction';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private cityBuilder: CityBuilder;
  private interaction: InteractionManager;
  private clock: THREE.Clock;
  private rawData: DataPoint[] = [];
  private container: HTMLElement;
  private loadingEl: HTMLElement;
  private animFrameId: number = 0;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.loadingEl = document.getElementById('loading')!;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    this.camera.position.set(30, 25, 30);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0a0e1a, 1);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.target.set(0, 0, 0);

    this.cityBuilder = new CityBuilder(this.scene, this.camera);
    this.interaction = new InteractionManager(this.scene, this.camera, this.renderer, this.cityBuilder);

    this.interaction.setDataChangeHandler((sortMode, categories) => {
      this.applyDataChanges(sortMode as SortMode, categories);
    });

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private async init(): Promise<void> {
    this.rawData = loadData();
    const initialSorted = sortData(this.rawData, 'valueDesc');
    this.cityBuilder.buildCity(initialSorted);

    this.loadingEl.classList.add('hidden');

    this.animate();
  }

  private applyDataChanges(sortMode: SortMode, categories: number[]): void {
    const filtered = filterByCategories(this.rawData, categories);
    const sorted = sortData(filtered, sortMode);
    this.cityBuilder.playWaveTransition(sorted);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    this.animFrameId = requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    this.controls.update();

    if (this.interaction.shouldAutoRotate()) {
      const angle = 0.001;
      const radius = Math.sqrt(
        this.camera.position.x ** 2 + this.camera.position.z ** 2
      );
      const currentAngle = Math.atan2(this.camera.position.z, this.camera.position.x);
      const newAngle = currentAngle + angle;
      this.camera.position.x = Math.cos(newAngle) * radius;
      this.camera.position.z = Math.sin(newAngle) * radius;
      this.camera.lookAt(0, 0, 0);
    }

    this.cityBuilder.animateBuildings(delta);

    this.renderer.render(this.scene, this.camera);
  }

  public start(): void {
    this.init();
  }

  public dispose(): void {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
  }
}

const app = new App();
app.start();
