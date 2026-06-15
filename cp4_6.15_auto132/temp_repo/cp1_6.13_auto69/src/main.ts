import { CoreScene } from './coreScene';
import { ShapeManager } from './shapeManager';
import { MorphController, Weights } from './morphController';
import { GalleryModule } from './galleryModule';

class App {
  private coreScene: CoreScene;
  private shapeManager: ShapeManager;
  private morphController: MorphController;
  private galleryModule: GalleryModule;
  
  private sliderSphere: HTMLInputElement;
  private sliderCube: HTMLInputElement;
  private sliderTorus: HTMLInputElement;
  private sliderOcta: HTMLInputElement;
  
  private valueSphere: HTMLElement;
  private valueCube: HTMLElement;
  private valueTorus: HTMLElement;
  private valueOcta: HTMLElement;
  
  private saveBtn: HTMLButtonElement;
  private galleryGrid: HTMLElement;
  private galleryCount: HTMLElement;

  constructor() {
    this.coreScene = new CoreScene();
    this.shapeManager = new ShapeManager();
    this.morphController = new MorphController(this.shapeManager);
    this.galleryModule = new GalleryModule(this.coreScene);
    
    const canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;
    this.coreScene.initScene(canvas);
    this.coreScene.setMesh(this.morphController.getMesh());
    
    this.sliderSphere = document.getElementById('slider-sphere') as HTMLInputElement;
    this.sliderCube = document.getElementById('slider-cube') as HTMLInputElement;
    this.sliderTorus = document.getElementById('slider-torus') as HTMLInputElement;
    this.sliderOcta = document.getElementById('slider-octa') as HTMLInputElement;
    
    this.valueSphere = document.getElementById('value-sphere') as HTMLElement;
    this.valueCube = document.getElementById('value-cube') as HTMLElement;
    this.valueTorus = document.getElementById('value-torus') as HTMLElement;
    this.valueOcta = document.getElementById('value-octa') as HTMLElement;
    
    this.saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
    this.galleryGrid = document.getElementById('gallery-grid') as HTMLElement;
    this.galleryCount = document.getElementById('gallery-count') as HTMLElement;
    
    this.init();
  }

  private init(): void {
    this.setupGallery();
    this.setupEventListeners();
    this.updateSliderValues();
    this.startAnimation();
  }

  private setupGallery(): void {
    this.galleryModule.setGridElement(this.galleryGrid);
    this.galleryModule.setCountElement(this.galleryCount);
    
    this.galleryModule.setOnRestoreCallback((weights: Weights) => {
      this.morphController.setTargetWeights(
        weights[0],
        weights[1],
        weights[2],
        weights[3],
        0.3
      );
      
      this.sliderSphere.value = weights[0].toString();
      this.sliderCube.value = weights[1].toString();
      this.sliderTorus.value = weights[2].toString();
      this.sliderOcta.value = weights[3].toString();
      this.updateSliderValues();
    });
  }

  private setupEventListeners(): void {
    const handleSliderChange = () => {
      const w1 = parseFloat(this.sliderSphere.value);
      const w2 = parseFloat(this.sliderCube.value);
      const w3 = parseFloat(this.sliderTorus.value);
      const w4 = parseFloat(this.sliderOcta.value);
      
      this.morphController.setTargetWeights(w1, w2, w3, w4, 0.2);
      this.updateSliderValues();
    };
    
    this.sliderSphere.addEventListener('input', handleSliderChange);
    this.sliderCube.addEventListener('input', handleSliderChange);
    this.sliderTorus.addEventListener('input', handleSliderChange);
    this.sliderOcta.addEventListener('input', handleSliderChange);
    
    this.saveBtn.addEventListener('click', () => {
      const weights = this.morphController.getWeights();
      this.galleryModule.saveSnapshot('', weights);
    });
  }

  private updateSliderValues(): void {
    this.valueSphere.textContent = parseFloat(this.sliderSphere.value).toFixed(2);
    this.valueCube.textContent = parseFloat(this.sliderCube.value).toFixed(2);
    this.valueTorus.textContent = parseFloat(this.sliderTorus.value).toFixed(2);
    this.valueOcta.textContent = parseFloat(this.sliderOcta.value).toFixed(2);
  }

  private startAnimation(): void {
    this.coreScene.startAnimationLoop((delta: number) => {
      this.morphController.update(delta);
    });
  }

  dispose(): void {
    this.coreScene.dispose();
    this.morphController.dispose();
    this.galleryModule.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  (window as unknown as { app: App }).app = app;
});
