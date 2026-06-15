import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  GridHelper,
  Object3D,
  Vector3,
  Color
} from 'three';
import { CONFIG, PaletteKey } from './config';
import { Firework, FireworkConfig } from './firework';
import { Controller } from './controller';
import { AudioAnalyzer } from './audioAnalyzer';
import { globalParticlePool } from './particlePool';

export class SceneManager {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private fireworks: Firework[] = [];
  private fireworkMeshes: Object3D[] = [];
  private controller: Controller | null = null;
  private audioAnalyzer: AudioAnalyzer | null = null;
  private beatCount: number = 0;
  private orbitAngle: number = 0;
  private isDragging: boolean = false;
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 };
  private cameraRotation: { x: number; y: number } = { x: 0, y: 0.3 };
  private cameraDistance: number = 25;
  private currentPalette: PaletteKey = 'spring';
  private isAudioMode: boolean = false;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 0;
  private fpsElement: HTMLElement | null = null;
  private cleanupInterval: number = 5000;
  private lastCleanupTime: number = 0;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new Scene();
    this.scene.background = new Color(0x0a0a1a);
    
    this.camera = new PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.updateCameraPosition();
    
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.createGroundGrid();
    this.bindEvents();
    this.initController();
    this.initAudioAnalyzer();
    
    this.fpsElement = document.getElementById('fps-counter');
  }
  
  private createGroundGrid(): void {
    const gridHelper = new GridHelper(
      CONFIG.GRID_SIZE,
      CONFIG.GRID_SIZE,
      0x444466,
      0x333355
    );
    gridHelper.position.y = -5;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
  }
  
  private initController(): void {
    this.controller = new Controller({
      onBeat: (angle: number) => this.handleBeat(angle),
      onModeChange: (mode: string) => this.handleModeChange(mode),
      onPaletteChange: (palette: PaletteKey) => this.handlePaletteChange(palette),
      onThresholdChange: (threshold: number) => this.handleThresholdChange(threshold)
    });
  }
  
  private async initAudioAnalyzer(): Promise<void> {
    this.audioAnalyzer = new AudioAnalyzer();
  }
  
  private handleBeat(angle: number): void {
    if (this.isAudioMode) return;
    
    const position = this.controller!.angleToPosition(angle);
    this.addFirework({
      position: new Vector3(position.x, 0, position.z),
      palette: this.currentPalette
    });
  }
  
  private handleModeChange(mode: string): void {
    this.isAudioMode = mode === 'audio';
    
    if (this.isAudioMode && this.audioAnalyzer && !this.audioAnalyzer.isReady()) {
      this.audioAnalyzer.initialize().then(success => {
        if (!success) {
          console.error('Failed to initialize audio analyzer');
        }
      });
    }
  }
  
  private handlePaletteChange(palette: PaletteKey): void {
    this.currentPalette = palette;
  }
  
  private handleThresholdChange(threshold: number): void {
    if (this.audioAnalyzer) {
      this.audioAnalyzer.setThreshold(threshold);
    }
  }
  
  addFirework(config: FireworkConfig): void {
    if (this.fireworks.length >= CONFIG.MAX_CONCURRENT_FIREWORKS) {
      const oldestFirework = this.fireworks.shift();
      if (oldestFirework) {
        this.removeFirework(oldestFirework);
      }
    }
    
    const firework = new Firework(config);
    this.fireworks.push(firework);
    
    const mesh = firework.getMesh();
    this.fireworkMeshes.push(mesh);
    this.scene.add(mesh);
    
    this.beatCount++;
    this.controller?.updateBeatCount(this.beatCount);
  }
  
  private removeFirework(firework: Firework): void {
    const index = this.fireworks.indexOf(firework);
    if (index > -1) {
      const mesh = this.fireworkMeshes[index];
      this.scene.remove(mesh);
      firework.dispose();
      this.fireworks.splice(index, 1);
      this.fireworkMeshes.splice(index, 1);
    }
  }
  
  private updateCameraPosition(): void {
    const x = Math.sin(this.cameraRotation.y) * Math.cos(this.cameraRotation.x) * this.cameraDistance;
    const y = Math.sin(this.cameraRotation.x) * this.cameraDistance + 5;
    const z = Math.cos(this.cameraRotation.y) * Math.cos(this.cameraRotation.x) * this.cameraDistance;
    
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }
  
  private bindEvents(): void {
    window.addEventListener('resize', () => this.handleResize());
    
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', () => this.handleMouseUp());
  }
  
  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  private handleMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }
  
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    
    this.cameraRotation.y += deltaX * 0.005;
    this.cameraRotation.x += deltaY * 0.005;
    
    this.cameraRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraRotation.x));
    
    this.updateCameraPosition();
    
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  }
  
  private handleMouseUp(): void {
    this.isDragging = false;
  }
  
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const fovChange = e.deltaY * 0.05;
    this.camera.fov = Math.max(
      CONFIG.CAMERA_FOV_MIN,
      Math.min(CONFIG.CAMERA_FOV_MAX, this.camera.fov + fovChange)
    );
    this.camera.updateProjectionMatrix();
  }
  
  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }
  
  private handleTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;
    
    const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
    const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
    
    this.cameraRotation.y += deltaX * 0.005;
    this.cameraRotation.x += deltaY * 0.005;
    
    this.cameraRotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraRotation.x));
    
    this.updateCameraPosition();
    
    this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  
  private updateAutoOrbit(deltaTime: number): void {
    if (this.isDragging) return;
    
    const orbitSpeed = (Math.PI * 2) / CONFIG.CAMERA_ORBIT_PERIOD;
    this.orbitAngle += orbitSpeed * deltaTime;
    
    const ellipseA = 30;
    const ellipseB = 20;
    
    this.cameraRotation.y = this.orbitAngle;
    this.cameraDistance = (ellipseA + ellipseB) / 2 + 
      (ellipseA - ellipseB) / 2 * Math.cos(this.orbitAngle * 2);
    
    this.updateCameraPosition();
  }
  
  private checkAudioTrigger(): void {
    if (!this.isAudioMode || !this.audioAnalyzer || !this.audioAnalyzer.isReady()) return;
    
    const result = this.audioAnalyzer.shouldTrigger();
    
    if (result.triggered && result.band) {
      const angle = Math.random() * Math.PI * 2;
      const position = this.controller!.angleToPosition(angle);
      
      this.addFirework({
        position: new Vector3(position.x, 0, position.z),
        palette: this.currentPalette,
        frequencyBand: result.band
      });
    }
  }
  
  private cleanupDeadFireworks(): void {
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      if (!this.fireworks[i].isAlive()) {
        this.removeFirework(this.fireworks[i]);
      }
    }
    
    globalParticlePool.forceCleanup();
  }
  
  private updateFPS(timestamp: number): void {
    this.frameCount++;
    
    if (timestamp - this.lastFrameTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFrameTime = timestamp;
      
      if (this.fpsElement) {
        this.fpsElement.textContent = `FPS: ${this.fps}`;
      }
    }
  }
  
  start(): void {
    this.lastFrameTime = performance.now();
    this.lastCleanupTime = performance.now();
    this.animate();
  }
  
  private animate = (): void => {
    requestAnimationFrame(this.animate);
    
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;
    
    this.updateFPS(currentTime);
    
    if (currentTime - this.lastCleanupTime > this.cleanupInterval) {
      this.cleanupDeadFireworks();
      this.lastCleanupTime = currentTime;
    }
    
    this.updateAutoOrbit(deltaTime);
    
    this.checkAudioTrigger();
    
    for (const firework of this.fireworks) {
      firework.update(deltaTime);
    }
    
    this.renderer.render(this.scene, this.camera);
  };
  
  setCamera(fov?: number, position?: Vector3): void {
    if (fov) {
      this.camera.fov = Math.max(CONFIG.CAMERA_FOV_MIN, Math.min(CONFIG.CAMERA_FOV_MAX, fov));
      this.camera.updateProjectionMatrix();
    }
    
    if (position) {
      this.camera.position.copy(position);
      this.camera.lookAt(0, 0, 0);
    }
  }
  
  dispose(): void {
    for (const firework of this.fireworks) {
      firework.dispose();
    }
    this.fireworks = [];
    this.fireworkMeshes = [];
    
    this.controller?.dispose();
    this.audioAnalyzer?.dispose();
    
    this.renderer.dispose();
  }
}