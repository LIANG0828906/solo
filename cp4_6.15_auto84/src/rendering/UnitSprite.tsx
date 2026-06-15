import { Container, Graphics } from 'pixi.js';
import { UnitData, ShipType, Faction, axialToPixel } from '../game/UnitData';
import { ParticleSystem } from './Particles';

const HEX_SIZE = 40;

interface UnitSpriteEntry {
  container: Container;
  shipGraphics: Graphics;
  ringGraphics: Graphics;
  unit: UnitData;
  particleTimer: number;
}

export class UnitSpriteRenderer {
  private container: Container;
  private sprites: Map<string, UnitSpriteEntry> = new Map();
  private particles: ParticleSystem;
  private tick: number = 0;
  private selectedId: string | null = null;
  private shakeOffset: { x: number; y: number } = { x: 0, y: 0 };
  private shakeDuration: number = 0;

  constructor(parent: Container) {
    this.container = new Container();
    this.particles = new ParticleSystem(this.container);
    parent.addChild(this.container);
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
    const { x, y } = axialToPixel(entry.unit.gridPos.q, entry.unit.gridPos.r, HEX_SIZE);
    this.particles.emitExplosion(x, y, entry.unit.faction === 'player' ? 0x00d4ff : 0xff4d2a);
    this.container.removeChild(entry.container);
    entry.container.destroy({ children: true });
    this.sprites.delete(unitId);
  }

  updateUnit(unit: UnitData): void {
    const entry = this.sprites.get(unit.id);
    if (!entry) return;
    entry.unit = unit;
    this.updatePosition(entry, unit);
  }

  moveUnit(unitId: string, fromQ: number, fromR: number, toQ: number, toR: number): void {
    const entry = this.sprites.get(unitId);
    if (!entry) return;
    const from = axialToPixel(fromQ, fromR, HEX_SIZE);
    const to = axialToPixel(toQ, toR, HEX_SIZE);
    entry.unit.gridPos = { q: toQ, r: toR };
    this.animateMovement(entry, from, to);
  }

  attackUnit(attackerId: string, targetId: string): void {
    const attacker = this.sprites.get(attackerId);
    const target = this.sprites.get(targetId);
    if (!attacker || !target) return;

    const fromPos = axialToPixel(attacker.unit.gridPos.q, attacker.unit.gridPos.r, HEX_SIZE);
    const toPos = axialToPixel(target.unit.gridPos.q, target.unit.gridPos.r, HEX_SIZE);
    const beamColor = attacker.unit.faction === 'player' ? 0x00d4ff : 0xff4d2a;

    this.particles.emitAttackBeam(fromPos.x, fromPos.y, toPos.x, toPos.y, beamColor);
    this.shakeDuration = 15;
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
      if (entry.ringGraphics.visible) {
        entry.ringGraphics.clear();
        const phase = this.tick * 0.05;
        const alpha = 0.4 + Math.sin(phase) * 0.2;
        entry.ringGraphics.lineStyle(2, 0xffffff, alpha);
        entry.ringGraphics.drawCircle(0, 0, 18 + Math.sin(phase) * 2);
        entry.ringGraphics.lineStyle(0);
      }

      entry.particleTimer++;
      if (entry.particleTimer % 3 === 0) {
        const trailColor = entry.unit.faction === 'player' ? 0x00d4ff : 0xff4d2a;
        const shipAngle = entry.unit.faction === 'player' ? Math.PI : 0;
        const localY = entry.unit.faction === 'player' ? -12 : 12;
        this.particles.emitEngineTrail(
          entry.container.x + this.shakeOffset.x,
          entry.container.y + localY + this.shakeOffset.y,
          trailColor,
          shipAngle,
        );
      }
    }

    this.particles.update();

    if (this.shakeDuration > 0) {
      this.shakeOffset.x = (Math.random() - 0.5) * this.shakeDuration * 0.8;
      this.shakeOffset.y = (Math.random() - 0.5) * this.shakeDuration * 0.8;
      this.shakeDuration--;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }

    this.container.x = this.shakeOffset.x;
    this.container.y = this.shakeOffset.y;
  }

  getContainer(): Container {
    return this.container;
  }

  getParticles(): ParticleSystem {
    return this.particles;
  }

  destroy(): void {
    this.particles.destroy();
    this.container.destroy({ children: true });
  }

  private createSpriteEntry(unit: UnitData): UnitSpriteEntry {
    const container = new Container();
    const shipGraphics = new Graphics();
    const ringGraphics = new Graphics();
    ringGraphics.visible = false;

    this.drawShip(shipGraphics, unit.type, unit.faction);

    container.addChild(shipGraphics);
    container.addChild(ringGraphics);

    return { container, shipGraphics, ringGraphics, unit, particleTimer: 0 };
  }

  private drawShip(g: Graphics, type: ShipType, faction: Faction): void {
    const color = faction === 'player' ? 0x00d4ff : 0xff4d2a;
    const darkColor = faction === 'player' ? 0x006688 : 0x882200;

    g.clear();

    switch (type) {
      case 'frigate':
        g.beginFill(color, 0.9);
        g.moveTo(0, -14);
        g.lineTo(-6, 10);
        g.lineTo(0, 6);
        g.lineTo(6, 10);
        g.closePath();
        g.endFill();
        g.beginFill(darkColor, 0.7);
        g.moveTo(0, -8);
        g.lineTo(-3, 6);
        g.lineTo(0, 3);
        g.lineTo(3, 6);
        g.closePath();
        g.endFill();
        g.lineStyle(1, color, 0.6);
        g.moveTo(-8, 4);
        g.lineTo(-6, 10);
        g.moveTo(8, 4);
        g.lineTo(6, 10);
        g.lineStyle(0);
        break;

      case 'cruiser':
        g.beginFill(color, 0.9);
        g.moveTo(0, -16);
        g.lineTo(-10, 8);
        g.lineTo(-6, 12);
        g.lineTo(0, 8);
        g.lineTo(6, 12);
        g.lineTo(10, 8);
        g.closePath();
        g.endFill();
        g.beginFill(darkColor, 0.7);
        g.moveTo(0, -10);
        g.lineTo(-5, 6);
        g.lineTo(0, 3);
        g.lineTo(5, 6);
        g.closePath();
        g.endFill();
        g.lineStyle(1, color, 0.5);
        g.moveTo(-12, 2);
        g.lineTo(-10, 8);
        g.moveTo(12, 2);
        g.lineTo(10, 8);
        g.lineStyle(0);
        g.beginFill(0xffffff, 0.3);
        g.drawCircle(0, -4, 3);
        g.endFill();
        break;

      case 'battleship':
        g.beginFill(color, 0.9);
        g.moveTo(0, -18);
        g.lineTo(-8, -4);
        g.lineTo(-14, 8);
        g.lineTo(-8, 12);
        g.lineTo(0, 8);
        g.lineTo(8, 12);
        g.lineTo(14, 8);
        g.lineTo(8, -4);
        g.closePath();
        g.endFill();
        g.beginFill(darkColor, 0.7);
        g.moveTo(0, -12);
        g.lineTo(-5, 0);
        g.lineTo(-8, 8);
        g.lineTo(0, 4);
        g.lineTo(8, 8);
        g.lineTo(5, 0);
        g.closePath();
        g.endFill();
        g.lineStyle(1, color, 0.5);
        g.moveTo(-16, 4);
        g.lineTo(-14, 8);
        g.moveTo(16, 4);
        g.lineTo(14, 8);
        g.lineStyle(0);
        g.beginFill(0xffffff, 0.4);
        g.drawCircle(0, -6, 4);
        g.endFill();
        g.lineStyle(1, 0xffffff, 0.3);
        g.drawCircle(0, -6, 6);
        g.lineStyle(0);
        break;
    }

    g.lineStyle(1.5, color, 0.8);
    g.moveTo(-3, -2);
    g.lineTo(3, -2);
    g.lineStyle(0);
  }

  private updatePosition(entry: UnitSpriteEntry, unit: UnitData): void {
    const { x, y } = axialToPixel(unit.gridPos.q, unit.gridPos.r, HEX_SIZE);
    entry.container.x = x;
    entry.container.y = y;
  }

  private animateMovement(entry: UnitSpriteEntry, from: { x: number; y: number }, to: { x: number; y: number }): void {
    const duration = 300;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      entry.container.x = from.x + (to.x - from.x) * eased;
      entry.container.y = from.y + (to.y - from.y) * eased;

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
}
