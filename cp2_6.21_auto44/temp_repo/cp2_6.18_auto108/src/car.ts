import type { CarState, InputState, TireMark } from './types';

const DRIFT_FRICTION = 0.985;
const BOOST_MULTIPLIER = 1.6;
const BOOST_DURATION = 0.5;
const CONTROL_LOCK_DURATION = 0.5;
const COLLISION_SPEED_FACTOR = 0.8;
const TIRE_MARK_LIFETIME = 5;
const TIRE_MARK_INTERVAL = 0.03;
const CAR_WIDTH = 24;
const CAR_HEIGHT = 40;
const MAX_SPEED = 300;
const ACCELERATION = 180;
const DECELERATION = 120;
const TURN_SPEED = 2.8;

export class Car {
  state: CarState;
  private input: InputState;
  private lastTireMarkTime: number = 0;
  private tireMarks: TireMark[] = [];
  private maxTireMarks: number = 300;
  private particleScale: number = 1.0;

  constructor(x: number, y: number) {
    this.state = {
      x,
      y,
      angle: -Math.PI / 2,
      speed: 0,
      maxSpeed: MAX_SPEED,
      acceleration: ACCELERATION,
      deceleration: DECELERATION,
      turnSpeed: TURN_SPEED,
      isDrifting: false,
      driftAngle: 0,
      boostTimer: 0,
      boostMultiplier: 1,
      controlLockTimer: 0,
      carWidth: CAR_WIDTH,
      carHeight: CAR_HEIGHT,
    };
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
    };
  }

  setInput(input: InputState): void {
    this.input = { ...input };
  }

  setParticleScale(scale: number): void {
    this.particleScale = Math.max(0.4, Math.min(1.0, scale));
  }

  getTireMarks(): TireMark[] {
    return this.tireMarks;
  }

  update(deltaTime: number, currentTime: number): void {
    const car = this.state;

    if (car.controlLockTimer > 0) {
      car.controlLockTimer -= deltaTime;
      if (car.controlLockTimer < 0) car.controlLockTimer = 0;
    }

    if (car.boostTimer > 0) {
      car.boostTimer -= deltaTime;
      if (car.boostTimer <= 0) {
        car.boostTimer = 0;
        car.boostMultiplier = 1;
      }
    }

    const isControlLocked = car.controlLockTimer > 0;
    const input = isControlLocked ? { up: false, down: false, left: false, right: false, space: false } : this.input;

    const wasDrifting = car.isDrifting;
    car.isDrifting = input.space && car.speed > 30;

    if (!wasDrifting && car.isDrifting) {
      car.driftAngle = 0;
    }

    if (wasDrifting && !car.isDrifting) {
      car.boostTimer = BOOST_DURATION;
      car.boostMultiplier = BOOST_MULTIPLIER;
    }

    if (input.up) {
      car.speed += car.acceleration * deltaTime * car.boostMultiplier;
    }
    if (input.down) {
      car.speed -= car.deceleration * deltaTime;
    }

    if (!input.up && !input.down) {
      if (car.speed > 0) {
        car.speed -= 30 * deltaTime;
        if (car.speed < 0) car.speed = 0;
      } else if (car.speed < 0) {
        car.speed += 30 * deltaTime;
        if (car.speed > 0) car.speed = 0;
      }
    }

    const effectiveMaxSpeed = car.maxSpeed * car.boostMultiplier;
    if (car.speed > effectiveMaxSpeed) car.speed = effectiveMaxSpeed;
    if (car.speed < -car.maxSpeed * 0.3) car.speed = -car.maxSpeed * 0.3;

    const speedFactor = Math.min(Math.abs(car.speed) / 80, 1);

    if (car.isDrifting) {
      car.speed *= Math.pow(DRIFT_FRICTION, deltaTime * 60);

      let driftTarget = 0;
      if (input.left) driftTarget = -0.6;
      else if (input.right) driftTarget = 0.6;

      car.driftAngle += (driftTarget - car.driftAngle) * 8 * deltaTime;

      const driftTurn = car.driftAngle * speedFactor;
      car.angle += driftTurn * car.turnSpeed * deltaTime;
    } else {
      car.driftAngle *= Math.pow(0.9, deltaTime * 60);

      if (input.left) {
        car.angle -= car.turnSpeed * speedFactor * deltaTime;
      }
      if (input.right) {
        car.angle += car.turnSpeed * speedFactor * deltaTime;
      }
    }

    const moveAngle = car.angle + car.driftAngle * 0.5;
    car.x += Math.cos(moveAngle) * car.speed * deltaTime;
    car.y += Math.sin(moveAngle) * car.speed * deltaTime;

    if (car.isDrifting && Math.abs(car.speed) > 50) {
      this.lastTireMarkTime += deltaTime;
      const interval = TIRE_MARK_INTERVAL / this.particleScale;

      if (this.lastTireMarkTime >= interval) {
        this.lastTireMarkTime = 0;
        this.addTireMarks(currentTime);
      }
    }

    this.updateTireMarks(currentTime);
  }

  private addTireMarks(currentTime: number): void {
    const car = this.state;
    const halfWidth = car.carWidth / 2;
    const halfLength = car.carHeight / 2;

    const rearLeftX = car.x - Math.cos(car.angle) * halfLength * 0.8 - Math.sin(car.angle) * halfWidth;
    const rearLeftY = car.y - Math.sin(car.angle) * halfLength * 0.8 + Math.cos(car.angle) * halfWidth;

    const rearRightX = car.x - Math.cos(car.angle) * halfLength * 0.8 + Math.sin(car.angle) * halfWidth;
    const rearRightY = car.y - Math.sin(car.angle) * halfLength * 0.8 - Math.cos(car.angle) * halfWidth;

    this.tireMarks.push({
      x: rearLeftX,
      y: rearLeftY,
      angle: car.angle + car.driftAngle * 0.3,
      alpha: 0.7,
      createdAt: currentTime,
      lifetime: TIRE_MARK_LIFETIME,
    });

    this.tireMarks.push({
      x: rearRightX,
      y: rearRightY,
      angle: car.angle + car.driftAngle * 0.3,
      alpha: 0.7,
      createdAt: currentTime,
      lifetime: TIRE_MARK_LIFETIME,
    });

    const maxMarks = Math.floor(this.maxTireMarks * this.particleScale);
    if (this.tireMarks.length > maxMarks) {
      this.tireMarks.splice(0, this.tireMarks.length - maxMarks);
    }
  }

  private updateTireMarks(currentTime: number): void {
    for (let i = this.tireMarks.length - 1; i >= 0; i--) {
      const mark = this.tireMarks[i];
      const age = currentTime - mark.createdAt;
      const progress = age / mark.lifetime;

      if (progress >= 1) {
        this.tireMarks.splice(i, 1);
      } else {
        mark.alpha = 0.7 * (1 - progress);
      }
    }
  }

  applyCollision(): void {
    const car = this.state;
    car.speed *= COLLISION_SPEED_FACTOR;
    car.controlLockTimer = CONTROL_LOCK_DURATION;
  }

  getRadius(): number {
    return Math.max(this.state.carWidth, this.state.carHeight) / 2;
  }

  reset(x: number, y: number): void {
    this.state.x = x;
    this.state.y = y;
    this.state.angle = -Math.PI / 2;
    this.state.speed = 0;
    this.state.isDrifting = false;
    this.state.driftAngle = 0;
    this.state.boostTimer = 0;
    this.state.boostMultiplier = 1;
    this.state.controlLockTimer = 0;
    this.tireMarks = [];
    this.lastTireMarkTime = 0;
  }
}
