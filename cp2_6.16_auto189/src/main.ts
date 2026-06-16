import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PlantModel, PollenSystem, PlantParams, getStagesDuration, easeInOutCubic } from './plantSimulator';
import { ControlPanel } from './controlPanel';

class PlantGrowthApp {
  appElement: HTMLElement;
  renderer!: THREE.WebGLRenderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  controls!: OrbitControls;
  ambientLight!: THREE.AmbientLight;
  directionalLight!: THREE.DirectionalLight;
  ground!: THREE.Mesh;
  plant!: PlantModel;
  pollen!: PollenSystem;
  controlPanel!: ControlPanel;
  isPlaying: boolean = true;
  globalProgress: number = 0;
  params: PlantParams = { light: 0.7, water: 0.6, speed: 1 };
  currentStage: number = -1;
  clock: THREE.Clock;
  lastFrameTime: number = 0;
  frameCount: number = 0;
  fpsAccumulator: number = 0;

  constructor() {
    this.clock = new THREE.Clock();
    const app = document.getElementById('app');
    if (!app) throw new Error('App element not found');
    this.appElement = app;
    this.initThree();
    this.initControlPanel();
    this.animate();
  }

  initThree() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.appElement.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.createBackground();

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(5, 4, 6);
    this.camera.lookAt(0, 1.5, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 18;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.target.set(0, 1.2, 0);

    this.createLights();
    this.createGround();

    this.plant = new PlantModel();
    this.scene.add(this.plant.group);

    this.pollen = new PollenSystem();
    this.scene.add(this.pollen.group);

    window.addEventListener('resize', () => this.onResize());
  }

  createBackground() {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);
    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  createLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    this.directionalLight.position.set(4, 8, 5);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 25;
    this.directionalLight.shadow.camera.left = -6;
    this.directionalLight.shadow.camera.right = 6;
    this.directionalLight.shadow.camera.top = 6;
    this.directionalLight.shadow.camera.bottom = -6;
    this.directionalLight.shadow.bias = -0.0005;
    this.scene.add(this.directionalLight);

    const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.2);
    fillLight.position.set(-3, 2, -4);
    this.scene.add(fillLight);

    this.updateLights();
  }

  updateLights() {
    const baseAmbient = 0.25;
    const baseDir = 0.4;
    this.ambientLight.intensity = baseAmbient + this.params.light * 0.5;
    this.directionalLight.intensity = baseDir + this.params.light * 0.9;
    const warmFactor = 0.7 + this.params.light * 0.3;
    this.directionalLight.color = new THREE.Color().setHSL(0.12, 0.3, warmFactor);
  }

  createGround() {
    const geometry = new THREE.CircleGeometry(8, 64);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const baseColor = '#5D6D7E';
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const a = Math.random() * 0.12;
      const gray = Math.floor(60 + Math.random() * 40);
      ctx.fillStyle = `rgba(${gray},${gray + 10},${gray + 20},${a})`;
      ctx.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 1 + Math.random() * 3;
      const a = 0.05 + Math.random() * 0.1;
      const hue = 0.28 + Math.random() * 0.08;
      ctx.fillStyle = `hsla(${hue * 360},40%,45%,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0x5D6D7E,
      transparent: true,
      opacity: 0.3,
      roughness: 0.95,
      metalness: 0,
    });
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  initControlPanel() {
    this.controlPanel = new ControlPanel({
      onProgressChange: (p) => {
        this.globalProgress = Math.max(0, Math.min(1, p));
      },
      onPlayPause: (playing) => {
        this.isPlaying = playing;
      },
      onParamsChange: (params) => {
        this.params = { ...params };
        this.updateLights();
      },
    });
    this.controlPanel.attachTo(this.appElement);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    const now = performance.now();
    if (this.lastFrameTime === 0) this.lastFrameTime = now;
    const rawDelta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    const delta = Math.min(rawDelta / 1000, 0.05);
    this.frameCount++;
    this.fpsAccumulator += rawDelta;

    if (this.isPlaying && this.controlPanel) {
      const totalDur = getStagesDuration(this.params);
      const effectiveSpeed = (1 / totalDur) * this.params.speed;
      this.globalProgress += delta * effectiveSpeed;
      if (this.globalProgress >= 1) this.globalProgress = 0;
      this.controlPanel.updateProgress(this.globalProgress);
    }

    const { stageIndex, stageProgress } = this.plant.update(this.globalProgress, this.params);
    if (stageIndex !== this.currentStage) {
      this.currentStage = stageIndex;
      this.controlPanel.setStage(stageIndex);
    }

    if (stageIndex >= 4 && stageProgress > 0.2) {
      const bloomFactor = easeInOutCubic(Math.min(1, (stageProgress - 0.2) / 0.8));
      const emitRate = 0.5 + bloomFactor * 2.5;
      const stemHeight = this.plant.getStemHeight(stageIndex, stageProgress);
      this.pollen.emit(stemHeight, emitRate * delta * 60, bloomFactor);
    }
    this.pollen.update(delta);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new PlantGrowthApp();
});
