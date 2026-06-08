import * as THREE from 'three';
import { WeatherEnvironment } from './weatherEnvironment';
import { UIOverlay } from './uiOverlay';
import { AnimationController } from './animationController';
import { generateWeatherData, getPresetCities } from './weatherData';
import type { CityWeatherData, WeatherUpdate } from './types';

class WeatherApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private weatherEnv: WeatherEnvironment;
  private ui: UIOverlay;
  private animCtrl: AnimationController;

  private currentData: CityWeatherData | null = null;
  private lastWeatherUpdate: WeatherUpdate | null = null;

  private isDragging: boolean = false;
  private previousMouse: { x: number; y: number } = { x: 0, y: 0 };
  private cameraTarget: THREE.Vector3;
  private cameraTheta: number = 0;
  private cameraPhi: number = Math.PI / 3;
  private cameraRadius: number = 25;
  private targetTheta: number = 0;
  private targetPhi: number = Math.PI / 3;
  private targetRadius: number = 25;

  private readonly DEFAULT_THETA = 0;
  private readonly DEFAULT_PHI = Math.PI / 3;
  private readonly DEFAULT_RADIUS = 25;

  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;

  constructor() {
    const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1628);

    const container = canvas.parentElement!;
    const rect = container.getBoundingClientRect();

    this.camera = new THREE.PerspectiveCamera(60, rect.width / rect.height, 0.1, 1000);
    this.cameraTarget = new THREE.Vector3(0, 5, 0);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(rect.width, rect.height);

    this.weatherEnv = new WeatherEnvironment(this.scene);
    this.ui = new UIOverlay();
    this.animCtrl = new AnimationController();

    this.bindEvents();
    this.loadDefaultCity();
    this.animate();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize.bind(this));

    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    this.ui.onCitySelect(this.onCitySelect.bind(this));
    this.ui.onPlayPause(this.onPlayPause.bind(this));
    this.ui.onSpeedChange(this.onSpeedChange.bind(this));
    this.ui.onSeek(this.onSeek.bind(this));
    this.ui.onResetView(this.onResetView.bind(this));

    this.animCtrl.onTick(this.onAnimationTick.bind(this));
  }

  private onResize(): void {
    const container = this.renderer.domElement.parentElement!;
    const rect = container.getBoundingClientRect();
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height);
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.previousMouse = { x: e.clientX, y: e.clientY };
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.previousMouse.x;
    const deltaY = e.clientY - this.previousMouse.y;

    this.targetTheta -= deltaX * 0.005;
    this.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.targetPhi + deltaY * 0.005));

    this.previousMouse = { x: e.clientX, y: e.clientY };
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    this.targetRadius = Math.max(8, Math.min(60, this.targetRadius * zoomFactor));
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (!this.isDragging || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - this.previousMouse.x;
    const deltaY = e.touches[0].clientY - this.previousMouse.y;

    this.targetTheta -= deltaX * 0.005;
    this.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.targetPhi + deltaY * 0.005));

    this.previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  private onTouchEnd(): void {
    this.isDragging = false;
  }

  private onCitySelect(cityName: string): void {
    const data = generateWeatherData(cityName);
    this.currentData = data;
    this.animCtrl.setData(data.hours);
    this.ui.setWeatherData(data);
  }

  private onPlayPause(): void {
    const playing = this.animCtrl.togglePlay();
    this.ui.setPlaying(playing);
  }

  private onSpeedChange(speed: number): void {
    this.animCtrl.setSpeed(speed);
  }

  private onSeek(time: number): void {
    this.animCtrl.seekTo(time);
  }

  private onResetView(): void {
    this.targetTheta = this.DEFAULT_THETA;
    this.targetPhi = this.DEFAULT_PHI;
    this.targetRadius = this.DEFAULT_RADIUS;
  }

  private onAnimationTick(update: WeatherUpdate): void {
    this.lastWeatherUpdate = update;
    this.weatherEnv.update(update);
    this.ui.update(update);
  }

  private loadDefaultCity(): void {
    const cities = getPresetCities();
    if (cities.length > 0) {
      this.onCitySelect(cities[0]);
    }
  }

  private updateCameraPosition(): void {
    this.cameraTheta = THREE.MathUtils.lerp(this.cameraTheta, this.targetTheta, 0.1);
    this.cameraPhi = THREE.MathUtils.lerp(this.cameraPhi, this.targetPhi, 0.1);
    this.cameraRadius = THREE.MathUtils.lerp(this.cameraRadius, this.targetRadius, 0.1);

    const x = this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
    const y = this.cameraRadius * Math.cos(this.cameraPhi);
    const z = this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);

    this.camera.position.set(
      this.cameraTarget.x + x,
      this.cameraTarget.y + y,
      this.cameraTarget.z + z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    this.updateCameraPosition();
    this.renderer.render(this.scene, this.camera);

    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = now;
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  new WeatherApp();
});
