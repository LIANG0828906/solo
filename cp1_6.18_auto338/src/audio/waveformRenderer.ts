export class WaveformRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private peaks: number[] = [];
  private color: string = '#FF6B6B';
  private clipStart: number = 0;
  private clipEnd: number = 1;
  private duration: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  setColor(color: string): void {
    this.color = color;
    this.render();
  }

  setClipRange(start: number, end: number, duration: number): void {
    this.clipStart = start;
    this.clipEnd = end;
    this.duration = duration;
    this.render();
  }

  loadAudioBuffer(buffer: AudioBuffer): void {
    const channelData = buffer.getChannelData(0);
    const samples = 500;
    const blockSize = Math.floor(channelData.length / samples);
    const peaks: number[] = [];

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let max = 0;

      for (let j = 0; j < blockSize; j++) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }

      peaks.push(max);
    }

    this.peaks = peaks;
    this.duration = buffer.duration;
    this.clipEnd = buffer.duration;
    this.render();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.render();
  }

  render(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    this.ctx.fillStyle = '#2D2D2D';
    this.ctx.fillRect(0, 0, width, height);

    if (this.peaks.length === 0) return;

    const centerY = height / 2;
    const barWidth = width / this.peaks.length;

    const clipStartX = this.duration > 0 ? (this.clipStart / this.duration) * width : 0;
    const clipEndX = this.duration > 0 ? (this.clipEnd / this.duration) * width : width;

    this.ctx.fillStyle = this.color + '4D';
    this.ctx.fillRect(clipStartX, 0, clipEndX - clipStartX, height);

    for (let i = 0; i < this.peaks.length; i++) {
      const x = i * barWidth;
      const peakHeight = this.peaks[i] * centerY * 0.9;

      this.ctx.fillStyle = this.color + '99';
      this.ctx.fillRect(x, centerY - peakHeight, barWidth - 0.5, peakHeight * 2);
    }

    if (this.duration > 0) {
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;

      this.ctx.beginPath();
      this.ctx.moveTo(clipStartX, 0);
      this.ctx.lineTo(clipStartX, height);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(clipEndX, 0);
      this.ctx.lineTo(clipEndX, height);
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(clipStartX - 4, height / 2 - 10, 8, 20);
      this.ctx.fillRect(clipEndX - 4, height / 2 - 10, 8, 20);
    }
  }

  getClipPositionFromX(x: number): number {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const ratio = Math.max(0, Math.min(1, x / width));
    return ratio * this.duration;
  }

  clear(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    this.ctx.fillStyle = '#2D2D2D';
    this.ctx.fillRect(0, 0, width, height);
  }
}
