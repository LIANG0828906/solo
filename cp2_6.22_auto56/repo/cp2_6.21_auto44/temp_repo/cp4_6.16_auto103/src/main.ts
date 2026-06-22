import * as THREE from 'three';
import { ParticleSystem } from './particleSystem';
import { ControlPanel } from './controlPanel';
import { ExplosionShape, ParticleConfig, ExplosionHistory, COLOR_PALETTE } from './types';

class FireworksApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particleSystem: ParticleSystem;
  private controlPanel: ControlPanel;
  private container: HTMLElement;
  private clock: THREE.Clock;
  private stars: THREE.Points | null = null;
  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private cameraAngleY: number = 0;
  private cameraDistance: number = 25;
  private autoFireEnabled: boolean = false;
  private lastAutoFireTime: number = 0;
  private nextAutoFireInterval: number = 0;
  private selectedColors: string[] = ['#FF6B35', '#FFE66D'];
  private selectedShape: ExplosionShape = 'circle';
  private particleCount: number = 150;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.scene.background = this.createGradientBackground();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.particleSystem = new ParticleSystem(this.scene, this.camera, this.renderer);

    this.controlPanel = new ControlPanel(this.container, {
      onColorChange: (colors) => this.handleColorChange(colors),
      onShapeChange: (shape) => this.handleShapeChange(shape),
      onParticleCountChange: (count) => this.handleParticleCountChange(count),
      onAutoFireChange: (enabled) => this.handleAutoFireChange(enabled),
      onReplay: (config) => this.handleReplay(config),
    });

    this.createStars();
    this.setupEventListeners();
    this.animate();
  }

  private createGradientBackground(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private createStars(): void {
    const starCount = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const twinkleSpeeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 80 + Math.random() * 40;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 10;
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.7 + Math.random() * 0.3;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;

      sizes[i] = 0.15 + Math.random() * 0.35;
      twinkleSpeeds[i] = 0.5 + Math.random() * 1.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute float twinkleSpeed;
        varying vec3 vColor;
        varying float vTwinkle;
        uniform float time;
        void main() {
          vColor = color;
          vTwinkle = 0.5 + 0.5 * sin(time * twinkleSpeed);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;
          float alpha = (1.0 - r * 2.0) * vTwinkle;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.handleResize());

    this.renderer.domElement.addEventListener('click', (e) => this.handleClick(e));
    this.renderer.domElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.renderer.domElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.renderer.domElement.addEventListener('mouseup', () => this.handleMouseUp());
    this.renderer.domElement.addEventListener('mouseleave', () => this.handleMouseUp());
    this.renderer.domElement.addEventListener('wheel', (e) => this.handleWheel(e));

    this.renderer.domElement.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.renderer.domElement.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.renderer.domElement.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private handleClick(e: MouseEvent): void {
    if (this.isDragging) return;
    this.launchFireworkFromScreen(e.clientX, e.clientY);
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isDragging = false;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private handleMouseMove(e: MouseEvent): void {
    if (e.buttons !== 1) return;

    const deltaX = e.clientX - this.previousMousePosition.x;
    if (Math.abs(deltaX) > 5) {
      this.isDragging = true;
    }

    if (this.isDragging) {
      this.cameraAngleY += deltaX * 0.005;
      this.updateCameraPosition();
    }

    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  private handleMouseUp(): void {
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    this.cameraDistance = Math.max(10, Math.min(60, this.cameraDistance + e.deltaY * 0.05));
    this.updateCameraPosition();
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.isDragging = false;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1) {
      e.preventDefault();
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      if (Math.abs(deltaX) > 5) {
        this.isDragging = true;
      }

      if (this.isDragging) {
        this.cameraAngleY += deltaX * 0.005;
        this.updateCameraPosition();
      }

      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (!this.isDragging && e.changedTouches.length === 1) {
      e.preventDefault();
      this.launchFireworkFromScreen(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  }

  private handleColorChange(colors: string[]): void {
    this.selectedColors = colors.length > 0 ? colors : ['#FF6B35', '#FFE66D'];
  }

  private handleShapeChange(shape: ExplosionShape): void {
    this.selectedShape = shape;
  }

  private handleParticleCountChange(count: number): void {
    this.particleCount = count;
  }

  private handleAutoFireChange(enabled: boolean): void {
    this.autoFireEnabled = enabled;
    if (enabled) {
      this.lastAutoFireTime = performance.now();
      this.nextAutoFireInterval = 2000 + Math.random() * 1000;
    }
  }

  private handleReplay(config: ParticleConfig): void {
    this.particleSystem.replayFirework(config);
  }

  private launchFireworkFromScreen(screenX: number, screenY: number): void {
    this.mouse.x = (screenX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(screenY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersectPoint);

    const launchPos = {
      x: intersectPoint.x,
      y: -5,
      z: intersectPoint.z,
    };

    this.launchFirework(launchPos);
  }

  private launchFirework(launchPos: { x: number; y: number; z: number }): ParticleConfig {
    const config = this.particleSystem.launchFirework(
      launchPos,
      [...this.selectedColors],
      this.selectedShape,
      this.particleCount
    );

    setTimeout(() => {
      const snapshot = this.particleSystem.takeSnapshot();
      const historyRecord: ExplosionHistory = {
        config,
        snapshot,
        timestamp: config.timestamp,
      };
      this.controlPanel.addHistoryRecord(historyRecord);
    }, 1500);

    return config;
  }

  private updateCameraPosition(): void {
    this.camera.position.x = Math.sin(this.cameraAngleY) * this.cameraDistance;
    this.camera.position.z = Math.cos(this.cameraAngleY) * this.cameraDistance;
    this.camera.position.y = 5;
    this.camera.lookAt(0, 3, 0);
  }

  private updateAutoFire(currentTime: number): void {
    if (!this.autoFireEnabled) return;

    if (currentTime - this.lastAutoFireTime >= this.nextAutoFireInterval) {
      const randomX = (Math.random() - 0.5) * 15;
      const randomZ = (Math.random() - 0.5) * 8;
      const launchPos = { x: randomX, y: -5, z: randomZ };

      const originalColors = [...this.selectedColors];
      const originalShape = this.selectedShape;

      this.selectedColors = this.getRandomColors();
      this.selectedShape = this.getRandomShape();

      this.launchFirework(launchPos);

      this.selectedColors = originalColors;
      this.selectedShape = originalShape;

      this.lastAutoFireTime = currentTime;
      this.nextAutoFireInterval = 2000 + Math.random() * 1000;
    }
  }

  private getRandomColors(): string[] {
    const count = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...COLOR_PALETTE].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((c) => c.color);
  }

  private getRandomShape(): ExplosionShape {
    const shapes: ExplosionShape[] = ['circle', 'star', 'heart'];
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const currentTime = performance.now();

    if (this.stars) {
      const material = this.stars.material as THREE.ShaderMaterial;
      material.uniforms.time.value += deltaTime;
    }

    this.particleSystem.update(deltaTime);
    this.updateAutoFire(currentTime);

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new FireworksApp();
});
