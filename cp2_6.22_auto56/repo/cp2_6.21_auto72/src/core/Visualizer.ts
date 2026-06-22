export class Visualizer {
  private waveformCanvas: HTMLCanvasElement | null = null;
  private spectrumCanvas: HTMLCanvasElement | null = null;
  private analyser: AnalyserNode | null = null;
  private waveformData: Uint8Array<ArrayBuffer> | null = null;
  private spectrumData: Uint8Array<ArrayBuffer> | null = null;
  private animationId: number | null = null;
  private isRunning = false;

  constructor() {}

  setAnalyser(analyser: AnalyserNode): void {
    this.analyser = analyser;
    const bufferLength = analyser.frequencyBinCount;
    this.waveformData = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
    this.spectrumData = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
  }

  setWaveformCanvas(canvas: HTMLCanvasElement): void {
    this.waveformCanvas = canvas;
  }

  setSpectrumCanvas(canvas: HTMLCanvasElement): void {
    this.spectrumCanvas = canvas;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clearCanvases();
  }

  private animate = (): void => {
    if (!this.isRunning) return;
    
    this.drawWaveform();
    this.drawSpectrum();
    
    this.animationId = requestAnimationFrame(this.animate);
  };

  private drawWaveform(): void {
    if (!this.waveformCanvas || !this.analyser || !this.waveformData) return;
    
    const canvas = this.waveformCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    const width = canvas.width;
    const height = canvas.height;

    this.analyser.getByteTimeDomainData(this.waveformData);

    ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 2 * dpr;
    ctx.strokeStyle = '#00ff88';
    ctx.shadowBlur = 10 * dpr;
    ctx.shadowColor = '#00ff88';
    ctx.beginPath();

    const sliceWidth = width / this.waveformData.length;
    let x = 0;

    for (let i = 0; i < this.waveformData.length; i++) {
      const v = this.waveformData[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  private drawSpectrum(): void {
    if (!this.spectrumCanvas || !this.analyser || !this.spectrumData) return;
    
    const canvas = this.spectrumCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    const width = canvas.width;
    const height = canvas.height;

    this.analyser.getByteFrequencyData(this.spectrumData);

    ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
    ctx.fillRect(0, 0, width, height);

    const barCount = 64;
    const dataStep = Math.floor(this.spectrumData.length / barCount);
    const barWidth = width / barCount - 2 * dpr;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = this.spectrumData[dataIndex];
      const barHeight = (value / 255) * height;
      
      const x = i * (barWidth + 2 * dpr);
      const y = height - barHeight;

      const gradient = ctx.createLinearGradient(x, height, x, y);
      const ratio = i / barCount;
      
      const r = Math.floor(68 + (255 - 68) * ratio);
      const g = Math.floor(136 + (68 - 136) * ratio);
      const b = Math.floor(255 + (136 - 255) * ratio);
      
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
      gradient.addColorStop(1, `rgb(${r}, ${g}, ${b})`);

      ctx.fillStyle = gradient;
      ctx.shadowBlur = 6 * dpr;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    ctx.shadowBlur = 0;
  }

  private clearCanvases(): void {
    [this.waveformCanvas, this.spectrumCanvas].forEach(canvas => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(10, 10, 15, 1)';
        ctx.fillRect(0, 0, canvas.width || 1, canvas.height || 1);
      }
    });
  }

  destroy(): void {
    this.stop();
    this.waveformCanvas = null;
    this.spectrumCanvas = null;
    this.analyser = null;
    this.waveformData = null;
    this.spectrumData = null;
  }
}

export const visualizer = new Visualizer();
