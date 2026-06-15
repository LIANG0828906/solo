import { Scene } from 'phaser';

export class ResourceLoader {
  private scene: Scene;
  private loaded: boolean = false;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  loadResources(): Promise<void> {
    return new Promise((resolve) => {
      this.registerGraphics();
      this.createParticleTextures();
      this.loaded = true;
      resolve();
    });
  }

  private registerGraphics(): void {
    const graphics = this.scene.add.graphics();
    graphics.setVisible(false);

    graphics.fillStyle(0x1a2a1a, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture('forest_bg', 800, 600);
    graphics.clear();

    graphics.fillStyle(0x3c5a3c, 1);
    graphics.fillRect(0, 0, 40, 40);
    graphics.generateTexture('tree_particle', 40, 40);
    graphics.clear();

    this.createPlayerTexture(graphics);
    this.createBulletTexture(graphics);
    graphics.destroy();
  }

  private createPlayerTexture(graphics: Phaser.GameObjects.Graphics): void {
    graphics.clear();
    graphics.lineStyle(2, 0x2a4a2a, 1);
    graphics.fillStyle(0x4a7a4a, 1);
    graphics.beginPath();
    graphics.moveTo(0, -14);
    graphics.lineTo(12, 10);
    graphics.lineTo(-12, 10);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();

    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(0, -5, 3);
    graphics.generateTexture('player', 30, 30);
  }

  private createBulletTexture(graphics: Phaser.GameObjects.Graphics): void {
    graphics.clear();
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture('enemy_bullet', 8, 8);
    graphics.clear();
    graphics.fillStyle(0x00ffff, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture('attack_effect', 10, 10);
  }

  private createParticleTextures(): void {
    const particleGraphics = this.scene.add.graphics();
    particleGraphics.setVisible(false);
    const colors = [0xff6b35, 0xffd93d, 0xffffff, 0xff0000];
    const sizes = [4, 3, 2, 6];
    const names = ['particle_orange', 'particle_yellow', 'particle_white', 'particle_red'];

    for (let i = 0; i < colors.length; i++) {
      particleGraphics.clear();
      particleGraphics.fillStyle(colors[i], 1);
      particleGraphics.fillCircle(sizes[i], sizes[i], sizes[i]);
      particleGraphics.generateTexture(names[i], sizes[i] * 2, sizes[i] * 2);
    }
    particleGraphics.destroy();
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
