import * as THREE from 'three';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { CharacterModule } from './modules/character';
import { RunesModule } from './modules/runes';
import { SceneModule } from './modules/scene';
import { GameProvider } from './context/GameProvider';
import GameApp from './App';

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public characterModule: CharacterModule;
  public runesModule: RunesModule;
  public sceneModule: SceneModule;
  public clock: THREE.Clock = new THREE.Clock();
  public animationFrameId: number = 0;
  
  private state: any = {
    characterPosition: new THREE.Vector3(0, 0, 5),
    fragments: [],
    recipes: [],
    slots: [null, null, null],
    isNearAltar: false,
    isTeleporting: false,
    showCombineEffect: false,
    newRecipeName: null,
    collectedCount: 0,
  };
  
  private listeners: Set<() => void> = new Set();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.userData.canvas = canvas;
    this.scene.userData.gameEngine = this;

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.runesModule = new RunesModule(() => {
      this.state.fragments = this.runesModule.getFragments();
      this.state.recipes = this.runesModule.getRecipes();
      this.state.slots = this.runesModule.getSlots();
      this.state.collectedCount = this.runesModule.getCollectedCount();
      this.notifyListeners();
    });

    this.sceneModule = new SceneModule({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      getState: () => this.state,
    });

    this.characterModule = new CharacterModule({
      scene: this.scene,
      camera: this.camera,
      getState: () => this.state,
      setState: (updater: (state: any) => any) => {
        this.state = updater(this.state);
        this.notifyListeners();
      },
      onFragmentCollect: (id: number) => {
        this.runesModule.collectFragment(id);
        this.sceneModule.removeFragment(id);
      },
    });

    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  async init() {
    const fragments = await this.runesModule.loadFragments();
    await this.runesModule.loadRecipes();

    fragments.forEach((fragment: any) => {
      if (!fragment.collected) {
        const mesh = this.sceneModule.createFragment(fragment);
        this.characterModule.registerFragmentMesh(fragment.id, mesh);
      }
    });

    this.characterModule.setPosition(this.state.characterPosition);
    this.state.fragments = this.runesModule.getFragments();
    this.state.recipes = this.runesModule.getRecipes();
    this.notifyListeners();
  }

  start() {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const deltaTime = this.clock.getDelta();
      const clampedDelta = Math.min(deltaTime, 0.1);

      this.characterModule.update(clampedDelta);
      this.sceneModule.update(clampedDelta);
      this.sceneModule.updateSlots(this.state.slots);

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  stop() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }

  getState() {
    return { ...this.state };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  performCombination() {
    const result = this.runesModule.performCombination();
    
    if (result.success && result.recipe) {
      this.state.showCombineEffect = true;
      this.state.newRecipeName = result.isNew ? result.recipe.name : null;
      
      this.sceneModule.createEnergyRing();
      this.sceneModule.resetParticles(2);
      
      this.notifyListeners();
      
      const duration = result.isNew ? 5000 : 1500;
      setTimeout(() => {
        this.state.showCombineEffect = false;
        this.state.newRecipeName = null;
        this.notifyListeners();
      }, duration);
    }
    
    return result;
  }

  addToSlot(fragmentId: number): boolean {
    const fragment = this.runesModule.getFragmentById(fragmentId);
    if (!fragment || !fragment.collected) return false;
    return this.runesModule.addToSlot(fragment.type, fragment.id);
  }

  removeFromSlot(slotIndex: number) {
    this.runesModule.removeFromSlot(slotIndex);
  }
}

let gameEngine: GameEngine | null = null;

export function getGameEngine(): GameEngine | null {
  return gameEngine;
}

export function initGame(): GameEngine | null {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas element not found');
    return null;
  }

  gameEngine = new GameEngine(canvas);
  gameEngine.init().then(() => {
    gameEngine!.start();
  });

  return gameEngine;
}

document.addEventListener('DOMContentLoaded', () => {
  initGame();
  
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(GameProvider, null,
          React.createElement(GameApp)
        )
      )
    );
  }
});
