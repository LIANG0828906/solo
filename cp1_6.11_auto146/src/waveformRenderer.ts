export interface WaveformRendererOptions {
  scrollSpeed?: number;
}

export class WaveformRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private pixelOffset = 0;
  private lastDrawTime = 0;
  private staticBuffer: AudioBuffer | null = null;
  private isPlaying = false;
  private onSeek: ((time: number) => void) | null = null;
  private getDuration: (() => number) | null = null;
  private getCurrentTime: (() => number) | null = null;
  private scrollSpeed: number;
  private isDragging = false;
  private fullWaveformCanvas: HTMLCanvasElement | null = null;
  private needsFullRedraw = true;

  constructor(canvas: HTMLCanvasElement, options: WaveformRendererOptions = {}) {
    this.canvas = canvas;
    this.scrollSpeed = options.scrollSpeed ?? (1 / 60);
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

    this.needsFullRedraw = true;
  }

  resize(): void {
    this.setupCanvas();
    this.needsFullRedraw = true;
    if (this.staticBuffer) {
      this.buildFullWaveform();
    }
  }

  setStaticBuffer(buffer: AudioBuffer | null): void {
    this.staticBuffer = buffer;
    this.pixelOffset = 0;
    this.needsFullRedraw = true;
    if (buffer) {
      this.buildFullWaveform();
    } else {
      this.fullWaveformCanvas = null;
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

  private buildFullWaveform(): void {
    if (!this.staticBuffer || this.width <= 0) return;

    const offline = document.createElement('canvas');
    offline.width = this.width * this.dpr;
    offline.height = this.height * this.dpr;
    const octx = offline.getContext('2d');
    if (!octx) return;
    octx.scale(this.dpr, this.dpr);

    this.drawStaticWaveform(octx, this.staticBuffer);
    this.fullWaveformCanvas = offline;
    this.needsFullRedraw = false;
  }

  private drawStaticWaveform(ctx: CanvasRenderingContext2D, buffer: AudioBuffer): void {
    const channels = buffer.numberOfChannels;
    const sampleCount = buffer.length;
    const samplesPerPixel = Math.max(1, Math.floor(sampleCount / this.width));

    const centerY = this.height / 2;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(85, 85, 85, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(this.width, centerY);
    ctx.stroke();

    // Vertical grid lines - every 1/5th of width
    ctx.strokeStyle = 'rgba(85, 85, 85, 0.15)';
    for (let i = 1; i < 5; i++) {
      const x = (this.width / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    // Positive gradient (cyan to purple)
    const posGrad = ctx.createLinearGradient(0, 0, 0, centerY);
    posGrad.addColorStop(0, '#7b2ff7');
    posGrad.addColorStop(1, '#00d4ff');

    // Negative gradient (red to orange)
    const negGrad = ctx.createLinearGradient(0, centerY, 0, this.height);
    negGrad.addColorStop(0, '#ff6b6b');
    negGrad.addColorStop(1, '#ffa502');

    const positivePath = new Path2D();
    const negativePath = new Path2D();
    let firstPos = true;
    let firstNeg = true;

    for (let x = 0; x < this.width; x++) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, sampleCount);

      let minSum = 0;
      let maxSum = 0;

      for (let ch = 0; ch < channels; ch++) {
        const data = buffer.getChannelData(ch);
        let minVal = 1;
        let maxVal = -1;
        for (let s = startSample; s < endSample; s++) {
          const v = data[s];
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
        }
        minSum += minVal;
        maxSum += maxVal;
      }

      const maxVal = maxSum / channels;
      const minVal = minSum / channels;

      const posH = Math.max(0, maxVal) * (centerY - 4);
      const negH = Math.max(0, -minVal) * (centerY - 4);

      if (posH > 0) {
        const y = centerY - posH;
        if (firstPos) {
          positivePath.moveTo(x, centerY);
          positivePath.lineTo(x, y);
          firstPos = false;
        } else {
          positivePath.lineTo(x, y);
        }
      } else if (!firstPos) {
        positivePath.lineTo(x, centerY);
      }

      if (negH > 0) {
        const y = centerY + negH;
        if (firstNeg) {
          negativePath.moveTo(x, centerY);
          negativePath.lineTo(x, y);
          firstNeg = false;
        } else {
          negativePath.lineTo(x, y);
        }
      } else if (!firstNeg) {
        negativePath.lineTo(x, centerY);
      }
    }

    // Close paths
    if (!firstPos) {
      positivePath.lineTo(this.width, centerY);
      positivePath.lineTo(0, centerY);
    }
    if (!firstNeg) {
      negativePath.lineTo(this.width, centerY);
      negativePath.lineTo(0, centerY);
    }

    ctx.fillStyle = posGrad;
    ctx.fill(positivePath);
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.2;
    ctx.stroke(positivePath);

    ctx.fillStyle = negGrad;
    ctx.fill(negativePath);
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 1.2;
    ctx.stroke(negativePath);
  }

  private drawRealtimeOverlay(liveData: Float32Array): void {
    if (!this.ctx) return;
    const centerY = this.height / 2;

    // Rightmost ~50px for realtime overlay scrolling in
    const overlayWidth = Math.min(50, this.width);
    const startX = this.width - overlayWidth;

    this.ctx.save();
    this.ctx.globalAlpha = 0.8;

    const posGrad = this.ctx.createLinearGradient(0, 0, 0, centerY);
    posGrad.addColorStop(0, '#7b2ff7');
    posGrad.addColorStop(1, '#00d4ff');

    const negGrad = this.ctx.createLinearGradient(0, centerY, 0, this.height);
    negGrad.addColorStop(0, '#ff6b6b');
    negGrad.addColorStop(1, '#ffa502');

    const step = Math.max(1, Math.floor(liveData.length / overlayWidth));
    const samplesPerPx = Math.max(1, Math.floor(liveData.length / overlayWidth));

    for (let px = 0; px < overlayWidth; px++) {
      const sStart = px * samplesPerPx;
      const sEnd = Math.min(sStart + samplesPerPx, liveData.length);

      let minV = 1;
      let maxV = -1;
      for (let s = sStart; s < sEnd; s += step) {
        const v = liveData[s];
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }

      const x = startX + px;
      const posH = Math.max(0, maxV) * (centerY - 4);
      const negH = Math.max(0, -minV) * (centerY - 4);

      if (posH > 0) {
        this.ctx.strokeStyle = posGrad;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x, centerY);
        this.ctx.lineTo(x, centerY - posH);
        this.ctx.stroke();
      }
      if (negH > 0) {
        this.ctx.strokeStyle = negGrad;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x, centerY);
        this.ctx.lineTo(x, centerY + negH);
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  draw(liveData?: Float32Array): void {
    if (!this.ctx) return;
    const now = performance.now();

    if (this.needsFullRedraw && this.fullWaveformCanvas) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.drawImage(this.fullWaveformCanvas, 0, 0, this.width * this.dpr, this.height * this.dpr, 0, 0, this.width, this.height);
      this.needsFullRedraw = false;
    }

    // Scroll behavior for scrolling waveform
    if (this.isPlaying && liveData) {
      const elapsed = now - this.lastDrawTime;
      const pixelsPerFrame = this.scrollSpeed * 60;
      this.pixelOffset += (elapsed / 1000) * pixelsPerFrame * 60;

      if (this.pixelOffset >= 1) {
        const shift = Math.floor(this.pixelOffset);
        this.pixelOffset -= shift;

        // Shift existing content left
        this.ctx.save();
        const shiftWidth = Math.max(0, this.width - shift);
        this.ctx.globalCompositeOperation = 'copy';
        this.ctx.drawImage(this.canvas, shift * this.dpr, 0, shiftWidth * this.dpr, this.height * this.dpr, 0, 0, shiftWidth, this.height);
        this.ctx.restore();

        // Clear rightmost column
        this.ctx.clearRect(this.width - shift, 0, shift, this.height);

        // Also update the full waveform cached view to match
        if (this.fullWaveformCanvas) {
          this.needsFullRedraw = true;
          requestAnimationFrame(() => this.needsFullRedraw = false);
        }
      }
    } else if (!this.staticBuffer) {
      this.clear();
    }

    // Draw playhead
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

        // If we're not scrolling mode, draw the static waveform as reference with playhead
        if (!this.needsFullRedraw) {
          this.ctx.save();
          this.ctx.globalCompositeOperation = 'destination-over';
          // Nothing to do here - static is drawn below
          this.ctx.restore();
        }
      }
    }

    this.lastDrawTime = now;
  }

  redrawStatic(): void {
    this.needsFullRedraw = true;
    if (this.staticBuffer) {
      this.buildFullWaveform();
      if (this.ctx && this.fullWaveformCanvas) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.fullWaveformCanvas, 0, 0, this.width * this.dpr, this.height * this.dpr, 0, 0, this.width, this.height);
      }
    }
  }

  clear(): void {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);

      const centerY = this.height / 2;
      this.ctx.strokeStyle = 'rgba(85, 85, 85, 0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, centerY);
      this.ctx.lineTo(this.width, centerY);
      this.ctx.stroke();
    }
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

    // Touch
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
