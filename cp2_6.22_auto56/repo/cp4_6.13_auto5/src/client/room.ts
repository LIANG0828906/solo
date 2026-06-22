import Phaser from 'phaser';
import { COLORS } from './types/game.js';

export interface RoomUIConfig {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onCopyRoomCode: () => void;
}

export class RoomUI {
  private scene: Phaser.Scene;
  private config: RoomUIConfig;
  private container: Phaser.GameObjects.Container | null = null;
  private currentMode: 'menu' | 'waiting' | 'join' = 'menu';
  private roomCodeText: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, config: RoomUIConfig) {
    this.scene = scene;
    this.config = config;
  }

  show(): void {
    this.hide();
    this.createMainMenu();
  }

  private createMainMenu(): void {
    const { width, height } = this.scene.scale;
    this.container = this.scene.add.container(width / 2, height / 2);

    const title = this.scene.add.text(0, -height * 0.25, 'CYBER MAZE', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.min(48, width * 0.08)}px`,
      color: COLORS.NEON_BLUE,
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, COLORS.NEON_BLUE, 20);

    const subtitle = this.scene.add.text(0, -height * 0.18, 'RACE', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.min(36, width * 0.06)}px`,
      color: COLORS.NEON_PINK,
      fontStyle: 'bold'
    });
    subtitle.setOrigin(0.5);
    subtitle.setShadow(0, 0, COLORS.NEON_PINK, 15);

    const nameLabel = this.scene.add.text(0, -height * 0.08, 'YOUR NAME', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.min(14, width * 0.025)}px`,
      color: COLORS.TEXT_DIM
    });
    nameLabel.setOrigin(0.5);

    const nameInput = this.createInputField(0, -height * 0.02, width * 0.3, 40, 'Enter name...');

    const createBtn = this.createButton(0, height * 0.08, width * 0.3, 45, 'CREATE ROOM', COLORS.NEON_BLUE, () => {
      const playerName = nameInput.text.trim() || 'Player';
      this.config.onCreateRoom(playerName);
    });

    const joinBtn = this.createButton(0, height * 0.16, width * 0.3, 45, 'JOIN ROOM', COLORS.NEON_PINK, () => {
      this.showJoinRoom();
    });

    const hint = this.scene.add.text(0, height * 0.28, '与好友在迷宫中展开竞速对决', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: `${Math.min(12, width * 0.02)}px`,
      color: COLORS.TEXT_DIM
    });
    hint.setOrigin(0.5);

    this.container.add([title, subtitle, nameLabel, nameInput, createBtn, joinBtn, hint]);
    this.currentMode = 'menu';
  }

  private createInputField(x: number, y: number, width: number, height: number, placeholder: string): Phaser.GameObjects.Text {
    const bg = this.scene.add.rectangle(x, y, width, height, 0x0d0221, 0.8);
    bg.setStrokeStyle(2, COLORS.NEON_BLUE, 0.5);
    this.container?.add(bg);

    let text = '';
    const textObj = this.scene.add.text(x, y, placeholder, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '16px',
      color: COLORS.TEXT_DIM
    });
    textObj.setOrigin(0.5);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      this.scene.input.stopPropagation();
      const userInput = prompt('请输入你的名字:', text);
      if (userInput !== null) {
        text = userInput.substring(0, 12);
        textObj.setText(text || placeholder);
        textObj.setColor(text ? COLORS.TEXT : COLORS.TEXT_DIM);
      }
    });

    return textObj;
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const btnContainer = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(0, 0, width, height, 0x0d0221, 0.9);
    bg.setStrokeStyle(2, color, 0.8);

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      color: color,
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    text.setShadow(0, 0, color, 10);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setStrokeStyle(3, color, 1);
      bg.setFillStyle(0x1a0a2e, 0.95);
      text.setScale(1.05);
      this.scene.tweens.add({
        targets: bg,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 150,
        ease: 'Power2'
      });
    });

    bg.on('pointerout', () => {
      bg.setStrokeStyle(2, color, 0.8);
      bg.setFillStyle(0x0d0221, 0.9);
      text.setScale(1);
      this.scene.tweens.add({
        targets: bg,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2'
      });
    });

    bg.on('pointerdown', onClick);

    btnContainer.add([bg, text]);
    return btnContainer;
  }

  private showJoinRoom(): void {
    if (!this.container) return;

    const { width, height } = this.scene.scale;
    this.container.removeAll(true);

    const title = this.scene.add.text(0, -height * 0.2, 'JOIN ROOM', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.min(32, width * 0.05)}px`,
      color: COLORS.NEON_PINK,
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, COLORS.NEON_PINK, 15);

    const nameLabel = this.scene.add.text(0, -height * 0.1, 'YOUR NAME', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.min(12, width * 0.02)}px`,
      color: COLORS.TEXT_DIM
    });
    nameLabel.setOrigin(0.5);

    const nameInput = this.createInputField(0, -height * 0.04, width * 0.25, 35, 'Enter name...');

    const codeLabel = this.scene.add.text(0, height * 0.03, 'ROOM CODE', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.min(12, width * 0.02)}px`,
      color: COLORS.TEXT_DIM
    });
    codeLabel.setOrigin(0.5);

    const codeInputBg = this.scene.add.rectangle(0, height * 0.09, width * 0.25, 35, 0x0d0221, 0.8);
    codeInputBg.setStrokeStyle(2, COLORS.NEON_PINK, 0.5);

    let codeText = '';
    const codeInput = this.scene.add.text(0, height * 0.09, 'XXXXXX', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '18px',
      color: COLORS.TEXT_DIM,
      letterSpacing: '4px'
    });
    codeInput.setOrigin(0.5);

    codeInputBg.setInteractive({ useHandCursor: true });
    codeInputBg.on('pointerdown', () => {
      this.scene.input.stopPropagation();
      const userInput = prompt('请输入房间码:');
      if (userInput !== null) {
        codeText = userInput.toUpperCase().substring(0, 6);
        codeInput.setText(codeText || 'XXXXXX');
        codeInput.setColor(codeText ? COLORS.NEON_PINK : COLORS.TEXT_DIM);
      }
    });

    const joinBtn = this.createButton(0, height * 0.18, width * 0.25, 40, 'JOIN', COLORS.NEON_PINK, () => {
      const playerName = nameInput.text.trim() || 'Player';
      const roomCode = codeText.trim();
      if (roomCode.length === 6) {
        this.config.onJoinRoom(roomCode, playerName);
      } else {
        this.showError('请输入有效的6位房间码');
      }
    });

    const backBtn = this.createButton(0, height * 0.26, width * 0.2, 35, 'BACK', COLORS.TEXT_DIM, () => {
      this.show();
    });

    this.container.add([title, nameLabel, nameInput, codeLabel, codeInputBg, codeInput, joinBtn, backBtn]);
    this.currentMode = 'join';
  }

  showWaitingRoom(roomCode: string, playerName: string, isHost: boolean): void {
    if (!this.container) {
      const { width, height } = this.scene.scale;
      this.container = this.scene.add.container(width / 2, height / 2);
    } else {
      this.container.removeAll(true);
    }

    const { width, height } = this.scene.scale;

    const title = this.scene.add.text(0, -height * 0.2, 'WAITING FOR OPPONENT', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.min(24, width * 0.04)}px`,
      color: COLORS.NEON_BLUE,
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, COLORS.NEON_BLUE, 15);

    const playerLabel = this.scene.add.text(0, -height * 0.1, `PLAYER: ${playerName}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '14px',
      color: COLORS.TEXT
    });
    playerLabel.setOrigin(0.5);

    const codeLabel = this.scene.add.text(0, -height * 0.03, 'ROOM CODE', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      color: COLORS.TEXT_DIM
    });
    codeLabel.setOrigin(0.5);

    this.roomCodeText = this.scene.add.text(0, height * 0.02, roomCode, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '32px',
      color: COLORS.NEON_PINK,
      letterSpacing: '8px'
    });
    this.roomCodeText.setOrigin(0.5);
    this.roomCodeText.setShadow(0, 0, COLORS.NEON_PINK, 15);

    const copyBtn = this.createButton(0, height * 0.1, width * 0.2, 35, 'COPY CODE', COLORS.NEON_BLUE, () => {
      navigator.clipboard.writeText(roomCode).then(() => {
        this.showMessage('房间码已复制!');
      }).catch(() => {
        this.showMessage(`房间码: ${roomCode}`);
      });
      this.config.onCopyRoomCode();
    });

    const dots = this.scene.add.text(0, height * 0.2, '●', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: COLORS.NEON_BLUE
    });
    dots.setOrigin(0.5);

    let dotCount = 0;
    this.scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        dotCount = (dotCount + 1) % 4;
        dots.setText('●'.repeat(dotCount) + '○'.repeat(3 - dotCount));
      }
    });

    const hint = this.scene.add.text(0, height * 0.28, '等待对手加入...', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '14px',
      color: COLORS.TEXT_DIM
    });
    hint.setOrigin(0.5);

    this.container.add([title, playerLabel, codeLabel, this.roomCodeText, copyBtn, dots, hint]);
    this.currentMode = 'waiting';

    this.startGlitchEffect(title);
  }

  private startGlitchEffect(textObj: Phaser.GameObjects.Text): void {
    this.scene.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        if (Math.random() > 0.7) {
          textObj.setX(textObj.x + (Math.random() - 0.5) * 4);
          textObj.setAlpha(0.8);
          this.scene.time.delayedCall(50, () => {
            textObj.setX(textObj.x);
            textObj.setAlpha(1);
          });
        }
      }
    });
  }

  showError(message: string): void {
    const { width, height } = this.scene.scale;
    const errorText = this.scene.add.text(width / 2, height * 0.85, message, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '14px',
      color: '#ff4444'
    });
    errorText.setOrigin(0.5);
    errorText.setShadow(0, 0, '#ff4444', 10);

    this.scene.tweens.add({
      targets: errorText,
      x: '+=5',
      yoyo: true,
      repeat: 5,
      duration: 50,
      onComplete: () => {
        this.scene.time.delayedCall(2000, () => {
          errorText.destroy();
        });
      }
    });
  }

  showMessage(message: string): void {
    const { width, height } = this.scene.scale;
    const msgText = this.scene.add.text(width / 2, height * 0.85, message, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '14px',
      color: COLORS.NEON_BLUE
    });
    msgText.setOrigin(0.5);
    msgText.setShadow(0, 0, COLORS.NEON_BLUE, 10);

    this.scene.time.delayedCall(2000, () => {
      msgText.destroy();
    });
  }

  showCountdown(count: number): void {
    const { width, height } = this.scene.scale;

    this.scene.cameras.main.flash(200, 255, 255, 255);

    const countText = this.scene.add.text(width / 2, height / 2, count > 0 ? count.toString() : 'GO!', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.min(120, width * 0.15)}px`,
      color: count > 0 ? COLORS.NEON_BLUE : COLORS.NEON_PINK,
      fontStyle: 'bold'
    });
    countText.setOrigin(0.5);
    countText.setShadow(0, 0, count > 0 ? COLORS.NEON_BLUE : COLORS.NEON_PINK, 30);
    countText.setScale(0.5);
    countText.setAlpha(0);

    this.scene.tweens.add({
      targets: countText,
      scale: 1.5,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 400,
      ease: 'Back.out',
      onComplete: () => {
        countText.destroy();
      }
    });
  }

  hide(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  getMode(): string {
    return this.currentMode;
  }
}
