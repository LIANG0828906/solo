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
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const background = this.add.graphics();
    background.fillGradientStyle(0x1a0a2e, 0x2a1a4e, 0x1a0a2e, 0x0a051e, 1);
    background.fillRect(0, 0, width, height);

    this.createStars(width, height);

    const title = this.add.text(width / 2, height * 0.25, '手势魔法塔防', {
      fontSize: '56px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#a0c4ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    title.setShadow(4, 4, '#000000', 0, true, true);

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const subtitle = this.add.text(width / 2, height * 0.25 + 60, 'Gesture Magic Tower Defense', {
      fontSize: '20px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#6a8abf',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    const startButton = this.add.rectangle(
      width / 2,
      height * 0.5,
      200,
      60,
      0x2a4a7f
    ).setStrokeStyle(2, 0x4a7acf).setInteractive({ useHandCursor: true });

    const startText = this.add.text(width / 2, height * 0.5, '开始游戏', {
      fontSize: '24px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);

    startButton.on('pointerover', () => {
      this.tweens.add({
        targets: startButton,
        fillColor: 0x3a5aaf,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });

    startButton.on('pointerout', () => {
      this.tweens.add({
        targets: startButton,
        fillColor: 0x2a4a7f,
        duration: 200,
        ease: 'Power2.easeOut'
      });
    });

    startButton.on('pointerdown', async () => {
      startButton.disableInteractive();
      startText.setText('加载中...');
      
      try {
        this.levelConfig = await this.fetchLevelConfig();
        this.highScores = await this.fetchHighScores();
        this.scene.start('BattleScene', { 
          levelConfig: this.levelConfig,
          highScores: this.highScores
        });
      } catch (error) {
        console.error('Failed to load level config:', error);
        startText.setText('重试');
        startButton.setInteractive({ useHandCursor: true });
      }
    });

    this.createHighScoresDisplay(width, height);

    this.createInstructions(width, height);
  }

  private createStars(width: number, height: number): void {
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(1, 3);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));
      
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: Phaser.Math.FloatBetween(0.1, 0.5) },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1000)
      });
    }
  }

  private async fetchLevelConfig(): Promise<LevelConfig> {
    try {
      const response = await fetch('/api/levels');
      if (!response.ok) throw new Error('Failed to fetch levels');
      return response.json();
    } catch (error) {
      console.log('Using default level config');
      return this.getDefaultLevelConfig();
    }
  }

  private async fetchHighScores(): Promise<HighScore[]> {
    try {
      const response = await fetch('/api/highscores');
      if (!response.ok) throw new Error('Failed to fetch high scores');
      return response.json();
    } catch (error) {
      console.log('Using default high scores');
      return [];
    }
  }

  private getDefaultLevelConfig(): LevelConfig {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      path: [
        { x: 0, y: height * 0.2 },
        { x: width * 0.25, y: height * 0.2 },
        { x: width * 0.25, y: height * 0.5 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.5, y: height * 0.3 },
        { x: width * 0.75, y: height * 0.3 },
        { x: width * 0.75, y: height * 0.6 },
        { x: width, y: height * 0.6 }
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

  private createHighScoresDisplay(width: number, height: number): void {
    const panelX = width * 0.75;
    const panelY = height * 0.5;
    const panelWidth = 280;
    const panelHeight = 220;

    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4e, 0.8);
    panel.lineStyle(2, 0x4a7acf, 0.8);
    panel.strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 4);
    panel.fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 4);

    panel.setShadow(2, 2, 0x000000, 0.3, true, true);

    this.add.text(panelX, panelY - panelHeight / 2 + 20, '🏆 高分榜', {
      fontSize: '20px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.fetchHighScores().then(scores => {
      const displayScores = scores.slice(0, 5);
      displayScores.forEach((score, index) => {
        const yPos = panelY - panelHeight / 2 + 55 + index * 30;
        this.add.text(panelX - 90, yPos, `${index + 1}.`, {
          fontSize: '16px',
          fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
          color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#a0c4ff'
        });
        this.add.text(panelX - 50, yPos, score.score.toLocaleString(), {
          fontSize: '16px',
          fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
          color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff'
        });
      });

      if (displayScores.length === 0) {
        this.add.text(panelX, panelY + 10, '暂无记录', {
          fontSize: '14px',
          fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
          color: '#6a8abf',
          fontStyle: 'italic'
        }).setOrigin(0.5);
      }
    });
  }

  private createInstructions(width: number, height: number): void {
    const panelX = width * 0.25;
    const panelY = height * 0.5;
    const panelWidth = 280;
    const panelHeight = 220;

    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4e, 0.8);
    panel.lineStyle(2, 0x4a7acf, 0.8);
    panel.strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 4);
    panel.fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 4);

    this.add.text(panelX, panelY - panelHeight / 2 + 20, '✋ 操作说明', {
      fontSize: '20px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#a0c4ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const instructions = [
      { icon: '🖐️', text: '五指张开 - 瞄准' },
      { icon: '✊', text: '握拳 - 建造箭塔 (30金币)' },
      { icon: '☝️', text: '食指指向 - 发射箭矢' }
    ];

    instructions.forEach((inst, index) => {
      const yPos = panelY - panelHeight / 2 + 60 + index * 40;
      this.add.text(panelX - 90, yPos, inst.icon, {
        fontSize: '24px'
      });
      this.add.text(panelX - 40, yPos + 2, inst.text, {
        fontSize: '14px',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        color: '#a0c4ff'
      });
    });
  }
}
