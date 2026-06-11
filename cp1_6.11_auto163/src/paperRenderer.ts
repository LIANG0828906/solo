import { FoldEngine, Point, Polygon } from './foldEngine';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class PaperRenderer {
  private ctx: CanvasRenderingContext2D;
  private engine: FoldEngine;
  private canvas: HTMLCanvasElement;
  private particles: Particle[] = [];
  private maxParticles: number = 20;
  private lastParticleTime: number = 0;
  private paperTextureCanvas: HTMLCanvasElement | null = null;
  private audioContext: AudioContext | null = null;

  constructor(canvas: HTMLCanvasElement, engine: FoldEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.engine = engine;
    this.createPaperTexture();
  }

  private createPaperTexture(): void {
    this.paperTextureCanvas = document.createElement('canvas');
    this.paperTextureCanvas.width = 512;
    this.paperTextureCanvas.height = 512;
    const texCtx = this.paperTextureCanvas.getContext('2d')!;

    texCtx.fillStyle = '#F5F0E1';
    texCtx.fillRect(0, 0, 512, 512);

    const imageData = texCtx.getImageData(0, 0, 512, 512);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 0.9));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.8));
      data[i + 3] = 255;
    }

    texCtx.putImageData(imageData, 0, 0);

    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const len = 10 + Math.random() * 30;
      const angle = Math.random() * Math.PI;
      
      texCtx.strokeStyle = `rgba(200, 180, 150, ${0.03 + Math.random() * 0.05})`;
      texCtx.lineWidth = 0.5 + Math.random() * 1;
      texCtx.beginPath();
      texCtx.moveTo(x, y);
      texCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      texCtx.stroke();
    }
  }

  public render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawPaperShadow();
    this.drawPaper();
    this.drawCreases();
    this.updateAndDrawParticles();
  }

  private drawPaperShadow(): void {
    const polygons = this.engine.getPolygons();
    const ctx = this.ctx;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 5;

    for (const poly of polygons) {
      if (poly.points.length < 3) continue;
      
      ctx.beginPath();
      ctx.moveTo(poly.points[0].x, poly.points[0].y);
      for (let i = 1; i < poly.points.length; i++) {
        ctx.lineTo(poly.points[i].x, poly.points[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fill();
    }

    ctx.restore();
  }

  private drawPaper(): void {
    const polygons = this.engine.getPolygons();
    const ctx = this.ctx;

    for (const poly of polygons) {
      this.drawPolygon(poly);
    }
  }

  private drawPolygon(poly: Polygon): void {
    if (poly.points.length < 3) return;

    const ctx = this.ctx;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(poly.points[0].x, poly.points[0].y);
    for (let i = 1; i < poly.points.length; i++) {
      ctx.lineTo(poly.points[i].x, poly.points[i].y);
    }
    ctx.closePath();
    ctx.clip();

    const centerX = poly.points.reduce((sum, p) => sum + p.x, 0) / poly.points.length;
    const centerY = poly.points.reduce((sum, p) => sum + p.y, 0) / poly.points.length;

    const rotationY = this.engine.getRotationY();
    const dx = centerX - this.engine.getPaperCenter().x;
    const lightFactor = 0.6 + 0.4 * (1 - Math.abs(dx) / (this.engine.getPaperSize() * 0.6)) * (0.7 + 0.3 * Math.cos(rotationY));

    const baseColor = poly.isFront ? '#F5F0E1' : '#E0D4BE';
    const shadowColor = '#B8A080';
    const highlightColor = '#FFF8EA';

    const foldShade = Math.abs(Math.sin(poly.foldAngle)) * 0.3;

    const gradient = ctx.createLinearGradient(
      centerX - 150, centerY - 50,
      centerX + 150, centerY + 50
    );

    const r1 = parseInt(baseColor.slice(1, 3), 16);
    const g1 = parseInt(baseColor.slice(3, 5), 16);
    const b1 = parseInt(baseColor.slice(5, 7), 16);
    const r2 = parseInt(shadowColor.slice(1, 3), 16);
    const g2 = parseInt(shadowColor.slice(3, 5), 16);
    const b2 = parseInt(shadowColor.slice(5, 7), 16);
    const r3 = parseInt(highlightColor.slice(1, 3), 16);
    const g3 = parseInt(highlightColor.slice(3, 5), 16);
    const b3 = parseInt(highlightColor.slice(5, 7), 16);

    const shade = Math.min(1, Math.max(0, lightFactor - foldShade));
    
    const highlightR = Math.round(r3 * 0.3 + r1 * 0.7);
    const highlightG = Math.round(g3 * 0.3 + g1 * 0.7);
    const highlightB = Math.round(b3 * 0.3 + b1 * 0.7);
    
    const midR = Math.round(r1 * shade + r2 * (1 - shade) * 0.5);
    const midG = Math.round(g1 * shade + g2 * (1 - shade) * 0.5);
    const midB = Math.round(b1 * shade + b2 * (1 - shade) * 0.5);
    
    const shadowR = Math.round(r1 * (shade * 0.7) + r2 * (1 - shade * 0.7));
    const shadowG = Math.round(g1 * (shade * 0.7) + g2 * (1 - shade * 0.7));
    const shadowB = Math.round(b1 * (shade * 0.7) + b2 * (1 - shade * 0.7));

    gradient.addColorStop(0, `rgb(${highlightR}, ${highlightG}, ${highlightB})`);
    gradient.addColorStop(0.4, `rgb(${midR}, ${midG}, ${midB})`);
    gradient.addColorStop(1, `rgb(${shadowR}, ${shadowG}, ${shadowB})`);

    ctx.fillStyle = gradient;
    ctx.fill();

    if (this.paperTextureCanvas) {
      ctx.globalAlpha = 0.08;
      const pattern = ctx.createPattern(this.paperTextureCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    this.drawCornerTint(poly);

    ctx.restore();

    this.drawPaperEdge(poly);
  }

  private drawCornerTint(poly: Polygon): void {
    const ctx = this.ctx;
    const corners = this.getCorners(poly);
    
    for (const corner of corners) {
      const gradient = ctx.createRadialGradient(
        corner.x, corner.y, 0,
        corner.x, corner.y, 40
      );
      gradient.addColorStop(0, 'rgba(232, 213, 183, 0.35)');
      gradient.addColorStop(1, 'rgba(232, 213, 183, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 40, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private getCorners(poly: Polygon): Point[] {
    const corners: Point[] = [];
    const points = poly.points;
    
    for (let i = 0; i < points.length; i++) {
      const prev = points[(i - 1 + points.length) % points.length];
      const curr = points[i];
      const next = points[(i + 1) % points.length];
      
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      let angleDiff = Math.abs(angle2 - angle1);
      
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      if (angleDiff > 0.25) {
        corners.push(curr);
      }
    }
    
    return corners;
  }

  private drawPaperEdge(poly: Polygon): void {
    if (poly.points.length < 3) return;

    const ctx = this.ctx;
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(poly.points[0].x, poly.points[0].y);
    for (let i = 1; i < poly.points.length; i++) {
      ctx.lineTo(poly.points[i].x, poly.points[i].y);
    }
    ctx.closePath();

    ctx.strokeStyle = 'rgba(139, 111, 71, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  private drawCreases(): void {
    const creases = this.engine.getCreases();
    const polygons = this.engine.getPolygons();
    const ctx = this.ctx;

    if (creases.length === 0) return;

    ctx.save();

    ctx.beginPath();
    for (const poly of polygons) {
      if (poly.points.length < 3) continue;
      ctx.moveTo(poly.points[0].x, poly.points[0].y);
      for (let i = 1; i < poly.points.length; i++) {
        ctx.lineTo(poly.points[i].x, poly.points[i].y);
      }
      ctx.closePath();
    }
    ctx.clip();

    for (const crease of creases) {
      ctx.save();
      
      if (crease.solid) {
        ctx.strokeStyle = '#6B5030';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.6;
      } else {
        ctx.strokeStyle = '#8B6F47';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.8;
      }

      ctx.beginPath();
      ctx.moveTo(crease.p1.x, crease.p1.y);
      ctx.lineTo(crease.p2.x, crease.p2.y);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  private updateAndDrawParticles(): void {
    const now = performance.now();

    if (this.engine.isFolding() && now - this.lastParticleTime > 100 && this.particles.length < this.maxParticles) {
      this.spawnParticle();
      this.lastParticleTime = now;
    }

    const ctx = this.ctx;
    const aliveParticles: Particle[] = [];

    for (const particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.02;
      particle.life -= 16;

      if (particle.life > 0) {
        particle.alpha = (particle.life / particle.maxLife) * 0.5;
        aliveParticles.push(particle);

        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = '#E8D5B7';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    this.particles = aliveParticles;
  }

  private spawnParticle(): void {
    const paperCenter = this.engine.getPaperCenter();
    const paperSize = this.engine.getPaperSize();
    const halfSize = paperSize / 2;

    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;

    switch (side) {
      case 0:
        x = paperCenter.x - halfSize + Math.random() * paperSize;
        y = paperCenter.y - halfSize;
        break;
      case 1:
        x = paperCenter.x + halfSize;
        y = paperCenter.y - halfSize + Math.random() * paperSize;
        break;
      case 2:
        x = paperCenter.x - halfSize + Math.random() * paperSize;
        y = paperCenter.y + halfSize;
        break;
      default:
        x = paperCenter.x - halfSize;
        y = paperCenter.y - halfSize + Math.random() * paperSize;
        break;
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 1;

    this.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      size: 1 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.3,
      life: 2000,
      maxLife: 2000
    });
  }

  public playFoldSound(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = this.audioContext;
    const duration = 0.3;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      
      let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;

      const envelope = i < bufferSize * 0.1
        ? i / (bufferSize * 0.1)
        : 1 - (i - bufferSize * 0.1) / (bufferSize * 0.9);

      data[i] = pink * 0.15 * envelope;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.15;
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    source.start();
  }

  public reset(): void {
    this.particles = [];
  }
}
