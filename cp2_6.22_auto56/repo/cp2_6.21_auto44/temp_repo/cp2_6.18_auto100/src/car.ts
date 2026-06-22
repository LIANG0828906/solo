import type { CarState, InputState, Vec2, SkidMark, ArenaState, Obstacle } from './types';

export class Car {
  public state: CarState;
  public skidMarks: SkidMark[] = [];

  private readonly maxSpeed = 280;
  private readonly baseAcceleration = 180;
  private readonly friction = 0.92;
  private readonly turnSpeed = 2.8;
  private readonly driftFriction = 0.985;
  private readonly driftTurnMultiplier = 2.2;
  private readonly boostMultiplier = 1.8;
  private readonly boostDuration = 0.5;
  private readonly lossOfControlDuration = 0.5;
  private readonly skidMarkInterval = 0.025;
  private skidMarkTimer = 0;
  private lapAngle = 0;
  private lastAngle = 0;

  constructor(arenaCenter: Vec2, arenaRadius: number) {
    this.state = {
      position: { x: arenaCenter.x, y: arenaCenter.y - arenaRadius * 0.4 },
      velocity: { x: 0, y: 0 },
      angle: 0,
      angularVelocity: 0,
      speed: 0,
      isDrifting: false,
      boostTime: 0,
      boostTimer: 0,
      lossOfControl: 0,
      lapCount: 0,
      score: 0
    };
    this.lastAngle = this.state.angle;
  }

  public update(dt: number, input: InputState, arena: ArenaState, obstacles: Obstacle[]): void {
    const wasDrifting = this.state.isDrifting;
    this.state.isDrifting = input.drift && this.state.speed > 20 && this.state.lossOfControl <= 0;

    if (wasDrifting && !this.state.isDrifting && this.state.lossOfControl <= 0) {
      this.state.boostTime = this.boostDuration;
    }

    if (this.state.boostTime > 0) {
      this.state.boostTime -= dt;
      if (this.state.boostTime < 0) this.state.boostTime = 0;
    }

    if (this.state.lossOfControl > 0) {
      this.state.lossOfControl -= dt;
      if (this.state.lossOfControl < 0) this.state.lossOfControl = 0;
    }

    const effectiveMaxSpeed = this.maxSpeed + this.state.lapCount * 10;
    const boostFactor = this.state.boostTime > 0 ? this.boostMultiplier : 1;
    const lapSpeedBonus = 1 + this.state.lapCount * 0.03;

    let accel = 0;
    if (this.state.lossOfControl <= 0) {
      if (input.up) accel += this.baseAcceleration;
      if (input.down) accel -= this.baseAcceleration * 0.6;
    }
    accel *= boostFactor * lapSpeedBonus;

    const forwardX = Math.cos(this.state.angle);
    const forwardY = Math.sin(this.state.angle);
    this.state.velocity.x += forwardX * accel * dt;
    this.state.velocity.y += forwardY * accel * dt;

    let turnInput = 0;
    if (this.state.lossOfControl <= 0) {
      if (input.left) turnInput -= 1;
      if (input.right) turnInput += 1;
    }

    const currentSpeed = Math.sqrt(
      this.state.velocity.x * this.state.velocity.x + this.state.velocity.y * this.state.velocity.y
    );
    this.state.speed = currentSpeed;

    const speedFactor = Math.min(currentSpeed / 60, 1);
    const driftMultiplier = this.state.isDrifting ? this.driftTurnMultiplier : 1;
    this.state.angle += turnInput * this.turnSpeed * speedFactor * driftMultiplier * dt;

    const driftAngleDiff = this.state.isDrifting ? 0.85 : 1;
    const newForwardX = Math.cos(this.state.angle);
    const newForwardY = Math.sin(this.state.angle);
    const forwardComponent =
      this.state.velocity.x * newForwardX + this.state.velocity.y * newForwardY;
    const rightComponent =
      this.state.velocity.x * -newForwardY + this.state.velocity.y * newForwardX;

    const frictionFactor = this.state.isDrifting ? this.driftFriction : this.friction;
    const driftLateralFriction = this.state.isDrifting ? 0.995 : 0.94;

    this.state.velocity.x =
      (newForwardX * forwardComponent * driftAngleDiff + -newForwardY * rightComponent * 0.3) *
      Math.pow(frictionFactor, dt * 60);
    this.state.velocity.y =
      (newForwardY * forwardComponent * driftAngleDiff + newForwardX * rightComponent * 0.3) *
      Math.pow(frictionFactor, dt * 60);
    this.state.velocity.x *= Math.pow(driftLateralFriction, dt * 60);
    this.state.velocity.y *= Math.pow(driftLateralFriction, dt * 60);

    const finalSpeed = Math.sqrt(
      this.state.velocity.x * this.state.velocity.x + this.state.velocity.y * this.state.velocity.y
    );
    const cappedMaxSpeed = effectiveMaxSpeed * boostFactor * lapSpeedBonus;
    if (finalSpeed > cappedMaxSpeed) {
      const ratio = cappedMaxSpeed / finalSpeed;
      this.state.velocity.x *= ratio;
      this.state.velocity.y *= ratio;
    }

    this.state.position.x += this.state.velocity.x * dt;
    this.state.position.y += this.state.velocity.y * dt;

    this.checkObstacleCollisions(obstacles);

    this.skidMarkTimer += dt;
    if (this.state.isDrifting && this.skidMarkTimer >= this.skidMarkInterval) {
      this.skidMarkTimer = 0;
      this.addSkidMarks();
    }

    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      this.skidMarks[i].life -= dt;
      this.skidMarks[i].alpha = Math.max(0, this.skidMarks[i].life / this.skidMarks[i].maxLife * 0.6);
      if (this.skidMarks[i].life <= 0) {
        this.skidMarks.splice(i, 1);
      }
    }

    this.trackLaps(dt);
    this.state.score = Math.floor(this.state.lapCount * 100 + this.state.speed * 0.1);
  }

  private trackLaps(dt: number): void {
    let delta = this.state.angle - this.lastAngle;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    this.lapAngle += Math.abs(delta);
    this.lastAngle = this.state.angle;
    while (this.lapAngle >= 2 * Math.PI) {
      this.lapAngle -= 2 * Math.PI;
      this.state.lapCount++;
    }
  }

  private addSkidMarks(): void {
    const carLen = 14;
    const carWidth = 8;
    const rearX = this.state.position.x - Math.cos(this.state.angle) * carLen * 0.6;
    const rearY = this.state.position.y - Math.sin(this.state.angle) * carLen * 0.6;
    const perpX = -Math.sin(this.state.angle);
    const perpY = Math.cos(this.state.angle);

    this.skidMarks.push({
      x: rearX + perpX * carWidth * 0.5,
      y: rearY + perpY * carWidth * 0.5,
      angle: this.state.angle,
      alpha: 0.6,
      life: 5,
      maxLife: 5
    });
    this.skidMarks.push({
      x: rearX - perpX * carWidth * 0.5,
      y: rearY - perpY * carWidth * 0.5,
      angle: this.state.angle,
      alpha: 0.6,
      life: 5,
      maxLife: 5
    });
  }

  private checkObstacleCollisions(obstacles: Obstacle[]): void {
    const carRadius = 10;
    for (const obstacle of obstacles) {
      const dx = this.state.position.x - obstacle.x;
      const dy = this.state.position.y - obstacle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = carRadius + obstacle.radius;

      if (dist < minDist && dist > 0) {
        if (this.state.lossOfControl <= 0) {
          this.state.velocity.x *= 0.8;
          this.state.velocity.y *= 0.8;
          this.state.lossOfControl = this.lossOfControlDuration;
        }
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        this.state.position.x += nx * overlap;
        this.state.position.y += ny * overlap;
        const dot = this.state.velocity.x * nx + this.state.velocity.y * ny;
        if (dot < 0) {
          this.state.velocity.x -= dot * nx;
          this.state.velocity.y -= dot * ny;
        }
      }
    }
  }

  public isOutsideArena(arena: ArenaState): boolean {
    const dx = this.state.position.x - arena.center.x;
    const dy = this.state.position.y - arena.center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist > arena.currentRadius;
  }
}
