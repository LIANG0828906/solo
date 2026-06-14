import * as THREE from 'three';
import { SceneManager } from './modules/sceneManager';
import { BuildingManager } from './modules/buildingManager';
import { InteractionManager } from './modules/interactionManager';
import { EffectManager } from './modules/effectManager';
import { NIGHT_MODE_THRESHOLD } from './models/buildingConfig';

class App {
  private sceneManager: SceneManager;
  private buildingManager: BuildingManager;
  private interactionManager!: InteractionManager;
  private effectManager: EffectManager;
  private container: HTMLElement;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  
  private buildingCountElement: HTMLElement | null = null;
  private fpsCounterElement: HTMLElement | null = null;
  private modeIndicatorElement: HTMLElement | null = null;
  
  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private currentFps: number = 60;
  private lastGrowthCheck: Map<string, number> = new Map();

  constructor() {
    this.sceneManager = new SceneManager();
    this.buildingManager = new BuildingManager(this.sceneManager);
    this.effectManager = new EffectManager(this.sceneManager, this.buildingManager);
    
    this.buildingManager.setEffectManager(this.effectManager);
    
    this.container = document.getElementById('canvas-container') as HTMLElement;
    this.clock = new THREE.Clock();
    
    this.initUIElements();
    this.init();
  }

  private initUIElements(): void {
    this.buildingCountElement = document.getElementById('building-count');
    this.fpsCounterElement = document.getElementById('fps-counter');
    this.modeIndicatorElement = document.getElementById('mode-indicator');
    
    const buildBtn = document.getElementById('build-btn');
    if (buildBtn) {
      buildBtn.addEventListener('click', () => {
        const randomX = Math.floor(Math.random() * 40);
        const randomZ = Math.floor(Math.random() * 40);
        this.buildingManager.placeBuilding(randomX, randomZ);
        this.updateBuildingCount();
      });
    }
  }

  private init(): void {
    if (!this.container) {
      console.error('Container element not found');
      return;
    }

    this.sceneManager.init(this.container);
    this.interactionManager = new InteractionManager(
      this.container,
      this.buildingManager,
      this.sceneManager,
      this.sceneManager.groundPlane
    );

    this.isRunning = true;
    this.animate();
    
    window.addEventListener('beforeunload', this.dispose.bind(this));
  }

  private animate(): void {
    if (!this.isRunning) return;
    
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.buildingManager.updateGrowth(deltaTime);
    this.effectManager.update(deltaTime);
    this.interactionManager.update();
    
    this.checkGrowthEffects();
    this.checkNightMode();
    this.updateFPS(deltaTime);
    this.updateBuildingCount();
    
    this.sceneManager.render();
  }

  private checkGrowthEffects(): void {
    const buildings = this.buildingManager.getBuildings();
    const now = Date.now();
    
    for (const building of buildings) {
      if (building.isGrowing && building.currentFloor > 0) {
        const lastCheck = this.lastGrowthCheck.get(building.id) || 0;
        if (now - lastCheck > 500) {
          this.effectManager.spawnGrowthEffect(building);
          this.lastGrowthCheck.set(building.id, now);
        }
      }
    }
  }

  private checkNightMode(): void {
    const buildingCount = this.buildingManager.getBuildingCount();
    const shouldBeNightMode = buildingCount >= NIGHT_MODE_THRESHOLD;
    const currentNightMode = this.effectManager.getNightModeStatus();
    
    if (shouldBeNightMode !== currentNightMode) {
      this.effectManager.toggleNightMode(shouldBeNightMode);
      this.updateModeIndicator(shouldBeNightMode);
    }
  }

  private updateFPS(deltaTime: number): void {
    this.frameCount++;
    this.fpsUpdateTime += deltaTime;
    
    if (this.fpsUpdateTime >= 1) {
      this.currentFps = Math.round(this.frameCount / this.fpsUpdateTime);
      this.frameCount = 0;
      this.fpsUpdateTime = 0;
      
      if (this.fpsCounterElement) {
        this.fpsCounterElement.textContent = this.currentFps.toString();
        
        if (this.currentFps >= 50) {
          this.fpsCounterElement.style.color = '#00ff88';
        } else if (this.currentFps >= 35) {
          this.fpsCounterElement.style.color = '#ffaa00';
        } else {
          this.fpsCounterElement.style.color = '#ff3366';
        }
      }
    }
  }

  private updateBuildingCount(): void {
    if (this.buildingCountElement) {
      const count = this.buildingManager.getBuildingCount();
      this.buildingCountElement.textContent = count.toString();
    }
  }

  private updateModeIndicator(isNight: boolean): void {
    if (this.modeIndicatorElement) {
      if (isNight) {
        this.modeIndicatorElement.textContent = 'NIGHT';
        this.modeIndicatorElement.classList.remove('mode-day');
        this.modeIndicatorElement.classList.add('mode-night');
      } else {
        this.modeIndicatorElement.textContent = 'DAY';
        this.modeIndicatorElement.classList.remove('mode-night');
        this.modeIndicatorElement.classList.add('mode-day');
      }
    }
  }

  dispose(): void {
    this.isRunning = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.interactionManager.dispose();
    this.buildingManager.dispose();
    this.effectManager.dispose();
    this.sceneManager.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
