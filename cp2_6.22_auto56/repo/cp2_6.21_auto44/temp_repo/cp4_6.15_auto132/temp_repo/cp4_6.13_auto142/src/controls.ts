import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { SceneManager } from './scene';

export class ControlPanel {
  private sceneManager: SceneManager;
  private orbitControls: OrbitControls;
  private domElement: HTMLElement;
  
  private mouseX: number = 0.5;
  private mouseY: number = 0.5;
  private isPaused: boolean = false;
  
  private onExplodeCallback: (() => void) | null = null;
  private onPauseCallback: ((paused: boolean) => void) | null = null;
  
  constructor(sceneManager: SceneManager, domElement: HTMLElement) {
    this.sceneManager = sceneManager;
    this.domElement = domElement;
    
    this.orbitControls = new OrbitControls(
      sceneManager.getCamera(),
      domElement
    );
    
    this.setupOrbitControls();
    this.setupMouseListeners();
    this.setupKeyboardListeners();
  }
  
  private setupOrbitControls(): void {
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.enableZoom = true;
    this.orbitControls.minDistance = 5;
    this.orbitControls.maxDistance = 50;
    this.orbitControls.enablePan = false;
    this.orbitControls.rotateSpeed = 0.5;
    this.orbitControls.zoomSpeed = 0.8;
  }
  
  private setupMouseListeners(): void {
    this.domElement.addEventListener('mousemove', (event: MouseEvent) => {
      this.mouseX = event.clientX / window.innerWidth;
      this.mouseY = event.clientY / window.innerHeight;
    });
    
    this.domElement.addEventListener('touchmove', (event: TouchEvent) => {
      if (event.touches.length > 0) {
        this.mouseX = event.touches[0].clientX / window.innerWidth;
        this.mouseY = event.touches[0].clientY / window.innerHeight;
      }
    });
  }
  
  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      switch (event.key) {
        case '1':
          this.togglePause();
          break;
        case '2':
          this.triggerExplode();
          break;
        case '3':
          this.resetCamera();
          break;
      }
    });
  }
  
  private togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.onPauseCallback) {
      this.onPauseCallback(this.isPaused);
    }
  }
  
  private triggerExplode(): void {
    this.sceneManager.triggerExplode();
    if (this.onExplodeCallback) {
      this.onExplodeCallback();
    }
  }
  
  private resetCamera(): void {
    this.sceneManager.resetCamera();
    this.orbitControls.reset();
  }
  
  getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }
  
  isPausedState(): boolean {
    return this.isPaused;
  }
  
  setPaused(paused: boolean): void {
    this.isPaused = paused;
  }
  
  update(): void {
    this.orbitControls.update();
  }
  
  onExplode(callback: () => void): void {
    this.onExplodeCallback = callback;
  }
  
  onPause(callback: (paused: boolean) => void): void {
    this.onPauseCallback = callback;
  }
}