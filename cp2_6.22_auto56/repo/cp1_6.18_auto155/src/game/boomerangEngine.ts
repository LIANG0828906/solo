import { Boomerang, Vector2, Star, Meteor, CatchRing } from '../types';

export class BoomerangEngine {
  private boomerang: Boomerang;
  private canvas: HTMLCanvasElement;
  private returnSpeed: number = 8;
  private maxSpeed: number = 10;
  private catchRadius: number = 50;
  private trailLength: number = 15;
  private scaleAnimationTime: number = 0;
  private scaleAnimationDuration: number = 200;
  private catchRings: CatchRing[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.boomerang = this.createBoomerang();
  }

  private createBoomerang(): Boomerang {
    return {
      position: { x: this.canvas.width * 0.2, y: this.canvas.height * 0.5 },
      velocity: { x: 0, y: 0 },
      startPosition: { x: this.canvas.width * 0.2, y: this.canvas.height * 0.5 },
      isFlying: false,
      isReturning: false,
      angle: 0,
      trail: [],
      scale: 1,
      scaleDirection: 0
    };
  }

  throw(startX: number, startY: number, endX: number, endY: number): boolean {
    if (this.boomerang.isFlying) return false;

    const dx = startX - endX;
    const dy = startY - endY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) return false;

    const speed = Math.min(distance * 0.1, this.maxSpeed);
    const angle = Math.atan2(dy, dx);

    this.boomerang.startPosition = { x: startX, y: startY };
    this.boomerang.position = { x: startX, y: startY };
    this.boomerang.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };
    this.boomerang.isFlying = true;
    this.boomerang.isReturning = false;
    this.boomerang.trail = [];
    this.boomerang.scale = 1;
    this.boomerang.scaleDirection = 1;
    this.scaleAnimationTime = 0;

    return true;
  }

  update(deltaTime: number, trackOffset: number): boolean {
    if (!this.boomerang.isFlying) {
      this.boomerang.position.x = this.canvas.width * 0.2;
      this.boomerang.position.y = this.canvas.height * 0.5;
      return false;
    }

    if (this.boomerang.scaleDirection !== 0) {
      this.scaleAnimationTime += deltaTime;
      const progress = this.scaleAnimationTime / this.scaleAnimationDuration;
      
      if (this.boomerang.scaleDirection === 1) {
        this.boomerang.scale = 1 + progress * 0.2;
        if (progress >= 1) {
          this.boomerang.scaleDirection = -1;
          this.scaleAnimationTime = 0;
        }
      } else {
        this.boomerang.scale = 1.2 - progress * 0.2;
        if (progress >= 1) {
          this.boomerang.scale = 1;
          this.boomerang.scaleDirection = 0;
        }
      }
    }

    this.boomerang.position.x += this.boomerang.velocity.x;
    this.boomerang.position.y += this.boomerang.velocity.y;
    this.boomerang.angle += 0.3;

    if (this.boomerang.trail.length >= this.trailLength) {
      this.boomerang.trail.shift();
    }
    this.boomerang.trail.push({ ...this.boomerang.position });

    const distFromStart = Math.sqrt(
      Math.pow(this.boomerang.position.x - this.boomerang.startPosition.x, 2) +
      Math.pow(this.boomerang.position.y - this.boomerang.startPosition.y, 2)
    );

    const maxDistance = 300;
    if (distFromStart > maxDistance && !this.boomerang.isReturning) {
      this.boomerang.isReturning = true;
    }

    if (this.boomerang.isReturning) {
      const dx = this.boomerang.startPosition.x - this.boomerang.position.x;
      const dy = this.boomerang.startPosition.y - this.boomerang.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        const returnForce = 0.3;
        this.boomerang.velocity.x += (dx / dist) * returnForce;
        this.boomerang.velocity.y += (dy / dist) * returnForce;

        const currentSpeed = Math.sqrt(
          this.boomerang.velocity.x ** 2 + this.boomerang.velocity.y ** 2
        );
        if (currentSpeed > this.maxSpeed) {
          this.boomerang.velocity.x = (this.boomerang.velocity.x / currentSpeed) * this.maxSpeed;
          this.boomerang.velocity.y = (this.boomerang.velocity.y / currentSpeed) * this.maxSpeed;
        }
      }

      if (dist < this.catchRadius) {
        this.catchBoomerang();
        return true;
      }
    }

    if (this.boomerang.position.x < -50 || this.boomerang.position.x > this.canvas.width + 50 ||
        this.boomerang.position.y < -50 || this.boomerang.position.y > this.canvas.height + 50) {
      this.boomerang.isReturning = true;
    }

    for (let i = this.catchRings.length - 1; i >= 0; i--) {
      const ring = this.catchRings[i];
      ring.life -= deltaTime;
      ring.radius = ring.maxRadius * (1 - ring.life / 400);
      ring.opacity = 0.8 * (ring.life / 400);
      
      if (ring.life <= 0) {
        this.catchRings.splice(i, 1);
      }
    }

    return false;
  }

  private catchBoomerang(): void {
    this.boomerang.isFlying = false;
    this.boomerang.isReturning = false;
    this.boomerang.velocity = { x: 0, y: 0 };
    this.boomerang.trail = [];
    this.boomerang.scale = 1;

    this.catchRings.push({
      x: this.boomerang.startPosition.x,
      y: this.boomerang.startPosition.y,
      radius: 20,
      maxRadius: 80,
      opacity: 0.8,
      life: 400
    });
  }

  checkStarCollision(stars: Star[]): Star | null {
    if (!this.boomerang.isFlying) return null;

    for (const star of stars) {
      if (star.collected) continue;

      const dx = this.boomerang.position.x - star.x;
      const dy = this.boomerang.position.y - star.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < star.radius + 15) {
        return star;
      }
    }
    return null;
  }

  checkMeteorCollision(meteors: Meteor[]): Meteor | null {
    if (!this.boomerang.isFlying) return null;

    for (const meteor of meteors) {
      const dx = this.boomerang.position.x - meteor.x;
      const dy = this.boomerang.position.y - meteor.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < meteor.radius + 10) {
        return meteor;
      }
    }
    return null;
  }

  getBoomerang(): Boomerang {
    return this.boomerang;
  }

  getCatchRings(): CatchRing[] {
    return this.catchRings;
  }

  isFlying(): boolean {
    return this.boomerang.isFlying;
  }

  reset(): void {
    this.boomerang = this.createBoomerang();
    this.catchRings = [];
  }

  resize(): void {
    if (!this.boomerang.isFlying) {
      this.boomerang.position = {
        x: this.canvas.width * 0.2,
        y: this.canvas.height * 0.5
      };
      this.boomerang.startPosition = { ...this.boomerang.position };
    }
  }
}
