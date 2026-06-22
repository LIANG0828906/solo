import { AudioEngine } from './audio-engine';
import { Visualizer } from './visualizer';
import { BeatEditor } from './beat-editor';
import { EffectPanel } from './effect-panel';
import type { VisualMode } from './types';

class App {
  private audioEngine: AudioEngine;
  private visualizer: Visualizer;
  private beatEditor: BeatEditor;
  private effectPanel: EffectPanel;
  private rafId: number | null = null;
  private waveformCanvas: HTMLCanvasElement;
  private waveformCtx: CanvasRenderingContext2D;
  private waveformOffscreen: HTMLCanvasElement;
  private waveformOffCtx: CanvasRenderingContext2D;
  private waveformData: Float32Array = new Float32Array(0);
  private waveformDirty = true;
  private currentMode: VisualMode = 'particles';

  constructor() {
    this.audioEngine = new AudioEngine();
    this.visualizer = new Visualizer(document.getElementById('mainCanvas') as HTMLCanvasElement);
    this.beatEditor = new BeatEditor(document.getElementById('beatCanvas') as HTMLCanvasElement);
    this.effectPanel = new EffectPanel();

    this.waveformCanvas = document.getElementById('waveformCanvas') as HTMLCanvasElement;
    this.waveformCtx = this.waveformCanvas.getContext('2d')!;
    this.waveformOffscreen = document.createElement('canvas');
    this.waveformOffCtx = this.waveformOffscreen.getContext('2d')!;

    this.setupResize();
    this.setupUpload();
    this.setupTransport();
    this.setupZoom();
    this.setupAudioProgress();
    this.setupEffectPanel();
    this.setupCanvasMouseEvents();

    this.handleResize();
    this.visualizer.start();
    this.startRenderLoop();
  }

  private setupResize(): void {
    const observer = new ResizeObserver(() => {
      this.handleResize();
    });
    observer.observe(document.getElementById('app')!);
  }

  private handleResize(): void {
    const dpr = window.devicePixelRatio || 1;

    const waveformSection = this.waveformCanvas.parentElement!;
    const ww = waveformSection.clientWidth;
    const wh = waveformSection.clientHeight;
    this.waveformCanvas.width = ww * dpr;
    this.waveformCanvas.height = wh * dpr;
    this.waveformCtx.scale(dpr, dpr);
    this.waveformCanvas.style.width = ww + 'px';
    this.waveformCanvas.style.height = wh + 'px';
    this.waveformOffscreen.width = this.waveformCanvas.width;
    this.waveformOffscreen.height = this.waveformCanvas.height;
    this.waveformDirty = true;

    const visSection = (document.getElementById('mainCanvas') as HTMLCanvasElement).parentElement!;
    this.visualizer.resize(visSection.clientWidth, visSection.clientHeight);

    const beatSection = (document.getElementById('beatCanvas') as HTMLCanvasElement).parentElement!;
    this.beatEditor.resize(beatSection.clientWidth, beatSection.clientHeight);
  }

  private setupUpload(): void {
    const overlay = document.getElementById('uploadOverlay')!;
    const box = document.getElementById('uploadBox')!;
    const input = document.getElementById('fileInput') as HTMLInputElement;

    box.addEventListener('click', () => input.click());

    input.addEventListener('change', async () => {
      if (input.files && input.files[0]) {
        await this.loadAudioFile(input.files[0]);
        overlay.classList.add('hidden');
      }
    });

    box.addEventListener('dragover', (e) => {
      e.preventDefault();
      box.classList.add('drag-over');
    });

    box.addEventListener('dragleave', () => {
      box.classList.remove('drag-over');
    });

    box.addEventListener('drop', async (e) => {
      e.preventDefault();
      box.classList.remove('drag-over');
      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
        await this.loadAudioFile(e.dataTransfer.files[0]);
        overlay.classList.add('hidden');
      }
    });
  }

  private async loadAudioFile(file: File): Promise<void> {
    const buffer = await this.audioEngine.loadAudio(file);
    this.waveformData = buffer.getChannelData(0);
    this.waveformDirty = true;
    this.beatEditor.setDuration(buffer.duration);
    this.beatEditor.setWaveformData(this.waveformData);
    this.renderStaticWaveform();
  }

  private setupTransport(): void {
    const playBtn = document.getElementById('playBtn')!;
    const stopBtn = document.getElementById('stopBtn')!;

    playBtn.addEventListener('click', () => {
      if (this.audioEngine.isPlaying) {
        this.audioEngine.pause();
        playBtn.classList.remove('playing');
        playBtn.innerHTML = '&#9654;';
      } else {
        this.audioEngine.play();
        playBtn.classList.add('playing');
        playBtn.innerHTML = '&#10074;&#10074;';
      }
    });

    stopBtn.addEventListener('click', () => {
      this.audioEngine.stop();
      playBtn.classList.remove('playing');
      playBtn.innerHTML = '&#9654;';
    });
  }

  private setupZoom(): void {
    const zoomIn = document.getElementById('zoomIn')!;
    const zoomOut = document.getElementById('zoomOut')!;
    const zoomLabel = document.getElementById('zoomLevel')!;

    zoomIn.addEventListener('click', () => {
      const newZoom = Math.min(8, this.beatEditor.getZoom() * 1.5);
      this.beatEditor.setZoom(newZoom);
      zoomLabel.textContent = newZoom.toFixed(1) + 'x';
    });

    zoomOut.addEventListener('click', () => {
      const newZoom = Math.max(0.5, this.beatEditor.getZoom() / 1.5);
      this.beatEditor.setZoom(newZoom);
      zoomLabel.textContent = newZoom.toFixed(1) + 'x';
    });
  }

  private setupAudioProgress(): void {
    this.audioEngine.onProgress((time) => {
      this.beatEditor.setCurrentTime(time);
      this.updateTimecode(time);
    });
  }

  private setupEffectPanel(): void {
    this.effectPanel.onParamChange((params) => {
      this.visualizer.setParams(params);
    });

    this.effectPanel.onModeChange((mode) => {
      this.currentMode = mode;
      this.visualizer.setParams({ mode });
    });
  }

  private setupCanvasMouseEvents(): void {
    const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.visualizer.handleMouseMove(e.clientX - rect.left, e.clientY - rect.top);
    });

    canvas.addEventListener('mouseleave', () => {
      this.visualizer.handleMouseLeave();
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.visualizer.handleMouseClick(e.clientX - rect.left, e.clientY - rect.top);
    });

    const beatCanvas = document.getElementById('beatCanvas') as HTMLCanvasElement;
    beatCanvas.addEventListener('click', (e) => {
      const rect = beatCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const dpr = window.devicePixelRatio || 1;
      const w = beatCanvas.width / dpr;
      const visDur = this.beatEditor.getZoom() > 0 ? this.audioEngine.duration / this.beatEditor.getZoom() : this.audioEngine.duration;
      const time = (x / w) * visDur;
      if (time >= 0 && time <= this.audioEngine.duration) {
        this.audioEngine.seekTo(time);
      }
    });
  }

  private updateTimecode(time: number): void {
    const el = document.getElementById('timecode')!;
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 1000);
    el.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  private renderStaticWaveform(): void {
    if (this.waveformData.length === 0) return;
    this.waveformDirty = false;

    const dpr = window.devicePixelRatio || 1;
    const w = this.waveformCanvas.width / dpr;
    const h = this.waveformCanvas.height / dpr;

    this.waveformOffCtx.clearRect(0, 0, w * dpr, h * dpr);
    this.waveformOffCtx.save();
    this.waveformOffCtx.scale(dpr, dpr);

    const mid = h / 2;
    const step = Math.ceil(this.waveformData.length / w);

    this.waveformOffCtx.fillStyle = 'rgba(80, 80, 100, 0.5)';
    this.waveformOffCtx.beginPath();
    this.waveformOffCtx.moveTo(0, mid);

    for (let x = 0; x < w; x++) {
      const idx = Math.floor((x / w) * this.waveformData.length);
      let min = 1, max = -1;
      for (let j = 0; j < step && idx + j < this.waveformData.length; j++) {
        const val = this.waveformData[idx + j];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      const yMin = mid + min * mid * 0.9;
      const yMax = mid + max * mid * 0.9;
      this.waveformOffCtx.fillStyle = 'rgba(80, 80, 100, 0.5)';
      this.waveformOffCtx.fillRect(x, yMin, 1, yMax - yMin || 1);
    }

    this.waveformOffCtx.restore();
  }

  private startRenderLoop(): void {
    const tick = () => {
      const freqData = this.audioEngine.getFrequencyData();
      this.visualizer.updateFrequencyData(freqData);
      this.renderWaveform();
      this.beatEditor.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private renderWaveform(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.waveformCanvas.width / dpr;
    const h = this.waveformCanvas.height / dpr;

    this.waveformCtx.save();
    this.waveformCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.waveformCtx.clearRect(0, 0, w, h);

    this.waveformCtx.drawImage(this.waveformOffscreen, 0, 0, w * dpr, h * dpr, 0, 0, w, h);

    if (this.audioEngine.duration > 0) {
      const progress = this.audioEngine.getCurrentTime() / this.audioEngine.duration;
      const playX = progress * w;

      this.waveformCtx.fillStyle = 'rgba(255, 0, 128, 0.12)';
      this.waveformCtx.fillRect(0, 0, playX, h);

      const grad = this.waveformCtx.createLinearGradient(0, 0, playX, 0);
      grad.addColorStop(0, 'rgba(0, 255, 255, 0.08)');
      grad.addColorStop(1, 'rgba(255, 0, 128, 0.15)');
      this.waveformCtx.fillStyle = grad;
      this.waveformCtx.fillRect(0, 0, playX, h);

      this.waveformCtx.strokeStyle = 'rgba(255, 0, 128, 0.8)';
      this.waveformCtx.lineWidth = 2;
      this.waveformCtx.shadowColor = 'rgba(255, 0, 128, 0.6)';
      this.waveformCtx.shadowBlur = 8;
      this.waveformCtx.beginPath();
      this.waveformCtx.moveTo(playX, 0);
      this.waveformCtx.lineTo(playX, h);
      this.waveformCtx.stroke();
      this.waveformCtx.shadowBlur = 0;
    }

    this.waveformCtx.restore();
  }
}

new App();
