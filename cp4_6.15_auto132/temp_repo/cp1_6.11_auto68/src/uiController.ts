import { AudioEngine } from './audioEngine';
import { Visualizer } from './visualizer';

export interface UIControllerOptions {
  audioEngine: AudioEngine;
  visualizer: Visualizer;
}

export class UIController {
  private audioEngine: AudioEngine;
  private visualizer: Visualizer;

  private fileInput: HTMLInputElement;
  private dropZone: HTMLElement;
  private playPauseBtn: HTMLButtonElement;
  private playIcon: HTMLElement;
  private playText: HTMLElement;
  private volumeSlider: HTMLInputElement;
  private volumeValue: HTMLElement;
  private speedSlider: HTMLInputElement;
  private speedValue: HTMLElement;
  private resetBtn: HTMLButtonElement;
  private loopBtn: HTMLButtonElement;
  private exportBtn: HTMLButtonElement;
  private noAudioOverlay: HTMLElement;
  private canvas: HTMLCanvasElement;

  private fileNameEl: HTMLElement;
  private fileSizeEl: HTMLElement;
  private sampleRateEl: HTMLElement;
  private channelsEl: HTMLElement;
  private currentTimeEl: HTMLElement;
  private totalTimeEl: HTMLElement;
  private regionStartEl: HTMLElement;
  private regionEndEl: HTMLElement;
  private regionDurationEl: HTMLElement;

  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private isSelecting: boolean = false;
  private selectionStart: number = 0;

  constructor(options: UIControllerOptions) {
    this.audioEngine = options.audioEngine;
    this.visualizer = options.visualizer;

    this.fileInput = this.getElement<HTMLInputElement>('fileInput');
    this.dropZone = this.getElement<HTMLElement>('dropZone');
    this.playPauseBtn = this.getElement<HTMLButtonElement>('playPauseBtn');
    this.playIcon = this.getElement<HTMLElement>('playIcon');
    this.playText = this.getElement<HTMLElement>('playText');
    this.volumeSlider = this.getElement<HTMLInputElement>('volumeSlider');
    this.volumeValue = this.getElement<HTMLElement>('volumeValue');
    this.speedSlider = this.getElement<HTMLInputElement>('speedSlider');
    this.speedValue = this.getElement<HTMLElement>('speedValue');
    this.resetBtn = this.getElement<HTMLButtonElement>('resetBtn');
    this.loopBtn = this.getElement<HTMLButtonElement>('loopBtn');
    this.exportBtn = this.getElement<HTMLButtonElement>('exportBtn');
    this.noAudioOverlay = this.getElement<HTMLElement>('noAudioOverlay');
    this.canvas = this.visualizer.getCanvas();

    this.fileNameEl = this.getElement<HTMLElement>('fileName');
    this.fileSizeEl = this.getElement<HTMLElement>('fileSize');
    this.sampleRateEl = this.getElement<HTMLElement>('sampleRate');
    this.channelsEl = this.getElement<HTMLElement>('channels');
    this.currentTimeEl = this.getElement<HTMLElement>('currentTime');
    this.totalTimeEl = this.getElement<HTMLElement>('totalTime');
    this.regionStartEl = this.getElement<HTMLElement>('regionStart');
    this.regionEndEl = this.getElement<HTMLElement>('regionEnd');
    this.regionDurationEl = this.getElement<HTMLElement>('regionDuration');

    this.bindEvents();
    this.updateUIState();
  }

  private getElement<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (!el) throw new Error(`找不到元素: ${id}`);
    return el as T;
  }

  private bindEvents(): void {
    this.fileInput.addEventListener('change', this.handleFileSelect);
    this.playPauseBtn.addEventListener('click', this.handlePlayPause);
    this.volumeSlider.addEventListener('input', this.handleVolumeChange);
    this.speedSlider.addEventListener('input', this.handleSpeedChange);
    this.resetBtn.addEventListener('click', this.handleReset);
    this.loopBtn.addEventListener('click', this.handleLoopToggle);
    this.exportBtn.addEventListener('click', this.handleExport);

    this.setupDragAndDrop();
    this.setupCanvasSelection();

    window.addEventListener('resize', this.handleResize);

    this.visualizer.setOnTimeUpdate(this.handleTimeUpdate);
  }

  private setupDragAndDrop(): void {
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('dragover');
    });

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove('dragover');
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('dragover');
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.loadFile(files[0]);
      }
    });

    document.body.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    document.body.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.loadFile(files[0]);
      }
    });
  }

  private setupCanvasSelection(): void {
    this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown);
    this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove);
    this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleCanvasMouseUp);

    this.canvas.addEventListener('touchstart', this.handleCanvasTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleCanvasTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleCanvasTouchEnd);
  }

  private getCanvasX(clientX: number): number {
    const rect = this.canvas.getBoundingClientRect();
    return clientX - rect.left;
  }

  private getCanvasY(clientY: number): number {
    const rect = this.canvas.getBoundingClientRect();
    return clientY - rect.top;
  }

  private handleCanvasMouseDown = (e: MouseEvent): void => {
    if (!this.audioEngine.getDuration()) return;

    const x = this.getCanvasX(e.clientX);
    const y = this.getCanvasY(e.clientY);

    if (!this.visualizer.isInWaveformArea(y)) return;

    this.isSelecting = true;
    this.selectionStart = x;
    this.dragStartX = x;

    const time = this.visualizer.xToTime(x);
    this.audioEngine.selectRegion(time, time);
    this.updateRegionInfo();
  };

  private handleCanvasMouseMove = (e: MouseEvent): void => {
    if (!this.isSelecting) return;

    const x = this.getCanvasX(e.clientX);
    const startTime = this.visualizer.xToTime(this.selectionStart);
    const endTime = this.visualizer.xToTime(x);

    this.audioEngine.selectRegion(startTime, endTime);
    this.updateRegionInfo();
    this.updateLoopExportButtons();
  };

  private handleCanvasMouseUp = (): void => {
    if (this.isSelecting) {
      this.isSelecting = false;
      const region = this.audioEngine.getRegion();
      if (region && Math.abs(region.end - region.start) < 0.01) {
        this.audioEngine.clearRegion();
        this.updateRegionInfo();
        this.updateLoopExportButtons();
      }
    }
  };

  private handleCanvasTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleCanvasMouseDown(mouseEvent as any);
    }
  };

  private handleCanvasTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleCanvasMouseMove(mouseEvent as any);
    }
  };

  private handleCanvasTouchEnd = (e: TouchEvent): void => {
    this.handleCanvasMouseUp();
  };

  private handleFileSelect = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.loadFile(files[0]);
    }
  };

  private async loadFile(file: File): Promise<void> {
    try {
      await this.audioEngine.loadFile(file);
      this.noAudioOverlay.classList.add('hidden');
      this.updateInfoPanel();
      this.updateUIState();
      this.updateRegionInfo();
      this.visualizer.resize();
      this.visualizer.start();
      this.audioEngine.play();
      this.updatePlayButton();
    } catch (error) {
      alert(error instanceof Error ? error.message : '加载音频失败');
    }
  }

  private handlePlayPause = (): void => {
    const isPlaying = this.audioEngine.togglePlay();
    this.updatePlayButton(isPlaying);
  };

  private handleVolumeChange = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    this.audioEngine.setVolume(value / 100);
    this.volumeValue.textContent = `${value}%`;
  };

  private handleSpeedChange = (e: Event): void => {
    const input = e.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.audioEngine.setSpeed(value);
    this.speedValue.textContent = `${value.toFixed(1)}x`;
  };

  private handleReset = (): void => {
    this.audioEngine.reset();
    this.volumeSlider.value = '70';
    this.volumeValue.textContent = '70%';
    this.speedSlider.value = '1';
    this.speedValue.textContent = '1.0x';
    this.updatePlayButton(false);
    this.updateRegionInfo();
    this.updateLoopExportButtons();
    this.updateLoopButton();
  };

  private handleLoopToggle = (): void => {
    const newLooping = !this.audioEngine.isLooping;
    this.audioEngine.setLooping(newLooping);
    this.updateLoopButton();
  };

  private handleExport = async (): Promise<void> => {
    try {
      const blob = await this.audioEngine.exportSelectedRegion();
      const region = this.audioEngine.getRegion();
      const fileName = this.audioEngine.fileName.replace(/\.[^/.]+$/, '');
      const startStr = region ? this.formatTimeForFilename(region.start) : '0';
      const endStr = region ? this.formatTimeForFilename(region.end) : '0';
      const downloadName = `${fileName}_${startStr}-${endStr}.wav`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : '导出失败');
    }
  };

  private formatTimeForFilename(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}${secs.toString().padStart(2, '0')}${ms.toString().padStart(3, '0')}`;
  }

  private handleResize = (): void => {
    this.visualizer.resize();
  };

  private handleTimeUpdate = (time: number): void => {
    this.currentTimeEl.textContent = this.formatTime(time);
    this.updatePlayButton();
  };

  private updatePlayButton(isPlaying?: boolean): void {
    const playing = isPlaying !== undefined ? isPlaying : this.audioEngine.isPlaying();
    if (playing) {
      this.playIcon.textContent = '⏸';
      this.playText.textContent = '暂停';
    } else {
      this.playIcon.textContent = '▶';
      this.playText.textContent = '播放';
    }
  }

  private updateInfoPanel(): void {
    this.fileNameEl.textContent = this.audioEngine.fileName || '--';
    this.fileSizeEl.textContent = this.formatFileSize(this.audioEngine.fileSize);
    this.sampleRateEl.textContent = this.audioEngine.sampleRate
      ? `${this.audioEngine.sampleRate} Hz`
      : '--';
    this.channelsEl.textContent = this.audioEngine.numberOfChannels
      ? this.audioEngine.numberOfChannels.toString()
      : '--';
    this.totalTimeEl.textContent = this.formatTime(this.audioEngine.getDuration());
  }

  private updateRegionInfo(): void {
    const region = this.audioEngine.getRegion();
    if (region) {
      this.regionStartEl.textContent = this.formatTime(region.start);
      this.regionEndEl.textContent = this.formatTime(region.end);
      this.regionDurationEl.textContent = this.formatTime(region.end - region.start);
    } else {
      this.regionStartEl.textContent = '--';
      this.regionEndEl.textContent = '--';
      this.regionDurationEl.textContent = '--';
    }
  }

  private updateLoopButton(): void {
    if (this.audioEngine.isLooping) {
      this.loopBtn.textContent = '⏹ 停止循环';
      this.loopBtn.style.backgroundColor = '#FF4500';
    } else {
      this.loopBtn.innerHTML = '🔁 循环播放选区';
      this.loopBtn.style.backgroundColor = '';
    }
  }

  private updateLoopExportButtons(): void {
    const hasRegion = this.audioEngine.hasRegion();
    this.loopBtn.disabled = !hasRegion;
    this.exportBtn.disabled = !hasRegion;
  }

  private updateUIState(): void {
    const hasAudio = !!this.audioEngine.getDuration();

    this.playPauseBtn.disabled = !hasAudio;
    this.volumeSlider.disabled = !hasAudio;
    this.speedSlider.disabled = !hasAudio;
    this.loopBtn.disabled = !hasAudio || !this.audioEngine.hasRegion();
    this.exportBtn.disabled = !hasAudio || !this.audioEngine.hasRegion();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
