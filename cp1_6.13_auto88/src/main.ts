import { TerrainGenerator, TERRAIN_STYLES, TerrainParams } from './terrainModule';
import { SceneManager } from './sceneManager';
import { EditorUI } from './editorUI';

class TerraForge {
  private terrainGenerator!: TerrainGenerator;
  private sceneManager!: SceneManager;
  private editorUI!: EditorUI;
  private isUpdating: boolean = false;
  private pendingUpdate: boolean = false;
  private isTransitioning: boolean = false;

  constructor() {
    const canvas = document.getElementById('terrain-canvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.terrainGenerator = new TerrainGenerator(256, 256);
    this.sceneManager = new SceneManager(canvas);
    this.editorUI = new EditorUI({
      onParamChange: this.handleParamChange.bind(this),
      onStyleChange: this.handleStyleChange.bind(this),
      onStatsUpdate: () => {}
    });

    this.init();
  }

  private init(): void {
    this.terrainGenerator.generateHeightMap();
    this.sceneManager.createTerrain(this.terrainGenerator.getHeightMap());
    this.sceneManager.start();
    this.updateStats();

    this.sceneManager.setOnTerrainClick((x, y) => {
      this.handleTerrainClick(x, y);
    });
  }

  private handleParamChange(config: {
    frequency: number;
    amplitude: number;
    seed: number;
    waterLevel: number;
  }): void {
    if (this.isTransitioning) return;

    this.terrainGenerator.setParams({
      frequency: config.frequency,
      amplitude: config.amplitude,
      seed: config.seed
    });

    this.sceneManager.updateWaterLevel(config.waterLevel);

    if (!this.isUpdating) {
      this.isUpdating = true;
      this.terrainGenerator.generateHeightMap();
      this.sceneManager.updateTerrain(this.terrainGenerator.getHeightMap());
      this.updateStats();
      
      setTimeout(() => {
        this.isUpdating = false;
        if (this.pendingUpdate) {
          this.pendingUpdate = false;
        }
      }, 100);
    } else {
      this.pendingUpdate = true;
    }
  }

  private handleStyleChange(styleName: string): void {
    const style = TERRAIN_STYLES[styleName];
    if (!style) return;

    this.isTransitioning = true;
    const startParams = { ...this.terrainGenerator['params'] } as TerrainParams;
    const targetParams: TerrainParams = {
      frequency: style.frequency,
      amplitude: style.amplitude,
      seed: Math.floor(Math.random() * 999) + 1,
      octaves: style.octaves,
      persistence: style.persistence
    };

    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = 1 - Math.pow(1 - progress, 3);
      
      this.terrainGenerator.lerpToTarget(targetParams, eased);
      this.terrainGenerator.generateHeightMap();
      this.sceneManager.updateTerrain(this.terrainGenerator.getHeightMap());
      this.updateStats();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isTransitioning = false;
        const uiConfig = this.editorUI.getConfig();
        this.editorUI.setConfig({
          frequency: style.frequency,
          amplitude: style.amplitude,
          seed: targetParams.seed,
          brushSize: uiConfig.brushSize,
          brushStrength: uiConfig.brushStrength,
          waterLevel: uiConfig.waterLevel
        });
      }
    };

    requestAnimationFrame(animate);
  }

  private handleTerrainClick(x: number, y: number): void {
    if (this.isTransitioning) return;

    const config = this.editorUI.getConfig();
    const isRaise = true;
    
    this.terrainGenerator.modifyHeightMap(
      x,
      y,
      config.brushSize,
      config.brushStrength * 0.05,
      isRaise
    );

    this.sceneManager.updateTerrain(this.terrainGenerator.getHeightMap());
    this.updateStats();
  }

  private updateStats(): void {
    const stats = this.terrainGenerator.getStats();
    this.editorUI.updateStats(stats);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TerraForge();
});
