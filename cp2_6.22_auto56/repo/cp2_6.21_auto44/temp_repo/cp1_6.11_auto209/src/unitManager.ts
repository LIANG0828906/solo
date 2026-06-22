type Side = 'red' | 'blue';
type UnitType = 'infantry' | 'cavalry' | 'archer' | 'scout' | 'heavyInfantry' | 'lightCavalry' | 'crossbowman' | 'spy';

interface Unit {
  id: string;
  side: Side;
  type: UnitType;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isMoving: boolean;
  isAttacking: boolean;
  attackTargetId: string | null;
  attackTimer: number;
  strength: number;
  maxStrength: number;
  emoji: string;
  speed: number;
  baseSpeed: number;
  isSelected: boolean;
  isHovered: boolean;
  hoverScale: number;
  pulsePhase: number;
  shakePhase: number;
  shakeOffsetX: number;
  shakeOffsetY: number;
  rallyBuff: RallyBuff | null;
  formationTargetX: number | null;
  formationTargetY: number | null;
}

interface RallyBuff {
  duration: number;
  maxDuration: number;
  attackBonus: number;
  speedBonus: number;
  generalId: string;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  velocityY: number;
}

const TOKEN_SIZE = 40;
const TOKEN_RADIUS = TOKEN_SIZE / 2;
const BORDER_RADIUS = 8;
const SELECTION_COLOR = '#FFD700';
const SELECTION_WIDTH = 3;
const PULSE_DURATION = 1.5;
const HOVER_SCALE = 1.15;
const HOVER_DURATION = 0.2;
const ATTACK_DURATION = 5;
const SHAKE_FREQUENCY = 10;
const SHAKE_AMPLITUDE = 3;
const FLOATING_TEXT_DURATION = 1.2;
const RALLY_RANGE = 800;
const RALLY_DURATION = 20;
const RALLY_ATTACK_BONUS = 0.1;
const RALLY_SPEED_BONUS = 0.5;
const BUFF_BAR_WIDTH = 30;
const BUFF_BAR_HEIGHT = 4;
const BUFF_BAR_COLOR = '#7FFF00';

const UNIT_CONFIG: Record<UnitType, { emoji: string; strength: number; speed: number }> = {
  infantry: { emoji: '⚔️', strength: 200, speed: 60 },
  cavalry: { emoji: '🐎', strength: 100, speed: 120 },
  archer: { emoji: '🏹', strength: 150, speed: 70 },
  scout: { emoji: '🔍', strength: 50, speed: 150 },
  heavyInfantry: { emoji: '🛡️', strength: 200, speed: 50 },
  lightCavalry: { emoji: '🏇', strength: 100, speed: 130 },
  crossbowman: { emoji: '🎯', strength: 150, speed: 65 },
  spy: { emoji: '🕵️', strength: 50, speed: 140 },
};

const COUNTER_RELATIONS: Record<UnitType, UnitType | null> = {
  infantry: 'archer',
  cavalry: 'infantry',
  archer: 'cavalry',
  scout: null,
  heavyInfantry: 'crossbowman',
  lightCavalry: 'heavyInfantry',
  crossbowman: 'lightCavalry',
  spy: null,
};

const SIDE_COLORS: Record<Side, string> = {
  red: '#E74C3C',
  blue: '#3498DB',
};

export class UnitManager {
  private units: Map<string, Unit> = new Map();
  private floatingTexts: FloatingText[] = [];
  private nextId = 0;
  private terrainMultiplierCallback: ((x: number, y: number) => number) | null = null;
  private activeUnitsCount: number = 0;
  private maxFloatingTexts: number = 5;

  setTerrainMultiplierCallback(callback: (x: number, y: number) => number): void {
    this.terrainMultiplierCallback = callback;
  }

  createUnit(side: Side, type: UnitType, x: number, y: number): string {
    const config = UNIT_CONFIG[type];
    const id = `unit_${this.nextId++}`;
    const unit: Unit = {
      id,
      side,
      type,
      x,
      y,
      targetX: x,
      targetY: y,
      isMoving: false,
      isAttacking: false,
      attackTargetId: null,
      attackTimer: 0,
      strength: config.strength,
      maxStrength: config.strength,
      emoji: config.emoji,
      speed: config.speed,
      baseSpeed: config.speed,
      isSelected: false,
      isHovered: false,
      hoverScale: 1,
      pulsePhase: 0,
      shakePhase: 0,
      shakeOffsetX: 0,
      shakeOffsetY: 0,
      rallyBuff: null,
      formationTargetX: null,
      formationTargetY: null,
    };
    this.units.set(id, unit);
    return id;
  }

  moveUnit(unitId: string, targetX: number, targetY: number): void {
    const unit = this.units.get(unitId);
    if (!unit) return;
    unit.targetX = targetX;
    unit.targetY = targetY;
    unit.isMoving = true;
    unit.isAttacking = false;
    unit.attackTargetId = null;
    unit.formationTargetX = null;
    unit.formationTargetY = null;
  }

  attackUnit(attackerId: string, targetId: string): void {
    const attacker = this.units.get(attackerId);
    const target = this.units.get(targetId);
    if (!attacker || !target || attacker.side === target.side) return;
    attacker.isAttacking = true;
    attacker.attackTargetId = targetId;
    attacker.attackTimer = ATTACK_DURATION;
    attacker.isMoving = false;
    attacker.formationTargetX = null;
    attacker.formationTargetY = null;
  }

  orderRally(generalId: string): void {
    const general = this.units.get(generalId);
    if (!general) return;

    const alliedUnits = Array.from(this.units.values()).filter(
      (u) => u.side === general.side && u.id !== generalId
    );

    const unitsInRange = alliedUnits.filter((u) => {
      const dx = u.x - general.x;
      const dy = u.y - general.y;
      return Math.sqrt(dx * dx + dy * dy) <= RALLY_RANGE;
    });

    const formationPositions = this.calculateDiamondFormation(
      general.x,
      general.y,
      unitsInRange.length
    );

    unitsInRange.forEach((unit, index) => {
      unit.rallyBuff = {
        duration: RALLY_DURATION,
        maxDuration: RALLY_DURATION,
        attackBonus: RALLY_ATTACK_BONUS,
        speedBonus: RALLY_SPEED_BONUS,
        generalId,
      };
      unit.speed = unit.baseSpeed * (1 + RALLY_SPEED_BONUS);

      if (index < formationPositions.length) {
        const [fx, fy] = formationPositions[index];
        unit.formationTargetX = fx;
        unit.formationTargetY = fy;
        unit.targetX = fx;
        unit.targetY = fy;
        unit.isMoving = true;
      }
    });
  }

  private calculateDiamondFormation(centerX: number, centerY: number, count: number): [number, number][] {
    const positions: [number, number][] = [];
    const spacing = 50;
    let layer = 1;
    let placed = 0;

    while (placed < count) {
      const halfLayer = Math.floor(layer / 2);
      for (let i = -halfLayer; i <= halfLayer; i++) {
        const j = halfLayer - Math.abs(i);
        if (layer % 2 === 0) {
          positions.push([centerX + i * spacing, centerY + j * spacing]);
          placed++;
          if (placed >= count) break;
          if (j !== 0) {
            positions.push([centerX + i * spacing, centerY - j * spacing]);
            placed++;
            if (placed >= count) break;
          }
        } else {
          positions.push([centerX + i * spacing, centerY + j * spacing]);
          placed++;
          if (placed >= count) break;
          if (j !== 0) {
            positions.push([centerX + i * spacing, centerY - j * spacing]);
            placed++;
            if (placed >= count) break;
          }
        }
      }
      layer++;
    }

    return positions;
  }

  update(deltaTime: number): void {
    this.activeUnitsCount = this.units.size;
    const shakeFreq = this.activeUnitsCount > 30 ? 5 : SHAKE_FREQUENCY;
    this.maxFloatingTexts = this.activeUnitsCount > 30 ? 5 : 10;

    this.units.forEach((unit) => {
      if (unit.isHovered) {
        unit.hoverScale = Math.min(HOVER_SCALE, unit.hoverScale + deltaTime / HOVER_DURATION);
      } else {
        unit.hoverScale = Math.max(1, unit.hoverScale - deltaTime / HOVER_DURATION);
      }

      unit.pulsePhase = (unit.pulsePhase + deltaTime / PULSE_DURATION) % 1;

      if (unit.rallyBuff) {
        unit.rallyBuff.duration -= deltaTime;
        if (unit.rallyBuff.duration <= 0) {
          unit.rallyBuff = null;
          unit.speed = unit.baseSpeed;
        }
      }

      if (unit.isAttacking && unit.attackTargetId) {
        unit.attackTimer -= deltaTime;
        unit.shakePhase = (unit.shakePhase + deltaTime * shakeFreq) % 1;
        const shakeAngle = unit.shakePhase * Math.PI * 2;
        unit.shakeOffsetX = Math.cos(shakeAngle) * SHAKE_AMPLITUDE;
        unit.shakeOffsetY = Math.sin(shakeAngle) * SHAKE_AMPLITUDE;

        if (Math.random() < deltaTime * 2) {
          const damage = -(Math.floor(Math.random() * 5) + 1);
          const target = this.units.get(unit.attackTargetId);
          if (target) {
            const actualDamage = this.calculateDamage(unit, target, damage);
            target.strength = Math.max(0, target.strength + actualDamage);
            this.addFloatingText(target.x, target.y - TOKEN_RADIUS, `${actualDamage}`, '#FF0000');

            if (target.strength <= 0) {
              this.units.delete(target.id);
              unit.isAttacking = false;
              unit.attackTargetId = null;
            }
          }
        }

        if (unit.attackTimer <= 0) {
          unit.isAttacking = false;
          unit.attackTargetId = null;
          unit.shakeOffsetX = 0;
          unit.shakeOffsetY = 0;
        }
      } else {
        unit.shakeOffsetX = 0;
        unit.shakeOffsetY = 0;
      }

      if (unit.isMoving || unit.formationTargetX !== null) {
        const tx = unit.formationTargetX ?? unit.targetX;
        const ty = unit.formationTargetY ?? unit.targetY;
        const dx = tx - unit.x;
        const dy = ty - unit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
          const terrainMultiplier = this.getTerrainMultiplier(unit.x, unit.y);
          const moveSpeed = unit.speed * terrainMultiplier * deltaTime;
          if (dist <= moveSpeed) {
            unit.x = tx;
            unit.y = ty;
          } else {
            unit.x += (dx / dist) * moveSpeed;
            unit.y += (dy / dist) * moveSpeed;
          }
        } else {
          if (unit.formationTargetX !== null) {
            unit.formationTargetX = null;
            unit.formationTargetY = null;
          }
          unit.isMoving = false;
        }
      }
    });

    this.floatingTexts = this.floatingTexts.filter((text) => {
      text.life -= deltaTime;
      text.y += text.velocityY * deltaTime;
      return text.life > 0;
    });
  }

  private calculateDamage(attacker: Unit, defender: Unit, baseDamage: number): number {
    let damage = baseDamage;
    const counters = COUNTER_RELATIONS[attacker.type];
    if (counters === defender.type) {
      damage = Math.floor(damage * 1.5);
    }
    if (attacker.rallyBuff) {
      damage = Math.floor(damage * (1 + attacker.rallyBuff.attackBonus));
    }
    return damage;
  }

  private getTerrainMultiplier(x: number, y: number): number {
    if (this.terrainMultiplierCallback) {
      return this.terrainMultiplierCallback(x, y);
    }
    return 1;
  }

  private addFloatingText(x: number, y: number, text: string, color: string): void {
    if (this.floatingTexts.length >= this.maxFloatingTexts) {
      return;
    }
    this.floatingTexts.push({
      id: `text_${this.nextId++}`,
      x,
      y,
      text,
      color,
      life: FLOATING_TEXT_DURATION,
      maxLife: FLOATING_TEXT_DURATION,
      velocityY: -30,
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.units.forEach((unit) => {
      this.renderUnit(ctx, unit);
    });

    this.floatingTexts.forEach((text) => {
      const alpha = text.life / text.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = text.color;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.text, text.x, text.y);
      ctx.restore();
    });
  }

  private renderUnit(ctx: CanvasRenderingContext2D, unit: Unit): void {
    const scale = unit.hoverScale;
    const x = unit.x + unit.shakeOffsetX;
    const y = unit.y + unit.shakeOffsetY;
    const size = TOKEN_SIZE * scale;
    const radius = size / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.roundRect(-radius, -radius, size, size, BORDER_RADIUS * scale);
    ctx.closePath();

    if (unit.isSelected) {
      const pulseScale = 1 + Math.sin(unit.pulsePhase * Math.PI * 2) * 0.1;
      ctx.save();
      ctx.lineWidth = SELECTION_WIDTH;
      ctx.strokeStyle = SELECTION_COLOR;
      ctx.globalAlpha = 0.7 + Math.sin(unit.pulsePhase * Math.PI * 2) * 0.3;
      ctx.beginPath();
      ctx.roundRect(
        -radius * pulseScale - SELECTION_WIDTH,
        -radius * pulseScale - SELECTION_WIDTH,
        size * pulseScale + SELECTION_WIDTH * 2,
        size * pulseScale + SELECTION_WIDTH * 2,
        (BORDER_RADIUS + SELECTION_WIDTH) * scale
      );
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = SIDE_COLORS[unit.side];
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${20 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unit.emoji, 0, -4 * scale);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${10 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${unit.strength}`, 0, 10 * scale);

    if (unit.rallyBuff) {
      const barWidth = BUFF_BAR_WIDTH * scale;
      const barHeight = BUFF_BAR_HEIGHT * scale;
      const barX = -barWidth / 2;
      const barY = radius + 6 * scale;
      const progress = unit.rallyBuff.duration / unit.rallyBuff.maxDuration;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      ctx.fillStyle = BUFF_BAR_COLOR;
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    }

    ctx.restore();
  }

  selectUnit(unitId: string): void {
    this.units.forEach((u) => (u.isSelected = false));
    const unit = this.units.get(unitId);
    if (unit) {
      unit.isSelected = true;
    }
  }

  setHover(unitId: string, isHovered: boolean): void {
    const unit = this.units.get(unitId);
    if (unit) {
      unit.isHovered = isHovered;
    }
  }

  getUnitAt(x: number, y: number): string | null {
    for (const [id, unit] of this.units) {
      const dx = x - unit.x;
      const dy = y - unit.y;
      if (Math.sqrt(dx * dx + dy * dy) <= TOKEN_RADIUS) {
        return id;
      }
    }
    return null;
  }

  getUnit(unitId: string): Unit | undefined {
    return this.units.get(unitId);
  }

  getAllUnits(): Unit[] {
    return Array.from(this.units.values());
  }

  clearAllUnits(): void {
    this.units.clear();
    this.floatingTexts = [];
  }

  getActiveUnitsCount(): number {
    return this.units.size;
  }
}
