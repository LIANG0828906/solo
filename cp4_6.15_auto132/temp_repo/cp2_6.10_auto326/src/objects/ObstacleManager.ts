import Phaser from 'phaser';

export type ObstacleType = 'lightWall' | 'pulseTrap' | 'debris' | 'starDust';

export interface Obstacle extends Phaser.Physics.Arcade.Sprite {
  type: ObstacleType;
  isActive: boolean;
}

export class ObstacleManager {
  private scene: Phaser.Scene;
  private pool: Phaser.Physics.Arcade.Group;
  private obstacleSpeed: number;
  private spawnInterval: number;
  private lastSpawnTime: number;
  private readonly baseSpeed: number = 200;
  private readonly baseSpawnInterval: number = 2000;
  private readonly minSpawnInterval: number = 600;
  private readonly maxSpeed: number = 600;
  private readonly laneWidth: number = 150;
  private readonly laneCount: number = 3;
  private readonly screenWidth: number;
  private readonly screenHeight: number;
  private readonly centerX: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.screenWidth = this.scene.game.config.width as number;
    this.screenHeight = this.scene.game.config.height as number;
    this.centerX = this.screenWidth / 2;
    this.obstacleSpeed = this.baseSpeed;
    this.spawnInterval = this.baseSpawnInterval;
    this.lastSpawnTime = 0;

    this.pool = this.scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 50,
      runChildUpdate: false
    });

    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < 20; i++) {
      const obstacle = this.pool.create(0, 0) as Obstacle;
      obstacle.type = 'debris';
      obstacle.isActive = false;
      obstacle.setActive(false);
      obstacle.setVisible(false);
    }
  }

  public update(time: number, delta: number, distance: number): void {
    this.updateDifficulty(distance);
    this.handleSpawning(time);
    this.moveObstacles(delta);
    this.recycleOffScreenObstacles();
  }

  private updateDifficulty(distance: number): void {
    const difficultyFactor: number = Math.min(distance / 5000, 1);
    this.obstacleSpeed = this.baseSpeed + (this.maxSpeed - this.baseSpeed) * difficultyFactor;
    this.spawnInterval = this.baseSpawnInterval - (this.baseSpawnInterval - this.minSpawnInterval) * difficultyFactor;
  }

  private handleSpawning(time: number): void {
    if (time - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnObstacle();
      this.lastSpawnTime = time;
    }
  }

  private spawnObstacle(): void {
    const rand: number = Math.random();
    let type: ObstacleType;

    if (rand < 0.3) {
      type = 'lightWall';
    } else if (rand < 0.5) {
      type = 'pulseTrap';
    } else if (rand < 0.8) {
      type = 'debris';
    } else {
      type = 'starDust';
    }

    const obstacle: Obstacle | null = this.getFromPool(type);
    if (obstacle) {
      this.configureObstacle(obstacle, type);
    }
  }

  private getFromPool(type: ObstacleType): Obstacle | null {
    let obstacle: Obstacle | undefined = this.pool.getFirstDead() as Obstacle | undefined;

    if (!obstacle && this.pool.getLength() < (this.pool as Phaser.Physics.Arcade.Group & { maxSize: number }).maxSize) {
      obstacle = this.pool.create(0, 0) as Obstacle;
    }

    if (obstacle) {
      obstacle.type = type;
      obstacle.isActive = true;
      obstacle.setActive(true);
      obstacle.setVisible(true);
      return obstacle;
    }

    return null;
  }

  private configureObstacle(obstacle: Obstacle, type: ObstacleType): void {
    const startY: number = -50;

    switch (type) {
      case 'lightWall':
        this.configureLightWall(obstacle, startY);
        break;
      case 'pulseTrap':
        this.configurePulseTrap(obstacle, startY);
        break;
      case 'debris':
        this.configureDebris(obstacle, startY);
        break;
      case 'starDust':
        this.configureStarDust(obstacle, startY);
        break;
    }
  }

  private configureLightWall(obstacle: Obstacle, startY: number): void {
    const blockedLanes: number[] = this.getRandomBlockedLanes(2);
    const lanePositions: number[] = blockedLanes.map(lane => this.getLaneX(lane));
    const minX: number = Math.min(...lanePositions) - this.laneWidth / 2;
    const maxX: number = Math.max(...lanePositions) + this.laneWidth / 2;
    const width: number = maxX - minX;
    const centerX: number = (minX + maxX) / 2;

    obstacle.setTexture('lightWall');
    obstacle.setPosition(centerX, startY);
    obstacle.setDisplaySize(width, 40);
    obstacle.body?.setSize(width, 40);
    obstacle.setImmovable(true);
  }

  private configurePulseTrap(obstacle: Obstacle, startY: number): void {
    const width: number = this.laneWidth * this.laneCount;

    obstacle.setTexture('pulseTrap');
    obstacle.setPosition(this.centerX, startY);
    obstacle.setDisplaySize(width, 30);
    obstacle.body?.setSize(width, 30);
    obstacle.setImmovable(true);
  }

  private configureDebris(obstacle: Obstacle, startY: number): void {
    const lane: number = Math.floor(Math.random() * this.laneCount);
    const x: number = this.getLaneX(lane);
    const size: number = 30 + Math.random() * 20;

    obstacle.setTexture('debris');
    obstacle.setPosition(x, startY);
    obstacle.setDisplaySize(size, size);
    obstacle.body?.setSize(size * 0.8, size * 0.8);
    obstacle.setImmovable(false);
  }

  private configureStarDust(obstacle: Obstacle, startY: number): void {
    const lane: number = Math.floor(Math.random() * this.laneCount);
    const x: number = this.getLaneX(lane);

    obstacle.setTexture('starDust');
    obstacle.setPosition(x, startY);
    obstacle.setDisplaySize(25, 25);
    obstacle.body?.setSize(20, 20);
    obstacle.setImmovable(false);
  }

  private getRandomBlockedLanes(count: number): number[] {
    const lanes: number[] = [0, 1, 2];
    const blocked: number[] = [];

    for (let i = 0; i < count; i++) {
      const index: number = Math.floor(Math.random() * lanes.length);
      blocked.push(lanes.splice(index, 1)[0]);
    }

    return blocked;
  }

  private getLaneX(lane: number): number {
    const totalWidth: number = this.laneWidth * this.laneCount;
    const startX: number = this.centerX - totalWidth / 2 + this.laneWidth / 2;
    return startX + lane * this.laneWidth;
  }

  private moveObstacles(delta: number): void {
    const children: Obstacle[] = this.pool.getMatching('active', true) as Obstacle[];
    const speed: number = this.obstacleSpeed * (delta / 1000);

    for (const obstacle of children) {
      obstacle.y += speed;
    }
  }

  private recycleOffScreenObstacles(): void {
    const children: Obstacle[] = this.pool.getMatching('active', true) as Obstacle[];

    for (const obstacle of children) {
      if (obstacle.y > this.screenHeight + 100) {
        this.recycleObstacle(obstacle);
      }
    }
  }

  public recycleObstacle(obstacle: Obstacle): void {
    obstacle.isActive = false;
    obstacle.setActive(false);
    obstacle.setVisible(false);
    obstacle.setPosition(-1000, -1000);
    obstacle.setVelocity(0, 0);
  }

  public reset(): void {
    const children: Obstacle[] = this.pool.getChildren() as Obstacle[];

    for (const obstacle of children) {
      this.recycleObstacle(obstacle);
    }

    this.obstacleSpeed = this.baseSpeed;
    this.spawnInterval = this.baseSpawnInterval;
    this.lastSpawnTime = 0;
  }

  public getActiveObstacles(): Obstacle[] {
    return this.pool.getMatching('active', true) as Obstacle[];
  }

  public getPool(): Phaser.Physics.Arcade.Group {
    return this.pool;
  }

  public getObstacleSpeed(): number {
    return this.obstacleSpeed;
  }

  public getSpawnInterval(): number {
    return this.spawnInterval;
  }
}
