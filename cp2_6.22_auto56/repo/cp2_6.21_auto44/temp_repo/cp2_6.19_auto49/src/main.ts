import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { CityBuilder } from './cityBuilder';
import { PlayerController } from './playerController';
import { EnvironmentManager, WeatherType } from './environmentManager';
import { UIController } from './uiController';

class VirtualCityApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  private cityBuilder: CityBuilder;
  private playerController: PlayerController;
  private environmentManager: EnvironmentManager;
  private uiController: UIController;

  private clock: THREE.Clock;
  private frameCount = 0;
  private lastFpsTime = 0;
  private currentFps = 60;

  constructor() {
    this.container = document.getElementById('app') || document.body;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();

    this.cityBuilder = new CityBuilder();
    this.scene.add(this.cityBuilder.group);

    this.playerController = new PlayerController(
      this.camera,
      this.renderer.domElement,
      this.cityBuilder.getBounds()
    );

    this.environmentManager = new EnvironmentManager(this.scene, this.cityBuilder);

    this.uiController = new UIController(document.body, {
      onToggleDayNight: () => this.environmentManager.toggleDayNight(),
      onWeatherChange: (weather: WeatherType) => this.environmentManager.setWeather(weather),
      onRequestFps: () => this.currentFps
    });
    this.uiController.createControlsHint();

    this.playerController.onStateChange((state) => {
      this.environmentManager.updatePlayerPosition(state);
    });

    window.addEventListener('resize', this.onWindowResize);

    this.animate();
  }

  private createCamera(): THREE.PerspectiveCamera {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 500);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(renderer.domElement);

    return renderer;
  }

  private onWindowResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 500) {
      this.currentFps = (this.frameCount * 1000) / (now - this.lastFpsTime);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    this.playerController.update(deltaTime);
    this.environmentManager.update(deltaTime);
    TWEEN.update();

    this.renderer.render(this.scene, this.camera);
  };

  public dispose(): void {
    window.removeEventListener('resize', this.onWindowResize);
    this.playerController.dispose();

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.renderer.dispose();
  }
}

function bootstrap(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new VirtualCityApp());
  } else {
    new VirtualCityApp();
  }
}

bootstrap();
