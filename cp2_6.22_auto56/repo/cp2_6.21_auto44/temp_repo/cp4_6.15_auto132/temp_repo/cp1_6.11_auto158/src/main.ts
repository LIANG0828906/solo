import * as THREE from 'three';
import GUI from 'lil-gui';
import {
  CityConfig,
  GeneratedCity,
  generateCity,
  updateCityAnimation,
  setupLightingStyle,
  createGround,
  createGrid,
  createSkybox
} from './cityGenerator';
import { InteractionManager } from './interaction';

class CityApp {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private container!: HTMLElement;
  private city: GeneratedCity | null = null;
  private interactionManager!: InteractionManager;
  private gui!: GUI;
  private skybox!: THREE.Mesh;

  private config: CityConfig = {
    density: 80,
    heightVariance: 1.0,
    lightStyle: 'day'
  };

  private fpsElement!: HTMLElement;
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();
  private currentFps: number = 0;

  private skyboxRotationSpeed: number = (Math.PI * 2) / 120000;

  constructor() {
    this.container = document.getElementById('app')!;
    this.fpsElement = document.getElementById('fps')!;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x1a1a2e, 150, 400);

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x1a1a2e, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cursor = 'grab';

    this.skybox = createSkybox();
    this.scene.add(this.skybox);

    const ground = createGround();
    this.scene.add(ground);

    const grid = createGrid();
    this.scene.add(grid);

    setupLightingStyle(this.scene, this.config.lightStyle);

    this.interactionManager = new InteractionManager(this.camera, this.renderer.domElement);

    this.generateNewCity();

    this.setupGUI();

    window.addEventListener('resize', this.onWindowResize.bind(this));

    this.animate();
  }

  private setupGUI(): void {
    const guiContainer = document.getElementById('gui-container')!;
    this.gui = new GUI({
      container: guiContainer,
      title: '城市控制',
      width: 280
    });

    const rebuildDebounced = this.debounce(() => this.generateNewCity(), 150);

    const paramFolder = this.gui.addFolder('参数设置');
    paramFolder.open();

    paramFolder
      .add(this.config, 'density', 20, 150, 1)
      .name('建筑密度')
      .onChange(() => rebuildDebounced());

    paramFolder
      .add(this.config, 'heightVariance', 0.2, 2.0, 0.05)
      .name('高度变化')
      .onChange(() => rebuildDebounced());

    const lightOptions: Record<string, 'day' | 'night' | 'dusk'> = {
      '白天暖光': 'day',
      '夜晚霓虹': 'night',
      '黄昏剪影': 'dusk'
    };

    paramFolder
      .add(this.config, 'lightStyle', lightOptions)
      .name('灯光风格')
      .onChange((value: 'day' | 'night' | 'dusk') => {
        this.config.lightStyle = value;
        setupLightingStyle(this.scene, value);
        this.applyLightStyleToBuildings();
      });

    const regenerateButton = {
      regenerate: () => this.generateNewCity()
    };

    this.gui
      .add(regenerateButton, 'regenerate')
      .name('重新生成城市');
  }

  private debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
  ): T {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return ((...args: unknown[]) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  private generateNewCity(): void {
    if (this.city) {
      this.scene.remove(this.city.group);
      this.city.group.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    this.city = generateCity(this.config);
    this.scene.add(this.city.group);
    this.interactionManager.setCityData(this.city.group, this.city.buildings);
    this.applyLightStyleToBuildings();
  }

  private applyLightStyleToBuildings(): void {
    if (!this.city) return;

    const emissiveIntensityMap = {
      day: 0,
      night: 0.15,
      dusk: 0.08
    };

    const targetEmissive = emissiveIntensityMap[this.config.lightStyle];

    for (const building of this.city.buildings) {
      const material = building.mesh.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = targetEmissive;

      if (building.antenna) {
        const antMaterial = building.antenna.material as THREE.MeshStandardMaterial;
        if (this.config.lightStyle === 'night') {
          antMaterial.emissiveIntensity = 0.8;
        } else if (this.config.lightStyle === 'dusk') {
          antMaterial.emissiveIntensity = 0.5;
        } else {
          antMaterial.emissiveIntensity = 0.3;
        }
      }
    }
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private updateFPS(currentTime: number): void {
    this.frameCount++;

    if (currentTime - this.lastFpsTime >= 1000) {
      this.currentFps = Math.round(
        (this.frameCount * 1000) / (currentTime - this.lastFpsTime)
      );
      this.fpsElement.textContent = `FPS: ${this.currentFps}`;
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const currentTime = performance.now();

    this.skybox.rotation.y += this.skyboxRotationSpeed * 16.67;

    const skyboxMaterial = this.skybox.material as THREE.ShaderMaterial;
    if (skyboxMaterial.uniforms && skyboxMaterial.uniforms.uTime) {
      skyboxMaterial.uniforms.uTime.value = currentTime / 1000;
    }

    if (this.city) {
      updateCityAnimation(this.city, currentTime);
    }

    this.interactionManager.update(currentTime);

    this.renderer.render(this.scene, this.camera);

    this.updateFPS(currentTime);
  }

  dispose(): void {
    this.gui.destroy();
    this.renderer.dispose();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}

let app: CityApp | null = null;

window.addEventListener('DOMContentLoaded', () => {
  app = new CityApp();
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
  }
});
