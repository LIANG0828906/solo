import type { ArenaState, Obstacle, Vec2 } from './types';

export class Arena {
  public state: ArenaState;
  public obstacles: Obstacle[] = [];
  private obstacleIdCounter = 0;

  constructor(center: Vec2) {
    this.state = {
      center: { ...center },
      currentRadius: 300,
      initialRadius: 300,
      minRadius: 100,
      edgeFlashTimer: 0,
      shrinkInterval: 15,
      nextShrinkTime: 15,
      nextObstacleTime: 5
    };
  }

  public update(dt: number, elapsedTime: number): void {
    this.state.edgeFlashTimer += dt;

    this.state.nextShrinkTime -= dt;
    if (this.state.nextShrinkTime <= 0 && this.state.currentRadius > this.state.minRadius) {
      this.shrink();
      this.state.nextShrinkTime = this.state.shrinkInterval;
    }

    this.state.nextObstacleTime -= dt;
    if (this.state.nextObstacleTime <= 0) {
      this.spawnObstacle();
      this.state.nextObstacleTime = 5 + Math.random() * 3;
    }
  }

  private shrink(): void {
    const newRadius = this.state.currentRadius * 0.95;
    this.state.currentRadius = Math.max(newRadius, this.state.minRadius);
  }

  private spawnObstacle(): void {
    const angle = Math.random() * Math.PI * 2;
    const maxDist = this.state.currentRadius * 0.75;
    const minDist = this.state.currentRadius * 0.2;
    const distance = minDist + Math.random() * (maxDist - minDist);
    const radius = 20 + Math.random() * 15;

    this.obstacles.push({
      id: this.obstacleIdCounter++,
      x: this.state.center.x + Math.cos(angle) * distance,
      y: this.state.center.y + Math.sin(angle) * distance,
      radius: radius
    });

    this.cleanupObstacles();
  }

  private cleanupObstacles(): void {
    this.obstacles = this.obstacles.filter(o => {
      const dx = o.x - this.state.center.x;
      const dy = o.y - this.state.center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist + o.radius < this.state.currentRadius;
    });
  }

  public getDiameterPercentage(): number {
    const initialDiameter = this.state.initialRadius * 2;
    const currentDiameter = this.state.currentRadius * 2;
    return Math.round((currentDiameter / initialDiameter) * 100);
  }

  public isEdgeFlashing(): boolean {
    return (this.state.edgeFlashTimer % 0.8) < 0.4;
  }
}
