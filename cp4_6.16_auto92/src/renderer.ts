import { Ship, Ore, SpaceDebris, Particle, NebulaLayer, Shockwave } from './entities';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private cameraX: number = 0;
  private cameraY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  setCanvasSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  setCamera(x: number, y: number): void {
    this.cameraX = x;
    this.cameraY = y;
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: wx - this.cameraX + this.canvas.width / 2,
      y: wy - this.cameraY + this.canvas.height / 2
    };
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: sx + this.cameraX - this.canvas.width / 2,
      y: sy + this.cameraY - this.canvas.height / 2
    };
  }

  clear(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(1, '#1a0a3e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawNebula(layers: NebulaLayer[], worldSize: number): void {
    this.ctx.save();
    
    layers.forEach((layer, layerIndex) => {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      
      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(layer.rotation);
      this.ctx.translate(-centerX, -centerY);
      
      layer.blobs.forEach((blob) => {
        const screenPos = this.worldToScreen(blob.x, blob.y);
        
        const gradient = this.ctx.createRadialGradient(
          screenPos.x, screenPos.y, 0,
          screenPos.x, screenPos.y, blob.radius
        );
        gradient.addColorStop(0, blob.color + this.alphaToHex(blob.alpha));
        gradient.addColorStop(1, blob.color + '00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, blob.radius, 0, Math.PI * 2);
        this.ctx.fill();
      });
      
      this.ctx.restore();
    });
    
    this.ctx.restore();
  }

  drawShip(ship: Ship): void {
    const pos = this.worldToScreen(ship.x, ship.y);
    const ctx = this.ctx;
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(ship.angle);
    
    if (ship.invincibleTime > 0 && Math.floor(ship.invincibleTime * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    const gradient = ctx.createRadialGradient(-15, 0, 0, -15, 0, 20);
    gradient.addColorStop(0, '#ffdd00');
    gradient.addColorStop(0.5, '#ff8800');
    gradient.addColorStop(1, 'rgba(255, 136, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(-25 - Math.random() * 10, 0);
    ctx.lineTo(-10, 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#3498db';
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-10, -12);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#74b9ff';
    ctx.beginPath();
    ctx.arc(5, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  drawThrusterParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    particles.forEach((p) => {
      const pos = this.worldToScreen(p.x, p.y);
      const alpha = p.getAlpha();
      
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size);
      gradient.addColorStop(0, `rgba(255, 221, 0, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 136, 0, ${alpha * 0.6})`);
      gradient.addColorStop(1, `rgba(255, 136, 0, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawOre(ore: Ore): void {
    const pos = this.worldToScreen(ore.x, ore.y);
    const ctx = this.ctx;
    const pulseScale = 1 + Math.sin(ore.pulsePhase) * 0.08;
    const glowRadius = ore.radius * pulseScale * (1.5 + ore.glowIntensity);
    
    const glowGradient = ctx.createRadialGradient(
      pos.x, pos.y, 0,
      pos.x, pos.y, glowRadius
    );
    const baseColor = ore.getColor();
    glowGradient.addColorStop(0, baseColor + this.alphaToHex(ore.glowIntensity * 0.6));
    glowGradient.addColorStop(0.5, baseColor + this.alphaToHex(ore.glowIntensity * 0.3));
    glowGradient.addColorStop(1, baseColor + '00');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    const oreGradient = ctx.createRadialGradient(
      pos.x - ore.radius * 0.3, pos.y - ore.radius * 0.3, 0,
      pos.x, pos.y, ore.radius * pulseScale
    );
    oreGradient.addColorStop(0, this.lightenColor(baseColor, 30));
    oreGradient.addColorStop(0.7, baseColor);
    oreGradient.addColorStop(1, this.darkenColor(baseColor, 30));
    
    ctx.fillStyle = oreGradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, ore.radius * pulseScale, 0, Math.PI * 2);
    ctx.fill();
    
    if (ore.isBeingHarvested && ore.harvestProgress > 0) {
      const progressBarRadius = ore.radius + 8;
      const barWidth = 4;
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + Math.PI * 2 * ore.harvestProgress;
      
      ctx.strokeStyle = `rgba(255, 50, 50, 0.7)`;
      ctx.lineWidth = barWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, progressBarRadius, startAngle, endAngle);
      ctx.stroke();
    }
  }

  drawHarvestParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    particles.forEach((p) => {
      const pos = this.worldToScreen(p.x, p.y);
      const alpha = p.getAlpha();
      
      ctx.fillStyle = p.color + this.alphaToHex(alpha);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawDebris(debris: SpaceDebris): void {
    if (debris.isWarning) {
      if (debris.isWarningVisible()) {
        this.drawDebrisWarning(debris);
      }
      return;
    }
    
    const ctx = this.ctx;
    
    for (let i = 0; i < debris.trail.length; i++) {
      const t = debris.trail[i];
      const pos = this.worldToScreen(t.x, t.y);
      const alpha = (1 - i / debris.trail.length) * 0.6;
      const size = debris.radius * (1 - i / debris.trail.length) * 0.5;
      
      ctx.fillStyle = `rgba(255, 60, 30, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const pos = this.worldToScreen(debris.x, debris.y);
    
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(debris.rotation);
    
    ctx.fillStyle = '#5d4e37';
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let i = 0; i < debris.vertices.length; i += 2) {
      const angle = debris.vertices[i];
      const r = debris.vertices[i + 1];
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }

  drawDebrisWarning(debris: SpaceDebris): void {
    const ctx = this.ctx;
    
    const start = this.worldToScreen(debris.warningArrowStart.x, debris.warningArrowStart.y);
    const end = this.worldToScreen(debris.warningArrowEnd.x, debris.warningArrowEnd.y);
    
    ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    const arrowHeadSize = 10;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    ctx.fillStyle = 'rgba(255, 80, 80, 0.8)';
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - arrowHeadSize * Math.cos(angle - Math.PI / 6),
      end.y - arrowHeadSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      end.x - arrowHeadSize * Math.cos(angle + Math.PI / 6),
      end.y - arrowHeadSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    const warningX = end.x + Math.cos(angle) * 20;
    const warningY = end.y + Math.sin(angle) * 20;
    const warningSize = 15;
    
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.moveTo(warningX, warningY - warningSize);
    ctx.lineTo(warningX - warningSize * 0.866, warningY + warningSize * 0.5);
    ctx.lineTo(warningX + warningSize * 0.866, warningY + warningSize * 0.5);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', warningX, warningY);
  }

  drawMiningBeam(shipX: number, shipY: number, targetX: number, targetY: number, active: boolean): void {
    if (!active) return;
    
    const start = this.worldToScreen(shipX, shipY);
    const end = this.worldToScreen(targetX, targetY);
    const ctx = this.ctx;
    
    const flickerAlpha = 0.6 + Math.random() * 0.4;
    
    ctx.strokeStyle = `rgba(80, 180, 255, ${flickerAlpha})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00aaff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    ctx.strokeStyle = `rgba(200, 230, 255, ${flickerAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
  }

  drawScore(score: number): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 180, 50);
    
    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 180, 50);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('分数: ' + score, 20, 25);
  }

  drawHealth(health: number, maxHealth: number, shockwaves: Shockwave[]): void {
    const ctx = this.ctx;
    const startX = this.canvas.width - 30;
    const startY = 35;
    const diamondSize = 18;
    const gap = 8;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(this.canvas.width - maxHealth * (diamondSize + gap) - 30, 10, maxHealth * (diamondSize + gap) + 20, 50);
    
    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.canvas.width - maxHealth * (diamondSize + gap) - 30, 10, maxHealth * (diamondSize + gap) + 20, 50);
    
    for (let i = 0; i < maxHealth; i++) {
      const x = startX - i * (diamondSize + gap);
      const y = startY;
      const isActive = i < health;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      
      if (isActive) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, diamondSize);
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(1, '#27ae60');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#555555';
      }
      
      ctx.fillRect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
      
      ctx.strokeStyle = isActive ? '#ffffff' : '#777777';
      ctx.lineWidth = 1;
      ctx.strokeRect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
      
      ctx.restore();
    }
    
    shockwaves.forEach((sw) => {
      const alpha = sw.getAlpha();
      ctx.strokeStyle = `rgba(255, 200, 100, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  drawGameOver(score: number, onRestart: () => void): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, w, h);
    
    const panelX = w / 2 - 200;
    const panelY = h / 2 - 120;
    const panelW = 400;
    const panelH = 240;
    
    ctx.fillStyle = 'rgba(20, 20, 50, 0.9)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    
    ctx.strokeStyle = '#4a90d9';
    ctx.lineWidth = 3;
    ctx.strokeRect(panelX, panelY, panelW, panelH);
    
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('游戏结束', w / 2, panelY + 25);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText('最终分数:', w / 2, panelY + 85);
    
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(score.toString(), w / 2, panelY + 115);
    
    const btnX = w / 2 - 70;
    const btnY = panelY + 165;
    const btnW = 140;
    const btnH = 45;
    
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillText('重新开始', w / 2, btnY + btnH / 2);
    
    this.canvas.onclick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
        this.canvas.onclick = null;
        onRestart();
      }
    };
  }

  clearGameOverHandler(): void {
    this.canvas.onclick = null;
  }

  private alphaToHex(alpha: number): string {
    const clamped = Math.max(0, Math.min(1, alpha));
    const hex = Math.round(clamped * 255).toString(16).padStart(2, '0');
    return hex;
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  renderComplete?(): void;
}
