class WaveformRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private analyser: AnalyserNode | null = null;
  private animationId: number | null = null;
  private dataArray: Uint8Array | null = null;

  init(canvas: HTMLCanvasElement, analyser: AnalyserNode): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyser = analyser;
    this.dataArray = new Uint8Array(analyser.frequencyBinCount);
    this.resize();
  }

  resize(): void {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  start(): void {
    if (this.animationId !== null) return;
    this.render();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private render = (): void => {
    this.animationId = requestAnimationFrame(this.render);
    if (!this.canvas || !this.ctx || !this.analyser || !this.dataArray) return;

    const { width, height } = this.canvas.getBoundingClientRect();
    this.analyser.getByteTimeDomainData(this.dataArray);

    this.ctx.fillStyle = '#0F0F23';
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.lineWidth = 2;

    const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#00D4FF');
    gradient.addColorStop(1, '#00FFAA');
    this.ctx.strokeStyle = gradient;

    this.ctx.beginPath();

    const sliceWidth = width / this.dataArray.length;
    let x = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = gradient;
    this.ctx.globalAlpha = 0.15;
    this.ctx.lineWidth = 6;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
  };

  destroy(): void {
    this.stop();
    this.canvas = null;
    this.ctx = null;
    this.analyser = null;
    this.dataArray = null;
  }
}

export const waveformRenderer = new WaveformRenderer();
