export class EndScene extends Phaser.Scene {
  private finalScore: number = 0;

  constructor() {
    super({ key: 'EndScene' });
  }

  init(data: { score: number }): void {
    this.finalScore = data.score || 0;
  }

  create(): void {
    const { width, height } = this.cameras.main;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0B0F2A, 0.9);
    overlay.setScrollFactor(0).setDepth(200);

    const title = this.add.text(width / 2, height / 2 - 120, '游戏结束', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#FF4B8B',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    title.setShadow(3, 3, '#FF4B8B', 5, true, true);

    this.add.text(width / 2, height / 2 - 40, '最终得分', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#FFFFFF'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    const scoreValue = this.add.text(width / 2, height / 2 + 10, `${Math.floor(this.finalScore)}`, {
      fontFamily: 'Arial',
      fontSize: '64px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    scoreValue.setShadow(3, 3, '#FFD700', 5, true, true);

    const button = this.add.container(width / 2, height / 2 + 120).setDepth(201);
    button.setSize(200, 60).setInteractive({ useHandCursor: true });

    const buttonGlow = this.add.circle(0, 0, 85, 0x7B2FF7, 0.2);
    const buttonBg = this.add.circle(0, 0, 80, 0x7B2FF7, 0.8);
    buttonBg.setStrokeStyle(3, 0xFF4B8B, 1);

    const buttonText = this.add.text(0, 0, '再玩一次', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    button.add([buttonGlow, buttonBg, buttonText]);

    button.on('pointerover', () => {
      buttonBg.setFillStyle(0xFF4B8B, 0.9);
      buttonGlow.setFillStyle(0xFF4B8B, 0.3);
    });

    button.on('pointerout', () => {
      buttonBg.setFillStyle(0x7B2FF7, 0.8);
      buttonGlow.setFillStyle(0x7B2FF7, 0.2);
    });

    button.on('pointerdown', () => {
      this.restartGame();
    });

    this.input.keyboard!.on('keydown-SPACE', () => {
      this.restartGame();
    });

    this.input.keyboard!.on('keydown-ENTER', () => {
      this.restartGame();
    });
  }

  private restartGame(): void {
    this.registry.set('score', 0);
    this.registry.set('starDust', 0);
    this.scene.stop('UI');
    this.scene.stop('GameScene');
    this.scene.stop('EndScene');
    this.scene.start('GameScene');
    this.scene.start('UI');
  }
}
