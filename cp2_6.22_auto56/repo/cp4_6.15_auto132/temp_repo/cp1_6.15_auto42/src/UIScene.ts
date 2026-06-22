import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private collectedText!: Phaser.GameObjects.Text;
  private gameOverPanel!: Phaser.GameObjects.Container;
  private isGameOver: boolean = false;
  private panelBg!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    this.isGameOver = false;

    const w = this.scale.width;

    this.scoreText = this.add.text(20, 20, '分数: 0', {
      fontSize: '22px',
      fontFamily: '"Segoe UI", sans-serif',
      color: '#aaccff',
      stroke: '#000033',
      strokeThickness: 3,
    });
    this.scoreText.setDepth(200);

    this.collectedText = this.add.text(20, 50, '回收: 0', {
      fontSize: '18px',
      fontFamily: '"Segoe UI", sans-serif',
      color: '#88aadd',
      stroke: '#000033',
      strokeThickness: 2,
    });
    this.collectedText.setDepth(200);

    this.livesText = this.add.text(w - 20, 20, '❤ ❤ ❤', {
      fontSize: '22px',
      fontFamily: '"Segoe UI", sans-serif',
      color: '#ff6666',
      stroke: '#000033',
      strokeThickness: 3,
    });
    this.livesText.setOrigin(1, 0);
    this.livesText.setDepth(200);

    this.gameOverPanel = this.add.container(0, 0);
    this.gameOverPanel.setDepth(300);
    this.gameOverPanel.setVisible(false);

    const playScene = this.scene.get('PlayScene');
    playScene.events.on('update-score', (score: number) => {
      this.scoreText.setText('分数: ' + score);
    });
    playScene.events.on('update-collected', (count: number) => {
      this.collectedText.setText('回收: ' + count);
    });
    playScene.events.on('update-lives', (lives: number) => {
      const hearts = '❤ '.repeat(Math.max(0, lives)).trim();
      this.livesText.setText(hearts);
    });
    playScene.events.on('game-over', (data: { score: number; collected: number; time: number }) => {
      this.showGameOverPanel(data);
    });

    this.scale.on('resize', this.handleResize, this);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const w = gameSize.width;
    this.livesText.setX(w - 20);
  }

  private showGameOverPanel(data: { score: number; collected: number; time: number }): void {
    this.isGameOver = true;
    const w = this.scale.width;
    const h = this.scale.height;

    this.gameOverPanel.removeAll(true);
    this.gameOverPanel.setPosition(0, 0);

    const panelW = 380;
    const panelH = 300;
    const px = (w - panelW) / 2;
    const py = (h - panelH) / 2;

    this.panelBg = this.add.graphics();
    this.panelBg.fillStyle(0x0a0a2e, 0.85);
    this.panelBg.fillRoundedRect(px, py, panelW, panelH, 16);
    this.panelBg.lineStyle(2, 0x4488cc, 0.5);
    this.panelBg.strokeRoundedRect(px, py, panelW, panelH, 16);

    this.drawFrostedOverlay(px, py, panelW, panelH);

    this.gameOverPanel.add(this.panelBg);

    const title = this.add.text(w / 2, py + 40, '任务结束', {
      fontSize: '32px',
      fontFamily: '"Segoe UI", sans-serif',
      color: '#ffffff',
      stroke: '#000033',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    this.gameOverPanel.add(title);

    const scoreLabel = this.add.text(w / 2, py + 100, '0', {
      fontSize: '42px',
      fontFamily: '"Segoe UI", sans-serif',
      color: '#88ccff',
      stroke: '#000033',
      strokeThickness: 4,
    });
    scoreLabel.setOrigin(0.5);
    this.gameOverPanel.add(scoreLabel);

    const collectedLabel = this.add.text(w / 2, py + 170, '回收碎片: 0', {
      fontSize: '20px',
      fontFamily: '"Segoe UI", sans-serif',
      color: '#aabbdd',
    });
    collectedLabel.setOrigin(0.5);
    this.gameOverPanel.add(collectedLabel);

    const minutes = Math.floor(data.time / 60);
    const seconds = Math.floor(data.time % 60);
    const timeStr = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
    const timeLabel = this.add.text(w / 2, py + 205, '游戏时长: ' + timeStr, {
      fontSize: '20px',
      fontFamily: '"Segoe UI", sans-serif',
      color: '#aabbdd',
    });
    timeLabel.setOrigin(0.5);
    this.gameOverPanel.add(timeLabel);

    const restartBtn = this.add.text(w / 2, py + 260, '[ 重新开始 ]', {
      fontSize: '22px',
      fontFamily: '"Segoe UI", sans-serif',
      color: '#66aaff',
      stroke: '#000033',
      strokeThickness: 2,
    });
    restartBtn.setOrigin(0.5);
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerover', () => restartBtn.setColor('#aaddff'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#66aaff'));
    restartBtn.on('pointerdown', () => {
      this.restartGame();
    });
    this.gameOverPanel.add(restartBtn);

    this.gameOverPanel.setVisible(true);

    this.animateNumber(scoreLabel, 0, data.score, 1500);
    this.animateNumber(collectedLabel, 0, data.collected, 1200, '回收碎片: ');
  }

  private drawFrostedOverlay(x: number, y: number, w: number, h: number): void {
    const blur = this.add.graphics();
    blur.setDepth(299);
    blur.fillStyle(0x1a1a4e, 0.3);
    blur.fillRoundedRect(x + 4, y + 4, w - 8, h - 8, 12);
  }

  private animateNumber(textObj: Phaser.GameObjects.Text, from: number, to: number, duration: number, prefix: string = ''): void {
    const startTime = this.time.now;
    const diff = to - from;

    const updateTick = () => {
      if (!textObj.active) return;
      const elapsed = this.time.now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(from + diff * eased);
      textObj.setText(prefix + current.toString());
      if (progress < 1) {
        this.time.delayedCall(16, updateTick);
      }
    };

    updateTick();
  }

  private restartGame(): void {
    this.gameOverPanel.setVisible(false);
    this.gameOverPanel.removeAll(true);
    this.isGameOver = false;
    this.scoreText.setText('分数: 0');
    this.collectedText.setText('回收: 0');
    this.livesText.setText('❤ ❤ ❤');
    this.scene.stop('PlayScene');
    this.scene.start('PlayScene');
  }

  update(): void {
    if (this.isGameOver) {
      this.gameOverPanel.setAlpha(1);
    }
  }
}
