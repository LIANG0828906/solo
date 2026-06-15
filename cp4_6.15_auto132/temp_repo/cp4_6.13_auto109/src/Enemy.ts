export enum EnemyType {
  NORMAL,
  FAST,
  HEAVY,
}

export class Enemy {
  x: number;
  y: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  size: number;
  color: string;
  score: number;
  time = 0;
  startX: number;

  constructor(x: number, type: EnemyType) {
    this.x = x;
    this.startX = x;
    this.type = type;

    switch (type) {
      case EnemyType.NORMAL:
        this.hp = 1;
        this.maxHp = 1;
        this.speed = 100 + Math.random() * 30;
        this.size = 20;
        this.color = '#ff4444';
        this.score = 10;
        break;
      case EnemyType.FAST:
        this.hp = 1;
        this.maxHp = 1;
        this.speed = 140 + Math.random() * 40;
        this.size = 15;
        this.color = '#ffcc00';
        this.score = 20;
        break;
      case EnemyType.HEAVY:
        this.hp = 3;
        this.maxHp = 3;
        this.speed = 55 + Math.random() * 20;
        this.size = 30;
        this.color = '#cc44ff';
        this.score = 50;
        break;
    }
  }

  update(dt: number): void {
    this.time += dt;
    this.y += this.speed * dt;

    if (this.type === EnemyType.FAST) {
      this.x = this.startX + Math.sin(this.time * 3) * 80;
    }
  }

  hit(damage: number): boolean {
    this.hp -= damage;
    return this.hp <= 0;
  }

  isOffScreen(canvasHeight: number): boolean {
    return this.y - this.size > canvasHeight;
  }

  getRadius(): number {
    return this.size;
  }
}
