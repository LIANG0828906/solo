import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const isMobile = width < 768;

    this.cameras.main.setBackgroundColor('#0d1117');

    this.createGridBackground(width, height);
    this.createTitle(width, height, isMobile);
    this.createElementIcons(width, height, isMobile);
    this.createTutorial(width, height, isMobile);
    this.createStartButton(width, height, isMobile);
  }

  private createGridBackground(width: number, height: number): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1a2332, 0.5);

    const gridSize = 60;
    for (let x = 0; x < width; x += gridSize) {
      graphics.beginPath();
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
      graphics.strokePath();
    }
    for (let y = 0; y < height; y += gridSize) {
      graphics.beginPath();
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
      graphics.strokePath();
    }
  }

  private createTitle(width: number, height: number, isMobile: boolean): void {
    const titleY = height * 0.15;
    const titleSize = isMobile ? 42 : 64;

    this.add.text(width / 2, titleY, '元素斗兽棋', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: `${titleSize}px`,
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const glow = this.add.text(width / 2, titleY, '元素斗兽棋', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: `${titleSize}px`,
      color: '#00d4ff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.5);

    this.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.7 },
      scale: { from: 1, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const subtitle = this.add.text(width / 2, titleY + (isMobile ? 50 : 70), 'ELEMENT CHESS', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: isMobile ? '14px' : '18px',
      color: '#00ffaa',
      letterSpacing: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: subtitle,
      alpha: { from: 0.5, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createElementIcons(width: number, height: number, isMobile: boolean): void {
    const elements = [
      { icon: '🔥', name: '火', color: '#ff0040', beats: '风' },
      { icon: '💧', name: '水', color: '#00d4ff', beats: '火' },
      { icon: '🪨', name: '土', color: '#ffaa00', beats: '水' },
      { icon: '🌪️', name: '风', color: '#00ffaa', beats: '土' }
    ];

    const startY = height * 0.35;
    const spacing = isMobile ? 70 : 100;
    const iconSize = isMobile ? 40 : 56;

    elements.forEach((elem, index) => {
      const x = width / 2 - (spacing * 1.5) + (index * spacing);
      
      const circle = this.add.circle(x, startY, isMobile ? 30 : 40, 0x1a2332)
        .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(elem.color).color);
      
      const icon = this.add.text(x, startY, elem.icon, {
        fontSize: `${iconSize}px`
      }).setOrigin(0.5);

      this.add.text(x, startY + (isMobile ? 45 : 55), elem.name, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: isMobile ? '12px' : '14px',
        color: elem.color
      }).setOrigin(0.5);

      this.tweens.add({
        targets: circle,
        scale: { from: 1, to: 1.1 },
        alpha: { from: 0.8, to: 1 },
        duration: 1500 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: icon,
        scale: { from: 1, to: 1.15 },
        duration: 1500 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  private createTutorial(width: number, height: number, isMobile: boolean): void {
    const tutorialY = height * 0.55;
    const fontSize = isMobile ? '11px' : '13px';
    const lineHeight = isMobile ? 22 : 28;

    const tutorialBg = this.add.graphics();
    const bgWidth = isMobile ? width * 0.9 : 500;
    const bgHeight = isMobile ? 180 : 160;
    
    tutorialBg.fillStyle(0x1a2332, 0.8);
    tutorialBg.lineStyle(2, 0x00d4ff, 0.5);
    tutorialBg.strokeRoundedRect(
      width / 2 - bgWidth / 2,
      tutorialY - bgHeight / 2,
      bgWidth,
      bgHeight,
      12
    );
    tutorialBg.fillRoundedRect(
      width / 2 - bgWidth / 2,
      tutorialY - bgHeight / 2,
      bgWidth,
      bgHeight,
      12
    );

    this.add.text(width / 2, tutorialY - bgHeight / 2 + 20, '游戏规则', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#00d4ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const rules = [
      '🎮 双方轮流在3x3棋盘上放置元素棋子',
      '⚔️ 拖拽移动到相邻格，点击敌方棋子攻击',
      '🔥 火克风、风克土、土克水、水克火',
      '💥 克制伤害x2，被克制伤害x0.5',
      '🏆 消灭对方所有棋子获胜'
    ];

    rules.forEach((rule, index) => {
      this.add.text(
        width / 2 - bgWidth / 2 + 20,
        tutorialY - bgHeight / 2 + 50 + index * lineHeight,
        rule,
        {
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: fontSize,
          color: '#c9d1d9'
        }
      );
    });
  }

  private createStartButton(width: number, height: number, isMobile: boolean): void {
    const buttonY = height * 0.82;
    const buttonWidth = isMobile ? 200 : 280;
    const buttonHeight = isMobile ? 55 : 70;

    const buttonBg = this.add.graphics();
    
    const drawButton = (alpha: number) => {
      buttonBg.clear();
      buttonBg.fillStyle(0x00d4ff, alpha);
      buttonBg.lineStyle(3, 0x00ffaa, 1);
      buttonBg.strokeRoundedRect(
        width / 2 - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        16
      );
      buttonBg.fillRoundedRect(
        width / 2 - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        16
      );
    };

    drawButton(0.3);

    const buttonText = this.add.text(width / 2, buttonY, '开始游戏', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: isMobile ? '20px' : '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const buttonHitZone = this.add.zone(
      width / 2,
      buttonY,
      buttonWidth,
      buttonHeight
    ).setInteractive({ useHandCursor: true });

    buttonHitZone.on('pointerover', () => {
      drawButton(0.5);
      buttonText.setScale(1.05);
    });

    buttonHitZone.on('pointerout', () => {
      drawButton(0.3);
      buttonText.setScale(1);
    });

    buttonHitZone.on('pointerdown', () => {
      drawButton(0.7);
      buttonText.setScale(0.95);
    });

    buttonHitZone.on('pointerup', () => {
      this.sound.add('click').play();
      this.scene.start('BattleScene');
    });

    this.tweens.add({
      targets: buttonBg,
      alpha: { from: 0.8, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}
