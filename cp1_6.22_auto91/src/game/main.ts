import { GameRenderer } from './renderer';
import { PlayerController } from './player';
import { audioAnalyzer, FrequencyData, BeatEvent } from '@/audio/analyzer';
import { musicLoader } from '@/audio/musicLoader';
import { UIOverlay, GameStateData } from '@/ui/overlay';

type GamePhase = 'ready' | 'playing' | 'paused' | 'gameover';

export class Game {
  private renderer: GameRenderer;
  private player: PlayerController;
  private ui: UIOverlay;

  private phase: GamePhase = 'ready';
  private progress: number = 0;
  private score: number = 0;
  private distance: number = 0;
  private combo: number = 0;

  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  private nextObstacleIndex: number = 0;
  private obstacleSpawnCooldown: number = 0;

  private readonly BASE_SPEED = 25;
  private readonly SPEED_INCREMENT = 0.002;
  private currentSpeed: number = this.BASE_SPEED;

  constructor() {
    this.renderer = new GameRenderer('game-canvas');
    this.player = new PlayerController();
    this.ui = new UIOverlay('ui-canvas');

    this.setupAudio();
    this.setupEventListeners();
    this.init();
  }

  private setupAudio(): void {
    const audioEl = musicLoader.getAudioElement();
    audioAnalyzer.connect(audioEl);

    audioAnalyzer.onFrequencyData((data: FrequencyData) => {
      this.renderer.updateFrequencyData(data);
      this.ui.updateFrequencyData(data);
    });

    audioAnalyzer.onBeat((beat: BeatEvent) => {
      this.handleBeat(beat);
    });
  }

  private handleBeat(beat: BeatEvent): void {
    if (this.phase !== 'playing') return;

    if (beat.type === 'low') {
      const spawnIndex = this.progress + 30 + Math.random() * 10;
      if (spawnIndex > this.nextObstacleIndex && this.obstacleSpawnCooldown <= 0) {
        this.renderer.spawnObstacle(Math.floor(spawnIndex), 'jump');
        this.nextObstacleIndex = Math.floor(spawnIndex) + 5;
        this.obstacleSpawnCooldown = 0.5;
      }
    } else if (beat.type === 'high') {
      const spawnIndex = this.progress + 25 + Math.random() * 10;
      if (spawnIndex > this.nextObstacleIndex && this.obstacleSpawnCooldown <= 0) {
        this.renderer.spawnObstacle(Math.floor(spawnIndex), 'slide');
        this.nextObstacleIndex = Math.floor(spawnIndex) + 5;
        this.obstacleSpawnCooldown = 0.5;
      }
    }
  }

  private setupEventListeners(): void {
    this.ui.onGameStateChange((state: Partial<GameStateData>) => {
      if (state.isPlaying !== undefined) {
        if (state.isPlaying) {
          this.start();
        } else {
          this.pause();
        }
      }
      if (state.isGameOver === false) {
        this.reset();
      }
    });

    this.player.onActionComplete(() => {
      if (this.phase === 'playing') {
        this.combo++;
        this.score += 10 * (1 + Math.floor(this.combo / 5));
        this.ui.triggerActionFlash('#00d4ff');
        this.updateUI();
      }
    });
  }

  private async init(): Promise<void> {
    const tracks = musicLoader.getTracks();
    if (tracks.length > 0) {
      await musicLoader.load(tracks[0].id);
    }
    this.ui.updateGameState({
      score: 0,
      distance: 0,
      combo: 0,
      isPlaying: false,
      isGameOver: false,
    });
    this.phase = 'ready';
    this.loop();
  }

  start(): void {
    if (this.phase === 'gameover') {
      this.reset();
    }
    audioAnalyzer.resume();
    audioAnalyzer.start();
    this.phase = 'playing';
  }

  pause(): void {
    this.phase = 'paused';
  }

  reset(): void {
    this.progress = 0;
    this.score = 0;
    this.distance = 0;
    this.combo = 0;
    this.currentSpeed = this.BASE_SPEED;
    this.nextObstacleIndex = 0;
    this.obstacleSpawnCooldown = 0;
    this.player.reset();
    this.renderer.clearObstacles();
    this.phase = 'playing';
    this.updateUI();
  }

  gameOver(): void {
    this.phase = 'gameover';
    audioAnalyzer.stop();
    musicLoader.pause();
    this.ui.updateGameState({
      score: this.score,
      distance: this.distance,
      combo: this.combo,
      isPlaying: false,
      isGameOver: true,
    });
  }

  private loop = (): void => {
    const now = performance.now();
    const deltaTime = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    if (this.phase === 'playing') {
      this.update(deltaTime);
    }

    this.render(deltaTime);
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number): void {
    if (this.obstacleSpawnCooldown > 0) {
      this.obstacleSpawnCooldown -= deltaTime;
    }

    this.currentSpeed += this.SPEED_INCREMENT * deltaTime * 60;
    this.progress += this.currentSpeed * deltaTime;
    this.distance = this.progress * 0.5;

    const maxProgress = this.renderer.getMaxSegments() - 20;
    if (this.progress >= maxProgress) {
      this.progress = maxProgress;
    }

    const playerData = this.player.update(deltaTime);

    this.renderer.updateCameraAndPlayer(
      this.progress,
      playerData.y,
      playerData.isJumping,
      playerData.isSliding,
      playerData.rotation,
      playerData.scarfWave,
    );

    this.renderer.updateTrack(deltaTime);
    this.renderer.updateParticles(deltaTime);
    this.renderer.updateObstacles(this.progress);

    const collisionResult = this.renderer.checkCollision(
      this.progress,
      playerData.y,
      playerData.isSliding,
    );

    if (collisionResult === 'hit') {
      this.gameOver();
    } else if (collisionResult === 'pass') {
      this.score += 50;
      this.combo++;
      this.ui.triggerActionFlash('#7b2ff7');
      this.updateUI();
    }

    this.score += deltaTime * 5;
    this.updateUI();
  }

  private updateUI(): void {
    this.ui.updateGameState({
      score: this.score,
      distance: this.distance,
      combo: this.combo,
    });
  }

  private render(deltaTime: number): void {
    this.renderer.render();
    this.ui.render(deltaTime);
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.dispose();
    this.ui.dispose();
    audioAnalyzer.dispose();
    musicLoader.dispose();
  }
}

const game = new Game();

(window as any).game = game;
