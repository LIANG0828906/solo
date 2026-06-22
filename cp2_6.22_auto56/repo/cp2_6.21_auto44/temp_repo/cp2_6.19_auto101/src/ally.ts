import { Vec2, Bullet, FormationMode, distance, distSq, clamp, lerp } from './types';
import { Player } from './player';
import { Meteor } from './enemy';
import { ParticleSystem } from './particle';
import { easeInOut, FORMATION_TRANSITION_DURATION, MODE_AURA_DURATION } from './animation';

export class Ally {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  angle: number = 0;
  radius: number = 14;
  slotIndex: number;
  shootCooldown: number = 0;
  shootInterval: number = 0.35;
  color: string = '#7dff9e';
  trailTimer: number = 0;
  modeAuraTimer: number = 0;
  lastMode: FormationMode = 'follow';

  baseFormationX: number;
  baseFormationY: number;
  currentFormationX: number;
  currentFormationY: number;
  targetFormationX: number;
  targetFormationY: number;
  formationTransition: number = 1;

  prevMeteorPos: WeakMap<Meteor, Vec2> = new WeakMap();
  playerHistory: Vec2[] = [];

  static FORMATION_OFFSET = 70;
  static FORMATION_TRANSITION_DURATION = FORMATION_TRANSITION_DURATION;

  constructor(slotIndex: number, player: Player) {
    this.slotIndex = slotIndex;
    const positions = Ally.getFormationPositions(0);
    this.baseFormationX = positions[slotIndex].x;
    this.baseFormationY = positions[slotIndex].y;
    this.currentFormationX = this.baseFormationX;
    this.currentFormationY = this.baseFormationY;
    this.targetFormationX = this.baseFormationX;
    this.targetFormationY = this.baseFormationY;
    this.x = player.x + this.baseFormationX;
    this.y = player.y + this.baseFormationY;
  }

  static getFormationPositions(rotation: number): Vec2[] {
    const off = Ally.FORMATION_OFFSET;
    const slots = [
      { x: 0, y: -off },
      { x: off, y: 0 },
      { x: 0, y: off },
      { x: -off, y: 0 }
    ];
    return slots.map(s => {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      return {
        x: s.x * cos - s.y * sin,
        y: s.x * sin + s.y * cos
      };
    });
  }

  setTargetFormation(pos: Vec2): void {
    this.targetFormationX = pos.x;
    this.targetFormationY = pos.y;
    this.formationTransition = 0;
  }

  updateFormation(dt: number): void {
    if (this.formationTransition < 1) {
      this.formationTransition = Math.min(1, this.formationTransition + dt / Ally.FORMATION_TRANSITION_DURATION);
      const t = easeInOut(this.formationTransition);
      this.currentFormationX = lerp(this.currentFormationX, this.targetFormationX, t);
      this.currentFormationY = lerp(this.currentFormationY, this.targetFormationY, t);
    }
  }

  getWorldFormationPos(playerX: number, playerY: number): Vec2 {
    return {
      x: playerX + this.currentFormationX,
      y: playerY + this.currentFormationY
    };
  }

  triggerModeAura(mode: FormationMode): void {
    this.lastMode = mode;
    this.modeAuraTimer = MODE_AURA_DURATION;
  }

  update(
    dt: number,
    mode: FormationMode,
    player: Player,
    meteors: Meteor[],
    bullets: Bullet[],
    particles: ParticleSystem,
    canvasW: number,
    canvasH: number,
    sharedTarget: Meteor | null
  ): void {
    this.updateFormation(dt);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.modeAuraTimer = Math.max(0, this.modeAuraTimer - dt);

    this.playerHistory.unshift({ x: player.x, y: player.y });
    if (this.playerHistory.length > 10) this.playerHistory.pop();

    let targetPos: Vec2;
    let shootAtTarget: Meteor | null = null;

    if (mode === 'follow') {
      targetPos = this.getWorldFormationPos(player.x, player.y);
    } else if (mode === 'defense') {
      targetPos = this.computeDefensePosition(player, meteors, dt);
      shootAtTarget = this.findNearestMeteor(meteors, this.x, this.y);
    } else {
      shootAtTarget = sharedTarget || this.findNearestMeteor(meteors, this.x, this.y);
      if (shootAtTarget) {
        const dx = shootAtTarget.x - player.x;
        const dy = shootAtTarget.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const approachDist = 100 + this.slotIndex * 20;
        if (dist > approachDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          targetPos = {
            x: shootAtTarget.x - nx * approachDist,
            y: shootAtTarget.y - ny * approachDist
          };
        } else {
          targetPos = this.getWorldFormationPos(player.x, player.y);
        }
      } else {
        targetPos = this.getWorldFormationPos(player.x, player.y);
      }
    }

    const dx = targetPos.x - this.x;
    const dy = targetPos.y - this.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);
    const maxSpeed = 5.5;
    if (distToTarget > 1) {
      const factor = Math.min(1, distToTarget / 30);
      this.vx = (dx / distToTarget) * maxSpeed * factor;
      this.vy = (dy / distToTarget) * maxSpeed * factor;
    } else {
      this.vx *= 0.85;
      this.vy *= 0.85;
    }

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.x = clamp(this.x, this.radius, canvasW - this.radius);
    this.y = clamp(this.y, this.radius, canvasH - this.radius);

    if (mode !== 'follow' && shootAtTarget) {
      this.angle = Math.atan2(shootAtTarget.y - this.y, shootAtTarget.x - this.x);
      if (this.shootCooldown <= 0) {
        this.shoot(bullets, shootAtTarget);
        this.shootCooldown = this.shootInterval;
      }
    } else {
      this.angle = player.angle;
    }

    this.trailTimer -= dt;
    if (this.trailTimer <= 0 && (Math.abs(this.vx) + Math.abs(this.vy)) > 0.5) {
      const tailX = this.x + Math.cos(this.angle + Math.PI) * this.radius;
      const tailY = this.y + Math.sin(this.angle + Math.PI) * this.radius;
      particles.spawnTrail(tailX, tailY, this.angle, 5);
      this.trailTimer = 0.04;
    }
  }

  private computeDefensePosition(player: Player, meteors: Meteor[], dt: number): Vec2 {
    const form = this.getWorldFormationPos(player.x, player.y);
    const nearest = this.findNearestMeteor(meteors, player.x, player.y);
    if (!nearest) return form;

    const prev = this.prevMeteorPos.get(nearest);
    let mVx = nearest.vx;
    let mVy = nearest.vy;
    if (prev) {
      mVx = (nearest.x - prev.x) / Math.max(dt, 0.001) / 60;
      mVy = (nearest.y - prev.y) / Math.max(dt, 0.001) / 60;
    }
    this.prevMeteorPos.set(nearest, { x: nearest.x, y: nearest.y });

    let pVx = 0;
    let pVy = 0;
    if (this.playerHistory.length >= 2) {
      pVx = (this.playerHistory[0].x - this.playerHistory[1].x) / Math.max(dt, 0.001) / 60;
      pVy = (this.playerHistory[0].y - this.playerHistory[1].y) / Math.max(dt, 0.001) / 60;
    }

    const relVx = mVx - pVx;
    const relVy = mVy - pVy;
    const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy) || 1;
    const relNx = relVx / relSpeed;
    const relNy = relVy / relSpeed;

    const lookahead = 45 + this.slotIndex * 8;
    const intercept: Vec2 = {
      x: nearest.x + relNx * lookahead,
      y: nearest.y + relNy * lookahead
    };

    const dPx = player.x - intercept.x;
    const dPy = player.y - intercept.y;
    const dLen = Math.sqrt(dPx * dPx + dPy * dPy) || 1;
    const nX = dPx / dLen;
    const nY = dPy / dLen;

    const shieldDist = 50 + this.slotIndex * 18;
    const ideal: Vec2 = {
      x: player.x - nX * shieldDist,
      y: player.y - nY * shieldDist
    };

    const blend = clamp(dLen / 300, 0.3, 1);
    return {
      x: lerp(form.x, ideal.x, blend),
      y: lerp(form.y, ideal.y, blend)
    };
  }

  private findNearestMeteor(meteors: Meteor[], x: number, y: number): Meteor | null {
    let nearest: Meteor | null = null;
    let minD = Infinity;
    for (const m of meteors) {
      const d = distSq({ x, y }, { x: m.x, y: m.y });
      if (d < minD) {
        minD = d;
        nearest = m;
      }
    }
    return nearest;
  }

  shoot(bullets: Bullet[], target: Meteor): void {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const bulletSpeed = 8;
    bullets.push({
      x: this.x + (dx / dist) * this.radius,
      y: this.y + (dy / dist) * this.radius,
      vx: (dx / dist) * bulletSpeed,
      vy: (dy / dist) * bulletSpeed,
      radius: 3.5,
      life: 2,
      fromPlayer: false,
      color: '#7dff9e'
    });
  }

  checkCollision(obj: { x: number; y: number; radius: number }): boolean {
    const d = distance({ x: this.x, y: this.y }, { x: obj.x, y: obj.y });
    return d < this.radius + obj.radius;
  }
}

export function findSharedTarget(player: Player, meteors: Meteor[]): Meteor | null {
  if (meteors.length === 0) return null;
  let best: Meteor | null = null;
  let bestScore = -Infinity;

  const playerCenterX = player.x;
  const playerCenterY = player.y;

  for (const m of meteors) {
    const dx = m.x - playerCenterX;
    const dy = m.y - playerCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const vx = m.vx;
    const vy = m.vy;
    const vLen = Math.sqrt(vx * vx + vy * vy) || 1;
    const toPlayerNx = -dx / (dist || 1);
    const toPlayerNy = -dy / (dist || 1);
    const headingDot = (vx / vLen) * toPlayerNx + (vy / vLen) * toPlayerNy;

    const sizeFactor = m.maxHealth * 0.6;
    const proximityFactor = Math.max(0, 600 - dist) * 0.02;
    const headingFactor = Math.max(0, headingDot) * 20;
    const healthFactor = m.health * 0.4;

    const score = sizeFactor + proximityFactor + headingFactor + healthFactor;

    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
