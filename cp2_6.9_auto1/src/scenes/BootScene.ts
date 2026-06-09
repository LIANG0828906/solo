import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.generateStarfieldTexture();
    this.generatePlaceholderAudio();
  }

  private generateStarfieldTexture(): void {
    const textureWidth = 2048;
    const textureHeight = 2048;

    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x0a0e27);
    graphics.fillRect(0, 0, textureWidth, textureHeight);

    graphics.generateTexture('starfieldBg', textureWidth, textureHeight);
    graphics.destroy();
  }

  private generatePlaceholderAudio(): void {
    const noop = () => {};
    const mock = {
      add: () => ({ play: noop, stop: noop, pause: noop, resume: noop, setVolume: noop })
    };
    (this.sound as any).mock = mock;
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
