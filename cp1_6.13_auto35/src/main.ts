import { ImageProcessor, ImageFeatures } from './processModule/imageProcessor';
import { GrowthController } from './processModule/growthController';
import { SceneBuilder, WindParams } from './renderModule/sceneBuilder';
import { InteractionHandler } from './renderModule/interactionHandler';

class VirtualBloomApp {
  private imageProcessor: ImageProcessor;
  private growthController: GrowthController;
  private sceneBuilder: SceneBuilder;
  private interactionHandler!: InteractionHandler;
  
  private isResetting: boolean = false;
  private hasImage: boolean = false;

  constructor() {
    this.imageProcessor = new ImageProcessor();
    this.growthController = new GrowthController();
    this.sceneBuilder = new SceneBuilder('canvas-container');
    
    this.init();
  }

  private init(): void {
    this.interactionHandler = new InteractionHandler({
      onWindChange: this.onWindChange.bind(this),
      onReset: this.onReset.bind(this),
      onLightToggle: this.onLightToggle.bind(this),
      onImageUpload: this.onImageUpload.bind(this)
    });
    
    this.sceneBuilder.setOnAnimate(this.onAnimate.bind(this));
    this.sceneBuilder.updateWind(this.interactionHandler.getWindParams());
    
    this.initializeDefaultPlant();
    
    this.sceneBuilder.startAnimation();
  }

  private initializeDefaultPlant(): void {
    const defaultFeatures: ImageFeatures = {
      colors: ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'],
      contours: this.generateDefaultContours()
    };
    
    this.growthController.initialize(defaultFeatures);
    this.interactionHandler.updateColorPalette(defaultFeatures.colors);
    this.hasImage = true;
  }

  private generateDefaultContours(): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.3;
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
    return points;
  }

  private async onImageUpload(file: File): Promise<void> {
    try {
      const features = await this.imageProcessor.processImage(file);
      this.processNewPlant(features);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('图片处理失败，请尝试其他图片');
    }
  }

  private processNewPlant(features: ImageFeatures): void {
    this.interactionHandler.updateColorPalette(features.colors);
    
    this.sceneBuilder.fadeOut(() => {
      this.growthController.reset();
      this.growthController.initialize(features);
      this.hasImage = true;
      
      this.sceneBuilder.fadeIn();
    });
  }

  private onWindChange(params: WindParams): void {
    this.sceneBuilder.updateWind(params);
  }

  private onReset(): void {
    if (this.isResetting || !this.hasImage) return;
    
    this.isResetting = true;
    this.growthController.setState('fading-out');
    
    this.sceneBuilder.fadeOut(() => {
      this.growthController.reset();
      this.growthController.setState('fading-in');
      
      const features = this.growthController.getColors().length > 0
        ? {
            colors: this.growthController.getColors(),
            contours: this.generateDefaultContours()
          }
        : {
            colors: ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'],
            contours: this.generateDefaultContours()
          };
      
      this.growthController.initialize(features);
      
      this.sceneBuilder.fadeIn(() => {
        this.isResetting = false;
        this.growthController.restartGrowth();
      });
    });
  }

  private onLightToggle(enabled: boolean): void {
    this.sceneBuilder.toggleDirectionalLight(enabled);
  }

  private onAnimate(deltaTime: number): void {
    if (this.hasImage && !this.isResetting) {
      this.growthController.update(deltaTime);
      
      const branches = this.growthController.getBranches();
      const time = this.growthController.getTime();
      
      this.sceneBuilder.updatePlant(branches, time);
    }
  }

  public dispose(): void {
    this.sceneBuilder.dispose();
    this.interactionHandler.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new VirtualBloomApp();
  
  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
});
