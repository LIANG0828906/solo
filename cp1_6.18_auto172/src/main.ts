import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleEngine, ParticleGroup } from './engine/particleEngine';
import { ImageryData } from './engine/semanticParser';
import { InputPanel } from './ui/inputPanel';
import { InfoPanel } from './ui/infoPanel';

class DreamTreeHoleApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private particleEngine: ParticleEngine;
  private inputPanel: InputPanel;
  private infoPanel: InfoPanel;
  private container: HTMLElement;
  private clock: THREE.Clock;
  private keys: Set<string> = new Set();
  private moveSpeed: number = 0.15;
  private statsDiv: HTMLDivElement | null = null;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 0;

  constructor() {
    this.container = document.getElementById('app')!;
    this.clock = new THREE.Clock();

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.createControls();

    this.setupEnvironment();
    this.setupKeyboardControls();

    this.particleEngine = new ParticleEngine(this.scene, this.camera, this.renderer.domElement);
    this.particleEngine.setInteractionCallback(this.onParticleGroupClick.bind(this));

    this.inputPanel = new InputPanel(this.container);
    this.inputPanel.setGenerateCallback(this.onGenerate.bind(this));
    this.inputPanel.setClearCallback(this.onClear.bind(this));
    this.inputPanel.mount();

    this.infoPanel = new InfoPanel(this.container);
    this.infoPanel.mount();

    this.createStatsDisplay();

    this.handleResize();
    window.addEventListener('resize', this.handleResize.bind(this));

    this.loadDefaultScene();

    this.animate();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#1A1A3E');
    gradient.addColorStop(0.5, '#12122E');
    gradient.addColorStop(1, '#0B0B1A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    scene.background = texture;

    scene.fog = new THREE.FogExp2(0x0B0B1A, 0.018);

    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 6, 22);
    camera.lookAt(0, 2, 0);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const canvasContainer = document.getElementById('canvas-container')!;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0B0B1A, 1);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    canvasContainer.appendChild(renderer.domElement);

    return renderer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;

    controls.minDistance = 3;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 2, 0);

    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };

    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    return controls;
  }

  private setupEnvironment(): void {
    const gridSize = 50;
    const gridDivisions = 50;

    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x2A2A4E, 0x2A2A4E);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.3;
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(0x3A3A5E, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x6A6ABE, 0.8);
    directionalLight.position.set(10, 20, 10);
    this.scene.add(directionalLight);

    const rimLight = new THREE.DirectionalLight(0x4682B4, 0.3);
    rimLight.position.set(-15, 10, -10);
    this.scene.add(rimLight);

    this.addFloatingParticles();
  }

  private addFloatingParticles(): void {
    const count = 300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 60;
      positions[i3 + 1] = Math.random() * 20 + 0.5;
      positions[i3 + 2] = (Math.random() - 0.5) * 60;

      const shade = 0.5 + Math.random() * 0.5;
      colors[i3] = 0.55 * shade;
      colors[i3 + 1] = 0.55 * shade;
      colors[i3 + 2] = 0.85 * shade;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    points.userData.isAmbient = true;
    this.scene.add(points);
  }

  private setupKeyboardControls(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  private updateKeyboardMovement(): void {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let moved = false;
    const offset = new THREE.Vector3(0, 0, 0);

    if (this.keys.has('KeyW')) {
      offset.add(forward);
      moved = true;
    }
    if (this.keys.has('KeyS')) {
      offset.sub(forward);
      moved = true;
    }
    if (this.keys.has('KeyA')) {
      offset.sub(right);
      moved = true;
    }
    if (this.keys.has('KeyD')) {
      offset.add(right);
      moved = true;
    }
    if (this.keys.has('Space')) {
      offset.y += 1;
      moved = true;
    }
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) {
      offset.y -= 1;
      moved = true;
    }

    if (moved) {
      offset.normalize().multiplyScalar(this.moveSpeed);

      const newCamPos = this.camera.position.clone().add(offset);
      newCamPos.y = Math.max(1, Math.min(25, newCamPos.y));

      const maxDist = 45;
      if (Math.abs(newCamPos.x) < maxDist && Math.abs(newCamPos.z) < maxDist) {
        this.camera.position.copy(newCamPos);
      }

      const newTarget = this.controls.target.clone().add(offset);
      newTarget.y = Math.max(0.5, Math.min(20, newTarget.y));
      if (Math.abs(newTarget.x) < maxDist && Math.abs(newTarget.z) < maxDist) {
        this.controls.target.copy(newTarget);
      }
    }
  }

  private onGenerate(imageryList: ImageryData[]): void {
    this.particleEngine.clearAll();
    this.particleEngine.createParticleGroups(imageryList);
    this.updateStatsDisplay();
  }

  private onClear(): void {
    this.particleEngine.clearAll();
    this.updateStatsDisplay();
  }

  private onParticleGroupClick(group: ParticleGroup, _intersection: THREE.Intersection): void {
    this.infoPanel.showGroup(group);
  }

  private loadDefaultScene(): void {
    const defaultText = '我漫步在迷雾笼罩的森林边缘，远处湖泊如镜，倒映着漫天星辰，月光温柔地洒落在回忆之上。';
    this.inputPanel.setInputText(defaultText);

    setTimeout(() => {
      import('./engine/semanticParser').then(({ parseInputText }) => {
        const imageryList = parseInputText(defaultText);
        this.onGenerate(imageryList);
      });
    }, 500);
  }

  private handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private createStatsDisplay(): void {
    this.statsDiv = document.createElement('div');
    this.statsDiv.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 40px;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(74, 74, 110, 0.5);
      border-radius: 8px;
      padding: 8px 14px;
      color: #8A8ABE;
      font-size: 11px;
      font-family: monospace;
      z-index: 100;
      line-height: 1.6;
      letter-spacing: 0.5px;
      pointer-events: none;
    `;
    this.container.appendChild(this.statsDiv);
    this.updateStatsDisplay();
  }

  private updateStatsDisplay(): void {
    if (!this.statsDiv) return;
    const total = this.particleEngine.getTotalParticleCount();
    const groups = this.particleEngine.getAllGroups().length;
    this.statsDiv.innerHTML = `
      <div>FPS: <span style="color: #E0E0FF;" id="fps-counter">--</span></div>
      <div>粒子: <span style="color: #E0E0FF;">${total.toLocaleString()}</span> / 30,000</div>
      <div>意象群: <span style="color: #E0E0FF;">${groups}</span></div>
    `;
  }

  private updateFps(time: number): void {
    this.frameCount++;
    if (time - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = time;

      const fpsEl = document.getElementById('fps-counter');
      if (fpsEl) {
        const color = this.currentFps >= 30 ? '#2E8B57' : this.currentFps >= 20 ? '#FFD700' : '#FF6347';
        fpsEl.textContent = String(this.currentFps);
        fpsEl.style.color = color;
      }
    }
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const time = performance.now();
    const delta = this.clock.getDelta();

    this.updateKeyboardMovement();
    this.controls.update();
    this.particleEngine.update(time, delta);

    this.scene.traverse((obj) => {
      if ((obj as THREE.Points).userData?.isAmbient) {
        const positions = ((obj as THREE.Points).geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += 0.002 + Math.sin(time * 0.001 + i) * 0.001;
          if (positions[i + 1] > 22) positions[i + 1] = 0.5;
        }
        ((obj as THREE.Points).geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      }
    });

    this.renderer.render(this.scene, this.camera);
    this.updateFps(time);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new DreamTreeHoleApp();
});
