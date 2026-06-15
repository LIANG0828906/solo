import { InputManager, GameAction, BeatTimingResult } from './InputManager';
import { MusicAnalyzer, LevelTrack, LEVEL_TRACKS } from './MusicAnalyzer';
import { EntityManager } from './EntityManager';
import { Renderer, GameUIState, GameScene } from './Renderer';
import { SettingsManager } from './SettingsManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private settingsManager: SettingsManager;
  private inputManager: InputManager;
  private musicAnalyzer: MusicAnalyzer;
  private entityManager: EntityManager;
  private renderer: Renderer;

  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private fps: number = 60;
  private fpsHistory: number[] = [];
  private isRunning: boolean = false;

  private scene: GameScene = 'menu';
  private currentLevelId: number = 0;

  private score: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private enemiesDefeated: number = 0;
  private totalShots: number = 0;
  private perfectShots: number = 0;
  private goodShots: number = 0;
  private missShots: number = 0;
  private syncRate: number = 100;

  private heatLevel: number = 0;
  private maxHeat: number = 100;
  private isOverheated: boolean = false;
  private heatCooldownRate: number = 15;

  private gameStartTime: number = 0;
  private gameDuration: number = 90;

  private lastBeatIndex: number = -1;
  private beatsPerCycle: number = 8;

  private selectedLevelIndex: number = 0;

  private displayedSyncRate: number = 100;
  private displayedScore: number = 0;
  private resultAnimationStart: number = 0;
  private resultAnimationDuration: number = 1500;
  private resultAnimationProgress: number = 0;
  private finalScore: number = 0;
  private finalSyncRate: number = 100;

  private lastEnemyExplosionCount: number = 0;

  constructor(canvas: HTMLCanvasElement, settingsManager: SettingsManager) {
    this.canvas = canvas;
    this.settingsManager = settingsManager;

    this.inputManager = new InputManager();
    this.musicAnalyzer = new MusicAnalyzer();
    this.entityManager = new EntityManager(canvas.width, canvas.height);
    this.renderer = new Renderer(canvas);

    this.bindEvents();
    this.updateSettings();
  }

  private bindEvents(): void {
    this.inputManager.onShootBeat(this.handleShootBeat.bind(this));

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.scene === 'menu') {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        this.goToLevelSelect();
      }
    } else if (this.scene === 'levelSelect') {
      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        this.selectLevel(0);
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        this.selectLevel(1);
      } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
        this.selectLevel(2);
      } else if (e.code === 'Escape') {
        this.goToMenu();
      }
    } else if (this.scene === 'playing') {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        this.pauseGame();
      }
    } else if (this.scene === 'paused') {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        this.resumeGame();
      }
    } else if (this.scene === 'victory' || this.scene === 'gameOver') {
      if (e.code === 'Enter') {
        this.goToLevelSelect();
      } else if (e.code === 'KeyR') {
        this.restartLevel();
      }
    }
  }

  private goToMenu(): void {
    this.scene = 'menu';
    this.musicAnalyzer.stop();
  }

  private goToLevelSelect(): void {
    this.scene = 'levelSelect';
    this.musicAnalyzer.stop();
  }

  private selectLevel(levelId: number): void {
    this.currentLevelId = levelId;
    this.startGame();
  }

  private async startGame(): Promise<void> {
    this.resetGameState();
    
    await this.musicAnalyzer.loadTrack(this.currentLevelId);
    await this.musicAnalyzer.start();
    
    this.gameStartTime = performance.now();
    this.scene = 'playing';
    
    const beatTimes = this.musicAnalyzer.getBeatTimes();
    const bpm = this.musicAnalyzer.getCurrentBpm();
    this.inputManager.setBeatTimes(beatTimes, bpm);
    
    const track = this.musicAnalyzer.getCurrentTrack();
    this.gameDuration = track.duration;
  }

  private resetGameState(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.enemiesDefeated = 0;
    this.totalShots = 0;
    this.perfectShots = 0;
    this.goodShots = 0;
    this.missShots = 0;
    this.syncRate = 100;
    this.heatLevel = 0;
    this.isOverheated = false;
    this.lastBeatIndex = -1;
    this.displayedSyncRate = 100;
    this.displayedScore = 0;
    this.resultAnimationStart = 0;
    this.resultAnimationProgress = 0;
    this.finalScore = 0;
    this.finalSyncRate = 100;
    this.lastEnemyExplosionCount = 0;
    
    this.entityManager.reset();
  }

  private pauseGame(): void {
    if (this.scene === 'playing') {
      this.scene = 'paused';
    }
  }

  private resumeGame(): void {
    if (this.scene === 'paused') {
      this.scene = 'playing';
    }
  }

  private restartLevel(): void {
    this.startGame();
  }

  private handleShootBeat(result: BeatTimingResult): void {
    if (this.scene !== 'playing') return;
    if (this.isOverheated) return;

    this.totalShots++;
    
    const playerState = this.entityManager.getPlayer();
    const isPerfect = result.accuracy === 'perfect';
    const isGood = result.accuracy === 'good';
    const isMiss = result.accuracy === 'miss';

    this.entityManager.shoot(isPerfect, performance.now());

    if (isPerfect) {
      this.perfectShots++;
      this.combo++;
      this.score += 100 * (1 + Math.floor(this.combo / 10) * 0.5);
      this.heatLevel = Math.max(0, this.heatLevel - 5);
      this.entityManager.addStardustBurst(
        playerState.x + playerState.width / 2,
        playerState.y
      );
      this.musicAnalyzer.playShootSound(true);
    } else if (isGood) {
      this.goodShots++;
      this.combo++;
      this.score += 50 * (1 + Math.floor(this.combo / 10) * 0.25);
      this.heatLevel = Math.max(0, this.heatLevel - 2);
      this.musicAnalyzer.playShootSound(false);
    } else {
      this.missShots++;
      this.combo = 0;
      this.heatLevel = Math.min(this.maxHeat, this.heatLevel + 20);
      this.musicAnalyzer.playShootSound(false);
    }

    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    this.updateSyncRate();

    if (this.heatLevel >= this.maxHeat) {
      this.isOverheated = true;
    }
  }

  private updateSyncRate(): void {
    if (this.totalShots === 0) {
      this.syncRate = 100;
      return;
    }
    
    const perfectWeight = 100;
    const goodWeight = 50;
    const missWeight = 0;
    
    const totalWeight = this.perfectShots * perfectWeight + this.goodShots * goodWeight + this.missShots * missWeight;
    const maxWeight = this.totalShots * perfectWeight;
    
    this.syncRate = (totalWeight / maxWeight) * 100;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.musicAnalyzer.stop();
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.updateFPS(deltaTime);
    this.update(deltaTime, currentTime);
    this.render();

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  private updateFPS(deltaTime: number): void {
    if (deltaTime > 0) {
      const currentFPS = 1 / deltaTime;
      this.fpsHistory.push(currentFPS);
      
      if (this.fpsHistory.length > 30) {
        this.fpsHistory.shift();
      }
      
      this.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      this.renderer.setPerformanceLevel(this.fps);
    }
  }

  private update(deltaTime: number, currentTime: number): void {
    if (this.scene === 'playing') {
      this.updateGame(deltaTime, currentTime);
    } else if (this.scene === 'victory' || this.scene === 'gameOver') {
      this.updateResultAnimation(currentTime);
      this.entityManager.update(deltaTime, currentTime, { up: false, down: false, left: false, right: false });
    } else {
      this.entityManager.update(deltaTime, currentTime, { up: false, down: false, left: false, right: false });
    }
  }

  private updateGame(deltaTime: number, currentTime: number): void {
    const audioCtx = this.musicAnalyzer.getAudioContext();
    if (!audioCtx) return;

    const audioTime = audioCtx.currentTime;
    const beatInfo = this.musicAnalyzer.getBeatInfo(audioTime);
    const elapsed = this.musicAnalyzer.getElapsedTime(audioTime);

    this.inputManager.setCurrentTime(elapsed);

    if (beatInfo.beatIndex > this.lastBeatIndex) {
      this.lastBeatIndex = beatInfo.beatIndex;
      this.entityManager.addBeatPulse();
      
      const difficultyLevel = 1 + Math.floor(elapsed / 20);
      this.entityManager.setDifficulty(difficultyLevel);
    }

    const inputState = this.inputManager.getInputState();
    const playerInput = {
      up: inputState.actions.has(GameAction.MOVE_UP),
      down: inputState.actions.has(GameAction.MOVE_DOWN),
      left: inputState.actions.has(GameAction.MOVE_LEFT),
      right: inputState.actions.has(GameAction.MOVE_RIGHT)
    };

    const stateBeforeUpdate = this.entityManager.getState();
    const explosionsBefore = stateBeforeUpdate.explosions.length;

    this.entityManager.update(deltaTime, currentTime, playerInput);

    const stateAfterUpdate = this.entityManager.getState();
    const explosionsAfter = stateAfterUpdate.explosions.length;
    const newExplosions = explosionsAfter - explosionsBefore;

    if (newExplosions > 0) {
      this.enemiesDefeated += newExplosions;
      this.score += newExplosions * 50;
      this.musicAnalyzer.playExplosionSound();
    }

    if (this.isOverheated) {
      this.heatLevel -= this.heatCooldownRate * 2 * deltaTime;
      if (this.heatLevel <= 30) {
        this.isOverheated = false;
      }
    } else {
      this.heatLevel -= this.heatCooldownRate * deltaTime;
    }
    this.heatLevel = Math.max(0, Math.min(this.maxHeat, this.heatLevel));

    if (elapsed >= this.gameDuration) {
      this.endGame(true);
    }

    this.displayedSyncRate += (this.syncRate - this.displayedSyncRate) * 0.1;
    this.displayedScore += (this.score - this.displayedScore) * 0.1;
  }

  private updateResultAnimation(currentTime: number): void {
    if (this.resultAnimationStart === 0) {
      this.resultAnimationStart = currentTime;
    }
  }

  private endGame(victory: boolean): void {
    this.scene = victory ? 'victory' : 'gameOver';
    this.musicAnalyzer.stop();
    this.resultAnimationStart = 0;
    
    this.settingsManager.setHighScore(Math.floor(this.score));
    
    if (victory && this.syncRate >= 80) {
      this.musicAnalyzer.playVictorySound();
      this.entityManager.addVictoryFireworks();
    }
  }

  private render(): void {
    const settings = this.settingsManager.getSettings();
    const audioCtx = this.musicAnalyzer.getAudioContext();
    
    let beatProgress = 0;
    let beatCount = 0;
    
    if (audioCtx && this.musicAnalyzer.isAudioPlaying()) {
      const audioTime = audioCtx.currentTime;
      const beatInfo = this.musicAnalyzer.getBeatInfo(audioTime);
      beatProgress = beatInfo.beatPhase;
      beatCount = beatInfo.beatIndex;
    }

    const uiState: GameUIState = {
      score: Math.floor(this.displayedScore),
      combo: this.combo,
      syncRate: this.displayedSyncRate,
      heatLevel: this.heatLevel,
      maxHeat: this.maxHeat,
      isOverheated: this.isOverheated,
      beatProgress,
      beatCount,
      beatsPerCycle: this.beatsPerCycle,
      gameTime: audioCtx ? this.musicAnalyzer.getElapsedTime(audioCtx.currentTime) : 0,
      gameDuration: this.gameDuration,
      showBeatIndicator: settings.beatIndicator
    };

    const levelInfo = this.musicAnalyzer.getCurrentTrack();
    
    this.renderer.render(
      this.entityManager.getState(),
      uiState,
      this.scene,
      { name: levelInfo.name, bpm: levelInfo.bpm }
    );
  }

  private updateSettings(): void {
    const settings = this.settingsManager.getSettings();
    this.musicAnalyzer.setMusicVolume(settings.musicVolume / 100);
    this.musicAnalyzer.setSfxVolume(settings.sfxVolume / 100);
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.entityManager.setCanvasSize(width, height);
  }

  getFPS(): number {
    return this.fps;
  }

  getScene(): GameScene {
    return this.scene;
  }
}
