import * as THREE from 'three';
import { create } from 'zustand';
import { AntColony } from './AntColony';
import { PheromoneSystem } from './PheromoneSystem';
import { Map3D } from './Map3D';
import { GameStats, PredatorEvent } from './types';

interface GameStore {
  stats: GameStats;
  isEnhancedMode: boolean;
  enhanceEndTime: number;
  predatorEvents: PredatorEvent[];
  setStats: (stats: GameStats) => void;
  setEnhancedMode: (enabled: boolean, endTime: number) => void;
  addPredatorEvent: (event: PredatorEvent) => void;
}

const useGameStore = create<GameStore>((set) => ({
  stats: {
    totalWorkers: 0,
    carryingFood: 0,
    foodCollected: 0,
    pheromoneCount: 0,
    predatorCount: 0,
  },
  isEnhancedMode: false,
  enhanceEndTime: 0,
  predatorEvents: [],
  setStats: (stats) => set({ stats }),
  setEnhancedMode: (enabled, endTime) => set({ isEnhancedMode: enabled, enhanceEndTime: endTime }),
  addPredatorEvent: (event) => set((state) => ({
    predatorEvents: [...state.predatorEvents.slice(-4), event],
  })),
}));

class GameApp {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private antColony!: AntColony;
  private pheromoneSystem!: PheromoneSystem;
  private map3D!: Map3D;
  private clock: THREE.Clock = new THREE.Clock();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private plane!: THREE.Plane;
  private frameCount: number = 0;
  private overlayUpdateFrame: number = 0;
  private lastEnhanceActivation: number = 0;
  private readonly ENHANCE_COOLDOWN: number = 15000;
  private readonly ENHANCE_DURATION: number = 10000;
  private isRunning: boolean = true;
  private animationFrameId: number = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupSystems();
    this.setupEventListeners();
    this.setupStoreSubscriptions();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.startAnimationLoop();
  }

  private setupRenderer(): void {
    const container = document.getElementById('canvas-container')!;
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(this.renderer.domElement);
  }

  private setupScene(): void {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a1a0a, 40, 80);
  }

  private setupCamera(): void {
    const container = document.getElementById('canvas-container')!;
    const aspect = container.clientWidth / container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 35, 35);
    this.camera.lookAt(0, 0, 0);
  }

  private setupSystems(): void {
    this.map3D = new Map3D(this.scene);
    this.map3D.build();

    this.pheromoneSystem = new PheromoneSystem(this.scene);
    
    this.antColony = new AntColony(this.scene, this.pheromoneSystem, this.map3D);

    this.antColony.setOnStatsUpdateCallback((stats) => {
      useGameStore.getState().setStats(stats);
    });

    this.map3D.setOnPredatorSpawnCallback((timeStr) => {
      useGameStore.getState().addPredatorEvent({
        time: timeStr,
        timestamp: Date.now(),
      });
      this.triggerAlertBorder();
    });

    this.map3D.setOnPredatorDetectCallback(() => {
      this.triggerAlertBorder();
    });

    this.pheromoneSystem.addPheromoneUpdateCallback(() => {
    });
  }

  private triggerAlertBorder(): void {
    const alert = document.getElementById('alert-border');
    if (alert) {
      alert.classList.remove('active');
      void alert.offsetWidth;
      alert.classList.add('active');
      setTimeout(() => alert.classList.remove('active'), 500);
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());
    
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    
    window.addEventListener('keydown', (e) => {
      if (e.key === 'a' || e.key === 'A') {
        this.activateEnhanceMode();
      }
    });

    const hamburger = document.getElementById('hamburger');
    const sidePanel = document.getElementById('side-panel');
    if (hamburger && sidePanel) {
      hamburger.addEventListener('click', () => {
        sidePanel.classList.toggle('open');
      });
    }
  }

  private activateEnhanceMode(): void {
    const now = performance.now();
    if (now - this.lastEnhanceActivation < this.ENHANCE_COOLDOWN) {
      return;
    }
    if (useGameStore.getState().isEnhancedMode) {
      return;
    }

    this.lastEnhanceActivation = now;
    const endTime = now + this.ENHANCE_DURATION;
    this.pheromoneSystem.setEnhancedMode(true);
    useGameStore.getState().setEnhancedMode(true, endTime);

    setTimeout(() => {
      this.pheromoneSystem.setEnhancedMode(false);
      useGameStore.getState().setEnhancedMode(false, 0);
    }, this.ENHANCE_DURATION);
  }

  private onCanvasClick(event: MouseEvent): void {
    const container = document.getElementById('canvas-container')!;
    const rect = container.getBoundingClientRect();
    
    this.mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.plane, intersectPoint);

    const mapSize = this.map3D.getMapSize();
    const half = mapSize / 2;
    if (
      intersectPoint.x >= -half && intersectPoint.x <= half &&
      intersectPoint.z >= -half && intersectPoint.z <= half
    ) {
      intersectPoint.y = this.map3D.getTerrainHeight(intersectPoint.x, intersectPoint.z);
      this.antColony.createCollectionTask(intersectPoint);
      this.showClickMarker(intersectPoint);
    }
  }

  private showClickMarker(position: THREE.Vector3): void {
    const geometry = new THREE.RingGeometry(0.2, 0.5, 32);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFF00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(position);
    marker.position.y += 0.05;
    this.scene.add(marker);

    const startTime = performance.now();
    const duration = 500;
    
    const animateMarker = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / duration;
      if (progress >= 1) {
        this.scene.remove(marker);
        geometry.dispose();
        material.dispose();
        return;
      }
      marker.scale.setScalar(1 + progress);
      material.opacity = 0.8 * (1 - progress);
      requestAnimationFrame(animateMarker);
    };
    animateMarker();
  }

  private onWindowResize(): void {
    const container = document.getElementById('canvas-container')!;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  private setupStoreSubscriptions(): void {
    useGameStore.subscribe((state) => {
      this.updateUI(state);
    });
  }

  private updateUI(state: ReturnType<typeof useGameStore.getState>): void {
    const { stats, isEnhancedMode, predatorEvents } = state;

    const totalWorkersEl = document.getElementById('total-workers');
    const carryingFoodEl = document.getElementById('carrying-food');
    const foodCollectedEl = document.getElementById('food-collected');
    const pheromoneCountEl = document.getElementById('pheromone-count');
    const predatorCountEl = document.getElementById('predator-count');

    if (totalWorkersEl) totalWorkersEl.textContent = stats.totalWorkers.toString();
    if (carryingFoodEl) carryingFoodEl.textContent = stats.carryingFood.toString();
    if (foodCollectedEl) foodCollectedEl.textContent = stats.foodCollected.toString();
    if (pheromoneCountEl) pheromoneCountEl.textContent = stats.pheromoneCount.toFixed(1);
    if (predatorCountEl) predatorCountEl.textContent = stats.predatorCount.toString();

    const modeStatusEl = document.getElementById('mode-status');
    if (modeStatusEl) {
      if (isEnhancedMode) {
        modeStatusEl.textContent = '增强模式';
        modeStatusEl.classList.remove('normal');
        modeStatusEl.classList.add('enhanced');
      } else {
        modeStatusEl.textContent = '普通模式';
        modeStatusEl.classList.remove('enhanced');
        modeStatusEl.classList.add('normal');
      }
    }

    const enhanceTimerEl = document.getElementById('enhance-timer');
    const countdownEl = document.getElementById('enhance-countdown');
    if (enhanceTimerEl && countdownEl) {
      if (isEnhancedMode) {
        enhanceTimerEl.style.display = 'block';
        const remaining = Math.max(0, (state.enhanceEndTime - performance.now()) / 1000);
        countdownEl.textContent = remaining.toFixed(1);
      } else {
        enhanceTimerEl.style.display = 'none';
      }
    }

    const timelineTrack = document.getElementById('timeline-track');
    if (timelineTrack) {
      const existingEvents = timelineTrack.querySelectorAll('.predator-event');
      existingEvents.forEach((el) => el.remove());

      const events = predatorEvents.slice(-5);
      const totalWidth = timelineTrack.clientWidth - 40;
      const spacing = events.length > 1 ? totalWidth / (events.length - 1) : 0;
      
      events.forEach((event, index) => {
        const div = document.createElement('div');
        div.className = 'predator-event';
        div.style.left = `${20 + (events.length > 1 ? index * spacing : totalWidth / 2)}px`;
        div.setAttribute('data-time', event.time);
        timelineTrack.appendChild(div);
      });
    }
  }

  private startAnimationLoop(): void {
    const animate = () => {
      if (!this.isRunning) return;
      
      this.animationFrameId = requestAnimationFrame(animate);

      const deltaTime = Math.min(this.clock.getDelta(), 0.1);
      const now = performance.now();

      this.update(deltaTime, now);
      this.render();

      this.frameCount++;
      if (this.frameCount - this.overlayUpdateFrame >= 3) {
        this.map3D.updatePheromoneOverlay(this.pheromoneSystem);
        this.overlayUpdateFrame = this.frameCount;
      }

      if (this.frameCount % 10 === 0) {
        this.updateUI(useGameStore.getState());
      }
    };

    animate();
  }

  private update(deltaTime: number, now: number): void {
    this.antColony.update(deltaTime, now);
    this.updateCamera();
  }

  private updateCamera(): void {
    const center = new THREE.Vector3(0, 0, 0);
    this.camera.lookAt(center);
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    
    this.antColony.dispose();
    this.map3D.dispose();
    this.pheromoneSystem.dispose();

    this.renderer.dispose();
    
    window.removeEventListener('resize', () => this.onWindowResize());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  (window as any).__gameApp = app;
});

export { useGameStore };
