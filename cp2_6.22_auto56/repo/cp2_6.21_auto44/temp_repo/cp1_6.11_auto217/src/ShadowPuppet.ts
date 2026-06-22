export type PuppetType = 'wusong' | 'tiger';
export type ActionState = 'idle' | 'attack' | 'block' | 'hit' | 'move';

export interface Point {
  x: number;
  y: number;
}

export interface AnimationState {
  state: ActionState;
  startTime: number;
  duration: number;
  startPos?: Point;
  targetPos?: Point;
  attackProgress?: number;
  blockProgress?: number;
  hitProgress?: number;
}

export interface HitBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const EASING = 'cubic-bezier(0.25, 0.1, 0.25, 1.0)';
const GOLD_STROKE = '#FFD700';

export class ShadowPuppet {
  public type: PuppetType;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public hp: number;
  public maxHp: number;
  public animation: AnimationState;
  public stickEnd: Point;
  public trailPoints: Point[] = [];
  public trailOpacities: number[] = [];
  public flashWhite: number = 0;
  public glowIntensity: number = 0;
  public afterimages: { x: number; y: number; opacity: number; stretch: number }[] = [];
  public stretchScale: number = 1;
  public facingRight: boolean = true;

  constructor(type: PuppetType, x: number, y: number) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.maxHp = 10;
    this.hp = 10;
    this.animation = {
      state: 'idle',
      startTime: 0,
      duration: 0
    };
    this.stickEnd = { x: 0, y: 0 };

    if (type === 'wusong') {
      this.width = 60;
      this.height = 120;
      this.facingRight = true;
    } else {
      this.width = 180;
      this.height = 80;
      this.facingRight = false;
    }
  }

  public reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.hp = this.maxHp;
    this.animation = { state: 'idle', startTime: 0, duration: 0 };
    this.trailPoints = [];
    this.trailOpacities = [];
    this.flashWhite = 0;
    this.glowIntensity = 0;
    this.afterimages = [];
    this.stretchScale = 1;
    this.facingRight = this.type === 'wusong';
  }

  public getHitBox(): HitBox {
    if (this.type === 'wusong') {
      return {
        x: this.x - this.width / 2,
        y: this.y - this.height,
        width: this.width,
        height: this.height
      };
    } else {
      return {
        x: this.x - this.width / 2,
        y: this.y - this.height / 2,
        width: this.width,
        height: this.height
      };
    }
  }

  public getStickEndPosition(): Point {
    if (this.type !== 'wusong') {
      return { x: this.x, y: this.y - this.height / 2 };
    }
    return { ...this.stickEnd };
  }

  public isBusy(): boolean {
    return this.animation.state !== 'idle' && this.animation.state !== 'move';
  }

  public startMove(dx: number, dy: number, duration: number, now: number): void {
    if (this.isBusy()) return;
    this.animation = {
      state: 'move',
      startTime: now,
      duration,
      startPos: { x: this.x, y: this.y },
      targetPos: { x: this.x + dx, y: this.y + dy }
    };
  }

  public startAttack(now: number): boolean {
    if (this.isBusy()) return false;
    this.animation = {
      state: 'attack',
      startTime: now,
      duration: this.type === 'wusong' ? 300 : 200,
      attackProgress: 0
    };
    if (this.type === 'tiger') {
      this.stretchScale = 1.5;
    }
    return true;
  }

  public startBlock(now: number): boolean {
    if (this.isBusy() || this.type !== 'wusong') return false;
    this.animation = {
      state: 'block',
      startTime: now,
      duration: 500,
      blockProgress: 0
    };
    return true;
  }

  public takeHit(damage: number, knockback: number, now: number): void {
    this.hp = Math.max(0, this.hp - damage);
    this.flashWhite = 1;
    const dir = this.facingRight ? -1 : 1;
    this.animation = {
      state: 'hit',
      startTime: now,
      duration: 200,
      startPos: { x: this.x, y: this.y },
      targetPos: { x: this.x + dir * knockback, y: this.y },
      hitProgress: 0
    };
  }

  public isBlocking(now: number): boolean {
    if (this.type !== 'wusong') return false;
    if (this.animation.state !== 'block') return false;
    return now - this.animation.startTime < this.animation.duration;
  }

  public checkCollision(other: ShadowPuppet, threshold: number = 30): boolean {
    if (this.type === 'wusong') {
      const stick = this.getStickEndPosition();
      const otherBox = other.getHitBox();
      const cx = otherBox.x + otherBox.width / 2;
      const cy = otherBox.y + otherBox.height / 2;
      const dist = Math.sqrt((stick.x - cx) ** 2 + (stick.y - cy) ** 2);
      return dist < threshold + otherBox.width / 3;
    } else {
      const myBox = this.getHitBox();
      const otherBox = other.getHitBox();
      return !(
        myBox.x + myBox.width < otherBox.x ||
        otherBox.x + otherBox.width < myBox.x ||
        myBox.y + myBox.height < otherBox.y ||
        otherBox.y + otherBox.height < myBox.y
      );
    }
  }

  private easeCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private updateMovement(_delta: number, now: number): void {
    if (this.animation.state === 'move' || this.animation.state === 'hit') {
      const elapsed = now - this.animation.startTime;
      const t = Math.min(1, elapsed / this.animation.duration);
      const eased = this.easeCubic(t);
      if (this.animation.startPos && this.animation.targetPos) {
        this.x = this.animation.startPos.x + (this.animation.targetPos.x - this.animation.startPos.x) * eased;
        this.y = this.animation.startPos.y + (this.animation.targetPos.y - this.animation.startPos.y) * eased;
      }
      if (t >= 1) {
        this.animation.state = 'idle';
      }
    }
  }

  public update(delta: number, now: number): void {
    this.updateMovement(delta, now);

    if (this.animation.state === 'attack') {
      const elapsed = now - this.animation.startTime;
      const t = Math.min(1, elapsed / this.animation.duration);
      this.animation.attackProgress = t;

      if (this.type === 'wusong') {
        const angle = -Math.PI / 3 + t * Math.PI * 1.2;
        const armLen = 60;
        const stickLen = 70;
        const shoulderX = this.x + (this.facingRight ? 10 : -10);
        const shoulderY = this.y - this.height * 0.55;
        const handX = shoulderX + Math.cos(angle) * armLen * (this.facingRight ? 1 : -1);
        const handY = shoulderY + Math.sin(angle) * armLen;
        this.stickEnd.x = handX + Math.cos(angle) * stickLen * (this.facingRight ? 1 : -1);
        this.stickEnd.y = handY + Math.sin(angle) * stickLen;

        if (t < 0.8 && Math.random() < 0.5) {
          this.trailPoints.push({ ...this.stickEnd });
          this.trailOpacities.push(0.8 - t * 0.8);
        }
      }

      if (t >= 1) {
        this.animation.state = 'idle';
        if (this.type === 'tiger') {
          this.stretchScale = 1;
        }
      }
    } else if (this.type === 'wusong') {
      const angle = -Math.PI / 3;
      const armLen = 60;
      const stickLen = 70;
      const shoulderX = this.x + (this.facingRight ? 10 : -10);
      const shoulderY = this.y - this.height * 0.55;
      const handX = shoulderX + Math.cos(angle) * armLen * (this.facingRight ? 1 : -1);
      const handY = shoulderY + Math.sin(angle) * armLen;
      this.stickEnd.x = handX + Math.cos(angle) * stickLen * (this.facingRight ? 1 : -1);
      this.stickEnd.y = handY + Math.sin(angle) * stickLen;
    }

    if (this.animation.state === 'block') {
      const elapsed = now - this.animation.startTime;
      const t = Math.min(1, elapsed / this.animation.duration);
      this.animation.blockProgress = t;
      this.glowIntensity = Math.sin(t * Math.PI) * 1;
      if (t >= 1) {
        this.animation.state = 'idle';
        this.glowIntensity = 0;
      }
    }

    this.flashWhite = Math.max(0, this.flashWhite - delta * 0.008);

    if (this.trailPoints.length > 20) {
      this.trailPoints.shift();
      this.trailOpacities.shift();
    }
    for (let i = 0; i < this.trailOpacities.length; i++) {
      this.trailOpacities[i] = Math.max(0, this.trailOpacities[i] - delta * 0.003);
    }

    if (this.type === 'tiger') {
      if (this.animation.state === 'attack') {
        const elapsed = now - this.animation.startTime;
        if (this.afterimages.length < 3 && elapsed > 0) {
          const shouldAdd = this.afterimages.length === 0 ||
            (now - (this.afterimages[this.afterimages.length - 1] as any)._addedAt) > 50;
          if (shouldAdd) {
            const img = {
              x: this.x,
              y: this.y,
              opacity: 0.7 - this.afterimages.length * 0.2,
              stretch: this.stretchScale,
              _addedAt: now
            } as any;
            this.afterimages.push(img);
          }
        }
      }

      this.afterimages = this.afterimages.filter(img => {
        img.opacity -= delta * 0.003;
        return img.opacity > 0;
      });
    }
  }

  public containsPoint(px: number, py: number): boolean {
    const box = this.getHitBox();
    return px >= box.x && px <= box.x + box.width &&
           py >= box.y && py <= box.y + box.height;
  }

  private drawWusong(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const y = this.y;
    const scaleX = this.facingRight ? 1 : -1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, 1);

    const color = this.flashWhite > 0.5 ? '#FFFFFF' : '#1A1A1A';

    if (this.glowIntensity > 0) {
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 30 * this.glowIntensity;
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = GOLD_STROKE;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(-12, -100);
    ctx.bezierCurveTo(-18, -108, -10, -118, 0, -115);
    ctx.bezierCurveTo(10, -118, 18, -108, 12, -100);
    ctx.bezierCurveTo(14, -92, 8, -85, 0, -86);
    ctx.bezierCurveTo(-8, -85, -14, -92, -12, -100);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-8, -86);
    ctx.bezierCurveTo(-18, -75, -22, -60, -20, -48);
    ctx.bezierCurveTo(-24, -40, -25, -28, -22, -18);
    ctx.bezierCurveTo(-18, -8, -8, -4, 0, -5);
    ctx.bezierCurveTo(8, -4, 18, -8, 22, -18);
    ctx.bezierCurveTo(25, -28, 24, -40, 20, -48);
    ctx.bezierCurveTo(22, -60, 18, -75, 8, -86);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const attackProgress = this.animation.state === 'attack' && this.animation.attackProgress !== undefined
      ? this.animation.attackProgress : 0;
    const armAngle = -Math.PI / 3 + attackProgress * Math.PI * 1.2;

    ctx.save();
    ctx.translate(10, -62);
    ctx.rotate(armAngle);
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.bezierCurveTo(20, -3, 45, -5, 60, -4);
    ctx.lineTo(60, 4);
    ctx.bezierCurveTo(45, 5, 20, 3, 0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(10, -62);
    ctx.rotate(armAngle);
    ctx.fillRect(55, -3, 70, 6);
    ctx.strokeRect(55, -3, 70, 6);
    ctx.beginPath();
    ctx.arc(125, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(-10, -60);
    ctx.rotate(-Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.bezierCurveTo(15, -2, 35, -4, 48, -3);
    ctx.lineTo(48, 3);
    ctx.bezierCurveTo(35, 4, 15, 2, 0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const legSwing = this.animation.state === 'move'
      ? Math.sin((Date.now() % 400) / 400 * Math.PI * 2) * 8
      : 0;

    ctx.beginPath();
    ctx.moveTo(-8, -18);
    ctx.bezierCurveTo(-12, -5, -14 + legSwing, 10, -16 + legSwing, 24);
    ctx.lineTo(-8 + legSwing, 24);
    ctx.bezierCurveTo(-6 + legSwing, 12, -4, 0, 0, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(8, -18);
    ctx.bezierCurveTo(12, -5, 14 - legSwing, 10, 16 - legSwing, 24);
    ctx.lineTo(8 - legSwing, 24);
    ctx.bezierCurveTo(6 - legSwing, 12, 4, 0, 0, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private drawTiger(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const y = this.y;
    const scaleX = this.facingRight ? 1 : -1;
    const stretch = this.stretchScale;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX * stretch, 1 / Math.sqrt(stretch));

    const color = this.flashWhite > 0.5 ? '#FFFFFF' : '#3E2723';

    ctx.fillStyle = color;
    ctx.strokeStyle = GOLD_STROKE;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(-80, 10);
    ctx.bezierCurveTo(-90, 35, -75, 42, -55, 35);
    ctx.bezierCurveTo(-50, 30, -48, 20, -45, 12);
    ctx.lineTo(-45, -8);
    ctx.bezierCurveTo(-50, -12, -55, -18, -60, -20);
    ctx.bezierCurveTo(-75, -25, -85, -15, -82, 0);
    ctx.bezierCurveTo(-88, 5, -85, 10, -80, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-72, -18);
    ctx.lineTo(-68, -32);
    ctx.lineTo(-62, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-56, -18);
    ctx.lineTo(-52, -30);
    ctx.lineTo(-48, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(-68, -8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-45, 0);
    ctx.bezierCurveTo(-20, -30, 30, -35, 55, -15);
    ctx.bezierCurveTo(70, -5, 72, 10, 60, 20);
    ctx.bezierCurveTo(50, 30, 30, 35, 0, 30);
    ctx.bezierCurveTo(-30, 32, -48, 25, -45, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-35, 25);
    ctx.bezierCurveTo(-38, 35, -36, 45, -38, 50);
    ctx.lineTo(-28, 50);
    ctx.bezierCurveTo(-26, 42, -28, 35, -25, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, 28);
    ctx.bezierCurveTo(-8, 38, -6, 48, -8, 52);
    ctx.lineTo(2, 52);
    ctx.bezierCurveTo(0, 44, 2, 38, 4, 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(30, 28);
    ctx.bezierCurveTo(28, 38, 30, 46, 28, 50);
    ctx.lineTo(38, 50);
    ctx.bezierCurveTo(40, 42, 38, 36, 40, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(60, 15);
    ctx.bezierCurveTo(75, 8, 85, 20, 90, 8);
    ctx.bezierCurveTo(92, -2, 82, -8, 75, 0);
    ctx.bezierCurveTo(68, 5, 65, 12, 58, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const img of this.afterimages) {
      ctx.save();
      ctx.globalAlpha = img.opacity;
      this.type === 'wusong' ? this.drawWusong(ctx) : this.drawTiger(ctx);
      ctx.restore();
    }

    if (this.type === 'wusong') {
      for (let i = 0; i < this.trailPoints.length - 1; i++) {
        const p1 = this.trailPoints[i];
        const p2 = this.trailPoints[i + 1];
        const opacity = this.trailOpacities[i];
        if (opacity <= 0) continue;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (this.type === 'wusong') {
      this.drawWusong(ctx);
    } else {
      this.drawTiger(ctx);
    }
  }

  public drawShadow(
    ctx: CanvasRenderingContext2D,
    lightAngle: number,
    shadowLength: number,
    opacity: number
  ): void {
    const rad = (lightAngle * Math.PI) / 180;
    const dx = Math.cos(rad) * shadowLength;
    const dy = Math.sin(rad) * shadowLength;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.translate(dx, dy);
    ctx.filter = 'blur(3px)';

    if (this.type === 'wusong') {
      this.drawWusongSilhouette(ctx);
    } else {
      this.drawTigerSilhouette(ctx);
    }

    ctx.restore();
  }

  private drawWusongSilhouette(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const y = this.y;
    const scaleX = this.facingRight ? 1 : -1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX, 1);

    ctx.beginPath();
    ctx.moveTo(-12, -100);
    ctx.bezierCurveTo(-18, -108, -10, -118, 0, -115);
    ctx.bezierCurveTo(10, -118, 18, -108, 12, -100);
    ctx.bezierCurveTo(14, -92, 8, -85, 0, -86);
    ctx.bezierCurveTo(-8, -85, -14, -92, -12, -100);
    ctx.closePath();
    ctx.moveTo(-8, -86);
    ctx.bezierCurveTo(-18, -75, -22, -60, -20, -48);
    ctx.bezierCurveTo(-24, -40, -25, -28, -22, -18);
    ctx.bezierCurveTo(-18, -8, -8, -4, 0, -5);
    ctx.bezierCurveTo(8, -4, 18, -8, 22, -18);
    ctx.bezierCurveTo(25, -28, 24, -40, 20, -48);
    ctx.bezierCurveTo(22, -60, 18, -75, 8, -86);
    ctx.closePath();
    ctx.moveTo(-8, -18);
    ctx.bezierCurveTo(-12, -5, -14, 10, -16, 24);
    ctx.lineTo(-8, 24);
    ctx.bezierCurveTo(-6, 12, -4, 0, 0, -14);
    ctx.closePath();
    ctx.moveTo(8, -18);
    ctx.bezierCurveTo(12, -5, 14, 10, 16, 24);
    ctx.lineTo(8, 24);
    ctx.bezierCurveTo(6, 12, 4, 0, 0, -14);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawTigerSilhouette(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const y = this.y;
    const scaleX = this.facingRight ? 1 : -1;
    const stretch = this.stretchScale;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleX * stretch, 1 / Math.sqrt(stretch));

    ctx.beginPath();
    ctx.moveTo(-80, 10);
    ctx.bezierCurveTo(-90, 35, -75, 42, -55, 35);
    ctx.bezierCurveTo(-50, 30, -48, 20, -45, 12);
    ctx.lineTo(-45, -8);
    ctx.bezierCurveTo(-50, -12, -55, -18, -60, -20);
    ctx.bezierCurveTo(-75, -25, -85, -15, -82, 0);
    ctx.bezierCurveTo(-88, 5, -85, 10, -80, 10);
    ctx.closePath();
    ctx.moveTo(-45, 0);
    ctx.bezierCurveTo(-20, -30, 30, -35, 55, -15);
    ctx.bezierCurveTo(70, -5, 72, 10, 60, 20);
    ctx.bezierCurveTo(50, 30, 30, 35, 0, 30);
    ctx.bezierCurveTo(-30, 32, -48, 25, -45, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export { EASING };
