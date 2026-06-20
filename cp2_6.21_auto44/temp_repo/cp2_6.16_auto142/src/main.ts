import { SceneManager } from './scene/SceneManager';
import { AtomSystem } from './scene/AtomSystem';
import { AnnotationSystem } from './scene/AnnotationSystem';
import { Sidebar } from './ui/Sidebar';
import { TopBar } from './ui/TopBar';
import { useMaterialStore } from './stores/useMaterialStore';

class NanoLensApp {
  private sceneManager!: SceneManager;
  private atomSystem!: AtomSystem;
  private annotationSystem!: AnnotationSystem;
  private sidebar!: Sidebar;
  private topBar!: TopBar;

  constructor() {
    this.init();
  }

  private init(): void {
    this.sceneManager = new SceneManager('canvas-container');
    this.atomSystem = new AtomSystem(this.sceneManager);
    this.annotationSystem = new AnnotationSystem(this.sceneManager);

    this.sidebar = new Sidebar(this.sceneManager);
    this.topBar = new TopBar(this.sceneManager);

    this.loadInitialMaterial();
    this.setupMaterialChangeListener();

    this.sceneManager.start();

    console.log('[NanoLens] 初始化完成');
  }

  private loadInitialMaterial(): void {
    const state = useMaterialStore.getState();
    const material = state.materials[state.currentMaterial];
    this.atomSystem.buildMaterial(material);
  }

  private setupMaterialChangeListener(): void {
    let lastMaterial = useMaterialStore.getState().currentMaterial;

    useMaterialStore.subscribe(
      (state) => state.currentMaterial,
      (newMaterial) => {
        if (newMaterial !== lastMaterial) {
          lastMaterial = newMaterial;
          const state = useMaterialStore.getState();
          const material = state.materials[newMaterial];
          this.atomSystem.buildMaterial(material);
        }
      }
    );
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new NanoLensApp();
});
