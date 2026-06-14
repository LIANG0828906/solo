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
    this.controls.minDistance = 10;
    this.controls.maxDistance = 100;
    this.controls.enablePan = true;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };

    this.setupLighting();
    this.createGameObjects();
    this.setupEventListeners();
    
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

    const totalParticles = this.getTotalParticles();
    if (totalParticles > 3000) {
      console.warn(`粒子数量超过限制: ${totalParticles}/3000`);
    }
  }

  private getTotalParticles(): number {
    let count = 0;
    this.scene.traverse((object) => {
      if (object instanceof THREE.Points) {
        count += object.geometry.attributes.position.count;
      }
    });
    return count;
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    
    this.starMap.dispose();
    this.spaceShip.dispose();
    this.uiLayer.dispose();
    
    this.renderer.dispose();
    
    window.removeEventListener('resize', this.onResize.bind(this));
    this.container.removeChild(this.renderer.domElement);
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
