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
  private lastBrushX: number = 0;
  private lastBrushY: number = 0;
  private affectedRegion: { x: number; y: number; width: number; height: number } | undefined;
  private lastUpdateTime: number = 0;
  private statsElement: HTMLElement | null = null;

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

    this.createStatsPanel();
    this.init();
  }

  private createStatsPanel(): void {
    this.statsElement = document.createElement('div');
    this.statsElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(20, 20, 30, 0.9);
      backdrop-filter: blur(5px);
      border-radius: 12px;
      padding: 12px 20px;
      display: flex;
      gap: 20px;
      color: #aaccdd;
      font-family: monospace;
      font-size: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      z-index: 100;
    `;
    document.body.appendChild(this.statsElement);

    this.updateStatsPanel(0, 0, 0, 0);
  }

  private updateStatsPanel(fps: number, min: number, max: number, avg: number): void {
    if (!this.statsElement) return;
    this.statsElement.innerHTML = `
      <span>FPS: <span style="color: ${fps >= 30 ? '#00ff88' : fps >= 25 ? '#ffff00' : '#ff4444'}">${fps}</span></span>
      <span>Min: <span style="color: #00aaff">${min.toFixed(3)}</span></span>
      <span>Max: <span style="color: #ff8800">${max.toFixed(3)}</span></span>
      <span>Avg: <span style="color: #aaffaa">${avg.toFixed(3)}</span></span>
    `;
  }

  private init(): void {
    const startTime = performance.now();
    this.terrainGenerator.generateHeightMap();
    this.sceneManager.createTerrain(this.terrainGenerator.getHeightMap());
    this.sceneManager.start();
    this.updateStats();

    const initTime = performance.now() - startTime;
    console.log(`Scene initialized in ${initTime.toFixed(2)}ms`);

    this.sceneManager.setOnTerrainClick((x, y) => {
      this.handleTerrainInteraction(x, y, true);
    });

    this.sceneManager.setOnTerrainDrag((x, y) => {
      this.handleTerrainInteraction(x, y, false);
    });

    this.sceneManager.setFpsCallback((fps) => {
      const stats = this.terrainGenerator.getStats();
      this.updateStatsPanel(fps, stats.min, stats.max, stats.avg);
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
      const startTime = performance.now();
      
      this.terrainGenerator.generateHeightMap();
      this.sceneManager.updateTerrain(this.terrainGenerator.getHeightMap());
      this.updateStats();
      
      const updateTime = performance.now() - startTime;
      console.log(`Param update completed in ${updateTime.toFixed(2)}ms`);
      
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
    const startHeightMap = [...this.terrainGenerator.getHeightMap()];
    
    const targetParams: TerrainParams = {
      frequency: style.frequency,
      amplitude: style.amplitude,
      seed: Math.floor(Math.random() * 999) + 1,
      octaves: style.octaves,
      persistence: style.persistence
    };

    const tempGenerator = new TerrainGenerator(256, 256);
    tempGenerator.setParams(targetParams);
    const targetHeightMap = tempGenerator.generateHeightMap();

    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = 1 - Math.pow(1 - progress, 3);
      
      this.terrainGenerator.lerpToTarget(targetParams, eased);

      const blendedHeightMap: number[] = [];
      for (let i = 0; i < startHeightMap.length; i++) {
        blendedHeightMap[i] = startHeightMap[i] * (1 - eased) + targetHeightMap[i] * eased;
      }

      this.terrainGenerator.setHeightMap(blendedHeightMap);
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
        
        const transitionTime = performance.now() - startTime;
        console.log(`Style transition completed in ${transitionTime.toFixed(2)}ms`);
      }
    };

    requestAnimationFrame(animate);
  }

  private handleTerrainInteraction(x: number, y: number, isFirst: boolean): void {
    if (this.isTransitioning) return;

    const now = performance.now();
    if (now - this.lastUpdateTime < 16) return;
    this.lastUpdateTime = now;

    const config = this.editorUI.getConfig();
    const isRaise = true;
    
    this.terrainGenerator.modifyHeightMap(
      x,
      y,
      config.brushSize,
      config.brushStrength * 0.02,
      isRaise
    );

    if (isFirst) {
      this.affectedRegion = {
        x: x - config.brushSize,
        y: y - config.brushSize,
        width: config.brushSize * 2,
        height: config.brushSize * 2
      };
    } else if (this.affectedRegion) {
      this.affectedRegion.x = Math.min(this.affectedRegion.x, x - config.brushSize);
      this.affectedRegion.y = Math.min(this.affectedRegion.y, y - config.brushSize);
      this.affectedRegion.width = Math.max(this.affectedRegion.width, x + config.brushSize - this.affectedRegion.x);
      this.affectedRegion.height = Math.max(this.affectedRegion.height, y + config.brushSize - this.affectedRegion.y);
    }

    this.sceneManager.updateTerrain(this.terrainGenerator.getHeightMap(), this.affectedRegion);
    this.updateStats();

    this.lastBrushX = x;
    this.lastBrushY = y;
  }

  private updateStats(): void {
    const stats = this.terrainGenerator.getStats();
    this.editorUI.updateStats(stats);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TerraForge();
});
