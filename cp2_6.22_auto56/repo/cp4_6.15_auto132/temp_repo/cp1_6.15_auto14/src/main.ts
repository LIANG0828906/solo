import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gameState } from './gameState';
import { tradeManager } from './tradeManager';
import { StarMap } from './starMap';
import { SpaceShip } from './spaceShip';
import { UILayer } from './uiLayer';

class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private starMap!: StarMap;
  private spaceShip!: SpaceShip;
  private uiLayer!: UILayer;
  private container: HTMLElement;
  private animationId: number = 0;
  private lastTime: number = 0;
  private frameCount: number = 0;
  private fps: number = 60;
  private hoveredPlanetId: string | null = null;
  private perfPanel!: HTMLElement;
  private fpsElement!: HTMLElement;
  private particlesElement!: HTMLElement;
  private renderTimeElement!: HTMLElement;
  private renderTime: number = 0;

  constructor() {
    this.container = document.getElementById('canvas-container') || document.body;
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.01);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 40, 50);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 80;
    this.controls.maxPolarAngle = Math.PI * 0.45;
    this.controls.enablePan = true;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };

    this.setupLighting();
    this.createGameObjects();
    this.setupEventListeners();
    this.createPerfPanel();
    
    this.lastTime = performance.now();
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404080, 0.4);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(50, 50, 50);
    mainLight.castShadow = false;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x6366f1, 0.3);
    fillLight.position.set(-50, -30, -50);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x8b5cf6, 0.5, 100);
    rimLight.position.set(0, 0, 0);
    this.scene.add(rimLight);
  }

  private createGameObjects(): void {
    this.starMap = new StarMap(this.scene);
    this.spaceShip = new SpaceShip(this.scene);
    this.uiLayer = new UILayer();

    this.starMap.setOnPlanetSelect((planetId) => {
      if (planetId) {
        const ship = gameState.getShip();
        if (ship.currentPlanetId && !ship.isFlying) {
          const confirmTravel = confirm(`确定要飞往 ${gameState.getPlanet(planetId)?.name} 吗？`);
          if (confirmTravel) {
            this.travelToPlanet(planetId);
          }
        } else if (ship.isFlying) {
          this.uiLayer['showToast']('飞船正在飞行中，请稍候...', 'info');
        }
      }
    });

    window.addEventListener('mission-accepted', () => {
      this.starMap.updateMissionHighlights();
    });
  }

  private travelToPlanet(planetId: string): void {
    const success = this.spaceShip.flyTo(planetId, () => {
      gameState.setSelectedPlanetId(null);
      this.starMap.hideHighlight();
      this.starMap.updateMissionHighlights();
    });

    if (!success) {
      this.uiLayer['showToast']('无法飞往该星球', 'error');
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));
    
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private onClick(event: MouseEvent): void {
    if (event.button !== 0) return;
    
    const planetId = this.starMap.handleClick(event, this.camera);
    if (!planetId) {
      gameState.setSelectedPlanetId(null);
      this.starMap.hideHighlight();
    }
  }

  private onMouseMove(event: MouseEvent): void {
    const planetId = this.starMap.handleHover(event, this.camera);
    
    if (planetId !== this.hoveredPlanetId) {
      this.hoveredPlanetId = planetId;
      this.renderer.domElement.style.cursor = planetId ? 'pointer' : 'grab';
    }
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1 / deltaTime);
    }

    this.update(deltaTime);
    this.render();

    gameState.updateGameTime(deltaTime);
    gameState.processEventQueue();
  }

  private update(deltaTime: number): void {
    this.controls.update();
    
    this.starMap.update(deltaTime);
    this.spaceShip.update(deltaTime);
    tradeManager.update(deltaTime);
    this.uiLayer.update();

    const shipPosition = this.spaceShip.getPosition();
    const cameraTarget = new THREE.Vector3(
      shipPosition.x * 0.3,
      shipPosition.y * 0.3 + 10,
      shipPosition.z * 0.3 + 20
    );
    
    this.camera.position.lerp(cameraTarget, deltaTime * 0.5);
    this.controls.target.lerp(shipPosition, deltaTime * 0.5);

    this.camera.position.clampLength(8, 80);

    if (this.frameCount % 10 === 0) {
      const particleInfo = this.getTotalParticles();
      if (particleInfo.total > 2800) {
        console.warn(`粒子数量接近上限: ${particleInfo.total}/3000`);
      }
    }

    if (this.frameCount % 180 === 0) {
      const particleInfo = this.getTotalParticles();
      const drawCalls = this.estimateDrawCalls();
      console.log(`📊 性能统计 [${new Date().toLocaleTimeString()}]`);
      console.log(`   FPS: ${this.fps}`);
      console.log(`   粒子总数: ${particleInfo.total}`);
      console.log(`   Draw Call 估算: ${drawCalls}`);
      console.log(`   渲染时间: ${this.renderTime.toFixed(2)}ms`);
    }

    if (this.frameCount % 30 === 0) {
      this.updatePerfPanel();
    }
  }

  private getTotalParticles(): { total: number; details: Map<string, number> } {
    const details = new Map<string, number>();
    let total = 0;
    this.scene.traverse((object) => {
      if (object instanceof THREE.Points) {
        const count = object.geometry.attributes.position.count;
        total += count;
        const name = object.name || 'unnamed';
        details.set(name, (details.get(name) || 0) + count);
      }
    });
    if (this.frameCount % 180 === 0) {
      console.log('💫 粒子数量统计:');
      details.forEach((count, name) => {
        console.log(`   ${name}: ${count}`);
      });
    }
    return { total, details };
  }

  private estimateDrawCalls(): number {
    let count = 0;
    this.scene.traverse((object) => {
      if ((object as THREE.Object3D).visible) {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line || object instanceof THREE.Sprite) {
          count++;
        }
      }
    });
    return count;
  }

  private createPerfPanel(): void {
    this.perfPanel = document.createElement('div');
    this.perfPanel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.65);
      color: #00ffff;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 11px;
      line-height: 1.4;
      border-radius: 6px;
      min-width: 180px;
      height: 60px;
      z-index: 9999;
      pointer-events: none;
      user-select: none;
      border: 1px solid rgba(0, 255, 255, 0.2);
    `;
    this.perfPanel.innerHTML = `
      <div style="font-weight:bold; color:#ffffff; margin-bottom:3px;">🚀 Performance</div>
      <div id="perf-fps">FPS: --</div>
      <div id="perf-particles">Particles: --</div>
      <div id="perf-render">Render: --</div>
    `;
    document.body.appendChild(this.perfPanel);
    this.fpsElement = this.perfPanel.querySelector('#perf-fps')!;
    this.particlesElement = this.perfPanel.querySelector('#perf-particles')!;
    this.renderTimeElement = this.perfPanel.querySelector('#perf-render')!;
  }

  private updatePerfPanel(): void {
    const particleInfo = this.getTotalParticles();
    this.fpsElement.textContent = `FPS: ${this.fps}`;
    this.particlesElement.textContent = `Particles: ${particleInfo.total}/3000`;
    this.renderTimeElement.textContent = `Render: ${this.renderTime.toFixed(1)}ms`;
  }

  private render(): void {
    const renderStart = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.renderTime = performance.now() - renderStart;
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    
    this.starMap.dispose();
    this.spaceShip.dispose();
    this.uiLayer.dispose();
    
    this.renderer.dispose();
    
    window.removeEventListener('resize', this.onResize.bind(this));
    this.container.removeChild(this.renderer.domElement);
    
    if (this.perfPanel && this.perfPanel.parentNode) {
      this.perfPanel.parentNode.removeChild(this.perfPanel);
    }
  }

  public getFPS(): number {
    return this.fps;
  }
}

let game: Game | null = null;

window.addEventListener('DOMContentLoaded', () => {
  game = new Game();
  console.log('🚀 星际贸易模拟器已启动');
  console.log('📋 操作说明:');
  console.log('   - 左键拖动: 旋转视角');
  console.log('   - 右键拖动: 平移视角');
  console.log('   - 滚轮: 缩放');
  console.log('   - 点击星球: 查看信息并前往');
});

window.addEventListener('beforeunload', () => {
  if (game) {
    game.dispose();
  }
});

export { Game };
