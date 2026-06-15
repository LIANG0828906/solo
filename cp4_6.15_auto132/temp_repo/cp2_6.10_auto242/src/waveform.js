class WaveformDisplay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bufferSize = 500;
    this.waveformData = new Array(this.bufferSize).fill(0);
    this.maxAmplitude = 1.0;
    this.writeIndex = 0;
    this.color = '#39ff14';
    this.gridColor = 'rgba(57, 255, 20, 0.15)';
    this.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    this.timeScale = 1;
    this.lastUpdateTime = 0;
    this.updateInterval = 16;
    
    this.resize();
    this.setupResizeObserver();
  }

  setupResizeObserver() {
    const observer = new ResizeObserver(() => {
      this.resize();
    });
    observer.observe(this.canvas);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
  }

  addSignal(signalData) {
    const { amplitude } = signalData;
    const normalizedAmplitude = Math.min(amplitude, this.maxAmplitude) / this.maxAmplitude;
    
    this.waveformData[this.writeIndex] = normalizedAmplitude;
    this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
    
    const rippleSize = 5;
    for (let i = 1; i < rippleSize; i++) {
      const ripple = Math.sin((i / rippleSize) * Math.PI) * normalizedAmplitude * 0.3;
      const idx = (this.writeIndex - 1 + this.bufferSize - i) % this.bufferSize;
      this.waveformData[idx] = Math.max(this.waveformData[idx], ripple);
    }
  }

  update() {
    const now = performance.now();
    if (now - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = now;
    
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;
    
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, w, h);
    
    this.drawGrid(ctx, w, h);
    this.drawCenterLine(ctx, w, h);
    this.drawWaveform(ctx, w, h);
    this.drawScaleMarkers(ctx, w, h);
  }

  drawGrid(ctx, w, h) {
    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 1;
    
    const gridRows = 8;
    const gridCols = 6;
    
    for (let i = 0; i <= gridRows; i++) {
      const y = (h / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    for (let i = 0; i <= gridCols; i++) {
      const x = (w / gridCols) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  drawCenterLine(ctx, w, h) {
    const centerY = h / 2;
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawWaveform(ctx, w, h) {
    const centerY = h / 2;
    const maxWaveHeight = h * 0.45;
    const sampleCount = this.waveformData.length;
    const xStep = w / sampleCount;
    
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, 'rgba(57, 255, 20, 0.3)');
    gradient.addColorStop(0.5, '#39ff14');
    gradient.addColorStop(1, 'rgba(57, 255, 20, 0.3)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    for (let i = 0; i < sampleCount; i++) {
      const dataIndex = (this.writeIndex + i) % sampleCount;
      const value = this.waveformData[dataIndex];
      const x = i * xStep;
      const y = centerY + Math.sin(i * 0.3 + performance.now() * 0.002) * value * maxWaveHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    ctx.beginPath();
    for (let i = 0; i < sampleCount; i++) {
      const dataIndex = (this.writeIndex + i) % sampleCount;
      const value = this.waveformData[dataIndex];
      const x = i * xStep;
      const y = centerY - Math.sin(i * 0.3 + performance.now() * 0.002) * value * maxWaveHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    const fillGradient = ctx.createLinearGradient(0, centerY - maxWaveHeight, 0, centerY + maxWaveHeight);
    fillGradient.addColorStop(0, 'rgba(57, 255, 20, 0)');
    fillGradient.addColorStop(0.5, 'rgba(57, 255, 20, 0.1)');
    fillGradient.addColorStop(1, 'rgba(57, 255, 20, 0)');
    
    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    for (let i = 0; i < sampleCount; i++) {
      const dataIndex = (this.writeIndex + i) % sampleCount;
      const value = this.waveformData[dataIndex];
      const x = i * xStep;
      const y = centerY + Math.sin(i * 0.3 + performance.now() * 0.002) * value * maxWaveHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    for (let i = sampleCount - 1; i >= 0; i--) {
      const dataIndex = (this.writeIndex + i) % sampleCount;
      const value = this.waveformData[dataIndex];
      const x = i * xStep;
      const y = centerY - Math.sin(i * 0.3 + performance.now() * 0.002) * value * maxWaveHeight;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    this.waveformData[this.writeIndex] *= 0.95;
  }

  drawScaleMarkers(ctx, w, h) {
    ctx.fillStyle = 'rgba(57, 255, 20, 0.5)';
    ctx.font = '10px monospace';
    
    const rightEdge = w - 5;
    
    ctx.textAlign = 'right';
    ctx.fillText('+1.0', rightEdge, 15);
    ctx.fillText('0', rightEdge, h / 2 + 4);
    ctx.fillText('-1.0', rightEdge, h - 5);
  }

  reset() {
    this.waveformData = new Array(this.bufferSize).fill(0);
    this.writeIndex = 0;
  }

  setColor(color) {
    this.color = color;
    this.gridColor = color.replace(')', ', 0.15)').replace('rgb', 'rgba');
  }
}

export default WaveformDisplay;
