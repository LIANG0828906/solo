export class SpectrogramRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private staticBuffer: AudioBuffer | null = null;
  private isPlaying = false;
  private onSeek: ((time: number) => void) | null = null;
  private getDuration: (() => number) | null = null;
  private getCurrentTime: (() => number) | null = null;
  private isDragging = false;
  private barData: Uint8Array | null = null;

  private readonly BAR_WIDTH = 2;
  private readonly BAR_GAP = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupCanvas();
    this.attachEvents();
  }

  private setupCanvas(): void {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.floor(rect.width);
    this.height = Math.floor(rect.height);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(this.dpr, this.dpr);
      this.ctx.imageSmoothingEnabled = true;
    }
  }

  resize(): void {
    this.setupCanvas();
  }

  setStaticBuffer(buffer: AudioBuffer | null): void {
    this.staticBuffer = buffer;
    if (!buffer) {
      this.clear();
    }
  }

  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
  }

  setOnSeek(cb: (time: number) => void): void {
    this.onSeek = cb;
  }

  setDurationGetter(cb: () => number): void {
    this.getDuration = cb;
  }

  setCurrentTimeGetter(cb: () => number): void {
    this.getCurrentTime = cb;
  }

  draw(data: Uint8Array): void {
    if (!this.ctx) return;
    this.barData = data;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Background grid
    this.drawGrid();

    const totalBarWidth = this.BAR_WIDTH + this.BAR_GAP;
    const maxBars = Math.floor(this.width / totalBarWidth);
    const binCount = data.length;

    // Use log scale to focus on audible frequencies
    const barCount = Math.min(maxBars, 128);
    const lowFreq = 20;
    const highFreq = 20000;
    const sampleRate = 44100;
    const nyquist = sampleRate / 2;

    const bottomPad = 4;
    const graphH = this.height - bottomPad;

    for (let i = 0; i < barCount; i++) {
      const t1 = i / barCount;
      const t2 = (i + 1) / barCount;
      const f1 = lowFreq * Math.pow(highFreq / lowFreq, t1);
      const f2 = lowFreq * Math.pow(highFreq / lowFreq, t2);

      const bin1 = Math.floor((f1 / nyquist) * binCount);
      const bin2 = Math.min(binCount - 1, Math.ceil((f2 / nyquist) * binCount));

      let sum = 0;
      let count = 0;
      for (let b = Math.max(0, bin1); b <= bin2; b++) {
        sum += data[b];
        count++;
      }
      const avg = count > 0 ? sum / count : 0;
      const norm = avg / 255;
      const h = Math.max(1, norm * graphH);

      const x = i * totalBarWidth;
      const y = this.height - bottomPad - h;

      // Gradient from blue (bottom) to red (top)
      const grad = this.ctx.createLinearGradient(0, y + h, 0, y);
      grad.addColorStop(0, this.getColorForHeight(norm, 0));
      grad.addColorStop(0.5, this.getColorForHeight(norm, 0.5));
      grad.addColorStop(1, this.getColorForHeight(norm, 1));

      this.ctx.fillStyle = grad;
      this.ctx.fillRect(x, y, this.BAR_WIDTH, h);

      // Glow effect for loud bars
      if (norm > 0.7) {
        this.ctx.save();
        this.ctx.globalAlpha = (norm - 0.7) * 1.5;
        this.ctx.shadowBlur = 6;
        this.ctx.shadowColor = this.getColorForHeight(norm, 1);
        this.ctx.fillRect(x, y, this.BAR_WIDTH, h);
        this.ctx.restore();
      }
    }

    // Playhead
    if (this.getCurrentTime && this.getDuration && this.staticBuffer) {
      const ct = this.getCurrentTime();
      const dur = this.getDuration();
      if (dur > 0) {
        const px = (ct / dur) * this.width;
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(px, 0);
        this.ctx.lineTo(px, this.height);
        this.ctx.stroke();
        this.ctx.restore();
      }
    }
  }

  private drawGrid(): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = 'rgba(85, 85, 85, 0.2)';
    this.ctx.lineWidth = 1;

    // Horizontal lines at -3dB, -6dB, -12dB
    const levels = [0.125, 0.25, 0.5, 0.75];
    for (const lvl of levels) {
      const y = this.height - lvl * (this.height - 4);
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }

    // Vertical lines
    this.ctx.strokeStyle = 'rgba(85, 85, 85, 0.1)';
    for (let i = 1; i < 8; i++) {
      const x = (this.width / 8) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
  }

  private getColorForHeight(intensity: number, position: number): string {
    // position: 0 = bottom (blue), 1 = top (red)
    // Hue shift: blue ~240 to red ~0
    const baseHue = 240;
    const targetHue = 0;
    const hue = baseHue + (targetHue - baseHue) * position;

    const saturation = 80 + intensity * 20;
    const lightness = 45 + intensity * 20;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  clear(): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawGrid();
  }

  private attachEvents(): void {
    let downX = -1;

    const toTime = (clientX: number): number | null => {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      if (!this.getDuration) return null;
      const dur = this.getDuration();
      return Math.max(0, Math.min(dur, (x / rect.width) * dur));
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.staticBuffer) return;
      this.isDragging = true;
      downX = e.clientX;
      const t = toTime(e.clientX);
      if (t !== null && this.onSeek) this.onSeek(t);
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const t = toTime(e.clientX);
      if (t !== null && this.onSeek) this.onSeek(t);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.staticBuffer || !e.touches[0]) return;
      this.isDragging = true;
      const t = toTime(e.touches[0].clientX);
      if (t !== null && this.onSeek) this.onSeek(t);
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || !e.touches[0]) return;
      const t = toTime(e.touches[0].clientX);
      if (t !== null && this.onSeek) this.onSeek(t);
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  getWidth(): number { return this.width; }
  getHeight(): number { return this.height; }
}
