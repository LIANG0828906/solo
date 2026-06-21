import { SceneManager } from './SceneManager';
import { DataFusion, SensorType, SensorSnapshot } from './DataFusion';

class App {
  private sceneManager: SceneManager;
  private dataFusion: DataFusion;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;

  private isPlaying = false;
  private isPlaybackMode = false;
  private playbackTime = 0;
  private playbackFrameIndex = 0;
  private lastPlaybackTime = 0;
  private readonly PLAYBACK_FPS = 2;
  private readonly HISTORY_SECONDS = 30;

  private playBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private sliderThumb: HTMLDivElement;
  private sliderProgress: HTMLDivElement;
  private timeDisplay: HTMLDivElement;
  private modeIndicator: HTMLDivElement;

  private isDraggingSlider = false;

  constructor() {
    this.container = document.getElementById('scene-container')!;
    this.canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;

    this.sceneManager = new SceneManager(this.container, this.canvas);
    this.dataFusion = new DataFusion();

    this.playBtn = document.getElementById('play-btn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.sliderThumb = document.getElementById('slider-thumb') as HTMLDivElement;
    this.sliderProgress = document.getElementById('slider-progress') as HTMLDivElement;
    this.timeDisplay = document.getElementById('time-display') as HTMLDivElement;
    this.modeIndicator = document.getElementById('mode-indicator') as HTMLDivElement;

    this.init();
  }

  private async init(): Promise<void> {
    await this.dataFusion.init();

    const configs = this.dataFusion.getSensorConfigs();
    if (configs) {
      this.sceneManager.setSensorConfigs(configs);
    }

    const latestSnapshot = this.dataFusion.getLatestSnapshot();
    if (latestSnapshot) {
      this.sceneManager.updateSnapshot(latestSnapshot);
    }

    this.dataFusion.onSnapshot((snapshot) => {
      if (!this.isPlaybackMode) {
        this.sceneManager.updateSnapshot(snapshot);
      }
    });

    this.dataFusion.onHistoryUpdate(() => {
      if (!this.isPlaybackMode) {
        this.updateTimeDisplayRealtime();
      }
    });

    this.sceneManager.setOnSensorClick((type) => this.handleSensorClick(type));

    this.setupControls();
    this.sceneManager.start();
    this.updateTimeDisplayRealtime();
  }

  private setupControls(): void {
    this.playBtn.addEventListener('click', () => this.togglePlayback());
    this.resetBtn.addEventListener('click', () => this.resetPlayback());

    this.sliderThumb.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.startSliderDrag(e.clientX);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingSlider) {
        this.updateSliderPosition(e.clientX);
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDraggingSlider) {
        this.endSliderDrag();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayback();
      }
    });

    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(timestamp: number): void {
    if (this.isPlaybackMode && this.isPlaying) {
      const delta = timestamp - this.lastPlaybackTime;
      if (delta >= 1000 / this.PLAYBACK_FPS) {
        this.lastPlaybackTime = timestamp;
        this.advancePlayback();
      }
    }
    requestAnimationFrame((t) => this.loop(t));
  }

  private togglePlayback(): void {
    if (!this.isPlaybackMode) {
      this.enterPlaybackMode();
    }

    this.isPlaying = !this.isPlaying;
    this.playBtn.textContent = this.isPlaying ? '⏸' : '▶';
  }

  private enterPlaybackMode(): void {
    this.isPlaybackMode = true;
    this.playbackTime = 0;
    this.playbackFrameIndex = 0;
    this.lastPlaybackTime = performance.now();
    this.isPlaying = true;
    this.playBtn.textContent = '⏸';

    this.modeIndicator.textContent = '回放模式';
    this.modeIndicator.className = 'mode-indicator mode-playback';

    this.updateSliderFromTime();
  }

  private exitPlaybackMode(): void {
    this.isPlaybackMode = false;
    this.isPlaying = false;
    this.playBtn.textContent = '▶';

    this.modeIndicator.textContent = '实时模式';
    this.modeIndicator.className = 'mode-indicator mode-live';

    const latest = this.dataFusion.getLatestSnapshot();
    if (latest) {
      this.sceneManager.updateSnapshot(latest);
    }

    this.updateTimeDisplayRealtime();
    this.setSliderPosition(1);
  }

  private resetPlayback(): void {
    if (this.isPlaybackMode) {
      this.playbackTime = 0;
      this.playbackFrameIndex = 0;
      this.updatePlaybackSnapshot();
      this.updateSliderFromTime();
    } else {
      this.enterPlaybackMode();
    }
  }

  private advancePlayback(): void {
    const history = this.dataFusion.getHistory();
    if (history.length === 0) return;

    this.playbackTime += 1 / this.PLAYBACK_FPS;
    if (this.playbackTime >= this.HISTORY_SECONDS) {
      this.exitPlaybackMode();
      return;
    }

    this.updatePlaybackSnapshot();
    this.updateSliderFromTime();
  }

  private updatePlaybackSnapshot(): void {
    const history = this.dataFusion.getHistoryLastSeconds(this.HISTORY_SECONDS);
    if (history.length === 0) return;

    const targetTime = Date.now() - (this.HISTORY_SECONDS - this.playbackTime) * 1000;
    const snapshot = this.dataFusion.getSnapshotAtTime(targetTime);
    if (snapshot) {
      this.sceneManager.updateSnapshot(snapshot);
    }

    this.updateTimeDisplayPlayback();
  }

  private startSliderDrag(clientX: number): void {
    this.isDraggingSlider = true;
    if (!this.isPlaybackMode) {
      this.enterPlaybackMode();
      this.isPlaying = false;
      this.playBtn.textContent = '▶';
    }
    this.updateSliderPosition(clientX);
  }

  private updateSliderPosition(clientX: number): void {
    const track = this.sliderThumb.parentElement!;
    const rect = track.getBoundingClientRect();
    let progress = (clientX - rect.left) / rect.width;
    progress = Math.max(0, Math.min(1, progress));
    this.setSliderPosition(progress);

    this.playbackTime = progress * this.HISTORY_SECONDS;
    this.updatePlaybackSnapshot();
  }

  private endSliderDrag(): void {
    this.isDraggingSlider = false;
  }

  private setSliderPosition(progress: number): void {
    const percentage = progress * 100;
    this.sliderThumb.style.left = `${percentage}%`;
    this.sliderProgress.style.width = `${percentage}%`;
  }

  private updateSliderFromTime(): void {
    const progress = this.playbackTime / this.HISTORY_SECONDS;
    this.setSliderPosition(progress);
  }

  private updateTimeDisplayRealtime(): void {
    this.timeDisplay.textContent = `实时`;
  }

  private updateTimeDisplayPlayback(): void {
    const timeAgo = this.HISTORY_SECONDS - this.playbackTime;
    this.timeDisplay.textContent = `-${timeAgo.toFixed(1)}s / 0s`;
  }

  private handleSensorClick(type: SensorType): void {
    this.sceneManager.flyToSensor(type);

    setTimeout(() => {
      const snapshot = this.dataFusion.getLatestSnapshot();
      const history = this.dataFusion.getHistoryLastSeconds(30);
      if (snapshot && history.length > 0) {
        this.sceneManager.showInfoPanel(type, snapshot, history);
      }
    }, 400);

    setTimeout(() => {
      this.sceneManager.closeInfoPanel();
    }, 8000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
