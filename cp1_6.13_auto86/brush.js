export class Brush {
  constructor() {
    this.minRadius = 3;
    this.maxRadius = 30;
    this.minOpacity = 0.5;
    this.maxOpacity = 1;
    this.ink = 100;
    this.maxInk = 100;
    this.inkDecayRate = 0.05;
    this.drawing = false;
    this.lastPoint = null;
    this.currentPoint = null;
    this.velocity = 0;
    this.color = '#000000';
    this.tool = 'brush';
    this.trail = [];
    this.maxTrailLength = 20;
    this.recovering = false;
  }

  setColor(color) {
    this.color = color;
  }

  setTool(tool) {
    this.tool = tool;
  }

  startDrawing(x, y) {
    if (this.ink <= 0 && this.tool === 'brush') return;
    this.drawing = true;
    this.lastPoint = { x, y };
    this.currentPoint = { x, y };
    this.velocity = 0;
    this.trail = [{ x, y, timestamp: Date.now() }];
  }

  updateDrawing(x, y) {
    if (!this.drawing) return;
    
    const now = Date.now();
    this.currentPoint = { x, y };
    
    const lastTrail = this.trail[this.trail.length - 1];
    const timeDelta = now - lastTrail.timestamp;
    const dx = x - lastTrail.x;
    const dy = y - lastTrail.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (timeDelta > 0) {
      this.velocity = distance / timeDelta * 1000;
    }
    
    this.trail.push({ x, y, timestamp: now });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    
    if (this.tool === 'brush') {
      this.ink = Math.max(0, this.ink - distance * this.inkDecayRate);
    }
    
    this.lastPoint = { x, y };
  }

  endDrawing() {
    if (!this.drawing) return;
    this.drawing = false;
    const trail = [...this.trail];
    this.trail = [];
    return trail;
  }

  getBrushParams() {
    const maxVelocity = 500;
    const normalizedVelocity = Math.min(this.velocity / maxVelocity, 1);
    
    const radius = this.maxRadius - (this.maxRadius - this.minRadius) * normalizedVelocity;
    let opacity = this.maxOpacity - (this.maxOpacity - this.minOpacity) * normalizedVelocity;
    
    if (this.ink < 20 && this.tool === 'brush') {
      opacity *= (this.ink / 20);
    }
    
    return { radius, opacity };
  }

  draw(ctx, x, y, isEnd = false) {
    if (!this.drawing && !isEnd) return;
    
    const { radius, opacity } = this.getBrushParams();
    
    if (this.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacity;
      ctx.fillStyle = this.color;
    }
    
    if (isEnd && this.trail.length > 1) {
      this.drawTrailEnd(ctx);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  drawTrailEnd(ctx) {
    if (this.trail.length < 2) return;
    
    const totalLength = this.trail.length;
    
    for (let i = 1; i < totalLength; i++) {
      const progress = i / totalLength;
      const startPoint = this.trail[i - 1];
      const endPoint = this.trail[i];
      
      const startRadius = this.getBrushParams().radius * (1 - progress * 0.7);
      const endRadius = this.getBrushParams().radius * (1 - (i + 1) / totalLength * 0.7);
      
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 1) continue;
      
      const steps = Math.max(1, Math.floor(distance / 2));
      
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        const x = startPoint.x + dx * t;
        const y = startPoint.y + dy * t;
        const radius = startRadius + (endRadius - startRadius) * t;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const lastPoint = this.trail[this.trail.length - 1];
    const finalRadius = this.getBrushParams().radius * 0.1;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, finalRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  canDraw() {
    return this.ink > 0 || this.tool !== 'brush';
  }

  dipInk() {
    if (this.recovering) return;
    
    this.recovering = true;
    const startInk = this.ink;
    const targetInk = this.maxInk;
    const duration = 300;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = 1 - Math.pow(1 - progress, 3);
      this.ink = startInk + (targetInk - startInk) * eased;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.ink = targetInk;
        this.recovering = false;
      }
    };
    
    requestAnimationFrame(animate);
  }

  getInkLevel() {
    return this.ink;
  }
}