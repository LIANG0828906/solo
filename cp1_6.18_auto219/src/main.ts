import { AudioAnalyzer } from './audioAnalyzer';
import { BrickRenderer } from './brickRenderer';

class App {
  private canvas: HTMLCanvasElement;
  private uploadZone: HTMLElement;
  private fileInput: HTMLInputElement;
  private playBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private volumeSlider: HTMLInputElement;
  private filenameEl: HTMLElement;

  private audioAnalyzer: AudioAnalyzer;
  private brickRenderer: BrickRenderer;
  private animationFrameId: number | null = null;
  private isReady: boolean = false;

  constructor() {
    this.canvas = document.getElementById('glassCanvas') as HTMLCanvasElement;
    this.uploadZone = document.getElementById('uploadZone') as HTMLElement;
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.playBtn = document.getElementById('playBtn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
    this.volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
    this.filenameEl = document.getElementById('filename') as HTMLElement;

    if (!this.canvas || !this.uploadZone || !this.fileInput || !this.playBtn || !this.resetBtn || !this.volumeSlider || !this.filenameEl) {
      throw new Error('页面元素缺失');
    }

    this.audioAnalyzer = new AudioAnalyzer();
    this.brickRenderer = new BrickRenderer(this.canvas);

    this.bindEvents();
    this.setVolume(parseFloat(this.volumeSlider.value));
    this.startRenderLoop();
  }

  private bindEvents(): void {
    this.uploadZone.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        this.handleFile(files[0]);
      }
    });

    this.uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadZone.classList.add('dragover');
    });

    this.uploadZone.addEventListener('dragleave', () => {
      this.uploadZone.classList.remove('dragover');
    });

    this.uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadZone.classList.remove('dragover');
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.handleFile(files[0]);
      }
    });

    this.playBtn.addEventListener('click', () => {
      this.togglePlay();
    });

    this.resetBtn.addEventListener('click', () => {
      this.reset();
    });

    this.volumeSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.setVolume(value);
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.isReady) {
        e.preventDefault();
        this.togglePlay();
      }
    });
  }

  private async handleFile(file: File): Promise<void> {
    this.filenameEl.textContent = `正在加载: ${file.name}...`;
    this.playBtn.disabled = true;
    this.resetBtn.disabled = true;
    this.isReady = false;

    try {
      await this.audioAnalyzer.loadFile(file);
      this.audioAnalyzer.setOnEnded(() => {
        this.playBtn.textContent = '播放';
        this.brickRenderer.reset();
      });
      this.filenameEl.textContent = file.name;
      this.playBtn.disabled = false;
      this.resetBtn.disabled = false;
      this.isReady = true;
      this.playBtn.textContent = '播放';
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载失败';
      this.filenameEl.textContent = `错误: ${message}`;
      console.error('音频加载失败:', err);
    }
  }

  private togglePlay(): void {
    if (!this.isReady) return;

    if (this.audioAnalyzer.getIsPlaying()) {
      this.audioAnalyzer.stop();
      this.playBtn.textContent = '继续';
    } else {
      this.audioAnalyzer.start();
      this.playBtn.textContent = '暂停';
    }
  }

  private reset(): void {
    this.audioAnalyzer.reset();
    this.brickRenderer.reset();
    this.playBtn.textContent = '播放';
  }

  private setVolume(value: number): void {
    this.audioAnalyzer.setVolume(value);
  }

  private startRenderLoop(): void {
    const loop = (): void => {
      if (this.audioAnalyzer.getIsPlaying()) {
        const bandEnergies = this.audioAnalyzer.getBandEnergies();
        this.brickRenderer.update(bandEnergies);
      }
      this.brickRenderer.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.audioAnalyzer.dispose();
  }
}

let app: App | null = null;

document.addEventListener('DOMContentLoaded', () => {
  try {
    app = new App();
  } catch (err) {
    console.error('应用初始化失败:', err);
  }
});

window.addEventListener('beforeunload', () => {
  if (app) {
    app.destroy();
  }
});
