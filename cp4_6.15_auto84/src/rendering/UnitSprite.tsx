import { Container, Graphics } from 'pixi.js';
import { UnitData, ShipType, Faction, axialToPixel } from '../game/UnitData';

const HEX_SIZE = 40;

interface PooledParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  startSize: number;
  color: number;
  alpha: number;
  decay: number;
  active: boolean;
  type: 'engine' | 'explosion' | 'shockwave' | 'spark' | 'beam';
}

interface BeamEffect {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  duration: number;
  color: number;
  faction: Faction;
  active: boolean;
  hitSpawned: boolean;
}

interface ExplosionEffect {
  x: number;
  y: number;
  shockwaveRadius: number;
  shockwaveMaxRadius: number;
  shockwaveAlpha: number;
  color: number;
  active: boolean;
}

interface UnitSpriteEntry {
  container: Container;
  shipContainer: Container;
  shipGraphics: Graphics;
  shipGlowGraphics: Graphics;
  engineGlowGraphics: Graphics;
  ringGraphics: Graphics;
  unit: UnitData;
  engineParticleTimer: number;
  moveProgress: number;
  moveFrom: { x: number; y: number } | null;
  moveTo: { x: number; y: number } | null;
  moveDuration: number;
  moveStartTime: number;
}

const PARTICLE_POOL_SIZE = 500;

export class UnitSpriteRenderer {
  private container: Container;
  private effectsContainer: Container;
  private particleGraphics: Graphics;
  private beamGraphics: Graphics;
  private sprites: Map<string, UnitSpriteEntry> = new Map();
  private particlePool: PooledParticle[] = [];
  private activeParticles: PooledParticle[] = [];
  private beams: BeamEffect[] = [];
  private explosions: ExplosionEffect[] = [];
  private tick: number = 0;
  private selectedId: string | null = null;
  private shakeOffset: { x: number; y: number } = { x: 0, y: 0 };
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;

  constructor(parent: Container) {
    this.container = new Container();
    this.effectsContainer = new Container();
    this.particleGraphics = new Graphics();
    this.beamGraphics = new Graphics();
    this.container.addChild(this.effectsContainer);
    this.container.addChild(this.particleGraphics);
    this.container.addChild(this.beamGraphics);
    parent.addChild(this.container);
    this.initParticlePool();
  }

  private initParticlePool(): void {
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      this.particlePool.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0,
        size: 0, startSize: 0,
        color: 0, alpha: 0, decay: 0,
        active: false, type: 'engine',
      });
    }
  }

  private acquireParticle(): PooledParticle | null {
    for (let i = 0; i < this.particlePool.length; i++) {
      if (!this.particlePool[i].active) {
        const p = this.particlePool[i];
        p.active = true;
        this.activeParticles.push(p);
        return p;
      }
    }
    return null;
  }

  private releaseParticle(p: PooledParticle): void {
    p.active = false;
    const idx = this.activeParticles.indexOf(p);
    if (idx > -1) {
      this.activeParticles.splice(idx, 1);
    }
  }

  addUnit(unit: UnitData): void {
    if (this.sprites.has(unit.id)) return;
    const entry = this.createSpriteEntry(unit);
    this.sprites.set(unit.id, entry);
    this.container.addChild(entry.container);
    this.updatePosition(entry, unit);
  }

  removeUnit(unitId: string): void {
    const entry = this.sprites.get(unitId);
    if (!entry) return;
    const pos = axialToPixel(entry.unit.gridPos.q, entry.unit.gridPos.r, HEX_SIZE);
    this.spawnExplosion(pos.x, pos.y, entry.unit.faction);
    this.shakeDuration = 18;
    this.shakeIntensity = 6;
    this.container.removeChild(entry.container);
    entry.container.destroy({ children: true });
    this.sprites.delete(unitId);
  }

  updateUnit(unit: UnitData): void {
    const entry = this.sprites.get(unit.id);
    if (!entry) return;
    entry.unit = unit;
    this.updatePosition(entry, unit);
    this.redrawShip(entry);
  }

  moveUnit(unitId: string, fromQ: number, fromR: number, toQ: number, toR: number): void {
    const entry = this.sprites.get(unitId);
    if (!entry) return;
    const from = axialToPixel(fromQ, fromR, HEX_SIZE);
    const to = axialToPixel(toQ, toR, HEX_SIZE);
    entry.unit.gridPos = { q: toQ, r: toR };
    entry.moveFrom = from;
    entry.moveTo = to;
    entry.moveStartTime = Date.now();
    entry.moveDuration = 350;
  }

  attackUnit(attackerId: string, targetId: string): void {
    const attacker = this.sprites.get(attackerId);
    const target = this.sprites.get(targetId);
    if (!attacker || !target) return;

    const fromPos = this.getUnitWorldPos(attacker);
    const toPos = this.getUnitWorldPos(target);
    const beamColor = attacker.unit.faction === 'player' ? 0x00d4ff : 0xff4d2a;

    const beam: BeamEffect = {
      fromX: fromPos.x,
      fromY: fromPos.y,
      toX: toPos.x,
      toY: toPos.y,
      progress: 0,
      duration: 20,
      color: beamColor,
      faction: attacker.unit.faction,
      active: true,
      hitSpawned: false,
    };
    this.beams.push(beam);
  }

  setSelected(unitId: string | null): void {
    if (this.selectedId && this.sprites.has(this.selectedId)) {
      const old = this.sprites.get(this.selectedId)!;
      old.ringGraphics.visible = false;
    }
    this.selectedId = unitId;
    if (unitId && this.sprites.has(unitId)) {
      const entry = this.sprites.get(unitId)!;
      entry.ringGraphics.visible = true;
    }
  }

  update(): void {
    this.tick++;

    for (const [id, entry] of this.sprites) {
      this.updateMovement(entry);
      this.updateEngineParticles(entry);
      this.updateSelectionRing(entry);
    }

    this.updateBeams();
    this.updateExplosions();
    this.updateParticles();
    this.updateScreenShake();

    this.container.x = this.shakeOffset.x;
    this.container.y = this.shakeOffset.y;
  }

  getContainer(): Container {
    return this.container;
  }

  destroy(): void {
    this.activeParticles = [];
    this.particlePool = [];
    this.beams = [];
    this.explosions = [];
    this.container.destroy({ children: true });
  }

  private getUnitWorldPos(entry: UnitSpriteEntry): { x: number; y: number } {
    return { x: entry.container.x, y: entry.container.y };
  }

  private createSpriteEntry(unit: UnitData): UnitSpriteEntry {
    const container = new Container();
    const shipContainer = new Container();
    const shipGraphics = new Graphics();
    const shipGlowGraphics = new Graphics();
    const engineGlowGraphics = new Graphics();
    const ringGraphics = new Graphics();
    ringGraphics.visible = false;

    container.addChild(ringGraphics);
    container.addChild(engineGlowGraphics);
    container.addChild(shipGlowGraphics);
    container.addChild(shipContainer);
    shipContainer.addChild(shipGraphics);

    const entry: UnitSpriteEntry = {
      container,
      shipContainer,
      shipGraphics,
      shipGlowGraphics,
      engineGlowGraphics,
      ringGraphics,
      unit,
      engineParticleTimer: 0,
      moveProgress: 0,
      moveFrom: null,
      moveTo: null,
      moveStartTime: 0,
      moveDuration: 0,
    };

    this.redrawShip(entry);
    this.drawEngineGlow(entry);

    return entry;
  }

  private redrawShip(entry: UnitSpriteEntry): void {
    const { shipGraphics, shipGlowGraphics, unit } = entry;
    this.drawShip(shipGraphics, unit.type, unit.faction);
    this.drawShipGlow(shipGlowGraphics, unit.type, unit.faction);
  }

  private drawShip(g: Graphics, type: ShipType, faction: Faction): void {
    const primary = faction === 'player' ? 0x00d4ff : 0xff4d2a;
    const secondary = faction === 'player' ? 0x00aaff : 0xff8800;
    const dark = faction === 'player' ? 0x005577 : 0x772200;
    const darker = faction === 'player' ? 0x003344 : 0x441100;
    const highlight = 0xffffff;

    g.clear();

    const facing = faction === 'player' ? 1 : -1;

    switch (type) {
      case 'frigate':
        this.drawFrigate(g, primary, secondary, dark, darker, highlight, facing);
        break;
      case 'cruiser':
        this.drawCruiser(g, primary, secondary, dark, darker, highlight, facing);
        break;
      case 'battleship':
        this.drawBattleship(g, primary, secondary, dark, darker, highlight, facing);
        break;
    }
  }

  private drawFrigate(
    g: Graphics,
    primary: number,
    secondary: number,
    dark: number,
    darker: number,
    highlight: number,
    facing: number,
  ): void {
    const f = facing;

    g.beginFill(primary, 0.95);
    g.moveTo(14 * f, 0);
    g.lineTo(-8 * f, -9);
    g.lineTo(-10 * f, 0);
    g.lineTo(-8 * f, 9);
    g.closePath();
    g.endFill();

    g.beginFill(secondary, 0.8);
    g.moveTo(10 * f, 0);
    g.lineTo(-4 * f, -5);
    g.lineTo(-6 * f, 0);
    g.lineTo(-4 * f, 5);
    g.closePath();
    g.endFill();

    g.beginFill(dark, 0.9);
    g.moveTo(-8 * f, -9);
    g.lineTo(-14 * f, -6);
    g.lineTo(-14 * f, 6);
    g.lineTo(-8 * f, 9);
    g.closePath();
    g.endFill();

    g.beginFill(darker, 0.8);
    g.moveTo(-10 * f, -5);
    g.lineTo(-14 * f, -3);
    g.lineTo(-14 * f, 3);
    g.lineTo(-10 * f, 5);
    g.closePath();
    g.endFill();

    g.beginFill(highlight, 0.4);
    g.drawCircle(2 * f, -2, 2);
    g.endFill();

    g.lineStyle(0.8, highlight, 0.3);
    g.moveTo(8 * f, -3);
    g.lineTo(2 * f, -6);
    g.moveTo(8 * f, 3);
    g.lineTo(2 * f, 6);
    g.lineStyle(0);

    g.lineStyle(1, primary, 0.6);
    g.moveTo(-8 * f, -9);
    g.lineTo(14 * f, 0);
    g.lineTo(-8 * f, 9);
    g.lineStyle(0);
  }

  private drawCruiser(
    g: Graphics,
    primary: number,
    secondary: number,
    dark: number,
    darker: number,
    highlight: number,
    facing: number,
  ): void {
    const f = facing;

    g.beginFill(primary, 0.95);
    g.moveTo(16 * f, 0);
    g.lineTo(8 * f, -8);
    g.lineTo(-6 * f, -11);
    g.lineTo(-12 * f, -6);
    g.lineTo(-12 * f, 6);
    g.lineTo(-6 * f, 11);
    g.lineTo(8 * f, 8);
    g.closePath();
    g.endFill();

    g.beginFill(secondary, 0.75);
    g.moveTo(12 * f, 0);
    g.lineTo(6 * f, -5);
    g.lineTo(-2 * f, -7);
    g.lineTo(-8 * f, -4);
    g.lineTo(-8 * f, 4);
    g.lineTo(-2 * f, 7);
    g.lineTo(6 * f, 5);
    g.closePath();
    g.endFill();

    g.beginFill(dark, 0.9);
    g.moveTo(-12 * f, -6);
    g.lineTo(-18 * f, -4);
    g.lineTo(-18 * f, 4);
    g.lineTo(-12 * f, 6);
    g.closePath();
    g.endFill();

    g.beginFill(darker, 0.85);
    g.moveTo(-14 * f, -3);
    g.lineTo(-18 * f, -2);
    g.lineTo(-18 * f, 2);
    g.lineTo(-14 * f, 3);
    g.closePath();
    g.endFill();

    g.beginFill(highlight, 0.35);
    g.drawCircle(4 * f, -2, 3);
    g.endFill();

    g.lineStyle(0.8, highlight, 0.25);
    g.moveTo(6 * f, -5);
    g.lineTo(0 * f, -8);
    g.moveTo(6 * f, 5);
    g.lineTo(0 * f, 8);
    g.lineStyle(0);

    g.beginFill(dark, 0.7);
    g.drawRect(-4 * f, -11, 4 * f, 3);
    g.drawRect(-4 * f, 8, 4 * f, 3);
    g.endFill();

    g.lineStyle(1, primary, 0.5);
    g.moveTo(-12 * f, -6);
    g.lineTo(8 * f, -8);
    g.lineTo(16 * f, 0);
    g.lineTo(8 * f, 8);
    g.lineTo(-12 * f, 6);
    g.lineStyle(0);
  }

  private drawBattleship(
    g: Graphics,
    primary: number,
    secondary: number,
    dark: number,
    darker: number,
    highlight: number,
    facing: number,
  ): void {
    const f = facing;

    g.beginFill(primary, 0.95);
    g.moveTo(20 * f, 0);
    g.lineTo(12 * f, -6);
    g.lineTo(6 * f, -12);
    g.lineTo(-4 * f, -14);
    g.lineTo(-12 * f, -10);
    g.lineTo(-16 * f, -4);
    g.lineTo(-16 * f, 4);
    g.lineTo(-12 * f, 10);
    g.lineTo(-4 * f, 14);
    g.lineTo(6 * f, 12);
    g.lineTo(12 * f, 6);
    g.closePath();
    g.endFill();

    g.beginFill(secondary, 0.7);
    g.moveTo(16 * f, 0);
    g.lineTo(10 * f, -4);
    g.lineTo(4 * f, -8);
    g.lineTo(-2 * f, -9);
    g.lineTo(-8 * f, -6);
    g.lineTo(-10 * f, -3);
    g.lineTo(-10 * f, 3);
    g.lineTo(-8 * f, 6);
    g.lineTo(-2 * f, 9);
    g.lineTo(4 * f, 8);
    g.lineTo(10 * f, 4);
    g.closePath();
    g.endFill();

    g.beginFill(dark, 0.9);
    g.moveTo(-16 * f, -4);
    g.lineTo(-22 * f, -3);
    g.lineTo(-22 * f, 3);
    g.lineTo(-16 * f, 4);
    g.closePath();
    g.endFill();

    g.beginFill(darker, 0.85);
    g.moveTo(-18 * f, -2);
    g.lineTo(-22 * f, -1.5);
    g.lineTo(-22 * f, 1.5);
    g.lineTo(-18 * f, 2);
    g.closePath();
    g.endFill();

    g.beginFill(highlight, 0.4);
    g.drawCircle(6 * f, -3, 4);
    g.endFill();

    g.lineStyle(1, highlight, 0.3);
    g.drawCircle(6 * f, -3, 6);
    g.lineStyle(0);

    g.beginFill(dark, 0.8);
    g.drawRect(2 * f, -14, 6 * f, 3);
    g.drawRect(2 * f, 11, 6 * f, 3);
    g.endFill();

    g.beginFill(secondary, 0.6);
    g.drawCircle(-2 * f, -11, 2);
    g.drawCircle(-2 * f, 11, 2);
    g.endFill();

    g.lineStyle(1, primary, 0.5);
    g.moveTo(-16 * f, -4);
    g.lineTo(-12 * f, -10);
    g.lineTo(6 * f, -12);
    g.lineTo(12 * f, -6);
    g.lineTo(20 * f, 0);
    g.lineTo(12 * f, 6);
    g.lineTo(6 * f, 12);
    g.lineTo(-12 * f, 10);
    g.lineTo(-16 * f, 4);
    g.lineStyle(0);
  }

  private drawShipGlow(g: Graphics, type: ShipType, faction: Faction): void {
    const color = faction === 'player' ? 0x00d4ff : 0xff4d2a;
    g.clear();

    let size = 12;
    if (type === 'cruiser') size = 16;
    if (type === 'battleship') size = 22;

    for (let i = 3; i >= 1; i--) {
      g.beginFill(color, 0.08 / i);
      g.drawCircle(0, 0, size + i * 4);
      g.endFill();
    }
  }

  private drawEngineGlow(entry: UnitSpriteEntry): void {
    const { engineGlowGraphics, unit } = entry;
    const color = unit.faction === 'player' ? 0x00d4ff : 0xff4d2a;
    const f = unit.faction === 'player' ? -1 : 1;

    engineGlowGraphics.clear();

    let offset = 10;
    let width = 6;
    if (unit.type === 'cruiser') { offset = 14; width = 8; }
    if (unit.type === 'battleship') { offset = 18; width = 10; }

    for (let i = 4; i >= 1; i--) {
      engineGlowGraphics.beginFill(color, 0.12 / i);
      engineGlowGraphics.drawEllipse(offset * f, 0, 8 * i, width * i);
      engineGlowGraphics.endFill();
    }

    engineGlowGraphics.beginFill(color, 0.6);
    engineGlowGraphics.drawEllipse(offset * f, 0, 4, width * 0.6);
    engineGlowGraphics.endFill();
  }

  private updatePosition(entry: UnitSpriteEntry, unit: UnitData): void {
    const { x, y } = axialToPixel(unit.gridPos.q, unit.gridPos.r, HEX_SIZE);
    entry.container.x = x;
    entry.container.y = y;
  }

  private updateMovement(entry: UnitSpriteEntry): void {
    if (!entry.moveFrom || !entry.moveTo) return;

    const elapsed = Date.now() - entry.moveStartTime;
    const t = Math.min(elapsed / entry.moveDuration, 1);
    const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    entry.container.x = entry.moveFrom.x + (entry.moveTo.x - entry.moveFrom.x) * eased;
    entry.container.y = entry.moveFrom.y + (entry.moveTo.y - entry.moveFrom.y) * eased;

    if (t >= 1) {
      entry.moveFrom = null;
      entry.moveTo = null;
    }
  }

  private updateEngineParticles(entry: UnitSpriteEntry): void {
    entry.engineParticleTimer++;
    const emitRate = entry.unit.type === 'battleship' ? 1 : entry.unit.type === 'cruiser' ? 1 : 2;

    if (entry.engineParticleTimer % emitRate === 0) {
      const pos = this.getUnitWorldPos(entry);
      const f = entry.unit.faction === 'player' ? -1 : 1;
      const baseY = pos.y;
      const baseX = pos.x;

      let engineOffset = 10;
      let spread = 3;
      if (entry.unit.type === 'cruiser') { engineOffset = 14; spread = 5; }
      if (entry.unit.type === 'battleship') { engineOffset = 18; spread = 7; }

      const particleCount = entry.unit.type === 'battleship' ? 3 : entry.unit.type === 'cruiser' ? 2 : 1;
      const color1 = entry.unit.faction === 'player' ? 0x00d4ff : 0xff4d2a;
      const color2 = entry.unit.faction === 'player' ? 0x00aaff : 0xff8800;

      for (let i = 0; i < particleCount; i++) {
        const p = this.acquireParticle();
        if (!p) continue;

        const yOffset = (Math.random() - 0.5) * spread;
        p.x = baseX + engineOffset * f + (Math.random() - 0.5) * 3;
        p.y = baseY + yOffset;
        p.vx = f * (1.5 + Math.random() * 2);
        p.vy = (Math.random() - 0.5) * 0.8;
        p.life = 20 + Math.random() * 15;
        p.maxLife = 35;
        p.startSize = 3 + Math.random() * 3;
        p.size = p.startSize;
        p.color = Math.random() > 0.5 ? color1 : color2;
        p.alpha = 0.9;
        p.decay = 0.03 + Math.random() * 0.02;
        p.type = 'engine';
        p.active = true;
      }
    }
  }

  private updateSelectionRing(entry: UnitSpriteEntry): void {
    if (!entry.ringGraphics.visible) return;

    const g = entry.ringGraphics;
    const phase = this.tick * 0.06;
    const rotPhase = this.tick * 0.015;

    g.clear();

    const innerSize = 22 + Math.sin(phase) * 2;
    const outerSize = 28 + Math.sin(phase + 0.5) * 3;

    this.drawHexRing(g, innerSize, 0xffffff, 0.9 + Math.sin(phase) * 0.1, 2.5, rotPhase);
    this.drawHexRing(g, outerSize, 0xffffff, 0.3 + Math.sin(phase + 0.3) * 0.15, 1.2, -rotPhase * 0.7);

    const pulseSize = 32 + (this.tick % 60) / 60 * 8;
    const pulseAlpha = Math.max(0, 0.3 - (this.tick % 60) / 60 * 0.3);
    this.drawHexRing(g, pulseSize, 0xffffff, pulseAlpha, 1, rotPhase * 0.5);
  }

  private drawHexRing(g: Graphics, size: number, color: number, alpha: number, width: number, rotation: number): void {
    g.lineStyle(width, color, alpha);
    g.moveTo(size * Math.cos(rotation), size * Math.sin(rotation));
    for (let i = 1; i <= 6; i++) {
      const angle = rotation + (Math.PI * 2 * i) / 6;
      g.lineTo(size * Math.cos(angle), size * Math.sin(angle));
    }
    g.lineStyle(0);
  }

  private updateBeams(): void {
    this.beamGraphics.clear();

    for (let i = this.beams.length - 1; i >= 0; i--) {
      const beam = this.beams[i];
      if (!beam.active) {
        this.beams.splice(i, 1);
        continue;
      }

      beam.progress += 1 / beam.duration;

      if (beam.progress >= 1) {
        beam.progress = 1;
        beam.active = false;

        if (!beam.hitSpawned) {
          beam.hitSpawned = true;
          this.spawnExplosion(beam.toX, beam.toY, beam.faction);
          this.shakeDuration = 18;
          this.shakeIntensity = 5;
        }
      }

      const currentEndX = beam.fromX + (beam.toX - beam.fromX) * beam.progress;
      const currentEndY = beam.fromY + (beam.toY - beam.fromY) * beam.progress;

      const dx = beam.toX - beam.fromX;
      const dy = beam.toY - beam.fromY;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = dx / len;
      const ny = dy / len;

      const beamLength = Math.min(len * beam.progress, len * 0.6);
      const startX = currentEndX - nx * beamLength;
      const startY = currentEndY - ny * beamLength;

      for (let layer = 3; layer >= 1; layer--) {
        const width = 8 - layer * 2;
        const alpha = 0.15 + (3 - layer) * 0.1;
        this.drawBeamSegment(this.beamGraphics, startX, startY, currentEndX, currentEndY, width, beam.color, alpha);
      }

      this.drawBeamSegment(this.beamGraphics, startX, startY, currentEndX, currentEndY, 2, 0xffffff, 0.9);

      const headGlowSize = 6 + Math.sin(this.tick * 0.5) * 2;
      for (let j = 3; j >= 1; j--) {
        this.beamGraphics.beginFill(beam.color, 0.2 / j);
        this.beamGraphics.drawCircle(currentEndX, currentEndY, headGlowSize * j);
        this.beamGraphics.endFill();
      }
      this.beamGraphics.beginFill(0xffffff, 0.8);
      this.beamGraphics.drawCircle(currentEndX, currentEndY, 3);
      this.beamGraphics.endFill();

      if (Math.random() > 0.6) {
        const p = this.acquireParticle();
        if (p) {
          p.x = currentEndX + (Math.random() - 0.5) * 8;
          p.y = currentEndY + (Math.random() - 0.5) * 8;
          p.vx = (Math.random() - 0.5) * 2;
          p.vy = (Math.random() - 0.5) * 2;
          p.life = 10 + Math.random() * 8;
          p.maxLife = 18;
          p.startSize = 2 + Math.random() * 2;
          p.size = p.startSize;
          p.color = beam.color;
          p.alpha = 0.8;
          p.decay = 0.08;
          p.type = 'spark';
          p.active = true;
        }
      }
    }
  }

  private drawBeamSegment(g: Graphics, x1: number, y1: number, x2: number, y2: number, width: number, color: number, alpha: number): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const nx = -dy / len;
    const ny = dx / len;

    g.beginFill(color, alpha);
    g.moveTo(x1 + nx * width, y1 + ny * width);
    g.lineTo(x2 + nx * width * 0.5, y2 + ny * width * 0.5);
    g.lineTo(x2 - nx * width * 0.5, y2 - ny * width * 0.5);
    g.lineTo(x1 - nx * width, y1 - ny * width);
    g.closePath();
    g.endFill();
  }

  private spawnExplosion(x: number, y: number, faction: Faction): void {
    const explosion: ExplosionEffect = {
      x,
      y,
      shockwaveRadius: 5,
      shockwaveMaxRadius: 35,
      shockwaveAlpha: 0.8,
      color: faction === 'player' ? 0x00d4ff : 0xff4d2a,
      active: true,
    };
    this.explosions.push(explosion);

    const particleCount = 25 + Math.floor(Math.random() * 10);
    const colors = [
      0xffffff,
      0xffffaa,
      faction === 'player' ? 0x00d4ff : 0xff4d2a,
      faction === 'player' ? 0x0088cc : 0xff8800,
      faction === 'player' ? 0x005577 : 0xcc3300,
    ];

    for (let i = 0; i < particleCount; i++) {
      const p = this.acquireParticle();
      if (!p) continue;

      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.6;
      const speed = 2 + Math.random() * 4;
      const colorIdx = Math.floor(Math.random() * colors.length);

      p.x = x + (Math.random() - 0.5) * 6;
      p.y = y + (Math.random() - 0.5) * 6;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 25 + Math.random() * 20;
      p.maxLife = 45;
      p.startSize = 2 + Math.random() * 4;
      p.size = p.startSize;
      p.color = colors[colorIdx];
      p.alpha = 1;
      p.decay = 0.025 + Math.random() * 0.02;
      p.type = 'explosion';
      p.active = true;
    }

    for (let i = 0; i < 8; i++) {
      const p = this.acquireParticle();
      if (!p) continue;

      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 3;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 15 + Math.random() * 10;
      p.maxLife = 25;
      p.startSize = 1.5 + Math.random() * 2;
      p.size = p.startSize;
      p.color = 0xffffff;
      p.alpha = 1;
      p.decay = 0.05;
      p.type = 'spark';
      p.active = true;
    }
  }

  private updateExplosions(): void {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      if (!exp.active) {
        this.explosions.splice(i, 1);
        continue;
      }

      const t = exp.shockwaveRadius / exp.shockwaveMaxRadius;
      exp.shockwaveRadius += 2.5;
      exp.shockwaveAlpha = Math.max(0, 0.7 * (1 - t));

      if (exp.shockwaveRadius >= exp.shockwaveMaxRadius) {
        exp.active = false;
      }

      this.particleGraphics.lineStyle(2, exp.color, exp.shockwaveAlpha);
      this.particleGraphics.drawCircle(exp.x, exp.y, exp.shockwaveRadius);
      this.particleGraphics.lineStyle(0);

      if (t < 0.5) {
        for (let j = 2; j >= 1; j--) {
          this.particleGraphics.beginFill(exp.color, exp.shockwaveAlpha * 0.3 / j);
          this.particleGraphics.drawCircle(exp.x, exp.y, exp.shockwaveRadius * 0.5 * j);
          this.particleGraphics.endFill();
        }
      }
    }
  }

  private updateParticles(): void {
    this.particleGraphics.clear();

    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      if (!p.active) continue;

      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.size = Math.max(0.5, p.startSize * p.alpha);

      if (p.life <= 0 || p.alpha <= 0) {
        this.releaseParticle(p);
        continue;
      }

      if (p.type === 'engine' || p.type === 'explosion' || p.type === 'spark') {
        for (let layer = 2; layer >= 1; layer--) {
          this.particleGraphics.beginFill(p.color, p.alpha * 0.3 / layer);
          this.particleGraphics.drawCircle(p.x, p.y, p.size * (layer + 1));
          this.particleGraphics.endFill();
        }

        this.particleGraphics.beginFill(p.color, p.alpha);
        this.particleGraphics.drawCircle(p.x, p.y, p.size);
        this.particleGraphics.endFill();
      }
    }
  }

  private updateScreenShake(): void {
    if (this.shakeDuration > 0) {
      const decayFactor = this.shakeDuration / 18;
      const intensity = this.shakeIntensity * decayFactor;
      this.shakeOffset.x = (Math.random() - 0.5) * intensity;
      this.shakeOffset.y = (Math.random() - 0.5) * intensity;
      this.shakeDuration--;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }
  }
}
