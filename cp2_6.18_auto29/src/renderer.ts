import type { GameState, BuildableType } from './gameState';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const COLORS = {
  background: '#0A1020',
  baseCore: '#1A2A4A',
  baseCoreBorder: '#4A6A9A',
  baseCoreGlow: '#00BFFF',
  asteroid: '#5A4A3A',
  asteroidDark: '#3A2A1A',
  asteroidLight: '#7A6A5A',
  crystal: '#FFD700',
  energyGreen: '#00FF88',
  energyGreenDark: '#00AA55',
  meteor: '#8B4513',
  meteorDark: '#5C2E0A',
  shield: '#00BFFF',
  buildingBorder: '#4A6A9A',
  buildingSelected: '#00BFFF',
  connectionLine: '#00BFFF',
  uiBackground: '#0A1020B0',
  textWhite: '#FFFFFF',
  textYellow: '#FFD700'
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private state: GameState;

  constructor(ctx: CanvasRenderingContext2D, state: GameState) {
    this.ctx = ctx;
    this.state = state;
  }

  render(): void {
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.drawBackground();
    this.drawStars();
    this.drawBorderGlow();
    this.drawConnections();
    this.drawAsteroids();
    this.drawBuildings();
    this.drawBaseCore();
    this.drawShip();
    this.drawMeteors();
    this.drawParticles();
    this.drawShield();
    this.drawBuildMenu();
    this.drawUI();
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawStars(): void {
    const ctx = this.ctx;
    const stars = this.state.getStars();
    const time = this.state.getTime();
    
    stars.forEach(star => {
      let brightness = star.brightness;
      
      if (star.isTwinkling) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        brightness = 0.3 + (twinkle * 0.5 + 0.5) * 0.7;
      }
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fill();
    });
  }

  private drawBorderGlow(): void {
    const ctx = this.ctx;
    const glowSize = 50;
    
    const topGradient = ctx.createLinearGradient(0, 0, 0, glowSize);
    topGradient.addColorStop(0, 'rgba(0, 191, 255, 0.15)');
    topGradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, glowSize);
    
    const bottomGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - glowSize, 0, CANVAS_HEIGHT);
    bottomGradient.addColorStop(0, 'rgba(0, 191, 255, 0)');
    bottomGradient.addColorStop(1, 'rgba(0, 191, 255, 0.15)');
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, CANVAS_HEIGHT - glowSize, CANVAS_WIDTH, glowSize);
    
    const leftGradient = ctx.createLinearGradient(0, 0, glowSize, 0);
    leftGradient.addColorStop(0, 'rgba(0, 191, 255, 0.15)');
    leftGradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
    ctx.fillStyle = leftGradient;
    ctx.fillRect(0, 0, glowSize, CANVAS_HEIGHT);
    
    const rightGradient = ctx.createLinearGradient(CANVAS_WIDTH - glowSize, 0, CANVAS_WIDTH, 0);
    rightGradient.addColorStop(0, 'rgba(0, 191, 255, 0)');
    rightGradient.addColorStop(1, 'rgba(0, 191, 255, 0.15)');
    ctx.fillStyle = rightGradient;
    ctx.fillRect(CANVAS_WIDTH - glowSize, 0, glowSize, CANVAS_HEIGHT);
  }

  private drawBaseCore(): void {
    const ctx = this.ctx;
    const base = this.state.getBase();
    const time = this.state.getTime();
    
    const pulse = Math.sin(time * 2 + base.pulsePhase) * 0.1 + 1;
    const glowRadius = base.radius * pulse * 1.5;
    
    const glowGradient = ctx.createRadialGradient(
      base.x, base.y, base.radius * 0.5,
      base.x, base.y, glowRadius
    );
    glowGradient.addColorStop(0, 'rgba(0, 191, 255, 0.3)');
    glowGradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(base.x, base.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    const coreGradient = ctx.createRadialGradient(
      base.x - base.radius * 0.3, base.y - base.radius * 0.3, 0,
      base.x, base.y, base.radius
    );
    coreGradient.addColorStop(0, 'rgba(42, 68, 110, 0.9)');
    coreGradient.addColorStop(1, 'rgba(26, 42, 74, 0.9)');
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(base.x, base.y, base.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = COLORS.baseCoreGlow;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.baseCoreGlow;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(base.x, base.y, base.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = 'rgba(0, 191, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(base.x, base.y, base.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(base.x, base.y, base.radius * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = COLORS.baseCoreGlow;
    ctx.beginPath();
    ctx.arc(base.x, base.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawAsteroids(): void {
    const ctx = this.ctx;
    const asteroids = this.state.getAsteroids();
    
    asteroids.forEach(asteroid => {
      if (!asteroid.active) return;
      
      const resourceRatio = asteroid.resources / asteroid.maxResources;
      const currentRadius = asteroid.radius * (0.4 + resourceRatio * 0.6);
      
      ctx.save();
      ctx.translate(asteroid.x, asteroid.y);
      
      ctx.beginPath();
      const segments = 12;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const noise = this.noise2D(
          asteroid.noiseSeed + Math.cos(angle) * 5,
          asteroid.noiseSeed + Math.sin(angle) * 5
        );
        const r = currentRadius * (0.8 + noise * 0.4);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      
      const gradient = ctx.createRadialGradient(
        -currentRadius * 0.3, -currentRadius * 0.3, 0,
        0, 0, currentRadius
      );
      gradient.addColorStop(0, COLORS.asteroidLight);
      gradient.addColorStop(0.5, COLORS.asteroid);
      gradient.addColorStop(1, COLORS.asteroidDark);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.strokeStyle = COLORS.asteroidDark;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    });
  }

  private noise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  private drawShip(): void {
    const ctx = this.ctx;
    const ship = this.state.getShip();
    const time = this.state.getTime();
    
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    
    const hover = Math.sin(time * 3) * 2;
    ctx.translate(0, hover);
    
    ctx.fillStyle = '#2A3A5A';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#4A6A9A';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#00BFFF';
    ctx.beginPath();
    ctx.arc(5, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    
    if (ship.isCollecting) {
      const collectPulse = Math.sin(time * 8) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 215, 0, ${collectPulse})`;
      ctx.beginPath();
      ctx.arc(-12, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }

  private drawBuildings(): void {
    const ctx = this.ctx;
    const buildings = this.state.getBuildings();
    const time = this.state.getTime();
    
    buildings.forEach(building => {
      if (building.buildProgress < 0.01) return;
      
      ctx.save();
      ctx.translate(building.x, building.y);
      ctx.rotate(building.angle * building.buildProgress);
      ctx.scale(building.scale, building.scale);
      
      const glowIntensity = 0.3 + Math.sin(time * 2 + building.id) * 0.2;
      
      if (building.type === 'energyTower') {
        this.drawEnergyTower(ctx, glowIntensity);
      } else if (building.type === 'shieldGenerator') {
        this.drawShieldGenerator(ctx, glowIntensity);
      } else if (building.type === 'warehouse') {
        this.drawWarehouse(ctx);
      } else if (building.type === 'miningFacility') {
        this.drawMiningFacility(ctx, glowIntensity);
      }
      
      ctx.restore();
    });
  }

  private drawEnergyTower(ctx: CanvasRenderingContext2D, glow: number): void {
    const width = 30;
    const height = 50;
    
    ctx.fillStyle = '#1A2A4A';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    
    ctx.strokeStyle = COLORS.buildingBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    
    ctx.fillStyle = `rgba(0, 255, 136, ${glow})`;
    ctx.fillRect(-width / 4, -height / 3, width / 2, height * 0.6);
    
    ctx.fillStyle = '#00FF88';
    ctx.beginPath();
    ctx.moveTo(0, -height / 2 - 10);
    ctx.lineTo(-5, -height / 2);
    ctx.lineTo(5, -height / 2);
    ctx.closePath();
    ctx.fill();
  }

  private drawShieldGenerator(ctx: CanvasRenderingContext2D, glow: number): void {
    const size = 35;
    
    ctx.fillStyle = '#1A2A4A';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size / 2;
      const y = Math.sin(angle) * size / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = COLORS.buildingBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.strokeStyle = `rgba(0, 191, 255, ${glow + 0.3})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = '#00BFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWarehouse(ctx: CanvasRenderingContext2D): void {
    const width = 40;
    const height = 30;
    
    ctx.fillStyle = '#1A2A4A';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    
    ctx.strokeStyle = COLORS.buildingBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    
    ctx.strokeStyle = 'rgba(74, 106, 154, 0.5)';
    ctx.beginPath();
    ctx.moveTo(-width / 2 + 5, 0);
    ctx.lineTo(width / 2 - 5, 0);
    ctx.stroke();
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-width / 4, -height / 4, width / 6, height / 3);
    ctx.fillRect(width / 12, -height / 4, width / 6, height / 3);
  }

  private drawMiningFacility(ctx: CanvasRenderingContext2D, glow: number): void {
    const width = 60;
    const height = 40;
    
    ctx.fillStyle = '#1A2A4A';
    ctx.fillRect(-width / 2, -height / 2, width, height);
    
    ctx.strokeStyle = COLORS.buildingBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(-width / 2, -height / 2, width, height);
    
    ctx.fillStyle = `rgba(255, 215, 0, ${glow * 0.5})`;
    ctx.fillRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10);
    
    ctx.fillStyle = '#FFD700';
    const drillOffset = Math.sin(this.state.getTime() * 4) * 3;
    ctx.fillRect(-4, height / 2 - 5 + drillOffset, 8, 10);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-width / 4, -height / 4);
    ctx.lineTo(-width / 4 + 8, -height / 4);
    ctx.lineTo(-width / 4 + 4, -height / 4 - 8);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(width / 4, -height / 4);
    ctx.lineTo(width / 4 + 8, -height / 4);
    ctx.lineTo(width / 4 + 4, -height / 4 - 8);
    ctx.closePath();
    ctx.fill();
  }

  private drawConnections(): void {
    const ctx = this.ctx;
    const buildings = this.state.getBuildings();
    const base = this.state.getBase();
    const time = this.state.getTime();
    
    const flash = Math.sin(time * Math.PI * 2) * 0.3 + 0.7;
    
    buildings.forEach(building => {
      if (building.buildProgress < 0.5) return;
      
      ctx.strokeStyle = `rgba(0, 191, 255, ${flash * 0.6})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = COLORS.connectionLine;
      ctx.shadowBlur = 4;
      
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(building.x, building.y);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
    });
  }

  private drawMeteors(): void {
    const ctx = this.ctx;
    const meteors = this.state.getMeteors();
    
    meteors.forEach(meteor => {
      ctx.save();
      ctx.translate(meteor.x, meteor.y);
      ctx.rotate(meteor.rotation);
      
      const trailLength = 30;
      const trailGradient = ctx.createLinearGradient(
        -meteor.radius - trailLength, 0,
        -meteor.radius, 0
      );
      trailGradient.addColorStop(0, 'rgba(139, 69, 19, 0)');
      trailGradient.addColorStop(1, 'rgba(255, 100, 50, 0.6)');
      
      ctx.fillStyle = trailGradient;
      ctx.beginPath();
      ctx.moveTo(-meteor.radius, -meteor.radius * 0.5);
      ctx.lineTo(-meteor.radius - trailLength, 0);
      ctx.lineTo(-meteor.radius, meteor.radius * 0.5);
      ctx.closePath();
      ctx.fill();
      
      const gradient = ctx.createRadialGradient(
        -meteor.radius * 0.3, -meteor.radius * 0.3, 0,
        0, 0, meteor.radius
      );
      gradient.addColorStop(0, '#CD853F');
      gradient.addColorStop(0.5, COLORS.meteor);
      gradient.addColorStop(1, COLORS.meteorDark);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, meteor.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = COLORS.meteorDark;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 150, 50, 0.8)';
      ctx.beginPath();
      ctx.arc(meteor.radius * 0.3, -meteor.radius * 0.2, meteor.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    const particles = this.state.getParticles();
    
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (particle.type === 'resource') {
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, particle.color);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'explosion') {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
  }

  private drawShield(): void {
    if (!this.state.isShieldActive()) return;
    
    const ctx = this.ctx;
    const base = this.state.getBase();
    const time = this.state.getTime();
    const healthRatio = this.state.getShieldHealth() / this.state.getShieldMaxHealth();
    const flashTimer = this.state.getShieldFlashTimer();
    
    const shieldRadius = 60;
    const pulse = Math.sin(time * 3) * 0.05 + 1;
    const flash = flashTimer > 0 ? 1 : 0;
    
    ctx.save();
    
    const baseAlpha = 0.3 * healthRatio + flash * 0.3;
    const gradient = ctx.createRadialGradient(
      base.x, base.y, shieldRadius * 0.8,
      base.x, base.y, shieldRadius * pulse * 1.1
    );
    gradient.addColorStop(0, `rgba(0, 191, 255, 0)`);
    gradient.addColorStop(0.5, `rgba(0, 191, 255, ${baseAlpha})`);
    gradient.addColorStop(1, `rgba(0, 191, 255, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(base.x, base.y, shieldRadius * pulse * 1.1, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = `rgba(0, 191, 255, ${0.5 + flash * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(base.x, base.y, shieldRadius * pulse, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = `rgba(0, 191, 255, ${0.2 + flash * 0.3})`;
    ctx.lineWidth = 1;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const startAngle = (i / segments) * Math.PI * 2 + time * 0.5;
      const endAngle = startAngle + Math.PI * 0.15;
      ctx.beginPath();
      ctx.arc(base.x, base.y, shieldRadius * pulse * 0.9, startAngle, endAngle);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  private drawBuildMenu(): void {
    if (!this.state.isBuildMenuOpen()) return;
    
    const ctx = this.ctx;
    const base = this.state.getBase();
    const hovered = this.state.getHoveredButton();
    
    const buttons: { type: BuildableType; label: string; cost: number }[] = [
      { type: 'energyTower', label: '能量塔', cost: 50 },
      { type: 'shieldGenerator', label: '护盾', cost: 80 },
      { type: 'warehouse', label: '仓库', cost: 30 }
    ];
    
    const innerRadius = 50;
    const midRadius = 70;
    const outerRadius = 90;
    const startAngle = -Math.PI / 2 - Math.PI / 3;
    
    buttons.forEach((btn, index) => {
      const angleStart = startAngle + (index / 3) * Math.PI * 2 / 3 * 1.5;
      const angleEnd = angleStart + Math.PI / 4;
      const isHovered = hovered === btn.type;
      const scale = isHovered ? 1.05 : 1;
      
      const rIn = innerRadius * scale;
      const rMid = midRadius * scale;
      const rOut = outerRadius * scale;
      
      ctx.save();
      ctx.translate(base.x, base.y);
      
      ctx.beginPath();
      ctx.arc(0, 0, rOut, angleStart, angleEnd);
      ctx.arc(0, 0, rIn, angleEnd, angleStart, true);
      ctx.closePath();
      
      const alpha = isHovered ? 0.9 : 0.7;
      ctx.fillStyle = `rgba(26, 42, 74, ${alpha})`;
      ctx.fill();
      
      ctx.strokeStyle = isHovered ? '#00BFFF' : '#4A6A9A';
      ctx.lineWidth = isHovered ? 2 : 1;
      if (isHovered) {
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 8;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      const midAngle = (angleStart + angleEnd) / 2;
      const iconX = Math.cos(midAngle) * rMid;
      const iconY = Math.sin(midAngle) * rMid;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, iconX, iconY - 6);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${btn.cost}`, iconX, iconY + 6);
      
      ctx.restore();
    });
  }

  private drawUI(): void {
    const ctx = this.ctx;
    const crystals = this.state.getCrystals();
    const energy = this.state.getEnergy();
    const maxEnergy = this.state.getMaxEnergy();
    const waveTimer = this.state.getWaveTimer();
    const crystalPulse = this.state.getCrystalPulse();
    const energyPulse = this.state.getEnergyPulse();
    
    const barHeight = 40;
    
    ctx.fillStyle = 'rgba(10, 16, 32, 0.565)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, barHeight);
    
    ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';
    ctx.fillRect(0, barHeight - 1, CANVAS_WIDTH, 1);
    
    const crystalX = 20;
    const crystalY = barHeight / 2;
    
    const crystalScale = 1 + crystalPulse * 0.15;
    ctx.save();
    ctx.translate(crystalX, crystalY);
    ctx.scale(crystalScale, crystalScale);
    
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 6 * crystalPulse;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.restore();
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(crystals)}`, crystalX + 20, crystalY);
    
    const energyBarX = 120;
    const energyBarY = barHeight / 2 - 8;
    const energyBarWidth = 120;
    const energyBarHeight = 16;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.roundRect(ctx, energyBarX, energyBarY, energyBarWidth, energyBarHeight, 4);
    ctx.fill();
    
    const energyRatio = energy / maxEnergy;
    const energyGradient = ctx.createLinearGradient(
      energyBarX, energyBarY,
      energyBarX, energyBarY + energyBarHeight
    );
    energyGradient.addColorStop(0, '#00FF88');
    energyGradient.addColorStop(1, '#00CC66');
    ctx.fillStyle = energyGradient;
    this.roundRect(ctx, energyBarX, energyBarY, energyBarWidth * energyRatio, energyBarHeight, 4);
    ctx.fill();
    
    if (energyPulse > 0) {
      ctx.shadowColor = '#00FF88';
      ctx.shadowBlur = 8 * energyPulse;
      ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
      this.roundRect(ctx, energyBarX, energyBarY, energyBarWidth * energyRatio, energyBarHeight, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    ctx.strokeStyle = '#4A6A9A';
    ctx.lineWidth = 1;
    this.roundRect(ctx, energyBarX, energyBarY, energyBarWidth, energyBarHeight, 4);
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('能量', energyBarX + energyBarWidth / 2, energyBarY + energyBarHeight / 2);
    
    const timerX = CANVAS_WIDTH - 100;
    const timerY = barHeight / 2;
    
    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('☄', timerX + 20, timerY);
    
    ctx.fillStyle = waveTimer < 10 ? '#FF6B6B' : '#FFFFFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(waveTimer.toFixed(1) + 's', timerX + 60, timerY);
    
    const waveNumX = CANVAS_WIDTH - 180;
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('第 ' + this.state.getWaveNumber() + ' 波', waveNumX, timerY);
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
