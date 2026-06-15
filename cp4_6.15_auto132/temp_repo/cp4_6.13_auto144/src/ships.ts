export type ShipType = 'flagship' | 'frigate' | 'destroyer' | 'scout';

export type FormationType = 'vee' | 'line' | 'ring';

export interface Position {
  x: number;
  y: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export const SHIP_COLORS: Record<ShipType, string> = {
  flagship: '#FFD700',
  frigate: '#4A90D9',
  destroyer: '#4ADE80',
  scout: '#A855F7'
};

export const FORMATION_NAMES: Record<FormationType, string> = {
  vee: 'V字形',
  line: '一字横排',
  ring: '环形包围'
};

const SHIP_BASE_SPEED = 2.5;

const SHIP_SPEED_MULTIPLIERS: Record<ShipType, number> = {
  flagship: 1.0,
  frigate: 1.1,
  destroyer: 1.0,
  scout: 1.2
};

const SHIP_SIZES: Record<ShipType, number> = {
  flagship: 18,
  frigate: 12,
  destroyer: 14,
  scout: 10
};

export class Ship {
  public x: number;
  public y: number;
  public targetX: number;
  public targetY: number;
  public type: ShipType;
  public angle: number;
  public trail: TrailPoint[] = [];
  public flameParticles: FlameParticle[] = [];
  public formationOffsetX: number = 0;
  public formationOffsetY: number = 0;
  public jitterPhase: number;
  public index: number;
  public moveTargetX: number;
  public moveTargetY: number;

  constructor(x: number, y: number, type: ShipType, index: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.moveTargetX = x;
    this.moveTargetY = y;
    this.type = type;
    this.angle = -Math.PI / 2;
    this.jitterPhase = Math.random() * Math.PI * 2;
    this.index = index;
  }

  public get speed(): number {
    return SHIP_BASE_SPEED * SHIP_SPEED_MULTIPLIERS[this.type];
  }

  public get size(): number {
    return SHIP_SIZES[this.type];
  }

  public get color(): string {
    return SHIP_COLORS[this.type];
  }

  public setFormationOffset(offsetX: number, offsetY: number): void {
    this.formationOffsetX = offsetX;
    this.formationOffsetY = offsetY;
  }

  public update(flagshipX: number, flagshipY: number, flagshipAngle: number, isMoving: boolean, deltaTime: number, ringCenterX?: number, ringCenterY?: number): void {
    let flagshipMoving = false;

    if (this.type === 'flagship') {
      const dx = this.moveTargetX - this.x;
      const dy = this.moveTargetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1) {
        flagshipMoving = true;
        this.angle = Math.atan2(dy, dx);
        const moveSpeed = this.speed * (deltaTime / 16.67);
        if (dist < moveSpeed) {
          this.x = this.moveTargetX;
          this.y = this.moveTargetY;
        } else {
          this.x += (dx / dist) * moveSpeed;
          this.y += (dy / dist) * moveSpeed;
        }
      }
    } else {
      let idealX: number;
      let idealY: number;

      if (ringCenterX !== undefined && ringCenterY !== undefined) {
        idealX = this.formationOffsetX + ringCenterX;
        idealY = this.formationOffsetY + ringCenterY;
      } else {
        const cos = Math.cos(flagshipAngle);
        const sin = Math.sin(flagshipAngle);
        const rotOffsetX = this.formationOffsetX * cos - this.formationOffsetY * sin;
        const rotOffsetY = this.formationOffsetX * sin + this.formationOffsetY * cos;
        idealX = flagshipX + rotOffsetX;
        idealY = flagshipY + rotOffsetY;
      }

      if (isMoving) {
        this.jitterPhase += 0.08 * (deltaTime / 16.67);
        const jitterAmount = this.type === 'scout' ? 0.8 : this.type === 'frigate' ? 0.5 : this.type === 'destroyer' ? 0.4 : 0;
        const jitterX = Math.sin(this.jitterPhase) * jitterAmount;
        const jitterY = Math.cos(this.jitterPhase * 0.7) * jitterAmount;

        idealX += jitterX;
        idealY += jitterY;
      }

      const dx = idealX - this.x;
      const dy = idealY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (isMoving && dist > 0.5) {
        this.angle = Math.atan2(dy, dx);
        const moveSpeed = this.speed * (deltaTime / 16.67);
        if (dist < moveSpeed) {
          this.x = idealX;
          this.y = idealY;
        } else {
          this.x += (dx / dist) * moveSpeed;
          this.y += (dy / dist) * moveSpeed;
        }
      } else if (!isMoving && dist > 1) {
        const moveSpeed = this.speed * 0.5 * (deltaTime / 16.67);
        if (dist < moveSpeed) {
          this.x = idealX;
          this.y = idealY;
        } else {
          this.x += (dx / dist) * moveSpeed;
          this.y += (dy / dist) * moveSpeed;
        }
      }
    }

    if (isMoving || flagshipMoving) {
      this.trail.push({ x: this.x, y: this.y, alpha: 0.5 });
    }

    if (this.trail.length > 40) {
      this.trail.shift();
    }

    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].alpha -= 0.012 * (deltaTime / 16.67);
      if (this.trail[i].alpha <= 0) {
        this.trail.splice(i, 1);
      }
    }

    this.updateFlameParticles(deltaTime);
  }

  private updateFlameParticles(deltaTime: number): void {
    if (Math.random() < 0.6) {
      const backAngle = this.angle + Math.PI;
      const offsetDist = this.size * 0.5;
      const px = this.x + Math.cos(backAngle) * offsetDist + (Math.random() - 0.5) * 4;
      const py = this.y + Math.sin(backAngle) * offsetDist + (Math.random() - 0.5) * 4;
      this.flameParticles.push({
        x: px,
        y: py,
        vx: Math.cos(backAngle) * (1 + Math.random()) + (Math.random() - 0.5),
        vy: Math.sin(backAngle) * (1 + Math.random()) + (Math.random() - 0.5),
        life: 20,
        maxLife: 20,
        size: 2 + Math.random() * 3
      });
    }

    for (let i = this.flameParticles.length - 1; i >= 0; i--) {
      const p = this.flameParticles[i];
      p.x += p.vx * (deltaTime / 16.67);
      p.y += p.vy * (deltaTime / 16.67);
      p.life -= (deltaTime / 16.67);
      if (p.life <= 0) {
        this.flameParticles.splice(i, 1);
      }
    }
  }

  public setMoveTarget(x: number, y: number): void {
    this.moveTargetX = x;
    this.moveTargetY = y;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length > 1) {
      ctx.save();
      for (let i = 1; i < this.trail.length; i++) {
        const prev = this.trail[i - 1];
        const curr = this.trail[i];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = curr.alpha * 0.6;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const p of this.flameParticles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * alpha);
      gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 100, 50, ${alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const s = this.size;
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.7, s * 0.6);
    ctx.lineTo(-s * 0.4, 0);
    ctx.lineTo(-s * 0.7, -s * 0.6);
    ctx.closePath();

    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(s * 0.3, 0);
    ctx.lineTo(-s * 0.1, s * 0.2);
    ctx.lineTo(-s * 0.1, -s * 0.2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    ctx.restore();
  }
}

export class Fleet {
  public ships: Ship[] = [];
  public formation: FormationType = 'vee';
  public targetX: number = 320;
  public targetY: number = 240;
  public ringCenterX: number = 0;
  public ringCenterY: number = 0;
  public transitioning: boolean = false;
  public transitionProgress: number = 1;
  public previousFormation: FormationType = 'vee';

  private formationOffsets: Map<number, { x: number; y: number }> = new Map();
  private previousOffsets: Map<number, { x: number; y: number }> = new Map();

  constructor() {
    this.initializeFleet();
  }

  private initializeFleet(): void {
    const startX = 320;
    const startY = 240;

    const shipConfigs: { type: ShipType }[] = [
      { type: 'flagship' },
      { type: 'frigate' },
      { type: 'frigate' },
      { type: 'frigate' },
      { type: 'destroyer' },
      { type: 'destroyer' },
      { type: 'scout' },
      { type: 'scout' }
    ];

    for (let i = 0; i < shipConfigs.length; i++) {
      const config = shipConfigs[i];
      const ship = new Ship(startX, startY, config.type, i);
      this.ships.push(ship);
    }

    this.setFormation('vee');
    this.applyFormationOffsets();
  }

  public setFormation(formation: FormationType): void {
    this.previousFormation = this.formation;
    this.formation = formation;
    this.calculateFormationOffsets();
    this.transitioning = true;
    this.transitionProgress = 0;
  }

  private calculateFormationOffsets(): void {
    const newPreviousOffsets = new Map<number, { x: number; y: number }>();
    for (const [key, value] of this.formationOffsets) {
      newPreviousOffsets.set(key, { x: value.x, y: value.y });
    }
    this.previousOffsets = newPreviousOffsets;
    this.formationOffsets = new Map();

    const spacing = 45;

    if (this.formation === 'vee') {
      this.formationOffsets.set(0, { x: 0, y: 0 });
      this.formationOffsets.set(1, { x: -spacing, y: spacing * 0.6 });
      this.formationOffsets.set(2, { x: -spacing, y: -spacing * 0.6 });
      this.formationOffsets.set(3, { x: -spacing * 1.8, y: spacing * 1.1 });
      this.formationOffsets.set(4, { x: -spacing * 2.6, y: spacing * 0.3 });
      this.formationOffsets.set(5, { x: -spacing * 2.6, y: -spacing * 0.3 });
      this.formationOffsets.set(6, { x: -spacing * 1.8, y: -spacing * 1.1 });
      this.formationOffsets.set(7, { x: -spacing * 3.4, y: spacing * 1.5 });
    } else if (this.formation === 'line') {
      const lineSpacing = 50;
      this.formationOffsets.set(0, { x: 0, y: 0 });
      this.formationOffsets.set(1, { x: 0, y: -lineSpacing });
      this.formationOffsets.set(2, { x: 0, y: lineSpacing });
      this.formationOffsets.set(3, { x: 0, y: -lineSpacing * 2 });
      this.formationOffsets.set(4, { x: 0, y: lineSpacing * 2 });
      this.formationOffsets.set(5, { x: 0, y: -lineSpacing * 3 });
      this.formationOffsets.set(6, { x: 0, y: lineSpacing * 3 });
      this.formationOffsets.set(7, { x: 0, y: -lineSpacing * 0.5 });
    } else if (this.formation === 'ring') {
      const ringRadius = 120;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        this.formationOffsets.set(i, {
          x: Math.cos(angle) * ringRadius,
          y: Math.sin(angle) * ringRadius
        });
      }
    }
  }

  public setRingCenter(x: number, y: number): void {
    this.ringCenterX = x;
    this.ringCenterY = y;
  }

  public setMoveTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
    const flagship = this.ships[0];
    if (flagship) {
      flagship.setMoveTarget(x, y);
    }
  }

  private applyFormationOffsets(): void {
    for (const ship of this.ships) {
      const offset = this.formationOffsets.get(ship.index);
      if (offset) {
        ship.setFormationOffset(offset.x, offset.y);
      }
    }
  }

  public get flagship(): Ship {
    return this.ships[0];
  }

  public isMoving(): boolean {
    const flagship = this.flagship;
    const dx = this.targetX - flagship.x;
    const dy = this.targetY - flagship.y;
    return Math.sqrt(dx * dx + dy * dy) > 2;
  }

  public getSpeedPercent(): number {
    const flagship = this.flagship;
    const dx = this.targetX - flagship.x;
    const dy = this.targetY - flagship.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return 0;
    const maxSpeed = SHIP_BASE_SPEED;
    const currentSpeed = Math.min(dist, maxSpeed);
    return Math.round((currentSpeed / maxSpeed) * 100);
  }

  public update(deltaTime: number): void {
    if (this.transitioning) {
      this.transitionProgress += deltaTime / 500;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.transitioning = false;
      }

      const t = this.easeInOutCubic(this.transitionProgress);

      for (const ship of this.ships) {
        const prevOffset = this.previousOffsets.get(ship.index) || { x: 0, y: 0 };
        const currOffset = this.formationOffsets.get(ship.index) || { x: 0, y: 0 };
        const lerpX = prevOffset.x + (currOffset.x - prevOffset.x) * t;
        const lerpY = prevOffset.y + (currOffset.y - prevOffset.y) * t;
        ship.setFormationOffset(lerpX, lerpY);
      }
    }

    const flagship = this.flagship;
    const isMoving = this.isMoving();

    let ringCX: number | undefined = undefined;
    let ringCY: number | undefined = undefined;

    if (this.formation === 'ring') {
      ringCX = this.ringCenterX;
      ringCY = this.ringCenterY;
    }

    for (const ship of this.ships) {
      ship.update(flagship.x, flagship.y, flagship.angle, isMoving, deltaTime, ringCX, ringCY);
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const ship of this.ships) {
      ship.draw(ctx);
    }
  }
}
