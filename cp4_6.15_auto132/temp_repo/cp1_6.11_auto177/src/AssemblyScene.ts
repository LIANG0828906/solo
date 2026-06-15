import { GameManager, Module, SlotType, PlacedModules } from './GameManager';

interface SlotInfo {
  type: SlotType;
  x: number;
  y: number;
  label: string;
}

interface ModuleItem {
  module: Module;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  width: number;
  height: number;
  hover: boolean;
}

interface PlacementAnimation {
  slot: SlotType;
  progress: number;
  success: boolean;
  shakeOffset: number;
  module: Module;
  startX: number;
  startY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class AssemblyScene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameManager: GameManager;
  
  private centerX: number = 0;
  private centerY: number = 0;
  
  private workbenchRadius: number = 250;
  private workbenchX: number = 0;
  private workbenchY: number = 0;
  
  private panelWidth: number = 200;
  private panelX: number = 0;
  private panelY: number = 0;
  
  private dashboardWidth: number = 180;
  private dashboardX: number = 0;
  private dashboardY: number = 0;
  
  private slots: SlotInfo[] = [];
  private moduleItems: ModuleItem[] = [];
  
  private draggingModule: ModuleItem | null = null;
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  
  private placementAnimations: PlacementAnimation[] = [];
  
  private steamParticles: Particle[] = [];
  
  private buttonX: number = 0;
  private buttonY: number = 0;
  private buttonWidth: number = 140;
  private buttonHeight: number = 45;
  private buttonHover: boolean = false;
  private buttonPressed: boolean = false;
  
  private slotPulsePhase: number = 0;
  
  private noiseCanvas: HTMLCanvasElement;
  private noiseCtx: CanvasRenderingContext2D;
  
  private gaugeNeedleAngles: { speed: number; turning: number; climb: number } = {
    speed: 0,
    turning: 0,
    climb: 0
  };
  private targetGaugeAngles: { speed: number; turning: number; climb: number } = {
    speed: 0,
    turning: 0,
    climb: 0
  };
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.gameManager = GameManager.getInstance();
    
    this.noiseCanvas = document.createElement('canvas');
    this.noiseCtx = this.noiseCanvas.getContext('2d')!;
    this.generateNoiseTexture();
    
    this.initializeSlots();
    this.initializeModules();
    this.resize();
  }
  
  private generateNoiseTexture(): void {
    this.noiseCanvas.width = 256;
    this.noiseCanvas.height = 256;
    const imageData = this.noiseCtx.createImageData(256, 256);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
    
    this.noiseCtx.putImageData(imageData, 0, 0);
  }
  
  private initializeSlots(): void {
    this.slots = [
      { type: 'leftWing', x: -120, y: -80, label: '左机翼' },
      { type: 'rightWing', x: 120, y: -80, label: '右机翼' },
      { type: 'engine', x: 0, y: 20, label: '引擎' },
      { type: 'propeller', x: 0, y: 120, label: '螺旋桨' }
    ];
  }
  
  private initializeModules(): void {
    this.moduleItems = [];
    const modules = this.gameManager.availableModules;
    const iconSize = 45;
    const padding = 15;
    const gap = 55;
    
    for (let i = 0; i < modules.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      
      this.moduleItems.push({
        module: modules[i],
        x: this.panelX + padding + col * (iconSize + 10),
        y: this.panelY + 60 + row * gap,
        baseX: this.panelX + padding + col * (iconSize + 10),
        baseY: this.panelY + 60 + row * gap,
        width: iconSize,
        height: iconSize,
        hover: false
      });
    }
  }
  
  public resize(): void {
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    
    this.workbenchX = this.centerX;
    this.workbenchY = this.centerY - 20;
    
    this.workbenchRadius = Math.min(250, Math.min(this.canvas.width, this.canvas.height) * 0.3);
    
    this.panelX = 20;
    this.panelY = this.centerY - 200;
    this.panelWidth = 200;
    
    this.dashboardX = this.canvas.width - this.dashboardWidth - 20;
    this.dashboardY = this.centerY - 180;
    
    this.slots = [
      { type: 'leftWing', x: this.workbenchX - this.workbenchRadius * 0.48, y: this.workbenchY - this.workbenchRadius * 0.3, label: '左机翼' },
      { type: 'rightWing', x: this.workbenchX + this.workbenchRadius * 0.48, y: this.workbenchY - this.workbenchRadius * 0.3, label: '右机翼' },
      { type: 'engine', x: this.workbenchX, y: this.workbenchY + this.workbenchRadius * 0.08, label: '引擎' },
      { type: 'propeller', x: this.workbenchX, y: this.workbenchY + this.workbenchRadius * 0.48, label: '螺旋桨' }
    ];
    
    this.buttonX = this.workbenchX - this.buttonWidth / 2;
    this.buttonY = this.workbenchY + this.workbenchRadius + 30;
    
    this.updateModulePositions();
  }
  
  private updateModulePositions(): void {
    const iconSize = 45;
    const padding = 15;
    const gap = 55;
    
    const categoryY: Record<string, number> = {
      'wing': this.panelY + 70,
      'engine': this.panelY + 180,
      'propeller': this.panelY + 290,
      'gear': this.panelY + 345
    };
    
    const categoryIndex: Record<string, number> = {
      'wing': 0,
      'engine': 0,
      'propeller': 0,
      'gear': 0
    };
    
    const placedModuleIds = new Set<string>();
    const placed = this.gameManager.placedModules;
    Object.values(placed).forEach(m => {
      if (m) placedModuleIds.add(m.id);
    });
    
    for (const item of this.moduleItems) {
      if (placedModuleIds.has(item.module.id)) {
        continue;
      }
      
      const type = item.module.type;
      const idx = categoryIndex[type];
      categoryIndex[type]++;
      
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      
      item.baseX = this.panelX + padding + col * (iconSize + 10);
      item.baseY = categoryY[type] + row * gap;
      item.x = item.baseX;
      item.y = item.baseY;
      item.width = iconSize;
      item.height = iconSize;
    }
  }
  
  public update(dt: number): void {
    this.slotPulsePhase += dt * 2;
    
    this.updatePlacementAnimations(dt);
    this.updateSteamParticles(dt);
    this.updateGaugeNeedles(dt);
    
    if (this.buttonHover && this.gameManager.isAllSlotsFilled()) {
      if (Math.random() < 0.3) {
        this.spawnSteamParticle();
      }
    }
  }
  
  private updateGaugeNeedles(dt: number): void {
    const stats = this.gameManager.aircraftStats;
    
    this.targetGaugeAngles.speed = (stats.speed / 100) * Math.PI - Math.PI / 2;
    this.targetGaugeAngles.turning = (stats.turning / 100) * Math.PI - Math.PI / 2;
    this.targetGaugeAngles.climb = (stats.climb / 100) * Math.PI - Math.PI / 2;
    
    const ease = 1 - Math.pow(0.01, dt);
    this.gaugeNeedleAngles.speed += (this.targetGaugeAngles.speed - this.gaugeNeedleAngles.speed) * ease;
    this.gaugeNeedleAngles.turning += (this.targetGaugeAngles.turning - this.gaugeNeedleAngles.turning) * ease;
    this.gaugeNeedleAngles.climb += (this.targetGaugeAngles.climb - this.gaugeNeedleAngles.climb) * ease;
  }
  
  private updatePlacementAnimations(dt: number): void {
    for (let i = this.placementAnimations.length - 1; i >= 0; i--) {
      const anim = this.placementAnimations[i];
      
      if (anim.success) {
        anim.progress += dt / 0.4;
        if (anim.progress >= 1) {
          this.placementAnimations.splice(i, 1);
        }
      } else {
        anim.progress += dt / 0.3;
        anim.shakeOffset = Math.sin(anim.progress * Math.PI * 10) * 5 * (1 - anim.progress);
        if (anim.progress >= 1) {
          this.placementAnimations.splice(i, 1);
        }
      }
    }
  }
  
  private updateSteamParticles(dt: number): void {
    for (let i = this.steamParticles.length - 1; i >= 0; i--) {
      const p = this.steamParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 20 * dt;
      p.life -= dt;
      p.size += 10 * dt;
      
      if (p.life <= 0) {
        this.steamParticles.splice(i, 1);
      }
    }
  }
  
  private spawnSteamParticle(): void {
    const side = Math.random() > 0.5 ? -1 : 1;
    this.steamParticles.push({
      x: this.buttonX + this.buttonWidth / 2 + side * 30,
      y: this.buttonY,
      vx: side * (10 + Math.random() * 20),
      vy: -30 - Math.random() * 20,
      life: 0.8,
      maxLife: 0.8,
      color: '#D3D3D3',
      size: 3
    });
  }
  
  public render(): void {
    const ctx = this.ctx;
    
    this.drawBackground();
    this.drawModulePanel();
    this.drawDashboard();
    this.drawWorkbench();
    this.drawSlots();
    this.drawPlacedModules();
    this.drawPlacementAnimations();
    this.drawModules();
    this.drawDraggingModule();
    this.drawStartButton();
    this.drawSteamParticles();
  }
  
  private drawBackground(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#4A3B2C';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const pattern = ctx.createPattern(this.noiseCanvas, 'repeat');
    if (pattern) {
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.globalAlpha = 1;
    }
  }
  
  private drawModulePanel(): void {
    const ctx = this.ctx;
    const x = this.panelX;
    const y = this.panelY;
    const w = this.panelWidth;
    const h = 400;
    
    ctx.fillStyle = '#5C4A3A';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#B8860B';
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('模块库', x + w / 2, y + 30);
    
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 45);
    ctx.lineTo(x + w - 10, y + 45);
    ctx.stroke();
    
    const categories = [
      { name: '机翼', y: y + 55 },
      { name: '引擎', y: y + 165 },
      { name: '螺旋桨', y: y + 275 },
      { name: '齿轮', y: y + 330 }
    ];
    
    ctx.fillStyle = '#D4A574';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'left';
    
    categories.forEach(cat => {
      ctx.fillText(cat.name, x + 15, cat.y);
    });
  }
  
  private drawModules(): void {
    const ctx = this.ctx;
    const placedModuleIds = new Set<string>();
    const placed = this.gameManager.placedModules;
    Object.values(placed).forEach(m => {
      if (m) placedModuleIds.add(m.id);
    });
    
    for (const item of this.moduleItems) {
      if (placedModuleIds.has(item.module.id)) continue;
      if (this.draggingModule === item) continue;
      
      this.drawModuleIcon(item.module, item.x + item.width / 2, item.y + item.height / 2, item.hover);
      
      ctx.fillStyle = '#D4A574';
      ctx.font = '10px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(item.module.name, item.x + item.width / 2, item.y + item.height + 12);
    }
  }
  
  private drawModuleIcon(module: Module, x: number, y: number, hover: boolean, scale: number = 1): void {
    const ctx = this.ctx;
    const size = 45 * scale;
    
    ctx.save();
    ctx.translate(x, y);
    
    if (hover) {
      ctx.shadowColor = '#C8944A';
      ctx.shadowBlur = 15;
      ctx.translate(0, -3);
    }
    
    ctx.fillStyle = '#3A2E20';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2 + 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    switch (module.type) {
      case 'wing':
        this.drawWingIcon(module.color, size);
        break;
      case 'engine':
        this.drawEngineIcon(module.color, size);
        break;
      case 'propeller':
        this.drawPropellerIcon(module.color, size);
        break;
      case 'gear':
        this.drawGearIcon(module.color, size);
        break;
    }
    
    ctx.restore();
  }
  
  private drawWingIcon(color: string, size: number): void {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    
    ctx.beginPath();
    ctx.moveTo(-size * 0.4, size * 0.1);
    ctx.lineTo(size * 0.4, size * 0.1);
    ctx.lineTo(size * 0.3, -size * 0.2);
    ctx.lineTo(-size * 0.3, -size * 0.2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.2);
    ctx.lineTo(0, size * 0.1);
    ctx.stroke();
  }
  
  private drawEngineIcon(color: string, size: number): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = color;
    ctx.fillRect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.6);
    
    ctx.fillStyle = '#4A4A4A';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(-size * 0.05, -size * 0.4, size * 0.1, size * 0.15);
  }
  
  private drawPropellerIcon(color: string, size: number): void {
    const ctx = this.ctx;
    const time = Date.now() / 500;
    
    ctx.save();
    ctx.rotate(time);
    
    ctx.fillStyle = color;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 2);
      ctx.beginPath();
      ctx.ellipse(0, -size * 0.25, size * 0.08, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  private drawGearIcon(color: string, size: number): void {
    const ctx = this.ctx;
    const teeth = 8;
    const innerR = size * 0.25;
    const outerR = size * 0.35;
    const time = Date.now() / 1000;
    
    ctx.save();
    ctx.rotate(time);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i * Math.PI) / teeth;
      const r = i % 2 === 0 ? outerR : innerR;
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
    
    ctx.fillStyle = '#3A2E20';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, innerR - 2, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  }
  
  private drawWorkbench(): void {
    const ctx = this.ctx;
    const x = this.workbenchX;
    const y = this.workbenchY;
    const r = this.workbenchRadius;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x + 5, y + 8, r, r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const gradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    gradient.addColorStop(0, '#8B7355');
    gradient.addColorStop(0.5, '#6B5B4F');
    gradient.addColorStop(1, '#4A3B2C');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#5C4033';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(x, y, r * (i / 5), 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#5C4033';
    const rivetCount = 12;
    const rivetR = r * 0.92;
    for (let i = 0; i < rivetCount; i++) {
      const angle = (i / rivetCount) * Math.PI * 2;
      const rx = x + Math.cos(angle) * rivetR;
      const ry = y + Math.sin(angle) * rivetR;
      
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#3A2E20';
      ctx.beginPath();
      ctx.arc(rx, ry, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5C4033';
    }
    
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.save();
    ctx.globalAlpha = 0.08;
    const pattern = ctx.createPattern(this.noiseCanvas, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  
  private drawSlots(): void {
    const ctx = this.ctx;
    const pulse = Math.sin(this.slotPulsePhase) * 0.3 + 0.7;
    
    for (const slot of this.slots) {
      const placed = this.gameManager.placedModules[slot.type];
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(slot.x + 2, slot.y + 2, 30, 0, Math.PI * 2);
      ctx.fill();
      
      const innerGradient = ctx.createRadialGradient(slot.x, slot.y, 0, slot.x, slot.y, 30);
      innerGradient.addColorStop(0, '#2A2015');
      innerGradient.addColorStop(1, '#3A2E20');
      
      ctx.fillStyle = innerGradient;
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 30, 0, Math.PI * 2);
      ctx.fill();
      
      if (!placed) {
        ctx.strokeStyle = `rgba(139, 115, 85, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(slot.x, slot.y, 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      ctx.fillStyle = '#8B7355';
      ctx.font = '11px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(slot.label, slot.x, slot.y + 45);
    }
  }
  
  private drawPlacedModules(): void {
    const placed = this.gameManager.placedModules;
    
    for (const slot of this.slots) {
      const module = placed[slot.type];
      if (module) {
        const hasAnim = this.placementAnimations.some(a => a.slot === slot.type && a.success);
        if (!hasAnim) {
          this.drawModuleIcon(module, slot.x, slot.y, false, 1.1);
        }
      }
    }
  }
  
  private drawPlacementAnimations(): void {
    const ctx = this.ctx;
    
    for (const anim of this.placementAnimations) {
      const slot = this.slots.find(s => s.type === anim.slot)!;
      
      if (anim.success) {
        const t = anim.progress;
        const ease = this.elasticOut(t);
        
        const currentX = anim.startX + (slot.x - anim.startX) * ease;
        const currentY = anim.startY + (slot.y - anim.startY) * ease;
        
        this.drawModuleIcon(anim.module, currentX, currentY, false, 1.1);
        
        if (t > 0.5) {
          const glowIntensity = (t - 0.5) * 2;
          ctx.save();
          ctx.strokeStyle = `rgba(255, 215, 0, ${glowIntensity})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 20 * glowIntensity;
          ctx.beginPath();
          ctx.arc(slot.x, slot.y, 32, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      } else {
        const currentX = anim.startX + anim.shakeOffset;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(currentX, anim.startY, 35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  
  private elasticOut(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
  
  private drawDashboard(): void {
    const ctx = this.ctx;
    const x = this.dashboardX;
    const y = this.dashboardY;
    const w = this.dashboardWidth;
    const h = 420;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, w, h, 8);
    ctx.fill();
    
    ctx.fillStyle = '#3A2E20';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    this.drawDecorativeBorder(x, y, w, h);
    
    ctx.fillStyle = '#B8860B';
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('飞行器属性', x + w / 2, y + 30);
    
    const gaugeY = y + 60;
    const gaugeSpacing = 90;
    
    this.drawGauge(x + w / 2, gaugeY, 60, '速度', this.gaugeNeedleAngles.speed, this.gameManager.aircraftStats.speed);
    this.drawGauge(x + w / 2, gaugeY + gaugeSpacing, 60, '转向', this.gaugeNeedleAngles.turning, this.gameManager.aircraftStats.turning);
    this.drawGauge(x + w / 2, gaugeY + gaugeSpacing * 2, 60, '爬升', this.gaugeNeedleAngles.climb, this.gameManager.aircraftStats.climb);
    
    const scoreY = gaugeY + gaugeSpacing * 2.8;
    ctx.fillStyle = '#D4A574';
    ctx.font = '14px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('总评分', x + w / 2, scoreY);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Georgia';
    ctx.fillText(this.gameManager.score.toString(), x + w / 2, scoreY + 25);
    
    this.drawHistory(x + 10, scoreY + 50, w - 20);
  }
  
  private drawDecorativeBorder(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;
    
    const cornerSize = 10;
    
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 15);
    ctx.lineTo(x + 5 + cornerSize, y + 5);
    ctx.lineTo(x + 15, y + 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + w - 5, y + 15);
    ctx.lineTo(x + w - 5 - cornerSize, y + 5);
    ctx.lineTo(x + w - 15, y + 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + 5, y + h - 15);
    ctx.lineTo(x + 5 + cornerSize, y + h - 5);
    ctx.lineTo(x + 15, y + h - 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + w - 5, y + h - 15);
    ctx.lineTo(x + w - 5 - cornerSize, y + h - 5);
    ctx.lineTo(x + w - 15, y + h - 5);
    ctx.stroke();
  }
  
  private drawGauge(cx: number, cy: number, radius: number, label: string, angle: number, value: number): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = '#2A2015';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 5, Math.PI, 0);
    ctx.stroke();
    
    ctx.strokeStyle = '#D4A574';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const tickAngle = Math.PI + (i / 10) * Math.PI;
      const innerR = radius - 10;
      const outerR = radius - 5;
      
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(tickAngle) * innerR, cy + Math.sin(tickAngle) * innerR);
      ctx.lineTo(cx + Math.cos(tickAngle) * outerR, cy + Math.sin(tickAngle) * outerR);
      ctx.stroke();
    }
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.moveTo(-3, 5);
    ctx.lineTo(0, -radius + 12);
    ctx.lineTo(3, 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    ctx.fillStyle = '#D4A574';
    ctx.font = '11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + 18);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 13px Georgia';
    ctx.fillText(value.toString(), cx, cy + 33);
  }
  
  private drawHistory(x: number, y: number, w: number): void {
    const ctx = this.ctx;
    const results = this.gameManager.raceResults;
    
    ctx.fillStyle = '#D4A574';
    ctx.font = '12px Georgia';
    ctx.textAlign = 'left';
    ctx.fillText('历史成绩', x, y - 5);
    
    if (results.length === 0) {
      ctx.fillStyle = '#6B5B4F';
      ctx.font = '10px Georgia';
      ctx.fillText('暂无记录', x, y + 20);
      return;
    }
    
    const itemHeight = 22;
    
    for (let i = 0; i < Math.min(results.length, 5); i++) {
      const result = results[i];
      const itemY = y + i * itemHeight;
      
      ctx.fillStyle = '#2E2E2E';
      ctx.beginPath();
      ctx.roundRect(x, itemY, w, itemHeight - 2, 4);
      ctx.fill();
      
      ctx.fillStyle = this.getRatingColor(result.rating);
      ctx.font = 'bold 12px Georgia';
      ctx.textAlign = 'left';
      ctx.fillText(result.rating, x + 8, itemY + 15);
      
      ctx.fillStyle = '#D4A574';
      ctx.font = '10px Georgia';
      ctx.textAlign = 'right';
      ctx.fillText(this.gameManager.formatTime(result.time), x + w - 8, itemY + 15);
    }
  }
  
  private getRatingColor(rating: string): string {
    switch (rating) {
      case 'S': return '#FFD700';
      case 'A': return '#C0C0C0';
      case 'B': return '#CD7F32';
      default: return '#D4A574';
    }
  }
  
  private drawDraggingModule(): void {
    if (this.draggingModule) {
      this.drawModuleIcon(
        this.draggingModule.module,
        this.draggingModule.x + this.draggingModule.width / 2,
        this.draggingModule.y + this.draggingModule.height / 2,
        true,
        1.2
      );
    }
  }
  
  private drawStartButton(): void {
    const ctx = this.ctx;
    const x = this.buttonX;
    const y = this.buttonY;
    const w = this.buttonWidth;
    const h = this.buttonHeight;
    const enabled = this.gameManager.isAllSlotsFilled();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 3, w, h, 8);
    ctx.fill();
    
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    if (enabled) {
      if (this.buttonPressed) {
        gradient.addColorStop(0, '#2E8B57');
        gradient.addColorStop(1, '#3CB371');
      } else if (this.buttonHover) {
        gradient.addColorStop(0, '#3CB371');
        gradient.addColorStop(1, '#5FDB8A');
      } else {
        gradient.addColorStop(0, '#2E8B57');
        gradient.addColorStop(1, '#3CB371');
      }
    } else {
      gradient.addColorStop(0, '#5C5C5C');
      gradient.addColorStop(1, '#4A4A4A');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    
    ctx.strokeStyle = enabled ? '#1E5631' : '#3A3A3A';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(x + 3, y + 3, w - 6, h / 2 - 3, 6);
    ctx.fill();
    
    if (this.buttonPressed) {
      ctx.translate(0, 2);
    }
    
    ctx.fillStyle = enabled ? '#FFFFFF' : '#888888';
    ctx.font = 'bold 16px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('启动引擎', x + w / 2, y + h / 2);
    ctx.textBaseline = 'alphabetic';
    
    if (this.buttonPressed) {
      ctx.translate(0, -2);
    }
  }
  
  private drawSteamParticles(): void {
    const ctx = this.ctx;
    
    for (const p of this.steamParticles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = `rgba(211, 211, 211, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  public handleMouseMove(x: number, y: number): void {
    for (const item of this.moduleItems) {
      const placed = Object.values(this.gameManager.placedModules).some(m => m?.id === item.module.id);
      if (placed || this.draggingModule === item) continue;
      
      item.hover = x >= item.x && x <= item.x + item.width &&
                   y >= item.y && y <= item.y + item.height;
    }
    
    this.buttonHover = x >= this.buttonX && x <= this.buttonX + this.buttonWidth &&
                       y >= this.buttonY && y <= this.buttonY + this.buttonHeight;
    
    if (this.draggingModule) {
      this.draggingModule.x = x - this.dragOffsetX;
      this.draggingModule.y = y - this.dragOffsetY;
    }
  }
  
  public handleMouseDown(x: number, y: number): void {
    if (this.buttonHover && this.gameManager.isAllSlotsFilled()) {
      this.buttonPressed = true;
      return;
    }
    
    for (const item of this.moduleItems) {
      const placed = Object.values(this.gameManager.placedModules).some(m => m?.id === item.module.id);
      if (placed) continue;
      
      if (x >= item.x && x <= item.x + item.width &&
          y >= item.y && y <= item.y + item.height) {
        this.draggingModule = item;
        this.dragOffsetX = x - item.x;
        this.dragOffsetY = y - item.y;
        break;
      }
    }
    
    if (!this.draggingModule) {
      for (const slot of this.slots) {
        const module = this.gameManager.placedModules[slot.type];
        if (module) {
          const dist = Math.sqrt((x - slot.x) ** 2 + (y - slot.y) ** 2);
          if (dist < 30) {
            this.gameManager.removeModule(slot.type);
            this.updateModulePositions();
            break;
          }
        }
      }
    }
  }
  
  public handleMouseUp(x: number, y: number): void {
    if (this.buttonPressed && this.buttonHover && this.gameManager.isAllSlotsFilled()) {
      this.buttonPressed = false;
      this.gameManager.startRace();
      return;
    }
    
    this.buttonPressed = false;
    
    if (this.draggingModule) {
      let placed = false;
      
      for (const slot of this.slots) {
        const dist = Math.sqrt((x - this.dragOffsetX - slot.x + this.draggingModule.width / 2) ** 2 +
                               (y - this.dragOffsetY - slot.y + this.draggingModule.height / 2) ** 2);
        
        if (dist < 40) {
          const success = this.gameManager.placeModule(slot.type, this.draggingModule.module);
          
          if (success) {
            this.placementAnimations.push({
              slot: slot.type,
              progress: 0,
              success: true,
              shakeOffset: 0,
              module: this.draggingModule.module,
              startX: this.draggingModule.x + this.draggingModule.width / 2,
              startY: this.draggingModule.y + this.draggingModule.height / 2
            });
          } else {
            this.placementAnimations.push({
              slot: slot.type,
              progress: 0,
              success: false,
              shakeOffset: 0,
              module: this.draggingModule.module,
              startX: this.draggingModule.baseX + this.draggingModule.width / 2,
              startY: this.draggingModule.baseY + this.draggingModule.height / 2
            });
            
            this.draggingModule.x = this.draggingModule.baseX;
            this.draggingModule.y = this.draggingModule.baseY;
          }
          
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        this.draggingModule.x = this.draggingModule.baseX;
        this.draggingModule.y = this.draggingModule.baseY;
      }
      
      this.draggingModule = null;
      this.updateModulePositions();
    }
  }
  
  public handleClick(x: number, y: number): void {
  }
}
