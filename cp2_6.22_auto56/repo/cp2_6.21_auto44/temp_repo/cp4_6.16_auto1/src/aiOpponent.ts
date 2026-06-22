export interface AIFrame {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

export interface TrackWaypoint {
  x: number;
  y: number;
  radius: number;
}

export interface AICarConfig {
  id: number;
  name: string;
  color: string;
  speedMultiplier: number;
  corneringSkill: number;
  startDelay: number;
}

export class AIOpponent {
  private id: number;
  private name: string;
  private color: string;
  private x: number = 0;
  private y: number = 0;
  private angle: number = 0;
  private speed: number = 0;
  private baseSpeed: number = 300;
  private maxSpeed: number = 300;
  private acceleration: number = 180;
  private deceleration: number = 250;
  private turnSpeed: number = 2.8;
  private currentWaypointIndex: number = 0;
  private waypoints: TrackWaypoint[] = [];
  private speedMultiplier: number = 1;
  private corneringSkill: number = 0.85;
  private startDelay: number = 0;
  private startTime: number = 0;
  private hasStarted: boolean = false;
  private isRunning: boolean = false;
  private lap: number = 0;
  private lapStartTime: number = 0;
  private lapTimes: number[] = [];
  private totalTime: number = 0;
  private finished: boolean = false;
  private trailPoints: { x: number; y: number; alpha: number }[] = [];
  private maxTrailLength: number = 40;
  private neonShadowColor: string = '#ff4757';

  constructor(config: AICarConfig, waypoints: TrackWaypoint[], playerReferenceSpeed: number = 300) {
    this.id = config.id;
    this.name = config.name;
    this.color = config.color;
    this.waypoints = waypoints;
    this.neonShadowColor = config.color;
    
    const rawMultiplier = config.speedMultiplier;
    const minAllowed = 0.95;
    const maxAllowed = 1.05;
    this.speedMultiplier = Math.max(minAllowed, Math.min(maxAllowed, rawMultiplier));
    
    this.corneringSkill = Math.max(0.7, Math.min(0.95, config.corneringSkill));
    this.startDelay = Math.max(0, Math.min(2, config.startDelay));
    
    this.baseSpeed = playerReferenceSpeed;
    this.maxSpeed = this.baseSpeed * this.speedMultiplier;
    
    if (this.speedMultiplier < minAllowed || this.speedMultiplier > maxAllowed) {
      console.warn(`AI ${this.name}: speedMultiplier clamped to ${this.speedMultiplier.toFixed(3)} (clamped from ${rawMultiplier.toFixed(3)})`);
    }
    
    if (waypoints.length > 0) {
      this.x = waypoints[0].x;
      this.y = waypoints[0].y;
      this.angle = this.calculateInitialAngle();
    }
  }

  private calculateInitialAngle(): number {
    if (this.waypoints.length < 2) return 0;
    const wp = this.waypoints[1];
    return Math.atan2(wp.y - this.y, wp.x - this.x);
  }

  start(): void {
    this.startTime = performance.now();
    this.isRunning = true;
    this.hasStarted = false;
    this.lap = 1;
    this.lapStartTime = 0;
    this.lapTimes = [];
    this.totalTime = 0;
    this.finished = false;
    this.currentWaypointIndex = 1;
    this.trailPoints = [];
  }

  reset(): void {
    if (this.waypoints.length > 0) {
      this.x = this.waypoints[0].x;
      this.y = this.waypoints[0].y;
      this.angle = this.calculateInitialAngle();
    }
    this.speed = 0;
    this.currentWaypointIndex = 1;
    this.trailPoints = [];
    this.lap = 0;
    this.finished = false;
    this.isRunning = false;
  }

  update(deltaTime: number): AIFrame | null {
    if (!this.isRunning || this.finished) return null;
    const now = performance.now();
    const elapsed = (now - this.startTime) / 1000;
    if (elapsed < this.startDelay) {
      return { x: this.x, y: this.y, angle: this.angle, speed: 0 };
    }
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.lapStartTime = now;
    }
    this.updateSteering();
    this.updateSpeed(deltaTime);
    this.move(deltaTime);
    this.checkWaypoints();
    this.updateTrail();
    return { x: this.x, y: this.y, angle: this.angle, speed: this.speed };
  }

  private updateSteering(): void {
    if (this.currentWaypointIndex >= this.waypoints.length) return;
    const wp = this.waypoints[this.currentWaypointIndex];
    const targetAngle = Math.atan2(wp.y - this.y, wp.x - this.x);
    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const turnAmount = this.turnSpeed * this.corneringSkill * 0.016;
    if (Math.abs(angleDiff) < turnAmount) {
      this.angle = targetAngle;
    } else {
      this.angle += angleDiff > 0 ? turnAmount : -turnAmount;
    }
  }

  private updateSpeed(deltaTime: number): void {
    if (this.currentWaypointIndex >= this.waypoints.length) return;
    const wp = this.waypoints[this.currentWaypointIndex];
    const dx = wp.x - this.x;
    const dy = wp.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const targetAngle = Math.atan2(dy, dx);
    let angleDiff = Math.abs(targetAngle - this.angle);
    while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - Math.PI * 2);
    let targetSpeed = this.maxSpeed;
    if (angleDiff > 0.2) {
      const slowdownFactor = 1 - (angleDiff / Math.PI) * (1 - this.corneringSkill) * 0.5;
      targetSpeed *= Math.max(0.4, slowdownFactor);
    }
    if (dist < wp.radius * 2) {
      targetSpeed *= 0.8;
    }
    if (this.speed < targetSpeed) {
      this.speed = Math.min(targetSpeed, this.speed + this.acceleration * deltaTime);
    } else {
      this.speed = Math.max(targetSpeed, this.speed - this.deceleration * deltaTime);
    }
  }

  private move(deltaTime: number): void {
    this.x += Math.cos(this.angle) * this.speed * deltaTime;
    this.y += Math.sin(this.angle) * this.speed * deltaTime;
  }

  private checkWaypoints(): void {
    if (this.currentWaypointIndex >= this.waypoints.length) return;
    const wp = this.waypoints[this.currentWaypointIndex];
    const dx = wp.x - this.x;
    const dy = wp.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < wp.radius) {
      const prevIndex = this.currentWaypointIndex;
      this.currentWaypointIndex++;
      if (this.currentWaypointIndex >= this.waypoints.length) {
        this.completeLap();
      }
    }
  }

  private completeLap(): void {
    const now = performance.now();
    const lapTime = (now - this.lapStartTime) / 1000;
    this.lapTimes.push(lapTime);
    this.totalTime += lapTime;
    this.lap++;
    if (this.lap > 3) {
      this.finished = true;
      this.isRunning = false;
    } else {
      this.currentWaypointIndex = 1;
      this.lapStartTime = now;
    }
  }

  private updateTrail(): void {
    this.trailPoints.push({ x: this.x, y: this.y, alpha: 1 });
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.shift();
    }
    this.trailPoints.forEach((point, i) => {
      point.alpha = (i + 1) / this.trailPoints.length * 0.6;
    });
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  getAngle(): number {
    return this.angle;
  }

  getSpeed(): number {
    return this.speed;
  }

  getColor(): string {
    return this.color;
  }

  getNeonShadowColor(): string {
    return this.neonShadowColor;
  }

  getName(): string {
    return this.name;
  }

  getId(): number {
    return this.id;
  }

  getLap(): number {
    return this.lap;
  }

  getLapTimes(): number[] {
    return [...this.lapTimes];
  }

  getTotalTime(): number {
    return this.totalTime + (this.isRunning && this.hasStarted ? (performance.now() - this.lapStartTime) / 1000 : 0);
  }

  getFinished(): boolean {
    return this.finished;
  }

  getTrailPoints(): { x: number; y: number; alpha: number }[] {
    return this.trailPoints;
  }

  getCurrentWaypointIndex(): number {
    return this.currentWaypointIndex;
  }

  getWaypointProgress(): number {
    return this.currentWaypointIndex / Math.max(1, this.waypoints.length);
  }

  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }
}

export class AIFactory {
  static generateOpponents(
    waypoints: TrackWaypoint[],
    playerAverageLapTime: number = 45,
    count: number = 2,
    playerReferenceSpeed: number = 300
  ): AIOpponent[] {
    const opponents: AIOpponent[] = [];
    const colors = ['#ff4757', '#ff6b81', '#ff3838', '#ff5252'];
    const names = ['幽灵猎手', '极速幻影', '暗夜追踪', '疾风骑士'];
    
    const getClampedSpeedMultiplier = (): number => {
      const raw = 0.95 + Math.random() * 0.10;
      const clamped = Math.max(0.95, Math.min(1.05, raw));
      const actualDeviation = Math.abs(clamped - 1.0) * 100;
      console.assert(actualDeviation <= 5.01, `Speed deviation ${actualDeviation.toFixed(2)}% exceeds ±5% limit!`);
      return clamped;
    };
    
    for (let i = 0; i < count; i++) {
      const speedMultiplier = getClampedSpeedMultiplier();
      const cornering = 0.78 + Math.random() * 0.15;
      const config: AICarConfig = {
        id: i,
        name: names[i % names.length],
        color: colors[i % colors.length],
        speedMultiplier: speedMultiplier,
        corneringSkill: cornering,
        startDelay: 0.15 + i * 0.25 + Math.random() * 0.15
      };
      opponents.push(new AIOpponent(config, waypoints, playerReferenceSpeed));
      
      const deviation = Math.abs(speedMultiplier - 1.0) * 100;
      console.log(`AI ${config.name}: speedMultiplier=${speedMultiplier.toFixed(4)}, deviation=${deviation.toFixed(2)}%`);
    }
    return opponents;
  }
}
