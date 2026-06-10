import Phaser from 'phaser';
import { Player } from '../utils/elements';

export class GameOverScene extends Phaser.Scene {
  private winner!: Player;
  private player1Score!: number;
  private player2Score!: number;

  init(data: { winner: Player; player1Score: number; player2Score: number }): void {
    this.winner = data.winner;
    this.player1Score = data.player1Score;
    this.player2Score = data.player2Score;
  }

  create(): void {
    const { width, height } = this.scale;
    const isMobile = width < 768;

    this.cameras.main.setBackgroundColor('#0d1117');

    this.createConfetti(width, height);
    this.createResultPanel(width, height, isMobile);
    this.createRestartButton(width, height, isMobile);
    this.playVictorySound();
  }

  private createConfetti(width: number, height: number): void {
    const colors = [0xff0040, 0x00d4ff, 0xffaa00, 0x00ffaa, 0xffffff];
    
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(-100, height);
      const color = Phaser.Utils.Array.GetRandom(colors);
      
      const confetti = this.add.rectangle(
        x,
        y,
        Phaser.Math.Between(4, 8),
        Phaser.Math.Between(8, 16),
        color
      ).setAlpha(0.8);

      this.tweens.add({
        targets: confetti,
        y: height + 100,
        x: x + Phaser.Math.Between(-100, 100),
        rotation: Phaser.Math.Between(-Math.PI * 2, Math.PI * 2),
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Linear'
      });
    }
  }

  private createResultPanel(width: number, height: number, isMobile: boolean): void {
    const panelWidth = isMobile ? width * 0.85 : 450;
    const panelHeight = isMobile ? 320 : 350;
    const panelY = height * 0.45;

    const winnerColor = this.winner === Player.PLAYER1 ? 0xff0040 : 0x00d4ff;
    const winnerName = this.winner === Player.PLAYER1 ? '玩家1' : '玩家2';

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a2332, 0.95);
    panelBg.lineStyle(3, winnerColor, 1);
    panelBg.strokeRoundedRect(
      width / 2 - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );
    panelBg.fillRoundedRect(
      width / 2 - panelWidth / 2,
      panelY - panelHeight / 2,
      panelWidth,
      panelHeight,
      20
    );

    const victoryText = this.add.text(width / 2, panelY - panelHeight / 2 + 50, '🏆 游戏结束 🏆', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: isMobile ? '24px' : '32px',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: victoryText,
      scale: { from: 1, to: 1.1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const winnerText = this.add.text(width / 2, panelY - panelHeight / 2 + 110, `${winnerName} 获胜！`, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: isMobile ? '28px' : '36px',
      color: `#${winnerColor.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: winnerText,
      alpha: { from: 0.7, to: 1 },
      scale: { from: 0.95, to: 1.05 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(width / 2, panelY - 20, '最终比分', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#8b949e'
    }).setOrigin(0.5);

    this.add.text(
      width / 2,
      panelY + 20,
      `${this.player1Score} : ${this.player2Score}`,
      {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: isMobile ? '36px' : '48px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    this.add.text(
      width / 2 - (isMobile ? 80 : 120),
      panelY + 60,
      '玩家1',
      {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: isMobile ? '12px' : '14px',
        color: '#ff0040'
      }
    ).setOrigin(0.5);

    this.add.text(
      width / 2 + (isMobile ? 80 : 120),
      panelY + 60,
      '玩家2',
      {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: isMobile ? '12px' : '14px',
        color: '#00d4ff'
      }
    ).setOrigin(0.5);
  }

  private createRestartButton(width: number, height: number, isMobile: boolean): void {
    const buttonY = height * 0.78;
    const buttonWidth = isMobile ? 180 : 240;
    const buttonHeight = isMobile ? 50 : 60;

    const buttonBg = this.add.graphics();
    
    const drawButton = (alpha: number) => {
      buttonBg.clear();
      buttonBg.fillStyle(0x00ffaa, alpha);
      buttonBg.lineStyle(3, 0x00d4ff, 1);
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

    const buttonText = this.add.text(width / 2, buttonY, '再来一局', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: isMobile ? '18px' : '22px',
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

    const homeButtonWidth = isMobile ? 100 : 120;
    const homeButtonHeight = isMobile ? 40 : 50;
    const homeButtonY = buttonY + (isMobile ? 70 : 80);

    const homeButtonBg = this.add.graphics();
    
    const drawHomeButton = (alpha: number) => {
      homeButtonBg.clear();
      homeButtonBg.fillStyle(0x8b949e, alpha);
      homeButtonBg.lineStyle(2, 0x30363d, 1);
      homeButtonBg.strokeRoundedRect(
        width / 2 - homeButtonWidth / 2,
        homeButtonY - homeButtonHeight / 2,
        homeButtonWidth,
        homeButtonHeight,
        12
      );
      homeButtonBg.fillRoundedRect(
        width / 2 - homeButtonWidth / 2,
        homeButtonY - homeButtonHeight / 2,
        homeButtonWidth,
        homeButtonHeight,
        12
      );
    };

    drawHomeButton(0.5);

    const homeButtonText = this.add.text(width / 2, homeButtonY, '返回主页', {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: isMobile ? '14px' : '16px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const homeButtonHitZone = this.add.zone(
      width / 2,
      homeButtonY,
      homeButtonWidth,
      homeButtonHeight
    ).setInteractive({ useHandCursor: true });

    homeButtonHitZone.on('pointerover', () => {
      drawHomeButton(0.7);
      homeButtonText.setScale(1.05);
    });

    homeButtonHitZone.on('pointerout', () => {
      drawHomeButton(0.5);
      homeButtonText.setScale(1);
    });

    homeButtonHitZone.on('pointerup', () => {
      this.sound.add('click').play();
      this.scene.start('TitleScene');
    });
  }

  private playVictorySound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
        }, index * 150);
      });
    } catch (e) {
      console.log('Audio not supported');
    }
  }
}
