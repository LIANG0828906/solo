import { SceneManager } from './sceneManager';
import { DataManager } from './dataManager';
import { UIController } from './uiController';
import type { PlayerPosition, KillEvent } from './types';

class App {
  private sceneManager: SceneManager | null = null;
  private dataManager: DataManager | null = null;
  private uiController: UIController | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;

  public async init(): Promise<void> {
    this.setupCanvas();
    if (!this.canvas) return;

    this.sceneManager = new SceneManager(this.canvas);
    this.dataManager = new DataManager();
    this.uiController = new UIController();

    await this.dataManager.init();

    const players = this.dataManager.getPlayers();
    const duration = this.dataManager.getDuration();
    const killMarkers = this.dataManager.getKillMarkers();
    const initialStats = this.dataManager.getStats();

    this.sceneManager.initPlayers(players);

    this.uiController.init(duration, killMarkers);
    this.uiController.updateStats(initialStats);

    this.setupEventListeners();
    this.startAnimationLoop();

    this.dataManager.start();
    this.uiController.play();

    console.log('🎮 Esports 3D Replay Dashboard initialized');
    console.log(`📊 Match data: ${players.length} players, ${duration}s duration`);
    console.log(`⚡ Kill events: ${killMarkers.length}`);
  }

  private setupCanvas(): void {
    const container = document.createElement('div');
    container.id = 'canvas-container';
    document.body.appendChild(container);

    this.canvas = document.createElement('canvas');
    container.appendChild(this.canvas);
  }

  private setupEventListeners(): void {
    if (!this.dataManager || !this.sceneManager || !this.uiController) return;

    this.dataManager.onEvent((event: PlayerPosition | KillEvent) => {
      if (event.eventType === 'moving') {
        this.sceneManager?.updatePlayerPosition(
          event.playerId,
          event.x,
          event.y,
          event.timestamp
        );
      } else if (event.eventType === 'kill') {
        this.sceneManager?.showKillEffect(event as KillEvent);
      }
    });

    this.dataManager.onStatsUpdate((stats) => {
      this.uiController?.updateStats(stats);
    });

    this.dataManager.onTimeUpdate((time) => {
      this.uiController?.updateTimeDisplay(time);
    });

    this.uiController.onTimeChange((time) => {
      if (this.dataManager?.isCurrentlyPlaying()) {
        this.uiController?.pause();
      }
      this.dataManager?.seekToTime(time);
      this.sceneManager?.clearTrails();

      const players = this.dataManager?.getPlayers() || [];
      players.forEach((player) => {
        const events = this.dataManager?.getEventsAtTime(time);
        const playerEvent = events?.find(
          (e) => e.playerId === player.id && e.eventType === 'moving'
        );
        if (playerEvent) {
          this.sceneManager?.updatePlayerPosition(
            player.id,
            playerEvent.x,
            playerEvent.y,
            time
          );
        }
      });
    });

    this.uiController.onTeamFilterChange((showRed, showBlue) => {
      this.dataManager?.setTeamFilter(showRed, showBlue);
      this.sceneManager?.setTeamVisibility(showRed, showBlue);
    });

    this.uiController.onHeatmapToggle((enabled) => {
      this.sceneManager?.setHeatmapEnabled(enabled);
    });

    this.uiController.onPlayPause((playing) => {
      if (playing) {
        this.dataManager?.start();
      } else {
        this.dataManager?.pause();
      }
    });
  }

  private startAnimationLoop(): void {
    if (!this.sceneManager) return;

    this.sceneManager.startAnimationLoop((stats) => {
      this.currentFps = stats.fps;
      const now = performance.now();
      if (now - this.lastFpsUpdate > 1000) {
        if (this.currentFps < 45) {
          console.warn(`⚠️ Low FPS: ${this.currentFps.toFixed(1)}`);
        }
        this.lastFpsUpdate = now;
      }
    });
  }

  public dispose(): void {
    this.sceneManager?.dispose();
    this.dataManager?.dispose();
    this.uiController?.dispose();
  }
}

const app = new App();

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await app.init();
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
  }
});

window.addEventListener('beforeunload', () => {
  app.dispose();
});
