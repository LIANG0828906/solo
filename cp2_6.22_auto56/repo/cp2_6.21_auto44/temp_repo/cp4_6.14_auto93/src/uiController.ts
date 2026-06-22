import { AudioAnalyzer } from './audioAnalyzer';

export interface UICallbacks {
  onFileSelected: (file: File) => void;
  onTogglePlay: () => boolean;
  onReset: () => void;
  onSensitivityChange: (value: number) => void;
  getAudioAnalyzer: () => AudioAnalyzer | null;
}

export class UIController {
  private uploadArea: HTMLElement;
  private uploadBtn: HTMLElement;
  private fileInput: HTMLInputElement;
  private resetBtn: HTMLElement;
  private infoPanel: HTMLElement;
  private controlsBar: HTMLElement;
  private playBtn: HTMLElement;
  private sensitivitySlider: HTMLInputElement;
  private infoTime: HTMLElement;
  private infoBpm: HTMLElement;
  private infoFps: HTMLElement;

  private callbacks: UICallbacks;
  private fpsFrames: number = 0;
  private fpsLastTime: number = 0;
  private lastInfoUpdate: number = 0;
  private currentFps: number = 60;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    this.uploadArea = document.getElementById('upload-area') as HTMLElement;
    this.uploadBtn = document.getElementById('upload-btn') as HTMLElement;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLElement;
    this.infoPanel = document.getElementById('info-panel') as HTMLElement;
    this.controlsBar = document.getElementById('controls-bar') as HTMLElement;
    this.playBtn = document.getElementById('play-btn') as HTMLElement;
    this.sensitivitySlider = document.getElementById('sensitivity-slider') as HTMLInputElement;
    this.infoTime = document.getElementById('info-time') as HTMLElement;
    this.infoBpm = document.getElementById('info-bpm') as HTMLElement;
    this.infoFps = document.getElementById('info-fps') as HTMLElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.uploadBtn.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.handleFile(file);
      }
    });

    this.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadArea.classList.add('dragover');
    });

    this.uploadArea.addEventListener('dragleave', () => {
      this.uploadArea.classList.remove('dragover');
    });

    this.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove('dragover');
      const file = e.dataTransfer?.files[0];
      if (file) {
        this.handleFile(file);
      }
    });

    this.resetBtn.addEventListener('click', () => {
      this.callbacks.onReset();
    });

    this.playBtn.addEventListener('click', () => {
      const isPlaying = this.callbacks.onTogglePlay();
      this.playBtn.textContent = isPlaying ? '⏸' : '▶';
    });

    this.sensitivitySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.callbacks.onSensitivityChange(value);
    });
  }

  private handleFile(file: File): void {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp3'];
    const ext = file.name.toLowerCase().split('.').pop();
    if (!validTypes.includes(file.type) && ext !== 'mp3' && ext !== 'wav') {
      alert('请上传 MP3 或 WAV 格式的音频文件');
      return;
    }
    this.callbacks.onFileSelected(file);
  }

  showPlayingUI(): void {
    this.uploadArea.classList.add('hidden');
    this.resetBtn.classList.remove('hidden');
    this.infoPanel.classList.remove('hidden');
    this.controlsBar.classList.remove('hidden');
    this.playBtn.textContent = '⏸';
  }

  updatePlayButton(isPlaying: boolean): void {
    this.playBtn.textContent = isPlaying ? '⏸' : '▶';
  }

  tickFPS(now: number): void {
    this.fpsFrames++;
    if (now - this.fpsLastTime >= 1000) {
      this.currentFps = Math.round((this.fpsFrames * 1000) / (now - this.fpsLastTime));
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }

    if (now - this.lastInfoUpdate >= 1000) {
      this.updateInfoDisplay();
      this.lastInfoUpdate = now;
    }
  }

  private updateInfoDisplay(): void {
    const analyzer = this.callbacks.getAudioAnalyzer();
    if (!analyzer) return;

    const current = analyzer.getCurrentTime();
    const duration = analyzer.getDuration();
    const bpm = analyzer.getBPM();

    this.infoTime.textContent = `时间: ${this.formatTime(current)} / ${this.formatTime(duration)}`;
    this.infoBpm.textContent = `BPM: ${bpm}`;
    this.infoFps.textContent = `FPS: ${this.currentFps}`;
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  getSensitivity(): number {
    return parseFloat(this.sensitivitySlider.value);
  }
}
