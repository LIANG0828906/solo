import Phaser from 'phaser';

export class UI {
  private scene: Phaser.Scene;
  private stardustText!: Phaser.GameObjects.Text;
  private shipCountText!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Text;
  private minimap!: Phaser.GameObjects.Graphics;
  private minimapBg!: Phaser.GameObjects.Rectangle;
  private warningOverlay!: Phaser.GameObjects.Graphics;
  private warningTween!: Phaser.Tweens.Tween | null;
  private isPaused: boolean = false;
  private stardust: number = 0;
  private shipCount: number = 0;
  private minimapScale: number = 0.08;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.warningTween = null;
    this.createUI();
  }

  private createUI(): void {
    const { width, height } = this.scene.game.config;
    const w = width as number;
    const h = height as number;

    this.stardustText = this.scene.add.text(20, 20, '星尘: 0', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#fbbf24',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(1000);

    this.shipCountText = this.scene.add.text(20, 55, '采集船: 0', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#00d4ff',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(1000);

    this.pauseButton = this.scene.add.text(w - 120, 20, '暂停', {
      fontFamily: 'Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#8b5cf6',
      padding: { left: 15, right: 15, top: 8, bottom: 8 },
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true });

    this.pauseButton.on('pointerdown', () => {
      this.togglePause();
    });

    const minimapWidth = 180;
    const minimapHeight = 135;
    const minimapX = 20;
    const minimapY = h - minimapHeight - 20;

    this.minimapBg = this.scene.add.rectangle(
      minimapX + minimapWidth / 2,
      minimapY + minimapHeight / 2,
      minimapWidth,
      minimapHeight,
      0x0a0a1a,
      0.8
    ).setStrokeStyle(2, 0x8b5cf6, 0.8).setScrollFactor(0).setDepth(999);

    this.minimap = this.scene.add.graphics().setScrollFactor(0).setDepth(1000);

    this.warningOverlay = this.scene.add.graphics().setScrollFactor(0).setDepth(998);
    this.updateWarningOverlay(0);
  }

  public updateStardust(count: number): void {
    this.stardust = count;
    this.stardustText.setText(`星尘: ${count}`);
  }

  public updateShipCount(count: number): void {
    this.shipCount = count;
    this.shipCountText.setText(`采集船: ${count}`);
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
    this.pauseButton.setText(this.isPaused ? '继续' : '暂停');
    this.scene.scene.pause();
    if (!this.isPaused) {
      this.scene.scene.resume();
    }
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public showWarning(active: boolean): void {
    if (active) {
      if (!this.warningTween || !this.warningTween.isPlaying()) {
        this.warningTween = this.scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: 500,
          yoyo: true,
          repeat: -1,
          onUpdate: (tween) => {
            const value = tween.getValue();
            this.updateWarningOverlay(value !== null ? value : 0);
          }
        });
      }
    } else {
      if (this.warningTween) {
        this.warningTween.stop();
        this.warningTween = null;
      }
      this.updateWarningOverlay(0);
    }
  }

  private updateWarningOverlay(alpha: number): void {
    const { width, height } = this.scene.game.config;
    const w = width as number;
    const h = height as number;

    this.warningOverlay.clear();

    const edgeWidth = 40;
    const color = 0x991b1b;

    this.warningOverlay.fillGradientStyle(color, color, color, color, alpha * 0.6, alpha * 0.2, alpha * 0.2, alpha * 0.6);
    this.warningOverlay.fillRect(0, 0, w, edgeWidth);

    this.warningOverlay.fillGradientStyle(color, color, color, color, alpha * 0.2, alpha * 0.6, alpha * 0.6, alpha * 0.2);
    this.warningOverlay.fillRect(0, h - edgeWidth, w, edgeWidth);

    this.warningOverlay.fillGradientStyle(color, color, color, color, alpha * 0.6, alpha * 0.2, alpha * 0.6, alpha * 0.2);
    this.warningOverlay.fillRect(0, 0, edgeWidth, h);

    this.warningOverlay.fillGradientStyle(color, color, color, color, alpha * 0.2, alpha * 0.6, alpha * 0.2, alpha * 0.6);
    this.warningOverlay.fillRect(w - edgeWidth, 0, edgeWidth, h);
  }

  public updateMinimap(
    ships: Array<{ x: number; y: number }>,
    storms: Array<{ x: number; y: number; radius: number }>,
    particles: Array<{ x: number; y: number }>,
    worldWidth: number,
    worldHeight: number
  ): void {
    const minimapWidth = 180;
    const minimapHeight = 135;
    const minimapX = 20;
    const minimapY = (this.scene.game.config.height as number) - minimapHeight - 20;

    this.minimapScale = Math.min(minimapWidth / worldWidth, minimapHeight / worldHeight);

    this.minimap.clear();

    this.minimap.fillStyle(0x1a1a2e, 0.5);
    this.minimap.fillRect(minimapX, minimapY, minimapWidth, minimapHeight);

    this.minimap.fillStyle(0xfbbf24, 0.8);
    const maxParticlesToShow = 100;
    const step = Math.max(1, Math.floor(particles.length / maxParticlesToShow));
    for (let i = 0; i < particles.length; i += step) {
      const p = particles[i];
      if (p) {
        const px = minimapX + p.x * this.minimapScale;
        const py = minimapY + p.y * this.minimapScale;
        this.minimap.fillPoint(px, py, 1);
      }
    }

    this.minimap.fillStyle(0x991b1b, 0.9);
    for (const storm of storms) {
      const sx = minimapX + storm.x * this.minimapScale;
      const sy = minimapY + storm.y * this.minimapScale;
      const sr = storm.radius * this.minimapScale;
      this.minimap.fillCircle(sx, sy, Math.max(sr, 3));
    }

    this.minimap.fillStyle(0x00d4ff, 1);
    for (const ship of ships) {
      const sx = minimapX + ship.x * this.minimapScale;
      const sy = minimapY + ship.y * this.minimapScale;
      this.minimap.fillCircle(sx, sy, 3);
    }

    const camera = this.scene.cameras.main;
    const viewX = minimapX + camera.scrollX * this.minimapScale;
    const viewY = minimapY + camera.scrollY * this.minimapScale;
    const viewW = camera.width * this.minimapScale;
    const viewH = camera.height * this.minimapScale;

    this.minimap.lineStyle(1, 0xffffff, 0.5);
    this.minimap.strokeRect(viewX, viewY, viewW, viewH);
  }

  public destroy(): void {
    if (this.warningTween) {
      this.warningTween.stop();
    }
    this.stardustText.destroy();
    this.shipCountText.destroy();
    this.pauseButton.destroy();
    this.minimap.destroy();
    this.minimapBg.destroy();
    this.warningOverlay.destroy();
  }
}
