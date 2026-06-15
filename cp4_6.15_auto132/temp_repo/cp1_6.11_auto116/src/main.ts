import { AudioAnalyzer } from './audioAnalyzer';
import { Visualizer } from './visualizer';

class App {
  private audioAnalyzer: AudioAnalyzer;
  private visualizer: Visualizer;

  private fileDropArea: HTMLElement;
  private fileInput: HTMLInputElement;
  private fileInfo: HTMLElement;
  private controls: HTMLElement;
  private playBtn: HTMLButtonElement;
  private playIcon: HTMLElement;
  private pauseIcon: HTMLElement;
  private volumeSlider: HTMLInputElement;
  private spectrumContainer: HTMLElement;
  private spectrumBars: HTMLElement[] = [];

  private readonly SPECTRUM_BARS = 32;
  private readonly BAR_MAX_HEIGHT = 120;
  private readonly BAR_MIN_HEIGHT = 4;

  private animationId: number = 0;

  constructor() {
    this.audioAnalyzer = new AudioAnalyzer();

    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
      throw new Error('Canvas container not found');
    }
    this.visualizer = new Visualizer(canvasContainer);

    this.fileDropArea = document.getElementById('fileDropArea') as HTMLElement;
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.fileInfo = document.getElementById('fileInfo') as HTMLElement;
    this.controls = document.getElementById('controls') as HTMLElement;
    this.playBtn = document.getElementById('playBtn') as HTMLButtonElement;
    this.playIcon = document.getElementById('playIcon') as HTMLElement;
    this.pauseIcon = document.getElementById('pauseIcon') as HTMLElement;
    this.volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
    this.spectrumContainer = document.getElementById('spectrumContainer') as HTMLElement;

    this.initSpectrumBars();
    this.bindEvents();
    this.startAnimationLoop();
  }

  private initSpectrumBars(): void {
    for (let i = 0; i < this.SPECTRUM_BARS; i++) {
      const bar = document.createElement('div');
      bar.className = 'spectrum-bar';
      bar.style.height = this.BAR_MIN_HEIGHT + 'px';
      this.spectrumContainer.appendChild(bar);
      this.spectrumBars.push(bar);
    }
  }

  private bindEvents(): void {
    this.fileDropArea.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.handleFile(target.files[0]);
      }
    });

    this.fileDropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.fileDropArea.classList.add('dragover');
    });

    this.fileDropArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.fileDropArea.classList.remove('dragover');
    });

    this.fileDropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.fileDropArea.classList.remove('dragover');

      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (this.isValidAudioFile(file)) {
          this.handleFile(file);
        }
      }
    });

    this.playBtn.addEventListener('click', () => {
      this.handlePlayPause();
    });

    this.volumeSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const volume = parseFloat(target.value) / 100;
      this.audioAnalyzer.setVolume(volume);
    });
  }

  private isValidAudioFile(file: File): boolean {
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'];
    const validExtensions = ['.mp3', '.wav'];
    const name = file.name.toLowerCase();
    return validTypes.includes(file.type) || validExtensions.some(ext => name.endsWith(ext));
  }

  private async handleFile(file: File): Promise<void> {
    if (!this.isValidAudioFile(file)) {
      alert('请选择有效的 MP3 或 WAV 格式音频文件');
      return;
    }

    try {
      this.fileInfo.textContent = '加载中...';
      this.fileInfo.classList.add('show');
      this.fileInfo.style.color = '#FF8C00';

      await this.audioAnalyzer.loadFile(file);

      this.fileInfo.textContent = `已加载: ${file.name}`;
      this.fileInfo.style.color = '#00FFFF';
      this.controls.classList.remove('hidden');

      this.updatePlayPauseIcons(false);
    } catch (error) {
      console.error('Failed to load audio file:', error);
      this.fileInfo.textContent = '加载失败，请重试';
      this.fileInfo.style.color = '#FF4444';
    }
  }

  private handlePlayPause(): void {
    const isPlaying = this.audioAnalyzer.togglePlayPause();
    this.updatePlayPauseIcons(isPlaying);
  }

  private updatePlayPauseIcons(isPlaying: boolean): void {
    if (isPlaying) {
      this.playIcon.style.display = 'none';
      this.pauseIcon.style.display = 'block';
      this.playBtn.setAttribute('aria-label', '暂停');
    } else {
      this.playIcon.style.display = 'block';
      this.pauseIcon.style.display = 'none';
      this.playBtn.setAttribute('aria-label', '播放');
    }
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.visualizer.update(this.audioAnalyzer);
      this.updateSpectrum();
    };
    animate();
  }

  private updateSpectrum(): void {
    const values = this.audioAnalyzer.getSpectrumBars(this.SPECTRUM_BARS);
    for (let i = 0; i < this.SPECTRUM_BARS; i++) {
      const height = this.BAR_MIN_HEIGHT + values[i] * (this.BAR_MAX_HEIGHT - this.BAR_MIN_HEIGHT);
      this.spectrumBars[i].style.height = height + 'px';
    }
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.visualizer.dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});
