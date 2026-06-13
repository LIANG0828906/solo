import { Visualizer, BlendMode, ThemeType } from './visualizer';
import { AudioEngine } from './audioEngine';

interface ControlsOptions {
  particleDensitySliderId?: string;
  spectrumSensitivitySliderId?: string;
  blendModeSelectId?: string;
  themeButtonIds?: Record<ThemeType, string>;
  playPauseButtonId?: string;
  progressBarId?: string;
  progressFillId?: string;
  timeDisplayId?: string;
  screenshotButtonId?: string;
  fileInputId?: string;
  easingDuration?: number;
}

interface EasingValue {
  current: number;
  target: number;
  start: number;
  startTime: number;
  duration: number;
  animating: boolean;
}

export class Controls {
  private visualizer: Visualizer;
  private audioEngine: AudioEngine;
  private particleDensitySlider: HTMLInputElement | null = null;
  private spectrumSensitivitySlider: HTMLInputElement | null = null;
  private blendModeSelect: HTMLSelectElement | null = null;
  private themeButtons: Record<ThemeType, HTMLElement | null> = {
    japanese: null,
    cyberpunk: null,
    darkTech: null
  };
  private playPauseButton: HTMLElement | null = null;
  private progressBar: HTMLInputElement | null = null;
  private progressFill: HTMLElement | null = null;
  private timeDisplay: HTMLElement | null = null;
  private screenshotButton: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;

  private particleDensityEasing: EasingValue;
  private spectrumSensitivityEasing: EasingValue;
  private readonly easingDuration: number;
  private animationFrameId: number | null = null;
  private isDragging = false;
  private lastPlayState = false;

  constructor(
    visualizer: Visualizer,
    audioEngine: AudioEngine,
    options: ControlsOptions = {}
  ) {
    this.visualizer = visualizer;
    this.audioEngine = audioEngine;
    this.easingDuration = options.easingDuration || 300;

    this.particleDensityEasing = {
      current: 200,
      target: 200,
      start: 200,
      startTime: 0,
      duration: this.easingDuration,
      animating: false
    };

    this.spectrumSensitivityEasing = {
      current: 1.5,
      target: 1.5,
      start: 1.5,
      startTime: 0,
      duration: this.easingDuration,
      animating: false
    };

    this.initElements(options);
    this.bindEvents();
    this.startEasingLoop();
  }

  private initElements(options: ControlsOptions): void {
    if (options.particleDensitySliderId) {
      this.particleDensitySlider = document.getElementById(
        options.particleDensitySliderId
      ) as HTMLInputElement;
    }

    if (options.spectrumSensitivitySliderId) {
      this.spectrumSensitivitySlider = document.getElementById(
        options.spectrumSensitivitySliderId
      ) as HTMLInputElement;
    }

    if (options.blendModeSelectId) {
      this.blendModeSelect = document.getElementById(
        options.blendModeSelectId
      ) as HTMLSelectElement;
    }

    if (options.themeButtonIds) {
      (Object.keys(options.themeButtonIds) as ThemeType[]).forEach((theme) => {
        const id = options.themeButtonIds![theme];
        if (id) {
          this.themeButtons[theme] = document.getElementById(id);
        }
      });
    }

    if (options.playPauseButtonId) {
      this.playPauseButton = document.getElementById(options.playPauseButtonId);
    }

    if (options.progressBarId) {
      this.progressBar = document.getElementById(options.progressBarId) as HTMLInputElement;
    }

    if (options.progressFillId) {
      this.progressFill = document.getElementById(options.progressFillId);
    }

    if (options.timeDisplayId) {
      this.timeDisplay = document.getElementById(options.timeDisplayId);
    }

    if (options.screenshotButtonId) {
      this.screenshotButton = document.getElementById(options.screenshotButtonId);
    }

    if (options.fileInputId) {
      this.fileInput = document.getElementById(options.fileInputId) as HTMLInputElement;
    }
  }

  private bindEvents(): void {
    if (this.particleDensitySlider) {
      this.particleDensitySlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.setParticleDensity(value);
      });
    }

    if (this.spectrumSensitivitySlider) {
      this.spectrumSensitivitySlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.setSpectrumSensitivity(value);
      });
    }

    if (this.blendModeSelect) {
      this.blendModeSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value as BlendMode;
        this.setBlendMode(value);
      });
    }

    (Object.keys(this.themeButtons) as ThemeType[]).forEach((theme) => {
      const button = this.themeButtons[theme];
      if (button) {
        button.addEventListener('click', () => {
          this.setTheme(theme);
        });
      }
    });

    if (this.playPauseButton) {
      this.playPauseButton.addEventListener('click', () => {
        this.togglePlayPause();
      });
    }

    if (this.progressBar) {
      this.progressBar.addEventListener('mousedown', () => {
        this.isDragging = true;
      });

      this.progressBar.addEventListener('touchstart', () => {
        this.isDragging = true;
      });

      const handleSeek = (e: Event) => {
        if (this.isDragging) {
          const value = parseFloat((e.target as HTMLInputElement).value);
          this.seekTo(value);
          this.isDragging = false;
        }
      };

      this.progressBar.addEventListener('mouseup', handleSeek);
      this.progressBar.addEventListener('touchend', handleSeek);

      this.progressBar.addEventListener('input', (e) => {
        if (this.isDragging) {
          const value = parseFloat((e.target as HTMLInputElement).value);
          this.updateProgressVisual(value);
          this.updateTimeDisplay(value);
        }
      });
    }

    if (this.screenshotButton) {
      this.screenshotButton.addEventListener('click', () => {
        this.takeScreenshot();
      });
    }

    if (this.fileInput) {
      this.fileInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          this.loadAudioFile(file);
        }
      });
    }
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private updateEasingValue(easing: EasingValue, now: number): void {
    if (!easing.animating) return;

    const elapsed = now - easing.startTime;
    const progress = Math.min(elapsed / easing.duration, 1);
    const easedProgress = this.easeInOutQuad(progress);

    easing.current = easing.start + (easing.target - easing.start) * easedProgress;

    if (progress >= 1) {
      easing.current = easing.target;
      easing.animating = false;
    }
  }

  private startEasingLoop(): void {
    const loop = (now: number) => {
      this.updateEasingValue(this.particleDensityEasing, now);
      this.updateEasingValue(this.spectrumSensitivityEasing, now);

      this.visualizer.setParticleDensity(this.particleDensityEasing.current);
      this.visualizer.setSpectrumSensitivity(this.spectrumSensitivityEasing.current);

      this.updateProgressBar();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private setParticleDensity(value: number): void {
    this.particleDensityEasing.target = value;
    this.particleDensityEasing.start = this.particleDensityEasing.current;
    this.particleDensityEasing.startTime = performance.now();
    this.particleDensityEasing.animating = true;
  }

  private setSpectrumSensitivity(value: number): void {
    this.spectrumSensitivityEasing.target = value;
    this.spectrumSensitivityEasing.start = this.spectrumSensitivityEasing.current;
    this.spectrumSensitivityEasing.startTime = performance.now();
    this.spectrumSensitivityEasing.animating = true;
  }

  private setBlendMode(mode: BlendMode): void {
    this.visualizer.setBlendMode(mode);
  }

  private setTheme(theme: ThemeType): void {
    this.visualizer.setTheme(theme);
    this.updateThemeButtonStates(theme);
    this.visualizer.setParticleDensity(themes[theme].particleDensity);
    if (this.particleDensitySlider) {
      this.particleDensitySlider.value = String(themes[theme].particleDensity);
      const display = document.getElementById('densityValue');
      if (display) display.textContent = String(themes[theme].particleDensity);
    }
  }

  private updateThemeButtonStates(activeTheme: ThemeType): void {
    (Object.keys(this.themeButtons) as ThemeType[]).forEach((theme) => {
      const button = this.themeButtons[theme];
      if (button) {
        if (theme === activeTheme) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      }
    });
  }

  private togglePlayPause(): void {
    if (!this.audioEngine.getAudioData()) {
      this.fileInput?.click();
      return;
    }
    this.audioEngine.togglePlay();
    this.updatePlayPauseButton();
  }

  private updatePlayPauseButton(): void {
    if (!this.playPauseButton) return;

    const isPlaying = this.audioEngine.getIsPlaying();
    if (isPlaying !== this.lastPlayState) {
      this.lastPlayState = isPlaying;
      this.playPauseButton.textContent = isPlaying ? '⏸️ 暂停' : '▶️ 播放';
      this.playPauseButton.dataset.playing = String(isPlaying);
    }
  }

  private seekTo(progress: number): void {
    const duration = this.audioEngine.getDuration();
    const time = progress * duration;
    this.audioEngine.seek(time);
    this.updateProgressVisual(progress);
  }

  private updateProgressVisual(progress: number): void {
    if (this.progressFill) {
      this.progressFill.style.width = `${progress * 100}%`;
    }
  }

  private updateProgressBar(): void {
    if (!this.progressBar || this.isDragging) return;

    const currentTime = this.audioEngine.getCurrentTime();
    const duration = this.audioEngine.getDuration();

    if (duration > 0) {
      const progress = currentTime / duration;
      this.progressBar.value = String(progress);
      this.updateProgressVisual(progress);
      this.updateTimeDisplay(progress);
    }

    this.updatePlayPauseButton();
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private updateTimeDisplay(progress: number): void {
    if (!this.timeDisplay) return;

    const duration = this.audioEngine.getDuration();
    const currentTime = progress * duration;

    this.timeDisplay.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(duration)}`;
  }

  private async takeScreenshot(): Promise<void> {
    try {
      await this.visualizer.takeScreenshot();
    } catch (error) {
      console.error('截图失败:', error);
    }
  }

  private async loadAudioFile(file: File): Promise<void> {
    try {
      await this.audioEngine.decodeFile(file);
      this.audioEngine.play();
      this.updatePlayPauseButton();

      this.audioEngine.setOnDataCallback((spectrum, waveform) => {
        const audioData = this.audioEngine.getAudioData();
        if (audioData) {
          const samples = 256;
          const currentSample = Math.floor(
            this.audioEngine.getCurrentTime() * audioData.sampleRate
          );
          const startSample = Math.max(0, currentSample - samples / 2);

          const leftSamples = new Float32Array(samples);
          const rightSamples = new Float32Array(samples);

          for (let i = 0; i < samples; i++) {
            const idx = Math.floor(startSample + i * (audioData.length / samples));
            leftSamples[i] = idx < audioData.leftChannel.length ? audioData.leftChannel[idx] : 0;
            rightSamples[i] = idx < audioData.rightChannel.length ? audioData.rightChannel[idx] : 0;
          }

          this.visualizer.setWaveformData(leftSamples, rightSamples);
        }
        this.visualizer.setSpectrumData(spectrum);
      });
    } catch (error) {
      console.error('音频文件加载失败:', error);
      alert('音频文件加载失败，请尝试其他文件');
    }
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

const themes: Record<ThemeType, { particleDensity: number }> = {
  japanese: { particleDensity: 150 },
  cyberpunk: { particleDensity: 400 },
  darkTech: { particleDensity: 80 }
};
