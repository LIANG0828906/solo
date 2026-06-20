import { Unit, HexCoord } from './MapGrid';
import { Renderer, AnimatingUnitState, DamageNumber } from './Renderer';

export interface AnimationCallback {
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

export class Animator {
  private renderer: Renderer;
  private animatingUnits: Map<string, AnimatingUnitState> = new Map();
  private damageNumbers: DamageNumber[] = [];
  private callbacks: Map<string, AnimationCallback> = new Map();

  private readonly moveDuration = 150;
  private readonly attackDuration = 300;

  constructor(renderer: Renderer) {
    this.renderer = renderer;
  }

  public getAnimatingUnits(): Map<string, AnimatingUnitState> {
    return this.animatingUnits;
  }

  public getDamageNumbers(): DamageNumber[] {
    return this.damageNumbers;
  }

  public isAnimating(): boolean {
    return this.animatingUnits.size > 0 || this.damageNumbers.length > 0;
  }

  public isUnitAnimating(unitId: string): boolean {
    return this.animatingUnits.has(unitId);
  }

  public animateMove(unit: Unit, path: HexCoord[], callback?: () => void): void {
    if (path.length < 2) {
      callback?.();
      return;
    }

    this.animateStep(unit, path, 0, callback);
  }

  private animateStep(unit: Unit, path: HexCoord[], stepIndex: number, callback?: () => void): void {
    if (stepIndex >= path.length - 1) {
      callback?.();
      return;
    }

    const from = path[stepIndex]!;
    const to = path[stepIndex + 1]!;
    const fromPixel = this.renderer.hexToPixel(from.q, from.r);
    const toPixel = this.renderer.hexToPixel(to.q, to.r);

    const animId = `move-${unit.id}-${stepIndex}`;
    this.animatingUnits.set(unit.id, {
      unit,
      fromX: fromPixel.x,
      fromY: fromPixel.y,
      toX: toPixel.x,
      toY: toPixel.y,
      progress: 0,
    });

    const startTime = performance.now();
    
    const animate = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / this.moveDuration, 1);
      const eased = this.easeInOutQuad(progress);

      const state = this.animatingUnits.get(unit.id);
      if (state) {
        state.progress = eased;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        unit.q = to.q;
        unit.r = to.r;
        this.animatingUnits.delete(unit.id);
        this.callbacks.delete(animId);
        this.animateStep(unit, path, stepIndex + 1, callback);
      }
    };

    requestAnimationFrame(animate);
  }

  public animateAttack(attacker: Unit, target: Unit, damage: number, callback?: () => void): void {
    const attackerPixel = this.renderer.hexToPixel(attacker.q, attacker.r);
    
    const animId = `attack-${attacker.id}`;
    this.animatingUnits.set(attacker.id, {
      unit: attacker,
      fromX: attackerPixel.x,
      fromY: attackerPixel.y,
      toX: attackerPixel.x,
      toY: attackerPixel.y,
      progress: 1,
      isAttacking: true,
      attackShake: 0,
    });

    const startTime = performance.now();
    
    const animate = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / this.attackDuration, 1);

      const state = this.animatingUnits.get(attacker.id);
      if (state) {
        state.attackShake = progress;
      }

      if (progress >= 0.3 && !this.callbacks.has(`dmg-${target.id}`)) {
        this.callbacks.set(`dmg-${target.id}`, {});
        this.showDamage(target, damage);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.animatingUnits.delete(attacker.id);
        this.callbacks.delete(animId);
        callback?.();
      }
    };

    requestAnimationFrame(animate);
  }

  private showDamage(unit: Unit, value: number): void {
    const pixel = this.renderer.hexToPixel(unit.q, unit.r);
    
    this.damageNumbers.push({
      x: pixel.x,
      y: pixel.y - 30,
      value,
      life: 1,
      maxLife: 1,
    });
  }

  public update(deltaTime: number): void {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dmg = this.damageNumbers[i]!;
      dmg.life -= deltaTime / 800;
      if (dmg.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  public clear(): void {
    this.animatingUnits.clear();
    this.damageNumbers.clear();
    this.callbacks.clear();
  }
}
