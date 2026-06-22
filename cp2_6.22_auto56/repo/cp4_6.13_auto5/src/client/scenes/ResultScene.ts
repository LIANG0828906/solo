import Phaser from 'phaser';
import { wsClient } from '../utils/wsClient.js';
import { COLORS, GameStats, PlayerColor } from '../types/game.js';

interface ResultSceneData {
  stats: GameStats;
  myPlayerId: string;
  myPlayerName: string;
  myColor: PlayerColor;
  opponentName: string;
  roomCode: string;
  isHost: boolean;
}

export class ResultScene extends Phaser.Scene {
  private stats!: GameStats;
  private myPlayerId!: string;
  private myPlayerName!: string;
  private myColor!: PlayerColor;
  private opponentName!: string;
  private roomCode!: string;
  private isHost!: boolean;
  private isWinner!: boolean;

  private unsubscribers: Array<() => void> = [];

  constructor() {
    super('ResultScene');
  }

  init(data: ResultSceneData): void {
    this.stats = data.stats;
    this.myPlayerId = data.myPlayerId;
    this.myPlayerName = data.myPlayerName;
    this.myColor = data.myColor;
    this.opponentName = data.opponentName;
    this.roomCode = data.roomCode;
    this.isHost = data.isHost;
    this.isWinner = this.stats.winnerName === this.myPlayerName;
  }

  create(): void {
    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.createResultUI();
    this.setupWebSocketHandlers();

    this.events.on('shutdown', this.shutdown.bind(this));
  }

  private createResultUI(): void {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    const winnerColor = this.stats.winnerColor === 'blue' ? COLORS.NEON_BLUE : COLORS.NEON_PINK;
    const resultText = this.isWinner ? 'YOU WIN!' : 'YOU LOSE';
    const resultColor = this.isWinner ? COLORS.NEON_BLUE : COLORS.NEON_PINK;

    const title = this.add.text(centerX, centerY - height * 0.25, resultText, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.min(64, width * 0.1)}px`,
      color: resultColor,
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, resultColor, 30);
    title.setScale(0.5);
    title.setAlpha(0);

    this.tweens.add({
      targets: title,
      scale: 1.2,
      alpha: 1,
      duration: 800,
      ease: 'Back.out',
      yoyo: true,
      hold: 500,
      repeatDelay: 1000,
      onComplete: () => {
        title.setScale(1);
      }
    });

    const winnerLabel = this.add.text(centerX, centerY - height * 0.1, 'WINNER', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      color: COLORS.TEXT_DIM
    });
    winnerLabel.setOrigin(0.5);
    winnerLabel.setAlpha(0);

    const winnerName = this.add.text(centerX, centerY - height * 0.04, this.stats.winnerName, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '28px',
      color: winnerColor,
      fontStyle: 'bold'
    });
    winnerName.setOrigin(0.5);
    winnerName.setShadow(0, 0, winnerColor, 15);
    winnerName.setAlpha(0);

    this.tweens.add({
      targets: [winnerLabel, winnerName],
      alpha: 1,
      duration: 500,
      delay: 500
    });

    const statsPanel = this.add.rectangle(centerX, centerY + height * 0.08, width * 0.35, height * 0.2, 0x0d0221, 0.8);
    statsPanel.setStrokeStyle(2, winnerColor, 0.5);
    statsPanel.setAlpha(0);

    const durationSeconds = Math.floor(this.stats.duration / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const timeLabel = this.add.text(centerX - width * 0.12, centerY + height * 0.03, '用时', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: COLORS.TEXT_DIM
    });
    timeLabel.setOrigin(0.5);
    timeLabel.setAlpha(0);

    const timeValue = this.add.text(centerX - width * 0.12, centerY + height * 0.08, timeStr, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      color: COLORS.NEON_BLUE
    });
    timeValue.setOrigin(0.5);
    timeValue.setShadow(0, 0, COLORS.NEON_BLUE, 10);
    timeValue.setAlpha(0);

    const winnerStepsLabel = this.add.text(centerX, centerY + height * 0.03, '获胜步数', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: COLORS.TEXT_DIM
    });
    winnerStepsLabel.setOrigin(0.5);
    winnerStepsLabel.setAlpha(0);

    const winnerStepsValue = this.add.text(centerX, centerY + height * 0.08, this.stats.winnerSteps.toString(), {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      color: winnerColor
    });
    winnerStepsValue.setOrigin(0.5);
    winnerStepsValue.setShadow(0, 0, winnerColor, 10);
    winnerStepsValue.setAlpha(0);

    const loserStepsLabel = this.add.text(centerX + width * 0.12, centerY + height * 0.03, '对手步数', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: COLORS.TEXT_DIM
    });
    loserStepsLabel.setOrigin(0.5);
    loserStepsLabel.setAlpha(0);

    const loserStepsValue = this.add.text(centerX + width * 0.12, centerY + height * 0.08, this.stats.loserSteps.toString(), {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      color: COLORS.NEON_PINK
    });
    loserStepsValue.setOrigin(0.5);
    loserStepsValue.setShadow(0, 0, COLORS.NEON_PINK, 10);
    loserStepsValue.setAlpha(0);

    this.tweens.add({
      targets: [statsPanel, timeLabel, timeValue, winnerStepsLabel, winnerStepsValue, loserStepsLabel, loserStepsValue],
      alpha: 1,
      duration: 500,
      delay: 1000
    });

    const rematchBtn = this.createButton(
      centerX,
      centerY + height * 0.22,
      width * 0.25,
      45,
      'PLAY AGAIN',
      COLORS.NEON_BLUE,
      () => {
        this.restartGame();
      }
    );
    rematchBtn.setAlpha(0);

    const leaveBtn = this.createButton(
      centerX,
      centerY + height * 0.3,
      width * 0.2,
      35,
      'LEAVE ROOM',
      COLORS.TEXT_DIM,
      () => {
        this.leaveRoom();
      }
    );
    leaveBtn.setAlpha(0);

    this.tweens.add({
      targets: [rematchBtn, leaveBtn],
      alpha: 1,
      duration: 500,
      delay: 1500
    });

    this.addAmbientParticles();
    this.addGlitchEffect(title);
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
    const btnContainer = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, 0x0d0221, 0.9);
    bg.setStrokeStyle(2, color, 0.8);

    const text = this.add.text(0, 0, label, {
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
      this.tweens.add({
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
      this.tweens.add({
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

  private addAmbientParticles(): void {
    const { width, height } = this.scale;

    const particles = this.add.particles(width / 2, height / 2, null, {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      speed: { min: 5, max: 20 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 3000,
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      tint: this.isWinner ? [COLORS.NEON_BLUE, COLORS.NEON_PINK] : [0x666666, 0x888888]
    });

    particles.setDepth(-1);
  }

  private addGlitchEffect(textObj: Phaser.GameObjects.Text): void {
    this.time.addEvent({
      delay: 1500,
      loop: true,
      callback: () => {
        if (Math.random() > 0.6) {
          const originalX = textObj.x;
          const originalAlpha = textObj.alpha;

          textObj.setX(originalX + (Math.random() - 0.5) * 6);
          textObj.setAlpha(0.7);
          textObj.setTint(0xff00ff, 0x00ffff, 0xff00ff, 0x00ffff);

          this.time.delayedCall(60, () => {
            textObj.setX(originalX);
            textObj.setAlpha(originalAlpha);
            textObj.clearTint();
          });
        }
      }
    });
  }

  private setupWebSocketHandlers(): void {
    const unsub1 = wsClient.on('COUNTDOWN', (message: any) => {
      this.handleNewGameCountdown(message.count);
    });

    const unsub2 = wsClient.on('GAME_START', (message: any) => {
      this.startNewGame(message);
    });

    const unsub3 = wsClient.on('ERROR', (message: any) => {
      console.error('Error:', message.message);
    });

    this.unsubscribers = [unsub1, unsub2, unsub3];
  }

  private handleNewGameCountdown(count: number): void {
    const { width, height } = this.scale;

    this.cameras.main.flash(200, 255, 255, 255);

    const countText = this.add.text(width / 2, height / 2, count > 0 ? count.toString() : 'GO!', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: `${Math.min(120, width * 0.15)}px`,
      color: count > 0 ? COLORS.NEON_BLUE : COLORS.NEON_PINK,
      fontStyle: 'bold'
    });
    countText.setOrigin(0.5);
    countText.setShadow(0, 0, count > 0 ? COLORS.NEON_BLUE : COLORS.NEON_PINK, 30);
    countText.setScale(0.5);
    countText.setAlpha(0);

    this.tweens.add({
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

  private restartGame(): void {
    wsClient.send({
      type: 'RESTART_GAME'
    });
  }

  private startNewGame(gameData: any): void {
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.time.delayedCall(500, () => {
      this.scene.start('GameScene', {
        maze: gameData.maze,
        player1Pos: gameData.player1Pos,
        player2Pos: gameData.player2Pos,
        myPlayerId: this.myPlayerId,
        myPlayerName: this.myPlayerName,
        myColor: this.myColor,
        opponentName: this.opponentName,
        roomCode: this.roomCode,
        isHost: this.isHost
      });
    });
  }

  private leaveRoom(): void {
    wsClient.send({
      type: 'LEAVE_ROOM'
    });

    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.time.delayedCall(500, () => {
      this.scene.start('RoomScene');
    });
  }

  private shutdown(): void {
    this.unsubscribers.forEach(unsub => unsub());
  }
}
