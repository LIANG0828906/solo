import { Gem, Particle, GEM_COLORS, GEM_COLORS_GLOW, getGemShapePath, DragState } from './gemGen';

export interface GameState {
  grid: (Gem | null)[][];
  conveyorGems: Gem[];
  bufferGem: Gem | null;
  particles: Particle[];
  score: number;
  chainCount: number;
  chainPulseProgress: number;
  mineGlowProgress: number;
  state: 'playing' | 'gameover' | 'animating' | 'resetting';
  resetProgress: number;
  gameOverProgress: number;
  dragState: DragState;
}

export interface LayoutConfig {
  width: number;
  height: number;
  gridSize: number;
  cellSize: number;
  gemSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  conveyorY: number;
  conveyorWidth: number;
  conveyorX: number;
  bufferX: number;
  bufferY: number;
}

export function calculateLayout(canvasWidth: number, canvasHeight: number): LayoutConfig {
  const isMobile = canvasWidth < 768;
  const maxGridWidth = isMobile ? canvasWidth * 0.9 : 480;
  const gridSize = Math.min(maxGridWidth, canvasHeight * 0.6);
  const cellSize = gridSize / 6;
  const gemSize = cellSize * 0.85;
  
  const gridOffsetX = (canvasWidth - gridSize) / 2;
  const gridOffsetY = canvasHeight * 0.35;
  
  const conveyorY = canvasHeight * 0.15;
  const conveyorWidth = gridSize * 0.8;
  const conveyorX = (canvasWidth - conveyorWidth) / 2;
  
  const bufferX = conveyorX + conveyorWidth + 30;
  const bufferY = conveyorY;
  
  return {
    width: canvasWidth,
    height: canvasHeight,
    gridSize,
    cellSize,
    gemSize,
    gridOffsetX,
    gridOffsetY,
    conveyorY,
    conveyorWidth,
    conveyorX,
    bufferX,
    bufferY
  };
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private layout: LayoutConfig;
  private gemShapeCache: Map<string, Path2D> = new Map();
  
  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.layout = calculateLayout(width, height);
    this.precacheGemShapes();
  }
  
  resize(width: number, height: number): void {
    this.layout = calculateLayout(width, height);
    this.precacheGemShapes();
  }
  
  private precacheGemShapes(): void {
    const shapes = ['diamond', 'hexagon', 'octagon', 'triangle'] as const;
    for (const shape of shapes) {
      const key = `${shape}-${this.layout.gemSize}`;
      this.gemShapeCache.set(key, getGemShapePath(shape, this.layout.gemSize));
    }
  }
  
  render(state: GameState): void {
    const ctx = this.ctx;
    const layout = this.layout;
    
    ctx.clearRect(0, 0, layout.width, layout.height);
    
    this.drawBackground(state.mineGlowProgress);
    this.drawConveyor();
    this.drawGrid(state.resetProgress);
    this.drawGridGems(state.grid, state.resetProgress);
    this.drawConveyorGems(state.conveyorGems);
    this.drawBufferGem(state.bufferGem);
    this.drawParticles(state.particles);
    this.drawDraggingGem(state.dragState);
    this.drawScore(state.score);
    this.drawChainCounter(state.chainCount, state.chainPulseProgress);
    
    if (state.state === 'gameover') {
      this.drawGameOver(state.score, state.gameOverProgress);
    }
  }
  
  private drawBackground(mineGlowProgress: number): void {
    const ctx = this.ctx;
    const layout = this.layout;
    
    const gradient = ctx.createRadialGradient(
      layout.width / 2, layout.height / 2, 0,
      layout.width / 2, layout.height / 2, Math.max(layout.width, layout.height) * 0.7
    );
    
    const darkColor = this.lerpColor('#2C1810', '#DAA520', mineGlowProgress * 0.3);
    const darkerColor = this.lerpColor('#1A0E0A', '#FFF8DC', mineGlowProgress * 0.2);
    const darkestColor = this.lerpColor('#0D0705', '#8B4513', mineGlowProgress * 0.1);
    
    gradient.addColorStop(0, darkColor);
    gradient.addColorStop(0.7, darkerColor);
    gradient.addColorStop(1, darkestColor);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, layout.width, layout.height);
    
    if (mineGlowProgress > 0) {
      const glowGradient = ctx.createRadialGradient(
        layout.width / 2, layout.height / 2 + layout.gridSize / 4, 0,
        layout.width / 2, layout.height / 2 + layout.gridSize / 4, layout.gridSize * 0.8
      );
      glowGradient.addColorStop(0, `rgba(218, 165, 32, ${mineGlowProgress * 0.3})`);
      glowGradient.addColorStop(0.5, `rgba(255, 248, 220, ${mineGlowProgress * 0.15})`);
      glowGradient.addColorStop(1, 'rgba(218, 165, 32, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, layout.width, layout.height);
    }
    
    this.drawMineShaftTexture();
  }
  
  private drawMineShaftTexture(): void {
    const ctx = this.ctx;
    const layout = this.layout;
    
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#4A2C1A';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 8; i++) {
      const y = layout.height * 0.2 + i * (layout.height * 0.1);
      ctx.beginPath();
      ctx.moveTo(layout.width * 0.1, y);
      ctx.lineTo(layout.width * 0.9, y);
      ctx.stroke();
    }
    
    for (let i = 0; i < 6; i++) {
      const x = layout.width * 0.15 + i * (layout.width * 0.14);
      ctx.beginPath();
      ctx.moveTo(x, layout.height * 0.2);
      ctx.lineTo(x, layout.height * 0.95);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  private drawConveyor(): void {
    const ctx = this.ctx;
    const layout = this.layout;
    
    const conveyorHeight = layout.gemSize + 20;
    
    ctx.save();
    
    ctx.fillStyle = '#3D2817';
    ctx.beginPath();
    ctx.roundRect(layout.conveyorX - 5, layout.conveyorY - conveyorHeight / 2 - 5, layout.conveyorWidth + 10, conveyorHeight + 10, 8);
    ctx.fill();
    
    const woodGradient = ctx.createLinearGradient(0, layout.conveyorY - conveyorHeight / 2, 0, layout.conveyorY + conveyorHeight / 2);
    woodGradient.addColorStop(0, '#5C3D2E');
    woodGradient.addColorStop(0.3, '#4A2C1A');
    woodGradient.addColorStop(0.7, '#3D2817');
    woodGradient.addColorStop(1, '#2C1810');
    
    ctx.fillStyle = woodGradient;
    ctx.beginPath();
    ctx.roundRect(layout.conveyorX, layout.conveyorY - conveyorHeight / 2, layout.conveyorWidth, conveyorHeight, 6);
    ctx.fill();
    
    ctx.strokeStyle = '#2C1810';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      const x = layout.conveyorX + i * (layout.conveyorWidth / 20);
      ctx.beginPath();
      ctx.moveTo(x, layout.conveyorY - conveyorHeight / 2);
      ctx.lineTo(x, layout.conveyorY + conveyorHeight / 2);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#1A0E0A';
    ctx.beginPath();
    ctx.arc(layout.conveyorX - 10, layout.conveyorY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(layout.conveyorX + layout.conveyorWidth + 10, layout.conveyorY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    this.drawBufferArea();
    
    ctx.restore();
  }
  
  private drawBufferArea(): void {
    const ctx = this.ctx;
    const layout = this.layout;
    const size = layout.gemSize + 16;
    
    ctx.save();
    
    const gradient = ctx.createRadialGradient(
      layout.bufferX, layout.bufferY, 0,
      layout.bufferX, layout.bufferY, size / 2
    );
    gradient.addColorStop(0, 'rgba(184, 134, 11, 0.3)');
    gradient.addColorStop(0.7, 'rgba(184, 134, 11, 0.1)');
    gradient.addColorStop(1, 'rgba(184, 134, 11, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(layout.bufferX, layout.bufferY, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(layout.bufferX, layout.bufferY, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#B8860B';
    ctx.font = '12px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('缓存', layout.bufferX, layout.bufferY + size / 2 + 18);
    
    ctx.restore();
  }
  
  private drawGrid(resetProgress: number): void {
    const ctx = this.ctx;
    const layout = this.layout;
    
    ctx.save();
    
    if (resetProgress > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(layout.gridOffsetX, layout.gridOffsetY, layout.gridSize * (1 - resetProgress), layout.gridSize);
      ctx.clip();
    }
    
    const bgGradient = ctx.createLinearGradient(
      layout.gridOffsetX, layout.gridOffsetY,
      layout.gridOffsetX, layout.gridOffsetY + layout.gridSize
    );
    bgGradient.addColorStop(0, 'rgba(44, 24, 16, 0.9)');
    bgGradient.addColorStop(1, 'rgba(26, 14, 10, 0.95)');
    
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.roundRect(layout.gridOffsetX - 4, layout.gridOffsetY - 4, layout.gridSize + 8, layout.gridSize + 8, 12);
    ctx.fill();
    
    ctx.strokeStyle = '#4A2C1A';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 6; i++) {
      const x = layout.gridOffsetX + i * layout.cellSize;
      const y = layout.gridOffsetY + i * layout.cellSize;
      
      ctx.beginPath();
      ctx.moveTo(x, layout.gridOffsetY);
      ctx.lineTo(x, layout.gridOffsetY + layout.gridSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(layout.gridOffsetX, y);
      ctx.lineTo(layout.gridOffsetX + layout.gridSize, y);
      ctx.stroke();
    }
    
    ctx.strokeStyle = '#6B4423';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(layout.gridOffsetX - 2, layout.gridOffsetY - 2, layout.gridSize + 4, layout.gridSize + 4, 10);
    ctx.stroke();
    
    if (resetProgress > 0) {
      ctx.restore();
      
      if (resetProgress < 1) {
        ctx.fillStyle = '#1A0E0A';
        ctx.fillRect(
          layout.gridOffsetX + layout.gridSize * (1 - resetProgress),
          layout.gridOffsetY,
          layout.gridSize * resetProgress,
          layout.gridSize
        );
      }
    }
    
    ctx.restore();
  }
  
  private drawGridGems(grid: (Gem | null)[][], resetProgress: number): void {
    const ctx = this.ctx;
    const layout = this.layout;
    
    ctx.save();
    
    if (resetProgress > 0) {
      ctx.beginPath();
      ctx.rect(layout.gridOffsetX, layout.gridOffsetY, layout.gridSize * (1 - resetProgress), layout.gridSize);
      ctx.clip();
    }
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const gem = grid[row][col];
        if (gem) {
          const cellCenterX = layout.gridOffsetX + col * layout.cellSize + layout.cellSize / 2;
          const cellCenterY = layout.gridOffsetY + row * layout.cellSize + layout.cellSize / 2;
          
          if (!gem.isDragging) {
            this.drawGem(gem, cellCenterX, cellCenterY);
          }
        }
      }
    }
    
    ctx.restore();
  }
  
  private drawConveyorGems(gems: Gem[]): void {
    for (const gem of gems) {
      if (!gem.isDragging) {
        this.drawGem(gem, gem.x, gem.y);
      }
    }
  }
  
  private drawBufferGem(gem: Gem | null): void {
    if (gem && !gem.isDragging) {
      this.drawGem(gem, gem.x, gem.y);
    }
  }
  
  private drawDraggingGem(dragState: DragState): void {
    if (dragState.isDragging && dragState.draggedGem) {
      const gem = dragState.draggedGem;
      
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = 0.3;
      this.drawGemShape(gem, gem.x + 8, gem.y + 8, 0.9);
      ctx.restore();
      
      ctx.save();
      ctx.globalAlpha = 0.8;
      this.drawGemShape(gem, gem.x, gem.y, gem.scale);
      ctx.restore();
    }
  }
  
  private drawGem(gem: Gem, x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = gem.opacity;
    this.drawGemShape(gem, x, y, gem.scale);
    ctx.restore();
  }
  
  private drawGemShape(gem: Gem, x: number, y: number, scale: number): void {
    const ctx = this.ctx;
    const layout = this.layout;
    
    const cacheKey = `${gem.shape}-${layout.gemSize}`;
    const path = this.gemShapeCache.get(cacheKey) || getGemShapePath(gem.shape, layout.gemSize);
    
    let color = GEM_COLORS[gem.color];
    let glowColor = GEM_COLORS_GLOW[gem.color];
    
    if (gem.isFlashing) {
      const flashOn = Math.floor(gem.flashPhase) % 2 === 1;
      if (flashOn) {
        color = '#FFFFFF';
        glowColor = 'rgba(255, 255, 255, 0.5)';
      }
    }
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(gem.rotation);
    ctx.scale(scale, scale);
    
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;
    
    const gradient = ctx.createRadialGradient(-layout.gemSize * 0.2, -layout.gemSize * 0.2, 0, 0, 0, layout.gemSize * 0.6);
    gradient.addColorStop(0, this.lightenColor(color, 50));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, this.darkenColor(color, 30));
    
    ctx.fillStyle = gradient;
    ctx.fill(path);
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = this.lightenColor(color, 20);
    ctx.lineWidth = 2;
    ctx.stroke(path);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-layout.gemSize * 0.15, -layout.gemSize * 0.25, layout.gemSize * 0.15, layout.gemSize * 0.08, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  private drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    
    for (const particle of particles) {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
    }
  }
  
  private drawScore(score: number): void {
    const ctx = this.ctx;
    const layout = this.layout;
    
    ctx.save();
    
    ctx.fillStyle = '#B8860B';
    ctx.font = 'bold 24px Cinzel, serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    
    const scoreX = layout.width - 40;
    const scoreY = 80;
    
    ctx.shadowColor = 'rgba(184, 134, 11, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(`得分: ${score.toLocaleString()}`, scoreX, scoreY);
    
    ctx.restore();
  }
  
  private drawChainCounter(chainCount: number, pulseProgress: number): void {
    const ctx = this.ctx;
    
    if (chainCount === 0) return;
    
    ctx.save();
    
    const x = 40;
    const y = 80;
    
    const pulseScale = 1 + Math.sin(pulseProgress * Math.PI) * 0.3;
    
    ctx.save();
    ctx.translate(x + 15, y + 15);
    ctx.scale(pulseScale, pulseScale);
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', 0, 0);
    ctx.restore();
    
    ctx.fillStyle = '#FF6B35';
    ctx.font = `bold ${Math.floor(20 * pulseScale)}px Cinzel, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 107, 53, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(`x${chainCount}`, x + 40, y + 15);
    
    ctx.restore();
  }
  
  private drawGameOver(score: number, progress: number): void {
    const ctx = this.ctx;
    const layout = this.layout;
    
    ctx.save();
    
    ctx.fillStyle = `rgba(0, 0, 0, ${progress * 0.7})`;
    ctx.fillRect(0, 0, layout.width, layout.height);
    
    const centerX = layout.width / 2;
    const centerY = layout.height / 2;
    
    ctx.save();
    ctx.translate(centerX, centerY - 80);
    ctx.rotate(progress * Math.PI * 2);
    ctx.globalAlpha = progress;
    
    const hatSize = 80;
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(0, hatSize * 0.3, hatSize * 0.8, hatSize * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, hatSize * 0.5, Math.PI, 0);
    ctx.lineTo(hatSize * 0.5, hatSize * 0.3);
    ctx.lineTo(-hatSize * 0.5, hatSize * 0.3);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, -hatSize * 0.1, hatSize * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fill();
    
    ctx.restore();
    
    ctx.globalAlpha = progress;
    ctx.fillStyle = '#B8860B';
    ctx.font = 'bold 48px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(184, 134, 11, 0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText('游戏结束', centerX, centerY + 20);
    
    ctx.font = 'bold 32px Cinzel, serif';
    ctx.fillStyle = '#FFF8DC';
    ctx.fillText(`最终得分: ${score.toLocaleString()}`, centerX, centerY + 70);
    
    ctx.restore();
  }
  
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
  }
  
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgb(${R}, ${G}, ${B})`;
  }
  
  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = parseInt(color1.replace('#', ''), 16);
    const c2 = parseInt(color2.replace('#', ''), 16);
    
    const r1 = (c1 >> 16) & 255;
    const g1 = (c1 >> 8) & 255;
    const b1 = c1 & 255;
    
    const r2 = (c2 >> 16) & 255;
    const g2 = (c2 >> 8) & 255;
    const b2 = c2 & 255;
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  getLayout(): LayoutConfig {
    return this.layout;
  }
}
