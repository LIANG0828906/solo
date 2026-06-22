import Phaser from 'phaser';

interface HighScore {
  score: number;
  name: string;
  date: string;
}

interface LevelConfig {
  waves: Array<{
    normalCount: number;
    armoredCount: number;
    speed: number;
  }>;
  path: Array<{ x: number; y: number }>;
}

export class MenuScene extends Phaser.Scene {
  private levelConfig: LevelConfig | null = null;
  private highScores: HighScore[] = [];

  constructor() {
    super('MenuScene');
  }

  preload(): void {
    this.load.setCORS('anonymous');
  }

  async create(): Promise<void> {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const background = this.add.graphics();
    background.fillGradientStyle(0x1a0a2e, 0x2a1a4e, 0x1a0a2e, 0x0a051e, 1);
    background.fillRect(0, 0, w, h);

    this.createStars(w, h);

    const title = this.add.text(w * 0.5, h * 0.25, '手势魔法塔防', {
      fontSize: `${Math.max(40, h * 0.052)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#a0c4ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    title.setShadow(4, 4, '#000000', 0, true, true);

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.add.text(w * 0.5, h * 0.25 + h * 0.055, 'Gesture Magic Tower Defense', {
      fontSize: `${Math.max(16, h * 0.018)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#6a8abf',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    const startButton = this.add.rectangle(
      w * 0.5, h * 0.5, Math.max(200, w * 0.15), Math.max(60, h * 0.055), 0x2a4a7f
    ).setStrokeStyle(2, 0x4a7acf).setInteractive({ useHandCursor: true });

    const startText = this.add.text(w * 0.5, h * 0.5, '开始游戏', {
      fontSize: `${Math.max(20, h * 0.022)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);

    startButton.on('pointerover', () => {
      this.tweens.add({ targets: startButton, fillColor: 0x3a5aaf, duration: 200, ease: 'Power2.easeOut' });
    });
    startButton.on('pointerout', () => {
      this.tweens.add({ targets: startButton, fillColor: 0x2a4a7f, duration: 200, ease: 'Power2.easeOut' });
    });

    startButton.on('pointerdown', async () => {
      startButton.disableInteractive();
      startText.setText('加载中...');
      try {
        this.levelConfig = await this.fetchLevelConfig();
        this.highScores = await this.fetchHighScores();
        this.scene.start('BattleScene', { levelConfig: this.levelConfig, highScores: this.highScores });
      } catch (error) {
        console.error('Failed to load level config:', error);
        startText.setText('重试');
        startButton.setInteractive({ useHandCursor: true });
      }
    });

    this.createHighScoresDisplay(w, h);
    this.createInstructions(w, h);
  }

  private createStars(w: number, h: number): void {
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.FloatBetween(1, 3);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: Phaser.Math.FloatBetween(0.1, 0.5) },
        duration: Phaser.Math.Between(1000, 3000), yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: Phaser.Math.Between(0, 1000)
      });
    }
  }

  private async fetchLevelConfig(): Promise<LevelConfig> {
    try {
      const r = await fetch('/api/levels');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    } catch { return this.getDefaultLevelConfig(); }
  }

  private async fetchHighScores(): Promise<HighScore[]> {
    try {
      const r = await fetch('/api/highscores');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    } catch { return []; }
  }

  private getDefaultLevelConfig(): LevelConfig {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      path: [
        { x: 0, y: h * 0.2 }, { x: w * 0.25, y: h * 0.2 },
        { x: w * 0.25, y: h * 0.5 }, { x: w * 0.5, y: h * 0.5 },
        { x: w * 0.5, y: h * 0.3 }, { x: w * 0.75, y: h * 0.3 },
        { x: w * 0.75, y: h * 0.6 }, { x: w, y: h * 0.6 }
      ],
      waves: [
        { normalCount: 5, armoredCount: 0, speed: 70 },
        { normalCount: 6, armoredCount: 1, speed: 70 },
        { normalCount: 6, armoredCount: 2, speed: 75 },
        { normalCount: 7, armoredCount: 2, speed: 75 },
        { normalCount: 8, armoredCount: 3, speed: 80 }
      ]
    };
  }

  private createHighScoresDisplay(w: number, h: number): void {
    const panelX = w * 0.75;
    const panelY = h * 0.55;
    const panelW = Math.max(250, w * 0.2);
    const panelH = Math.max(200, h * 0.2);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(panelX - panelW / 2 + 2, panelY - panelH / 2 + 2, panelW, panelH, 4);

    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4e, 0.8);
    panel.lineStyle(2, 0x4a7acf, 0.8);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 4);
    panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 4);

    this.add.text(panelX, panelY - panelH / 2 + 20, '🏆 高分榜', {
      fontSize: `${Math.max(16, h * 0.018)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.fetchHighScores().then(scores => {
      const top5 = scores.slice(0, 5);
      top5.forEach((s, i) => {
        const yy = panelY - panelH / 2 + 55 + i * 30;
        const c = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#a0c4ff';
        this.add.text(panelX - panelW * 0.35, yy, `${i + 1}.`, {
          fontSize: '14px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', color: c
        });
        this.add.text(panelX - panelW * 0.2, yy, s.score.toLocaleString(), {
          fontSize: '14px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
          color: i === 0 ? '#ffd700' : '#ffffff'
        });
      });
      if (top5.length === 0) {
        this.add.text(panelX, panelY + 10, '暂无记录', {
          fontSize: '14px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
          color: '#6a8abf', fontStyle: 'italic'
        }).setOrigin(0.5);
      }
    });
  }

  private createInstructions(w: number, h: number): void {
    const panelX = w * 0.25;
    const panelY = h * 0.55;
    const panelW = Math.max(250, w * 0.2);
    const panelH = Math.max(200, h * 0.2);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(panelX - panelW / 2 + 2, panelY - panelH / 2 + 2, panelW, panelH, 4);

    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4e, 0.8);
    panel.lineStyle(2, 0x4a7acf, 0.8);
    panel.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 4);
    panel.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 4);

    this.add.text(panelX, panelY - panelH / 2 + 20, '✋ 操作说明', {
      fontSize: `${Math.max(16, h * 0.018)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#a0c4ff', fontStyle: 'bold'
    }).setOrigin(0.5);

    const instructions = [
      { icon: '🖐️', text: '五指张开 - 瞄准' },
      { icon: '✊', text: '握拳 - 建造箭塔 (30金币)' },
      { icon: '☝️', text: '食指指向 - 发射箭矢' }
    ];
    instructions.forEach((inst, i) => {
      const yy = panelY - panelH / 2 + 55 + i * 35;
      this.add.text(panelX - panelW * 0.35, yy, inst.icon, { fontSize: '20px' });
      this.add.text(panelX - panelW * 0.15, yy + 2, inst.text, {
        fontSize: `${Math.max(12, h * 0.013)}px`,
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', color: '#a0c4ff'
      });
    });
  }
}
