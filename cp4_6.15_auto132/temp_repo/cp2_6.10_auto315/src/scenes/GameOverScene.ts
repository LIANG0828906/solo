import Phaser from 'phaser';

const COLORS = {
  BG_DARK: '#0a0a0f',
  NEON_GREEN: '#00ffaa',
  NEON_MAGENTA: '#ff00aa',
  NEON_BLUE: '#00aaff'
} as const;

export default class GameOverScene extends Phaser.Scene {
  private score = 0;
  private highScore = 0;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number }) {
    this.score = data.score;
    const stored = localStorage.getItem('pixelDrift_highScore');
    this.highScore = stored ? parseInt(stored, 10) : 0;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pixelDrift_highScore', this.score.toString());
    }
  }

  create() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    this.add.rectangle(centerX, centerY, 500, 400, 0x0a0a0f, 0.9)
      .setStrokeStyle(4, 0xff00aa);

    this.add.rectangle(centerX, centerY, 500, 400)
      .setStrokeStyle(2, 0x00ffaa)
      .setAlpha(0.5);

    const title = this.add.text(centerX, centerY - 130, 'GAME OVER', {
      fontFamily: 'Courier New, monospace',
      fontSize: '48px',
      color: COLORS.NEON_MAGENTA,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: 'Sine.easeInOut'
    });

    this.add.text(centerX, centerY - 40, `本局得分`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY, this.score.toString().padStart(6, '0'), {
      fontFamily: 'Courier New, monospace',
      fontSize: '42px',
      color: COLORS.NEON_GREEN,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 60, `最高记录`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#888888'
    }).setOrigin(0.5);

    this.add.text(centerX, centerY + 95, this.highScore.toString().padStart(6, '0'), {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: COLORS.NEON_BLUE,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const btnBg = this.add.rectangle(centerX, centerY + 160, 220, 60, 0x0a0a0f)
      .setStrokeStyle(3, 0x00ffaa)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(centerX, centerY + 160, '重新开始', {
      fontFamily: 'Courier New, monospace',
      fontSize: '24px',
      color: COLORS.NEON_GREEN,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setStrokeStyle(3, 0xff00aa);
      btnText.setColor(COLORS.NEON_MAGENTA);
    });

    btnBg.on('pointerout', () => {
      btnBg.setStrokeStyle(3, 0x00ffaa);
      btnText.setColor(COLORS.NEON_GREEN);
    });

    btnBg.on('pointerdown', () => {
      this.restartGame();
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.restartGame();
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.restartGame();
    });
  }

  private restartGame() {
    this.scene.start('RaceScene');
  }
}
