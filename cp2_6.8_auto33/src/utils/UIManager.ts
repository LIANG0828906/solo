import Phaser from 'phaser';
import { ScoreUpdatedEvent } from './ScoreManager';

export class UIManager {
  private scene: Phaser.Scene;
  private hudContainer!: Phaser.GameObjects.Container;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private hudBg!: Phaser.GameObjects.Graphics;
  private comboTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createHUD(width: number): void {
    this.hudContainer = this.scene.add.container(0, 0);
    this.hudContainer.setDepth(100);

    this.hudBg = this.scene.add.graphics();
    this.drawHUDBackground(width);

    this.scoreText = this.scene.add.text(30, 28, '分数: 0', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.applyTextGlow(this.scoreText);

    this.comboText = this.scene.add.text(width / 2, 28, '', {
      fontFamily: 'Arial',
      fontSize: '26px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.levelText = this.scene.add.text(width - 200, 28, '关卡: 1', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.applyTextGlow(this.levelText);

    this.livesText = this.scene.add.text(width - 80, 28, '❤❤❤', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ff4081',
      fontStyle: 'bold'
    });
    this.applyTextGlow(this.livesText, '#ff4081');

    this.hudContainer.add([this.hudBg, this.scoreText, this.comboText, this.levelText, this.livesText]);
  }

  private drawHUDBackground(width: number): void {
    this.hudBg.clear();
    this.hudBg.fillStyle(0xffffff, 0.1);
    this.hudBg.fillRect(0, 10, width, 50);

    this.hudBg.lineStyle(1, 0xffffff, 0.2);
    this.hudBg.strokeRect(0, 10, width, 50);
  }

  private applyTextGlow(text: Phaser.GameObjects.Text, glowColor: string = '#00e5ff'): void {
    text.setShadow(2, 2, glowColor, 3, true, true);
  }

  updateScore(event: ScoreUpdatedEvent): void {
    this.scoreText.setText(`分数: ${event.score}`);

    if (event.combo > 1) {
      this.comboText.setText(`连锁 x${event.combo}! +${event.pointsGained}`);
      this.comboText.setAlpha(1);
      this.animateCombo();
    }
  }

  resetCombo(): void {
    this.comboText.setText('');
    this.comboText.setAlpha(0);
    if (this.comboTween) {
      this.comboTween.stop();
      this.comboTween = null;
    }
  }

  private animateCombo(): void {
    if (this.comboTween) {
      this.comboTween.stop();
    }

    this.comboText.setScale(1.5);

    this.comboTween = this.scene.tweens.add({
      targets: this.comboText,
      scale: { from: 1.5, to: 1 },
      alpha: { from: 1, to: 0.8 },
      duration: 300,
      ease: 'Back.Out',
      yoyo: true,
      repeat: 0
    });
  }

  updateLives(lives: number): void {
    const hearts = '❤'.repeat(Math.max(0, lives));
    this.livesText.setText(hearts);
  }

  updateLevel(level: number): void {
    this.levelText.setText(`关卡: ${level}`);
  }

  showGameOver(onRestart: () => void): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.scene.cameras.main.shake(500, 0.01);

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);

    const gameOverText = this.scene.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
      fontFamily: 'Arial',
      fontSize: '64px',
      color: '#ff4081',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    gameOverText.setShadow(4, 4, '#00e5ff', 6, true, true);
    gameOverText.setDepth(201);

    const scoreText = this.scene.add.text(width / 2, height / 2 - 10, `最终分数: ${this.scoreText.text.split(': ')[1]}`, {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    scoreText.setShadow(2, 2, '#00e5ff', 3, true, true);
    scoreText.setDepth(201);

    const buttonBg = this.scene.add.graphics();
    const buttonWidth = 240;
    const buttonHeight = 60;
    const buttonX = width / 2 - buttonWidth / 2;
    const buttonY = height / 2 + 50;

    const drawButton = (isHover: boolean) => {
      buttonBg.clear();
      const gradient = buttonBg.createLinearGradient(buttonX, buttonY, buttonX + buttonWidth, buttonY + buttonHeight);
      gradient.addColorStop(0, isHover ? '#ff8800' : '#ff6f00');
      gradient.addColorStop(1, isHover ? '#ff60a0' : '#ff4081');
      buttonBg.fillGradientStyle(
        Phaser.Display.Color.HexStringToColor(isHover ? '#ff8800' : '#ff6f00').color,
        Phaser.Display.Color.HexStringToColor(isHover ? '#ff60a0' : '#ff4081').color,
        Phaser.Display.Color.HexStringToColor(isHover ? '#ff60a0' : '#ff4081').color,
        Phaser.Display.Color.HexStringToColor(isHover ? '#ff8800' : '#ff6f00').color,
        1, 1, 1, 1
      );
      buttonBg.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);

      if (isHover) {
        buttonBg.lineStyle(3, 0xffffff, 0.8);
        buttonBg.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 12);
      }
    };
    drawButton(false);
    buttonBg.setDepth(201);

    const restartText = this.scene.add.text(width / 2, buttonY + buttonHeight / 2, '重新开始', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    restartText.setShadow(2, 2, '#000000', 2, true, true);
    restartText.setDepth(202);

    const buttonHit = this.scene.add.zone(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, buttonWidth, buttonHeight);
    buttonHit.setInteractive({ useHandCursor: true });
    buttonHit.setDepth(203);

    let breathTween: Phaser.Tweens.Tween;
    const startBreath = () => {
      breathTween = this.scene.tweens.add({
        targets: buttonBg,
        alpha: { from: 1, to: 0.7 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    };
    startBreath();

    buttonHit.on('pointerover', () => {
      drawButton(true);
      breathTween.stop();
      buttonBg.setAlpha(1);
    });

    buttonHit.on('pointerout', () => {
      drawButton(false);
      startBreath();
    });

    buttonHit.on('pointerdown', () => {
      overlay.destroy();
      gameOverText.destroy();
      scoreText.destroy();
      buttonBg.destroy();
      restartText.destroy();
      buttonHit.destroy();
      onRestart();
    });
  }

  showMainMenu(onStart: () => void): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.createGalaxyBackground(width, height);

    const title = this.scene.add.text(width / 2, height / 2 - 120, '霓虹打砖块', {
      fontFamily: 'Arial',
      fontSize: '72px',
      color: '#ff4081',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    title.setShadow(4, 4, '#00e5ff', 8, true, true);
    title.setDepth(10);

    const subtitle = this.scene.add.text(width / 2, height / 2 - 50, 'NEON BREAKOUT', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#00e5ff',
      fontStyle: 'bold',
      letterSpacing: 8
    }).setOrigin(0.5);
    subtitle.setShadow(2, 2, '#ff4081', 4, true, true);
    subtitle.setDepth(10);

    const buttonWidth = 280;
    const buttonHeight = 70;
    const buttonX = width / 2 - buttonWidth / 2;
    const buttonY = height / 2 + 40;

    const buttonBg = this.scene.add.graphics();
    const drawButton = (isHover: boolean) => {
      buttonBg.clear();
      const color1 = isHover ? 0xff8800 : 0xff6f00;
      const color2 = isHover ? 0xff60a0 : 0xff4081;
      buttonBg.fillGradientStyle(color1, color1, color2, color2, 1, 1, 1, 1);
      buttonBg.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 14);

      buttonBg.lineStyle(isHover ? 3 : 1, 0xffffff, isHover ? 0.9 : 0.3);
      buttonBg.strokeRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 14);

      if (isHover) {
        buttonBg.lineStyle(6, 0x00e5ff, 0.5);
        buttonBg.strokeRoundedRect(buttonX - 2, buttonY - 2, buttonWidth + 4, buttonHeight + 4, 16);
      }
    };
    drawButton(false);
    buttonBg.setDepth(10);

    const startText = this.scene.add.text(width / 2, buttonY + buttonHeight / 2, '开始游戏', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    startText.setShadow(2, 2, '#000000', 2, true, true);
    startText.setDepth(11);

    const buttonHit = this.scene.add.zone(buttonX + buttonWidth / 2, buttonY + buttonHeight / 2, buttonWidth, buttonHeight);
    buttonHit.setInteractive({ useHandCursor: true });
    buttonHit.setDepth(12);

    const breathTween = this.scene.tweens.add({
      targets: buttonBg,
      alpha: { from: 1, to: 0.65 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    buttonHit.on('pointerover', () => {
      drawButton(true);
      breathTween.pause();
      buttonBg.setAlpha(1);
    });

    buttonHit.on('pointerout', () => {
      drawButton(false);
      breathTween.resume();
    });

    buttonHit.on('pointerdown', () => {
      title.destroy();
      subtitle.destroy();
      buttonBg.destroy();
      startText.destroy();
      buttonHit.destroy();
      breathTween.stop();
      onStart();
    });
  }

  private createGalaxyBackground(width: number, height: number): void {
    const particlesTexture = this.scene.textures.createCanvas('menu-galaxy', 8, 8);
    const ctx = particlesTexture.getContext();
    const gradient = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 8, 8);
    particlesTexture.refresh();

    const particles = this.scene.add.particles(width / 2, height / 2, 'menu-galaxy', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: { min: 4000, max: 8000 },
      speed: { min: 15, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 1.2 },
      quantity: 3,
      frequency: 40,
      tint: [0xff6f00, 0x4fc3f7, 0xff4081, 0x00e5ff],
      blendMode: 'ADD'
    });
    particles.setDepth(0);

    this.scene.tweens.add({
      targets: particles,
      rotate: { from: 0, to: 0.05 },
      duration: 10000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  showLevelComplete(level: number, onNext: () => void): void {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(150);

    const text = this.scene.add.text(width / 2, height / 2, `第 ${level} 关完成!`, {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#00e5ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    text.setShadow(4, 4, '#ff4081', 6, true, true);
    text.setDepth(151);
    text.setAlpha(0);

    this.scene.tweens.add({
      targets: text,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1 },
      duration: 500,
      ease: 'Back.Out',
      onComplete: () => {
        this.scene.time.delayedCall(1500, () => {
          this.scene.tweens.add({
            targets: text,
            alpha: { from: 1, to: 0 },
            scale: { from: 1, to: 1.5 },
            duration: 300,
            onComplete: () => {
              overlay.destroy();
              text.destroy();
              onNext();
            }
          });
        });
      }
    });
  }

  resize(width: number): void {
    if (this.hudBg) {
      this.drawHUDBackground(width);
    }
    if (this.levelText) {
      this.levelText.setX(width - 200);
    }
    if (this.livesText) {
      this.livesText.setX(width - 80);
    }
  }
}
