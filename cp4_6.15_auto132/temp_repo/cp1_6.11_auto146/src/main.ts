import { AudioProcessor, AudioState } from './audioProcessor';
import { WaveformRenderer } from './waveformRenderer';
import { SpectrogramRenderer } from './spectrogramRenderer';
import { EQController, EQ_PRESETS } from './eqController';

class Application {
  private audioProcessor: AudioProcessor;
  private waveformRenderer: WaveformRenderer;
  private spectrogramRenderer: SpectrogramRenderer;
  private eqController: EQController;

  private state: Partial<AudioState> = {};

  // DOM
  private uploadBtn: HTMLButtonElement;
  private uploadIcon: HTMLElement;
  private uploadText: HTMLElement;
  private fileInput: HTMLInputElement;
  private fileInfo: HTMLElement;
  private playBtn: HTMLButtonElement;
  private stopBtn: HTMLButtonElement;
  private currentTimeEl: HTMLElement;
  private totalTimeEl: HTMLElement;
  private progressFg: SVGCircleElement;
  private sampleRateEl: HTMLElement;
  private bitDepthEl: HTMLElement;
  private channelsEl: HTMLElement;
  private vuMeter: HTMLElement;
  private vuDb: HTMLElement;

  private waveformCanvas: HTMLCanvasElement;
  private spectrogramCanvas: HTMLCanvasElement;
  private eqSection: HTMLElement;
  private eqConnector: SVGElement;
  private presetsSection: HTMLElement;

  private renderRafId: number | null = null;
  private lastVuUpdate = 0;
  private currentFileName = '';

  constructor() {
    this.audioProcessor = new AudioProcessor();

    // DOM refs
    this.uploadBtn = document.getElementById('uploadBtn') as HTMLButtonElement;
    this.uploadIcon = document.getElementById('uploadIcon')!;
    this.uploadText = document.getElementById('uploadText')!;
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.fileInfo = document.getElementById('fileInfo')!;
    this.playBtn = document.getElementById('playBtn') as HTMLButtonElement;
    this.stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
    this.currentTimeEl = document.getElementById('currentTime')!;
    this.totalTimeEl = document.getElementById('totalTime')!;
    this.progressFg = document.querySelector('.progress-circle-fg') as SVGCircleElement;
    this.sampleRateEl = document.getElementById('sampleRate')!;
    this.bitDepthEl = document.getElementById('bitDepth')!;
    this.channelsEl = document.getElementById('channels')!;
    this.vuMeter = document.getElementById('vuMeter')!;
    this.vuDb = document.getElementById('vuDb')!;

    this.waveformCanvas = document.getElementById('waveformCanvas') as HTMLCanvasElement;
    this.spectrogramCanvas = document.getElementById('spectrogramCanvas') as HTMLCanvasElement;
    this.eqSection = document.getElementById('eqSection') as HTMLElement;
    this.eqConnector = document.getElementById('eqConnector') as unknown as SVGElement;
    this.presetsSection = document.getElementById('presetsSection') as HTMLElement;

    // Renderers
    this.waveformRenderer = new WaveformRenderer(this.waveformCanvas);
    this.spectrogramRenderer = new SpectrogramRenderer(this.spectrogramCanvas);

    // EQ
    this.eqController = new EQController(this.eqSection, this.eqConnector, this.presetsSection);

    this.setupCallbacks();
    this.setupEvents();
    this.resetAll();
    this.startRenderLoop();
  }

  private setupCallbacks(): void {
    // Audio processor
    this.audioProcessor.setOnStateChange((s) => {
      this.state = { ...this.state, ...s };
      this.updateStateUI();
    });

    this.audioProcessor.setOnTimeDomain((data) => {
      this.waveformRenderer.draw(data);
    });

    this.audioProcessor.setOnFrequency((data) => {
      this.spectrogramRenderer.draw(data);
    });

    this.audioProcessor.setOnEnded(() => {
      this.playBtn.textContent = '▶';
      this.waveformRenderer.setPlaying(false);
      this.spectrogramRenderer.setPlaying(false);
    });

    // Waveform
    this.waveformRenderer.setOnSeek((t) => this.audioProcessor.seek(t));
    this.waveformRenderer.setDurationGetter(() => this.state.duration ?? 0);
    this.waveformRenderer.setCurrentTimeGetter(() => this.state.currentTime ?? 0);

    // Spectrogram
    this.spectrogramRenderer.setOnSeek((t) => this.audioProcessor.seek(t));
    this.spectrogramRenderer.setDurationGetter(() => this.state.duration ?? 0);
    this.spectrogramRenderer.setCurrentTimeGetter(() => this.state.currentTime ?? 0);

    // EQ
    this.eqController.setOnGainChange((idx, g) => {
      this.audioProcessor.setBandGain(idx, g, true);
    });

    this.eqController.setOnPresetChange((_key, gains) => {
      this.audioProcessor.setAllGains(gains, true);
    });
  }

  private setupEvents(): void {
    // Upload
    this.uploadBtn.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      await this.loadFile(file);
    });

    // Drag and drop on whole app
    const app = document.getElementById('app')!;
    ['dragenter', 'dragover'].forEach((ev) => {
      app.addEventListener(ev, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
    app.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0];
      if (file) await this.loadFile(file);
    });

    // Playback
    this.playBtn.addEventListener('click', () => {
      if (!this.audioProcessor.hasAudio()) return;
      if (this.state.isPlaying) {
        this.audioProcessor.pause();
        this.playBtn.textContent = '▶';
        this.waveformRenderer.setPlaying(false);
        this.spectrogramRenderer.setPlaying(false);
      } else {
        this.audioProcessor.play();
        this.playBtn.textContent = '⏸';
        this.waveformRenderer.setPlaying(true);
        this.spectrogramRenderer.setPlaying(true);
      }
    });

    this.stopBtn.addEventListener('click', () => {
      if (!this.audioProcessor.hasAudio()) return;
      this.audioProcessor.stop();
      this.audioProcessor.seek(0);
      this.playBtn.textContent = '▶';
      this.waveformRenderer.setPlaying(false);
      this.spectrogramRenderer.setPlaying(false);
      this.waveformRenderer.draw();
    });

    // Resize
    let resizeTimer: number | null = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        this.waveformRenderer.resize();
        this.spectrogramRenderer.resize();
        this.eqController.forceUpdate();
        if (this.audioProcessor.hasAudio()) {
          this.waveformRenderer.draw();
        }
      }, 100);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space' && this.audioProcessor.hasAudio()) {
        e.preventDefault();
        this.playBtn.click();
      } else if (e.code === 'ArrowLeft' && this.audioProcessor.hasAudio()) {
        e.preventDefault();
        const t = Math.max(0, (this.state.currentTime ?? 0) - 5);
        this.audioProcessor.seek(t);
      } else if (e.code === 'ArrowRight' && this.audioProcessor.hasAudio()) {
        e.preventDefault();
        const t = Math.min(this.state.duration ?? 0, (this.state.currentTime ?? 0) + 5);
        this.audioProcessor.seek(t);
      }
    });
  }

  private async loadFile(file: File): Promise<void> {
    this.setLoading(true);
    this.currentFileName = file.name;

    try {
      await this.audioProcessor.decodeAudioFile(file);

      const buffer = this.audioProcessor.getAudioBuffer();
      this.waveformRenderer.setStaticBuffer(buffer);
      this.spectrogramRenderer.setStaticBuffer(buffer);

      // Update info display
      this.fileInfo.textContent = `${file.name} (${this.formatSize(file.size)})`;

      // Draw initial waveform
      this.waveformRenderer.draw();

      // Auto play
      this.playBtn.disabled = false;
      this.stopBtn.disabled = false;

      // Reset EQ to flat
      this.eqController.setAllGains(EQ_PRESETS.standard.gains, false, false);
      this.audioProcessor.setAllGains(EQ_PRESETS.standard.gains, false);

      // Start playback
      this.audioProcessor.play();
      this.playBtn.textContent = '⏸';
      this.waveformRenderer.setPlaying(true);
      this.spectrogramRenderer.setPlaying(true);

      // Reset to standard preset highlight
      const stdBtn = document.querySelector('.preset-btn[data-preset="standard"]');
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      stdBtn?.classList.add('active');

      setTimeout(() => this.eqController.forceUpdate(), 50);
    } catch (err) {
      console.error('加载文件失败:', err);
      const msg = err instanceof Error ? err.message : '未知错误';
      this.fileInfo.textContent = `❌ 加载失败: ${msg}`;
      this.playBtn.disabled = true;
      this.stopBtn.disabled = true;
    } finally {
      this.setLoading(false);
    }
  }

  private setLoading(loading: boolean): void {
    if (loading) {
      this.uploadBtn.classList.add('loading');
      this.uploadIcon.innerHTML = '<div class="spinner"></div>';
      this.uploadText.textContent = '加载中...';
    } else {
      this.uploadBtn.classList.remove('loading');
      this.uploadIcon.textContent = '📁';
      this.uploadText.textContent = '上传音频';
    }
  }

  private resetAll(): void {
    this.waveformRenderer.clear();
    this.spectrogramRenderer.clear();
    this.sampleRateEl.textContent = '-- Hz';
    this.bitDepthEl.textContent = '-- bit';
    this.channelsEl.textContent = '--';
    this.currentTimeEl.textContent = '00:00';
    this.totalTimeEl.textContent = '00:00';
    this.vuMeter.style.width = '0%';
    this.vuDb.textContent = '-∞ dB';
    this.setProgressCircle(0);
  }

  private updateStateUI(): void {
    const { currentTime = 0, duration = 0, sampleRate = 0, numberOfChannels = 0, bitDepth = 0, peakLevel = 0 } = this.state;

    this.currentTimeEl.textContent = this.formatTime(currentTime);
    this.totalTimeEl.textContent = this.formatTime(duration);
    this.setProgressCircle(duration > 0 ? currentTime / duration : 0);

    if (sampleRate) this.sampleRateEl.textContent = `${sampleRate.toLocaleString()} Hz`;
    if (bitDepth) this.bitDepthEl.textContent = `${bitDepth} bit`;
    if (numberOfChannels) this.channelsEl.textContent = numberOfChannels >= 2 ? '立体声' : '单声道';
  }

  private startRenderLoop(): void {
    const loop = (t: number) => {
      // VU meter at ~30fps
      if (t - this.lastVuUpdate >= 1000 / 30) {
        this.lastVuUpdate = t;
        const peak = this.state.peakLevel ?? 0;
        const pct = Math.min(100, peak * 100);
        this.vuMeter.style.width = `${pct}%`;
        if (peak > 0) {
          const db = 20 * Math.log10(peak);
          this.vuDb.textContent = db <= -60 ? '-∞ dB' : `${db.toFixed(1)} dB`;
        } else {
          this.vuDb.textContent = '-∞ dB';
        }
      }

      // Update waveform if not playing (to ensure playhead moves during seek)
      if (!this.state.isPlaying && this.audioProcessor.hasAudio()) {
        this.waveformRenderer.draw();
      }

      this.renderRafId = requestAnimationFrame(loop);
    };
    this.renderRafId = requestAnimationFrame(loop);
  }

  private setProgressCircle(pct: number): void {
    if (!this.progressFg) return;
    const circumference = 2 * Math.PI * 13;
    const offset = circumference * (1 - Math.max(0, Math.min(1, pct)));
    this.progressFg.style.strokeDasharray = String(circumference);
    this.progressFg.style.strokeDashoffset = String(offset);
  }

  private formatTime(sec: number): string {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  dispose(): void {
    if (this.renderRafId !== null) cancelAnimationFrame(this.renderRafId);
    this.audioProcessor.dispose();
    this.eqController.dispose();
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  (window as unknown as { __app?: Application }).__app = new Application();
});
