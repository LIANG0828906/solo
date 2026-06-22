import Phaser from 'phaser';
import { RoomUI } from '../room.js';
import { wsClient } from '../utils/wsClient.js';
import { COLORS, PlayerColor } from '../types/game.js';

export class RoomScene extends Phaser.Scene {
  private roomUI!: RoomUI;
  private myPlayerId: string = '';
  private myPlayerName: string = '';
  private myColor: PlayerColor = 'blue';
  private roomCode: string = '';
  private opponentName: string = '';
  private isHost: boolean = false;

  constructor() {
    super('RoomScene');
  }

  preload(): void {
  }

  create(): void {
    this.roomUI = new RoomUI(this, {
      onCreateRoom: this.handleCreateRoom.bind(this),
      onJoinRoom: this.handleJoinRoom.bind(this),
      onCopyRoomCode: () => {}
    });

    this.roomUI.show();

    this.setupWebSocketHandlers();

    if (!wsClient.isConnected()) {
      wsClient.connect().catch((error) => {
        console.error('Failed to connect:', error);
        this.roomUI.showError('无法连接到服务器');
      });
    }

    this.addBackgroundParticles();
  }

  private setupWebSocketHandlers(): void {
    wsClient.on('ROOM_CREATED', (message: any) => {
      this.myPlayerId = message.playerId;
      this.myColor = message.color;
      this.roomCode = message.roomCode;
      this.isHost = true;
      this.roomUI.showWaitingRoom(this.roomCode, this.myPlayerName, this.isHost);
    });

    wsClient.on('ROOM_JOINED', (message: any) => {
      this.myPlayerId = message.playerId;
      this.myColor = message.color;
      this.roomCode = message.roomCode;
      this.opponentName = message.opponentName;
      this.isHost = false;
      this.roomUI.showWaitingRoom(this.roomCode, this.myPlayerName, this.isHost);
    });

    wsClient.on('WAITING_FOR_OPPONENT', () => {
    });

    wsClient.on('OPPONENT_JOINED', (message: any) => {
      this.opponentName = message.opponentName;
      this.roomUI.showMessage(`对手 ${this.opponentName} 已加入!`);
    });

    wsClient.on('COUNTDOWN', (message: any) => {
      this.roomUI.showCountdown(message.count);
    });

    wsClient.on('GAME_START', (message: any) => {
      this.startGame(message);
    });

    wsClient.on('ERROR', (message: any) => {
      this.roomUI.showError(message.message);
    });
  }

  private handleCreateRoom(playerName: string): void {
    this.myPlayerName = playerName;

    if (!wsClient.isConnected()) {
      wsClient.connect().then(() => {
        wsClient.send({
          type: 'CREATE_ROOM',
          playerName
        });
      }).catch(() => {
        this.roomUI.showError('无法连接到服务器');
      });
    } else {
      wsClient.send({
        type: 'CREATE_ROOM',
        playerName
      });
    }
  }

  private handleJoinRoom(roomCode: string, playerName: string): void {
    this.myPlayerName = playerName;

    if (!wsClient.isConnected()) {
      wsClient.connect().then(() => {
        wsClient.send({
          type: 'JOIN_ROOM',
          roomCode,
          playerName
        });
      }).catch(() => {
        this.roomUI.showError('无法连接到服务器');
      });
    } else {
      wsClient.send({
        type: 'JOIN_ROOM',
        roomCode,
        playerName
      });
    }
  }

  private addBackgroundParticles(): void {
    const { width, height } = this.scale;

    const particles = this.add.particles(0, 0, null, {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 4000,
      quantity: 2,
      blendMode: Phaser.BlendModes.ADD,
      tint: [COLORS.NEON_BLUE, COLORS.NEON_PINK]
    });

    particles.setDepth(-1);
  }

  private startGame(gameData: any): void {
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

  update(): void {
  }
}
