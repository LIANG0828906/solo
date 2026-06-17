import { createDefaultConfig, type SharedConfig } from './sharedConfig';
import { ImageParser } from './imageParser';
import { ParticleCloud } from './particleCloud';
import { UIController } from './uiController';

class AuraBloomApp {
  private config: SharedConfig;
  private particleCloud: ParticleCloud;
  private uiController: UIController;

  constructor() {
    const container = document.getElementById('canvas-container')!;
    this.config = createDefaultConfig();

    this.particleCloud = new ParticleCloud(container, this.config);

    this.uiController = new UIController(
      this.config,
      (file) => this.handleImageUpload(file),
      () => this.handleScreenshot(),
      () => this.handleParamChange()
    );

    this.particleCloud.start();
  }

  private async handleImageUpload(file: File): Promise<void> {
    try {
      const particles = await ImageParser.parse(file, this.config);
      this.particleCloud.loadParticles(particles);
      this.uiController.hideUploadPanel();
    } catch (error) {
      console.error('Image parse failed:', error);
    }
  }

  private handleParamChange(): void {
    this.particleCloud.onParamChange();
    this.particleCloud.updateColorMode();
  }

  private async handleScreenshot(): Promise<void> {
    if (this.config.isScreenshotting) return;

    this.config.isScreenshotting = true;

    this.particleCloud.pauseAnimation();
    this.particleCloud.renderFrame();

    await this.uiController.triggerFlashEffect();

    const dataURL = this.particleCloud.getCanvasDataURL();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `autoblom_${timestamp}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();

    this.particleCloud.resumeAnimation();
    this.config.isScreenshotting = false;
  }
}

new AuraBloomApp();
