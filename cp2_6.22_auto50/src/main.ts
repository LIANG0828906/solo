import * as PIXI from 'pixi.js';
import { Player } from './game/Player';
import { Level, LEVELS } from './game/Level';
import { TimeRecorder } from './game/TimeRecorder';
import { UIManager } from './ui/UIManager';
import type { GameMode, GameStats, Rect } from '../types';

class Game {
  private app: PIXI.Application;
  private player: Player;
  private level: Level | null = null;
  private timeRecorder: TimeRecorder;
  private uiManager: UIManager;

  private gameContainer: PIXI.Container;
  private currentLevelIndex: number = 0;
  private gameMode: GameMode = 'playing';

  private stats: GameStats = {
    steps: 0,
    timeElapsed: 0,
    recordingsCount: 0,
    score: 0
  };

  private levelStartTime: number = 0;
  private lastFrameTime: number = 0;

  private readonly BASE_WIDTH = 1280;
  private readonly BASE_HEIGHT = 720;

  constructor() {
    this.app = new PIXI.Application({
      background: '#0a0a2e',
      resizeTo: window,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true
    });

    const container = document.getElementById('game-container');
    if (container) {
      container.appendChild(this.app.view as HTMLCanvasElement);
    }

    this.gameContainer = new PIXI.Container();
    this.app.stage.addChild(this.gameContainer);

    this.player = new Player(100, 500);
    this.gameContainer.addChild(this.player.sprite);

    this.timeRecorder = new TimeRecorder({ sampleRate: 2 });
    this.uiManager = new UIManager(this.app);
    this.app.stage.addChild(this.uiManager.container);

    this.setupEventListeners();
    this.setupUICallbacks();
    this.setupResizeHandler();

    this.showLevelSelect();

    this.lastFrameTime = performance.now();
    this.app.ticker.add(this.gameLoop.bind(this));
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.player.handleKeyDown(e.key);

      if (e.key === 'r' || e.key === 'R') {
        this.toggleRecording();
      }
      if (e.key === 'p' || e.key === 'P') {
        this.togglePlayback();
      }
      if (e.key === 'Escape') {
        this.resetLevel();
      }
      if (e.key === 'z' || e.key === 'Z') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          if (e.shiftKey) {
            this.handleRedo();
          } else {
            this.handleUndo();
          }
        }
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.player.handleKeyUp(e.key);
    });
  }

  private setupUICallbacks(): void {
    this.uiManager.onRecordToggle = () => this.toggleRecording();
    this.uiManager.onPlayToggle = () => this.togglePlayback();
    this.uiManager.onRewindToggle = () => this.toggleRewind();
    this.uiManager.onPauseToggle = () => this.togglePause();
    this.uiManager.onStop = () => this.stopPlayback();
    this.uiManager.onClear = () => this.clearRecordings();
    this.uiManager.onUndo = () => this.handleUndo();
    this.uiManager.onRedo = () => this.handleRedo();
    this.uiManager.onTimeChange = (time: number) => this.handleTimeChange(time);
    this.uiManager.onScaleChange = (scale: number) => this.handleScaleChange(scale);
    this.uiManager.onLevelSelect = (index: number) => this.loadLevel(index);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.scaleGameContainer();
    });
    this.scaleGameContainer();
  }

  private scaleGameContainer(): void {
    const scaleX = this.app.screen.width / this.BASE_WIDTH;
    const scaleY = this.app.screen.height / this.BASE_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    this.gameContainer.scale.set(scale);
    this.gameContainer.x = (this.app.screen.width - this.BASE_WIDTH * scale) / 2;
    this.gameContainer.y = (this.app.screen.height - this.BASE_HEIGHT * scale) / 2;
  }

  private showLevelSelect(): void {
    const levelsInfo = LEVELS.map(l => ({
      id: l.id,
      name: l.name,
      description: l.description
    }));
    this.uiManager.showLevelSelect(levelsInfo);
  }

  private loadLevel(index: number): void {
    if (index < 0 || index >= LEVELS.length) return;

    this.uiManager.showTransition(() => {
      this.currentLevelIndex = index;

      if (this.level) {
        this.gameContainer.removeChild(this.level.container);
        this.level.destroy();
      }

      this.level = new Level(LEVELS[index]);
      this.gameContainer.addChildAt(this.level.container, 0);

      const startPos = LEVELS[index].playerStart;
      this.player.reset(startPos.x, startPos.y);
      this.player.sprite.visible = true;

      this.timeRecorder.clearAllRecordings(this.gameContainer);
      this.uiManager.clearHistory();

      this.stats = { steps: 0, timeElapsed: 0, recordingsCount: 0, score: 0 };
      this.levelStartTime = performance.now();
      this.gameMode = 'playing';

      this.uiManager.setLevelName(LEVELS[index].name);
      this.uiManager.setHint(LEVELS[index].description, 5000);
      this.uiManager.updateStats(this.stats);
      this.uiManager.setSegments(this.timeRecorder.getSegments());
      this.uiManager.setMaxDuration(this.timeRecorder.getMaxDuration());
      this.uiManager.setCurrentTime(0);
      this.uiManager.setGameMode(this.gameMode);
    });
  }

  private resetLevel(): void {
    if (!this.level) return;

    const startPos = LEVELS[this.currentLevelIndex].playerStart;
    this.player.reset(startPos.x, startPos.y);
    this.level.reset();

    this.timeRecorder.clearAllRecordings(this.gameContainer);
    this.stats.steps = 0;
    this.levelStartTime = performance.now();
    this.gameMode = 'playing';

    this.uiManager.updateStats(this.stats);
    this.uiManager.setSegments([]);
    this.uiManager.setMaxDuration(0);
    this.uiManager.setCurrentTime(0);
    this.uiManager.setGameMode(this.gameMode);
    this.uiManager.setHint('关卡已重置', 2000);
  }

  private toggleRecording(): void {
    if (this.gameMode === 'recording') {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    if (this.gameMode === 'playback' || this.gameMode === 'rewinding') {
      this.stopPlayback();
    }

    const maxRecordings = LEVELS[this.currentLevelIndex]?.maxRecordings || 3;
    if (this.timeRecorder.getSegments().length >= maxRecordings) {
      this.uiManager.setHint(`最多只能录制 ${maxRecordings} 段！`, 3000);
      return;
    }

    this.timeRecorder.startRecording(this.gameContainer);
    this.gameMode = 'recording';
    this.uiManager.setGameMode(this.gameMode);
    this.uiManager.setButtonLabel('record', 'STOP');
    this.uiManager.setHint('正在录制... 按 R 停止', 2000);
    this.uiManager.addHistoryItem();
  }

  private stopRecording(): void {
    const segment = this.timeRecorder.stopRecording(this.gameContainer);

    if (segment) {
      this.stats.recordingsCount = this.timeRecorder.getSegments().length;
      this.uiManager.updateStats(this.stats);
      this.uiManager.setSegments(this.timeRecorder.getSegments());
      this.uiManager.setMaxDuration(this.timeRecorder.getMaxDuration());
      this.uiManager.setHint(`录制完成！时长 ${((segment.endTime - segment.startTime) / 1000).toFixed(1)}秒`, 3000);
    } else {
      this.uiManager.setHint('录制时间太短，已取消', 2000);
    }

    this.gameMode = 'playing';
    this.uiManager.setGameMode(this.gameMode);
    this.uiManager.setButtonLabel('record', 'REC');
  }

  private togglePlayback(): void {
    if (this.gameMode === 'recording') {
      this.stopRecording();
    }

    if (this.gameMode === 'playback') {
      this.stopPlayback();
    } else if (this.gameMode === 'paused') {
      this.timeRecorder.resumePlayback();
      this.gameMode = 'playback';
      this.uiManager.setGameMode(this.gameMode);
      this.uiManager.setButtonLabel('pause', 'PAUSE');
    } else {
      this.timeRecorder.startPlayback();
      this.gameMode = 'playback';
      this.uiManager.setGameMode(this.gameMode);
      this.uiManager.setHint('回放中...', 2000);
    }
  }

  private toggleRewind(): void {
    if (this.gameMode === 'recording') {
      this.stopRecording();
    }

    if (this.gameMode === 'rewinding') {
      this.stopPlayback();
    } else if (this.gameMode === 'paused') {
      this.timeRecorder.resumePlayback();
      this.gameMode = 'rewinding';
      this.uiManager.setGameMode(this.gameMode);
    } else {
      this.timeRecorder.startRewind();
      this.gameMode = 'rewinding';
      this.uiManager.setGameMode(this.gameMode);
      this.uiManager.setHint('倒带中...', 2000);
    }
  }

  private togglePause(): void {
    if (this.gameMode === 'playback' || this.gameMode === 'rewinding') {
      this.timeRecorder.pausePlayback();
      this.gameMode = 'paused';
      this.uiManager.setGameMode(this.gameMode);
      this.uiManager.setButtonLabel('pause', 'RESUME');
      this.uiManager.setHint('已暂停', 1500);
    } else if (this.gameMode === 'paused') {
      this.togglePlayback();
    }
  }

  private stopPlayback(): void {
    this.timeRecorder.stopPlayback();
    this.gameMode = 'playing';
    this.uiManager.setGameMode(this.gameMode);
    this.uiManager.setButtonLabel('pause', 'PAUSE');
  }

  private clearRecordings(): void {
    this.timeRecorder.clearAllRecordings(this.gameContainer);
    this.stats.recordingsCount = 0;
    this.uiManager.updateStats(this.stats);
    this.uiManager.setSegments([]);
    this.uiManager.setMaxDuration(0);
    this.uiManager.setCurrentTime(0);
    this.uiManager.setHint('已清空所有录制', 2000);
    this.uiManager.addHistoryItem();
  }

  private handleUndo(): void {
    if (this.timeRecorder.undo(this.gameContainer)) {
      this.stats.recordingsCount = this.timeRecorder.getSegments().length;
      this.uiManager.updateStats(this.stats);
      this.uiManager.setSegments(this.timeRecorder.getSegments());
      this.uiManager.setMaxDuration(this.timeRecorder.getMaxDuration());
      this.uiManager.setHint('撤销成功', 1500);
    } else {
      this.uiManager.setHint('没有可撤销的操作', 1500);
    }
  }

  private handleRedo(): void {
    if (this.timeRecorder.redo(this.gameContainer)) {
      this.stats.recordingsCount = this.timeRecorder.getSegments().length;
      this.uiManager.updateStats(this.stats);
      this.uiManager.setSegments(this.timeRecorder.getSegments());
      this.uiManager.setMaxDuration(this.timeRecorder.getMaxDuration());
      this.uiManager.setHint('重做成功', 1500);
    } else {
      this.uiManager.setHint('没有可重做的操作', 1500);
    }
  }

  private handleTimeChange(time: number): void {
    this.timeRecorder.setPlaybackTime(time);

    if (this.level) {
      const ghostRects = new Map<string, Rect>();
      for (const [id, ghost] of this.timeRecorder.getGhostPlayers()) {
        ghostRects.set(id, ghost.getRect());
      }
      this.level.checkButtonPresses(
        this.player.getRect(),
        ghostRects,
        time,
        this.timeRecorder.getSegments()
      );
    }
  }

  private handleScaleChange(scale: number): void {
    this.timeRecorder.setTimeScale(scale);
  }

  private collectGhostRects(): Map<string, Rect> {
    const ghostRects = new Map<string, Rect>();
    for (const [id, ghost] of this.timeRecorder.getGhostPlayers()) {
      ghostRects.set(id, ghost.getRect());
    }
    return ghostRects;
  }

  private gameLoop(_delta: number): void {
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    const clampedDelta = Math.min(deltaTime, 1 / 30);

    if (this.level) {
      if (this.gameMode !== 'paused') {
        if (this.gameMode !== 'playback' && this.gameMode !== 'rewinding') {
          const activeDoors = this.level.getActiveDoors();
          this.player.update(clampedDelta, this.level.getPlatforms(), activeDoors);
        }

        this.timeRecorder.update(clampedDelta, this.player.getState());

        const currentTime = this.timeRecorder.getPlayingState()
          ? this.timeRecorder.getPlaybackTime()
          : this.timeRecorder.getGlobalTime();

        const ghostRects = this.collectGhostRects();
        this.level.checkButtonPresses(
          this.player.getRect(),
          ghostRects,
          currentTime,
          this.timeRecorder.getSegments()
        );

        if (this.timeRecorder.getPlayingState()) {
          this.uiManager.setCurrentTime(this.timeRecorder.getPlaybackTime());
        }

        if (this.level.checkSpikeCollision(this.player.getRect())) {
          this.uiManager.setHint('碰到尖刺！重置位置', 2000);
          const startPos = LEVELS[this.currentLevelIndex].playerStart;
          this.player.reset(startPos.x, startPos.y);
        }

        if (this.level.checkGoalReached(this.player.getRect())) {
          this.handleLevelComplete();
        }

        this.stats.timeElapsed = now - this.levelStartTime;
        this.uiManager.updateStats({
          timeElapsed: this.stats.timeElapsed,
          recordingsCount: this.timeRecorder.getSegments().length
        });
      }
    }

    this.uiManager.update(clampedDelta);
  }

  private handleLevelComplete(): void {
    const timeSeconds = (this.stats.timeElapsed / 1000).toFixed(1);
    const segments = this.timeRecorder.getSegments().length;

    let score = 1000;
    score -= Math.floor(this.stats.timeElapsed / 1000) * 10;
    score -= segments * 50;
    score = Math.max(0, score);

    this.stats.score = score;

    const stars = score >= 800 ? 3 : score >= 500 ? 2 : 1;
    const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);

    this.uiManager.setHint(
      `通关！ ${starStr} | 用时: ${timeSeconds}s | 录制: ${segments}段 | 得分: ${score}`,
      8000
    );

    if (this.currentLevelIndex < LEVELS.length - 1) {
      setTimeout(() => {
        this.loadLevel(this.currentLevelIndex + 1);
      }, 3000);
    } else {
      setTimeout(() => {
        this.showLevelSelect();
      }, 5000);
    }
  }

  public destroy(): void {
    this.app.destroy(true);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
