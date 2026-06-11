import { PlateInfo } from './types';
import { formatTime, clamp } from './utils';

type Callback = (value: number) => void;
type SimpleCallback = () => void;

export class UIManager {
  private loadingEl: HTMLElement | null = null;
  private progressBar: HTMLElement | null = null;
  private progressFill: HTMLElement | null = null;
  private timeLabel: HTMLElement | null = null;
  private speedSlider: HTMLElement | null = null;
  private sliderFill: HTMLElement | null = null;
  private sliderThumb: HTMLElement | null = null;
  private speedLabel: HTMLElement | null = null;
  private playBtn: HTMLElement | null = null;
  private reverseBtn: HTMLElement | null = null;
  private infoPanel: HTMLElement | null = null;
  private plateNameEl: HTMLElement | null = null;
  private plateSpeedEl: HTMLElement | null = null;
  private plateElevationEl: HTMLElement | null = null;

  private progressCallback: Callback | null = null;
  private speedCallback: Callback | null = null;
  private playPauseCallback: SimpleCallback | null = null;
  private reverseCallback: SimpleCallback | null = null;

  private isDraggingProgress: boolean = false;
  private isDraggingSlider: boolean = false;
  private currentSpeed: number = 1.0;
  private isPlaying: boolean = true;
  private isReversed: boolean = false;

  constructor() {
    this.cacheElements();
    this.bindEvents();
  }

  private cacheElements(): void {
    this.loadingEl = document.getElementById('loading');
    this.progressBar = document.getElementById('progress-bar');
    this.progressFill = document.getElementById('progress-fill');
    this.timeLabel = document.getElementById('time-label');
    this.speedSlider = document.getElementById('speed-slider');
    this.sliderFill = document.getElementById('slider-fill');
    this.sliderThumb = document.getElementById('slider-thumb');
    this.speedLabel = document.getElementById('speed-label');
    this.playBtn = document.getElementById('play-btn');
    this.reverseBtn = document.getElementById('reverse-btn');
    this.infoPanel = document.getElementById('info-panel');
    this.plateNameEl = document.getElementById('plate-name');
    this.plateSpeedEl = document.getElementById('plate-speed');
    this.plateElevationEl = document.getElementById('plate-elevation');
  }

  private bindEvents(): void {
    if (this.progressBar) {
      this.progressBar.addEventListener('mousedown', this.onProgressMouseDown.bind(this));
      this.progressBar.addEventListener('touchstart', this.onProgressTouchStart.bind(this), { passive: false });
    }

    if (this.speedSlider) {
      this.speedSlider.addEventListener('mousedown', this.onSliderMouseDown.bind(this));
      this.speedSlider.addEventListener('touchstart', this.onSliderTouchStart.bind(this), { passive: false });
    }

    if (this.playBtn) {
      this.playBtn.addEventListener('click', this.onPlayPauseClick.bind(this));
    }

    if (this.reverseBtn) {
      this.reverseBtn.addEventListener('click', this.onReverseClick.bind(this));
    }

    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));
    document.addEventListener('mouseup', this.onDocumentMouseUp.bind(this));
    document.addEventListener('touchmove', this.onDocumentTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.onDocumentTouchEnd.bind(this));
  }

  private onProgressMouseDown(e: MouseEvent): void {
    this.isDraggingProgress = true;
    this.updateProgressFromEvent(e.clientX);
    e.preventDefault();
  }

  private onProgressTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDraggingProgress = true;
      this.updateProgressFromEvent(e.touches[0].clientX);
      e.preventDefault();
    }
  }

  private onSliderMouseDown(e: MouseEvent): void {
    this.isDraggingSlider = true;
    this.updateSpeedFromEvent(e.clientX);
    e.preventDefault();
  }

  private onSliderTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDraggingSlider = true;
      this.updateSpeedFromEvent(e.touches[0].clientX);
      e.preventDefault();
    }
  }

  private onDocumentMouseMove(e: MouseEvent): void {
    if (this.isDraggingProgress) {
      this.updateProgressFromEvent(e.clientX);
    }
    if (this.isDraggingSlider) {
      this.updateSpeedFromEvent(e.clientX);
    }
  }

  private onDocumentTouchMove(e: TouchEvent): void {
    if (this.isDraggingProgress && e.touches.length === 1) {
      this.updateProgressFromEvent(e.touches[0].clientX);
      e.preventDefault();
    }
    if (this.isDraggingSlider && e.touches.length === 1) {
      this.updateSpeedFromEvent(e.touches[0].clientX);
      e.preventDefault();
    }
  }

  private onDocumentMouseUp(): void {
    this.isDraggingProgress = false;
    this.isDraggingSlider = false;
  }

  private onDocumentTouchEnd(): void {
    this.isDraggingProgress = false;
    this.isDraggingSlider = false;
  }

  private updateProgressFromEvent(clientX: number): void {
    if (!this.progressBar) return;
    const rect = this.progressBar.getBoundingClientRect();
    const progress = clamp((clientX - rect.left) / rect.width, 0, 1);
    this.updateProgressUI(progress);
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  private updateSpeedFromEvent(clientX: number): void {
    if (!this.speedSlider) return;
    const rect = this.speedSlider.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const speed = 0.1 + ratio * 4.9;
    this.currentSpeed = speed;
    this.updateSpeedUI(speed);
    if (this.speedCallback) {
      this.speedCallback(speed);
    }
  }

  private onPlayPauseClick(): void {
    this.isPlaying = !this.isPlaying;
    this.updatePlayButtonUI();
    if (this.playPauseCallback) {
      this.playPauseCallback();
    }
  }

  private onReverseClick(): void {
    this.isReversed = !this.isReversed;
    this.updateReverseButtonUI();
    if (this.reverseCallback) {
      this.reverseCallback();
    }
  }

  private updateProgressUI(progress: number): void {
    if (this.progressFill) {
      this.progressFill.style.width = `${progress * 100}%`;
    }
  }

  private updateSpeedUI(speed: number): void {
    const ratio = (speed - 0.1) / 4.9;
    if (this.sliderFill) {
      this.sliderFill.style.width = `${ratio * 100}%`;
    }
    if (this.sliderThumb) {
      this.sliderThumb.style.left = `${ratio * 100}%`;
    }
    if (this.speedLabel) {
      this.speedLabel.textContent = `速度：${speed.toFixed(1)}x`;
    }
  }

  private updatePlayButtonUI(): void {
    if (this.playBtn) {
      if (this.isPlaying) {
        this.playBtn.textContent = '暂停';
        this.playBtn.classList.add('active');
      } else {
        this.playBtn.textContent = '播放';
        this.playBtn.classList.remove('active');
      }
    }
  }

  private updateReverseButtonUI(): void {
    if (this.reverseBtn) {
      if (this.isReversed) {
        this.reverseBtn.classList.add('active');
      } else {
        this.reverseBtn.classList.remove('active');
      }
    }
  }

  public showLoading(): void {
    if (this.loadingEl) {
      this.loadingEl.classList.remove('hidden');
    }
  }

  public hideLoading(): void {
    if (this.loadingEl) {
      this.loadingEl.classList.add('hidden');
      setTimeout(() => {
        if (this.loadingEl) {
          this.loadingEl.style.display = 'none';
        }
      }, 800);
    }
  }

  public updateTimeLabel(progress: number): void {
    if (!this.isDraggingProgress) {
      this.updateProgressUI(progress);
    }
    if (this.timeLabel) {
      this.timeLabel.textContent = formatTime(progress);
    }
  }

  public updateSpeedLabel(speed: number): void {
    this.currentSpeed = speed;
    this.updateSpeedUI(speed);
  }

  public updateInfoPanel(data: PlateInfo | null): void {
    if (!this.infoPanel) return;

    if (data) {
      if (this.plateNameEl) this.plateNameEl.textContent = data.name;
      if (this.plateSpeedEl) this.plateSpeedEl.textContent = data.speed;
      if (this.plateElevationEl) this.plateElevationEl.textContent = data.elevation;
      this.infoPanel.classList.add('visible');
    } else {
      this.infoPanel.classList.remove('visible');
    }
  }

  public onProgressChange(callback: Callback): void {
    this.progressCallback = callback;
  }

  public onSpeedChange(callback: Callback): void {
    this.speedCallback = callback;
  }

  public onPlayPause(callback: SimpleCallback): void {
    this.playPauseCallback = callback;
  }

  public onReverse(callback: SimpleCallback): void {
    this.reverseCallback = callback;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsReversed(): boolean {
    return this.isReversed;
  }

  public getSpeed(): number {
    return this.currentSpeed;
  }

  public dispose(): void {
    document.removeEventListener('mousemove', this.onDocumentMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onDocumentMouseUp.bind(this));
    document.removeEventListener('touchmove', this.onDocumentTouchMove.bind(this));
    document.removeEventListener('touchend', this.onDocumentTouchEnd.bind(this));
  }
}
