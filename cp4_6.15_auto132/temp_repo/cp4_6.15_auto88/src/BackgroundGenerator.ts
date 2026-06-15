import { v4 as uuidv4 } from 'uuid';

export type BackgroundStyle = 'gradient' | 'office' | 'beach' | 'starry' | 'geometric';

export interface BackgroundTemplate {
  id: string;
  name: string;
  style: BackgroundStyle;
  thumbnail: string;
}

class BackgroundGenerator {
  private presets: BackgroundTemplate[] = [
    { id: uuidv4(), name: '纯色渐变', style: 'gradient', thumbnail: this.generateGradientThumbnail('#667eea', '#764ba2') },
    { id: uuidv4(), name: '办公室场景', style: 'office', thumbnail: this.generateOfficeThumbnail() },
    { id: uuidv4(), name: '热带海滩', style: 'beach', thumbnail: this.generateBeachThumbnail() },
    { id: uuidv4(), name: '星空极光', style: 'starry', thumbnail: this.generateStarryThumbnail() },
    { id: uuidv4(), name: '抽象几何', style: 'geometric', thumbnail: this.generateGeometricThumbnail() }
  ];

  private generateGradientThumbnail(color1: string, color2: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 160, 90);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 160, 90);
    return canvas.toDataURL();
  }

  private generateOfficeThumbnail(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 90);
    gradient.addColorStop(0, '#3a4a5c');
    gradient.addColorStop(1, '#2c3e50');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 160, 90);
    
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 70, 160, 20);
    
    ctx.fillStyle = '#5dade2';
    ctx.fillRect(80, 40, 50, 35);
    
    ctx.fillStyle = '#aab7b8';
    ctx.fillRect(20, 50, 30, 25);
    
    return canvas.toDataURL();
  }

  private generateBeachThumbnail(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d')!;
    
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 45);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, 160, 45);
    
    const seaGradient = ctx.createLinearGradient(0, 45, 0, 65);
    seaGradient.addColorStop(0, '#4FC3F7');
    seaGradient.addColorStop(1, '#0288D1');
    ctx.fillStyle = seaGradient;
    ctx.fillRect(0, 45, 160, 20);
    
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(0, 65, 160, 25);
    
    ctx.beginPath();
    ctx.arc(130, 20, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD54F';
    ctx.fill();
    
    return canvas.toDataURL();
  }

  private generateStarryThumbnail(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 90);
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(0.5, '#1a1a4a');
    gradient.addColorStop(1, '#2a1a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 160, 90);
    
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 160;
      const y = Math.random() * 90;
      const size = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
      ctx.fill();
    }
    
    const auroraGradient = ctx.createLinearGradient(0, 0, 160, 90);
    auroraGradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
    auroraGradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.3)');
    auroraGradient.addColorStop(1, 'rgba(136, 0, 255, 0.3)');
    ctx.fillStyle = auroraGradient;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(40, 10, 80, 25);
    ctx.quadraticCurveTo(120, 40, 160, 20);
    ctx.lineTo(160, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    
    return canvas.toDataURL();
  }

  private generateGeometricThumbnail(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 90;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 160, 90);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(1, '#2a5298');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 160, 90);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * 30;
      const y = 20 + (i % 3) * 25;
      const size = 15 + Math.random() * 10;
      
      ctx.beginPath();
      if (i % 2 === 0) {
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x + size / 2, y + size / 2);
        ctx.lineTo(x - size / 2, y + size / 2);
      } else {
        ctx.rect(x - size / 2, y - size / 2, size, size);
      }
      ctx.closePath();
      ctx.stroke();
    }
    
    return canvas.toDataURL();
  }

  getPresetTemplates(): BackgroundTemplate[] {
    return this.presets;
  }

  async generateByStyle(style: BackgroundStyle, width: number, height: number): Promise<HTMLImageElement> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    switch (style) {
      case 'gradient':
        this.drawGradient(ctx, width, height);
        break;
      case 'office':
        this.drawOffice(ctx, width, height);
        break;
      case 'beach':
        this.drawBeach(ctx, width, height);
        break;
      case 'starry':
        this.drawStarry(ctx, width, height);
        break;
      case 'geometric':
        this.drawGeometric(ctx, width, height);
        break;
    }

    return this.canvasToImage(canvas);
  }

  private drawGradient(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#f093fb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawOffice(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    gradient.addColorStop(0, '#3a4a5c');
    gradient.addColorStop(1, '#2c3e50');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height * 0.7);
    
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, height * 0.7, width, 8);
    
    const windowX = width * 0.6;
    const windowY = height * 0.15;
    const windowW = width * 0.3;
    const windowH = height * 0.4;
    
    const windowGradient = ctx.createLinearGradient(windowX, windowY, windowX, windowY + windowH);
    windowGradient.addColorStop(0, '#87CEEB');
    windowGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = windowGradient;
    ctx.fillRect(windowX, windowY, windowW, windowH);
    
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 6;
    ctx.strokeRect(windowX, windowY, windowW, windowH);
    ctx.beginPath();
    ctx.moveTo(windowX + windowW / 2, windowY);
    ctx.lineTo(windowX + windowW / 2, windowY + windowH);
    ctx.moveTo(windowX, windowY + windowH / 2);
    ctx.lineTo(windowX + windowW, windowY + windowH / 2);
    ctx.stroke();
    
    ctx.fillStyle = '#718096';
    ctx.fillRect(width * 0.08, height * 0.45, width * 0.35, height * 0.08);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(width * 0.08, height * 0.53, width * 0.02, height * 0.17);
    ctx.fillRect(width * 0.41, height * 0.53, width * 0.02, height * 0.17);
    
    ctx.fillStyle = '#a0aec0';
    ctx.fillRect(width * 0.12, height * 0.38, width * 0.22, height * 0.07);
  }

  private drawBeach(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.5);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.7, '#B3E5FC');
    skyGradient.addColorStop(1, '#FFE082');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.5);
    
    const sunX = width * 0.8;
    const sunY = height * 0.25;
    const sunRadius = Math.min(width, height) * 0.08;
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 1.5);
    sunGradient.addColorStop(0, '#FFF59D');
    sunGradient.addColorStop(0.5, '#FFD54F');
    sunGradient.addColorStop(1, 'rgba(255, 213, 79, 0)');
    ctx.fillStyle = sunGradient;
    ctx.fillRect(0, 0, width, height * 0.5);
    
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD54F';
    ctx.fill();
    
    const seaGradient = ctx.createLinearGradient(0, height * 0.5, 0, height * 0.72);
    seaGradient.addColorStop(0, '#4FC3F7');
    seaGradient.addColorStop(0.5, '#0288D1');
    seaGradient.addColorStop(1, '#01579B');
    ctx.fillStyle = seaGradient;
    ctx.fillRect(0, height * 0.5, width, height * 0.22);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const waveY = height * 0.52 + i * 8;
      ctx.beginPath();
      for (let x = 0; x < width; x += 5) {
        const y = waveY + Math.sin((x + Date.now() / 1000) * 0.02) * 3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    
    const sandGradient = ctx.createLinearGradient(0, height * 0.72, 0, height);
    sandGradient.addColorStop(0, '#F5DEB3');
    sandGradient.addColorStop(1, '#DEB887');
    ctx.fillStyle = sandGradient;
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
  }

  private drawStarry(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(0.4, '#1a1a4a');
    gradient.addColorStop(0.7, '#2a1a4a');
    gradient.addColorStop(1, '#1a0a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
      ctx.fill();
    }
    
    const auroraGradient = ctx.createLinearGradient(0, 0, width, height * 0.5);
    auroraGradient.addColorStop(0, 'rgba(0, 255, 136, 0.4)');
    auroraGradient.addColorStop(0.3, 'rgba(0, 200, 255, 0.4)');
    auroraGradient.addColorStop(0.6, 'rgba(136, 0, 255, 0.4)');
    auroraGradient.addColorStop(1, 'rgba(255, 0, 136, 0.3)');
    ctx.fillStyle = auroraGradient;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.1);
    ctx.quadraticCurveTo(width * 0.2, height * 0.02, width * 0.4, height * 0.08);
    ctx.quadraticCurveTo(width * 0.6, height * 0.15, width * 0.8, height * 0.05);
    ctx.quadraticCurveTo(width * 0.9, height * 0.02, width, height * 0.1);
    ctx.lineTo(width, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.15, Math.min(width, height) * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
  }

  private drawGeometric(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(0.5, '#2a5298');
    gradient.addColorStop(1, '#0f2027');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    
    const shapes = [
      { type: 'triangle', x: 0.15, y: 0.2, size: 0.12 },
      { type: 'circle', x: 0.4, y: 0.3, size: 0.1 },
      { type: 'square', x: 0.7, y: 0.15, size: 0.1 },
      { type: 'triangle', x: 0.85, y: 0.5, size: 0.15 },
      { type: 'circle', x: 0.2, y: 0.6, size: 0.08 },
      { type: 'square', x: 0.55, y: 0.7, size: 0.12 },
      { type: 'triangle', x: 0.35, y: 0.85, size: 0.1 },
      { type: 'circle', x: 0.75, y: 0.85, size: 0.09 }
    ];
    
    shapes.forEach((shape, index) => {
      const x = width * shape.x;
      const y = height * shape.y;
      const size = Math.min(width, height) * shape.size;
      
      ctx.fillStyle = `hsla(${index * 45}, 70%, 60%, 0.3)`;
      ctx.strokeStyle = `hsla(${index * 45}, 70%, 60%, 0.6)`;
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      switch (shape.type) {
        case 'triangle':
          ctx.moveTo(x, y - size / 2);
          ctx.lineTo(x + size / 2, y + size / 2);
          ctx.lineTo(x - size / 2, y + size / 2);
          break;
        case 'circle':
          ctx.arc(x, y, size / 2, 0, Math.PI * 2);
          break;
        case 'square':
          ctx.rect(x - size / 2, y - size / 2, size, size);
          break;
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
    
    const lineGradient = ctx.createLinearGradient(0, height / 2, width, height / 2);
    lineGradient.addColorStop(0, 'rgba(233, 69, 96, 0)');
    lineGradient.addColorStop(0.5, 'rgba(233, 69, 96, 0.8)');
    lineGradient.addColorStop(1, 'rgba(233, 69, 96, 0)');
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  async generateFromColor(color: string, width: number, height: number): Promise<HTMLImageElement> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, this.lightenColor(color, 20));
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    this.addParticleEffects(ctx, width, height, color);
    
    return this.canvasToImage(canvas);
  }

  private addParticleEffects(ctx: CanvasRenderingContext2D, width: number, height: number, baseColor: string): void {
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 4 + 1;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(1, `${baseColor}00`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  async generateFromUpload(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = canvas.toDataURL();
    });
  }
}

export const backgroundGenerator = new BackgroundGenerator();
