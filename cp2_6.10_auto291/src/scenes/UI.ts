export class UI extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private starDustText!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Container;
  private isPaused: boolean = false;
  private pauseIcon!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'UI', active: true });
  }

  create(): void {
    this.scoreText = this.add.text(20, 20, '分数: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(100);

    this.starDustText = this.add.text(20, 55, '星尘: 0/10', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(100);

    this.createPauseButton();

    this.registry.events.on('changedata', this.updateData, this);

    this.pauseButton.on('pointerdown', () => {
      this.togglePause();
    });

    this.scale.on('resize', this.handleResize, this);
  }

  private createPauseButton(): void {
    this.pauseButton = this.add.container(
      this.cameras.main.width - 60,
      this.cameras.main.height - 60
    ).setDepth(100).setSize(50, 50).setInteractive({ useHandCursor: true });

    const bg = this.add.circle(0, 0, 30, 0xFFFFFF, 0.2);
    bg.setStrokeStyle(2, 0xFFFFFF, 0.6);

    const glow = this.add.circle(0, 0, 34, 0xFFFFFF, 0.1);

    this.pauseIcon = this.add.graphics();
    this.drawPauseIcon();

    this.pauseButton.add([glow, bg, this.pauseIcon]);
  }

  private drawPauseIcon(): void {
    this.pauseIcon.clear();
    if (this.isPaused) {
      this.pauseIcon.fillStyle(0xFFFFFF, 0.9);
      this.pauseIcon.beginPath();
      this.pauseIcon.moveTo(-8, -10);
      this.pauseIcon.lineTo(12, 0);
      this.pauseIcon.lineTo(-8, 10);
      this.pauseIcon.closePath();
      this.pauseIcon.fill();
    } else {
      this.pauseIcon.fillStyle(0xFFFFFF, 0.9);
      this.pauseIcon.fillRect(-10, -10, 6, 20);
      this.pauseIcon.fillRect(4, -10, 6, 20);
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.drawPauseIcon();

    const gameScene = this.scene.get('GameScene');
    if (this.isPaused) {
      gameScene.scene.pause();
    } else {
      gameScene.scene.resume();
    }
  }

  private updateData(_parent: Phaser.Data.DataManager, key: string, value: number): void {
    if (key === 'score') {
      this.scoreText.setText(`分数: ${Math.floor(value)}`);
    } else if (key === 'starDust') {
      this.starDustText.setText(`星尘: ${value}/10`);
      if (value >= 10) {
        this.starDustText.setColor('#00FF00');
      } else {
        this.starDustText.setColor('#FFD700');
      }
    }
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    if (this.pauseButton) {
      this.pauseButton.setPosition(gameSize.width - 60, gameSize.height - 60);
    }
  }
}
