import Phaser from 'phaser';
import { MazeRenderer } from '../maze.js';
import { PlayerController, VirtualJoystick } from '../player.js';
import { wsClient } from '../utils/wsClient.js';
import { COLORS, GameStatus, PlayerColor, Direction, GameStats, MAZE_SIZE } from '../types/game.js';

interface GameSceneData {
  maze: number[][];
  player1Pos: { x: number; y: number };
  player2Pos: { x: number; y: number };
  myPlayerId: string;
  myPlayerName: string;
  myColor: PlayerColor;
  opponentName: string;
  roomCode: string;
  isHost: boolean;
}

export class GameScene extends Phaser.Scene {
  private mazeRenderer!: MazeRenderer;
  private localPlayer!: PlayerController;
  private opponentPlayer!: PlayerController;
  private mazeData!: number[][];
  private gameStatus: GameStatus = 'playing';
  private myPlayerId!: string;
  private myPlayerName!: string;
  private myColor!: PlayerColor;
  private opponentName!: string;
  private roomCode!: string;
  private isHost!: boolean;
  private virtualJoystick!: VirtualJoystick;
  private isMobile: boolean = false;

  private hudText!: Phaser.GameObjects.Text;
  private player1Stats!: Phaser.GameObjects.Text;
  private player2Stats!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private startTime!: number;
  private elapsedTime: number = 0;

  private unsubscribers: Array<() => void> = [];

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.mazeData = data.maze;
    this.myPlayerId = data.myPlayerId;
    this.myPlayerName = data.myPlayerName;
    this.myColor = data.myColor;
    this.opponentName = data.opponentName || 'Opponent';
    this.roomCode = data.roomCode;
    this.isHost = data.isHost;
    this.startTime = Date.now();
    this.elapsedTime = 0;
  }

  create(): void {
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.isMobile = this.sys.game.device.os.android ||
                    this.sys.game.device.os.iOS ||
                    this.sys.game.device.os.mobile ||
                    window.innerWidth < 768;

    this.mazeRenderer = new MazeRenderer(this);
    this.mazeRenderer.setMaze(this.mazeData);
    this.mazeRenderer.render();

    const cellSize = this.mazeRenderer.getCellSize();
    const offsetX = (this.scale.width - cellSize * MAZE_SIZE) / 2;
    const offsetY = (this.scale.height - cellSize * MAZE_SIZE) / 2 + this.scale.height * 0.05;

    const localStartPos = this.myColor === 'blue'
      ? { x: 0, y: 0 }
      : { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 };

    const opponentStartPos = this.myColor === 'blue'
      ? { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 }
      : { x: 0, y: 0 };

    this.localPlayer = new PlayerController(
      this,
      this.myPlayerId,
      this.myPlayerName,
      this.myColor,
      true
    );
    this.localPlayer.setMaze(this.mazeData, cellSize, offsetX, offsetY);
    this.localPlayer.setInitialPosition(localStartPos);
    this.localPlayer.createVisual();

    this.opponentPlayer = new PlayerController(
      this,
      'opponent',
      this.opponentName,
      this.myColor === 'blue' ? 'pink' : 'blue',
      false
    );
    this.opponentPlayer.setMaze(this.mazeData, cellSize, offsetX, offsetY);
    this.opponentPlayer.setInitialPosition(opponentStartPos);
    this.opponentPlayer.createVisual();

    this.setupHUD();
    this.setupWebSocketHandlers();

    if (this.isMobile) {
      this.virtualJoystick = new VirtualJoystick(this);
      this.virtualJoystick.create(this.scale.width * 0.15, this.scale.height * 0.75);
      this.virtualJoystick.setOnDirectionChange((direction: Direction) => {
        if (this.gameStatus === 'playing') {
          wsClient.send({
            type: 'PLAYER_INPUT',
            direction,
            timestamp: Date.now()
          });
        }
      });
    }

    this.events.on('shutdown', this.shutdown.bind(this));
  }

  private setupHUD(): void {
    const { width } = this.scale;

    const blueColor = COLORS.NEON_BLUE;
    const pinkColor = COLORS.NEON_PINK;

    if (this.myColor === 'blue') {
      this.player1Stats = this.add.text(20, 20, `[YOU] ${this.myPlayerName}\nSteps: 0`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '14px',
        color: blueColor,
        align: 'left'
      });
      this.player1Stats.setShadow(0, 0, blueColor, 8);

      this.player2Stats = this.add.text(width - 20, 20, `${this.opponentName}\nSteps: 0`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '14px',
        color: pinkColor,
        align: 'right'
      });
      this.player2Stats.setShadow(0, 0, pinkColor, 8);
      this.player2Stats.setOrigin(1, 0);
    } else {
      this.player1Stats = this.add.text(20, 20, `${this.opponentName}\nSteps: 0`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '14px',
        color: blueColor,
        align: 'left'
      });
      this.player1Stats.setShadow(0, 0, blueColor, 8);

      this.player2Stats = this.add.text(width - 20, 20, `[YOU] ${this.myPlayerName}\nSteps: 0`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '14px',
        color: pinkColor,
        align: 'right'
      });
      this.player2Stats.setShadow(0, 0, pinkColor, 8);
      this.player2Stats.setOrigin(1, 0);
    }

    this.timerText = this.add.text(width / 2, 20, '00:00', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '20px',
      color: COLORS.TEXT
    });
    this.timerText.setOrigin(0.5, 0);
    this.timerText.setShadow(0, 0, COLORS.NEON_BLUE, 10);

    const roomLabel = this.add.text(width / 2, this.scale.height - 30, `ROOM: ${this.roomCode}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: COLORS.TEXT_DIM
    });
    roomLabel.setOrigin(0.5, 0);

    const controlsHint = this.isMobile
      ? '使用虚拟摇杆控制移动'
      : (this.myColor === 'blue' ? 'WASD 控制移动' : '方向键 控制移动');
    const hintText = this.add.text(width / 2, this.scale.height - 50, controlsHint, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: COLORS.TEXT_DIM
    });
    hintText.setOrigin(0.5, 0);
  }

  private setupWebSocketHandlers(): void {
    const unsub1 = wsClient.on('PLAYER_MOVE', (message: any) => {
      if (message.playerId !== this.myPlayerId) {
        this.opponentPlayer.updateFromServer(message.position, message.direction);
      }
    });

    const unsub2 = wsClient.on('COLLISION', (message: any) => {
      if (message.playerId === this.myPlayerId) {
        this.localPlayer.handleCollision(message.position);
      }
    });

    const unsub3 = wsClient.on('GAME_STATE', (message: any) => {
      this.gameStatus = message.gameStatus;

      message.players.forEach((playerState: any) => {
        if (playerState.id === this.myPlayerId) {
          this.localPlayer.setSteps(playerState.steps);
          if (this.myColor === 'blue') {
            this.player1Stats.setText(`[YOU] ${this.myPlayerName}\nSteps: ${playerState.steps}`);
          } else {
            this.player2Stats.setText(`[YOU] ${this.myPlayerName}\nSteps: ${playerState.steps}`);
          }
        } else {
          this.opponentPlayer.setSteps(playerState.steps);
          if (this.myColor === 'blue') {
            this.player2Stats.setText(`${this.opponentName}\nSteps: ${playerState.steps}`);
          } else {
            this.player1Stats.setText(`${this.opponentName}\nSteps: ${playerState.steps}`);
          }
        }
      });
    });

    const unsub4 = wsClient.on('GAME_END', (message: any) => {
      this.endGame(message.stats);
    });

    const unsub5 = wsClient.on('COUNTDOWN', (message: any) => {
    });

    const unsub6 = wsClient.on('ERROR', (message: any) => {
      console.error('Game error:', message.message);
    });

    this.unsubscribers = [unsub1, unsub2, unsub3, unsub4, unsub5, unsub6];
  }

  update(time: number, delta: number): void {
    if (this.gameStatus === 'playing') {
      this.localPlayer.update(time, delta);
      this.opponentPlayer.update(time, delta);

      this.elapsedTime = Date.now() - this.startTime;
      const seconds = Math.floor(this.elapsedTime / 1000);
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      this.timerText.setText(`${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }
  }

  private endGame(stats: GameStats): void {
    this.gameStatus = 'ended';

    if (this.virtualJoystick) {
      this.virtualJoystick.destroy();
    }

    this.cameras.main.flash(500, 255, 255, 255);

    this.playVictoryEffects(stats);

    this.time.delayedCall(1500, () => {
      this.scene.start('ResultScene', {
        stats,
        myPlayerId: this.myPlayerId,
        myPlayerName: this.myPlayerName,
        myColor: this.myColor,
        roomCode: this.roomCode,
        isHost: this.isHost,
        opponentName: this.opponentName
      });
    });
  }

  private playVictoryEffects(stats: GameStats): void {
    const isWinner = stats.winnerName === this.myPlayerName;
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const winnerColor = stats.winnerColor === 'blue' ? COLORS.NEON_BLUE : COLORS.NEON_PINK;

    const lightning = this.add.graphics();
    lightning.setDepth(1000);

    const drawLightning = () => {
      lightning.clear();
      lightning.lineStyle(3, winnerColor, 1);
      lightning.beginPath();

      let x = centerX + (Math.random() - 0.5) * 200;
      let y = 0;

      lightning.moveTo(x, y);

      while (y < this.scale.height) {
        x += (Math.random() - 0.5) * 80;
        y += 20 + Math.random() * 30;
        lightning.lineTo(x, y);
      }

      lightning.stroke();
      lightning.lineStyle(1, 0xffffff, 0.8);
      lightning.strokePath();
    };

    let flashCount = 0;
    const flashInterval = this.time.addEvent({
      delay: 100,
      repeat: 15,
      callback: () => {
        drawLightning();
        this.cameras.main.shake(50, 0.01);
        flashCount++;
        if (flashCount >= 15) {
          lightning.destroy();
        }
      }
    });

    const particles = this.add.particles(centerX, centerY, null, {
      x: centerX,
      y: centerY,
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 2000,
      quantity: 50,
      blendMode: Phaser.BlendModes.ADD,
      tint: isWinner ? [COLORS.NEON_BLUE, COLORS.NEON_PINK] : [0x666666, 0x888888],
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Circle(0, 0, 100),
        quantity: 50
      }
    });

    particles.setDepth(999);

    this.time.delayedCall(2000, () => {
      particles.stop();
    });
  }

  private shutdown(): void {
    this.unsubscribers.forEach(unsub => unsub());
    if (this.mazeRenderer) {
      this.mazeRenderer.destroy();
    }
    if (this.localPlayer) {
      this.localPlayer.destroy();
    }
    if (this.opponentPlayer) {
      this.opponentPlayer.destroy();
    }
  }
}
