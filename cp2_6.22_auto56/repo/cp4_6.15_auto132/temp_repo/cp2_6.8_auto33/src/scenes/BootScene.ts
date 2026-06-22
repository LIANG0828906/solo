import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.createGalaxyParticles(width, height);

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222244, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add.text(width / 2, height / 2 - 60, '加载中...', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.applyNeonGlow(this.loadingText, '#00e5ff');

    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      this.updateProgressBar(width, height, value);
    });

    this.load.on('complete', () => {
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene');
      });
    });

    this.load.start();
  }

  private createGalaxyParticles(width: number, height: number): void {
    const particlesTexture = this.textures.createCanvas('galaxy-particles', 8, 8);
    if (!particlesTexture) return;
    const ctx = particlesTexture.getContext();
    if (!ctx) return;
    const gradient = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 8, 8);
    particlesTexture.refresh();

    this.particles = this.add.particles(0, 0, 'galaxy-particles', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 3000, max: 6000 },
      speed: { min: 20, max: 60 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 1.5 },
      quantity: 2,
      frequency: 50,
      tint: [0xff6f00, 0x4fc3f7, 0xff4081],
      blendMode: 'ADD'
    });
  }

  private updateProgressBar(width: number, height: number, value: number): void {
    this.progressBar.clear();
    this.progressBar.fillStyle(0xff4081, 1);
    this.progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    this.percentText.setText(Math.floor(value * 100) + '%');
  }

  private applyNeonGlow(text: Phaser.GameObjects.Text, glowColor: string): void {
    text.setShadow(2, 2, glowColor, 2, true, true);
  }
}
