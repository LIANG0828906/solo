export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

export type ObstacleType = 'obstacle' | 'note';

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  color: string;
  passed: boolean;
  collected: boolean;
  spawnTime: number;
  scale: number;
  rotation: number;
  rotationSpeed: number;
  shrink: boolean;
}

export class ObstacleManager {
  public obstacles: Obstacle[] = [];
  public particles: Particle[] = [];
  public baseSpeed: number = 300;
  public speedIncrement: number = 50;
  public speedIncrementInterval: number = 30;
  public noteRadius: number = 10;
  public obstacleSize: number = 40;
  private groundY: number;
  private trackHeight: number;
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 1000;
  private maxParticles: number = 200;
  private elapsedTime: number = 0;

  constructor(groundY: number, trackHeight: number) {
    this.groundY = groundY;
    this.trackHeight = trackHeight;
  }

  public update(deltaTime: number, currentTime: number, bpm: number): void {
    this.elapsedTime += deltaTime;
    const currentSpeed = this.getCurrentSpeed();
    this.spawnInterval = 60000 / bpm * 2;

    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      this.spawnObstacle(currentTime);
      this.lastSpawnTime = currentTime;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= currentSpeed * deltaTime;

      const age = (currentTime - obs.spawnTime) / 1000;
      if (age < 0.2) {
        obs.scale = 0.8 + (age / 0.2) * 0.2;
      } else {
        obs.scale = 1;
      }

      if (obs.shrink) {
        obs.scale = Math.max(0, obs.scale - deltaTime * 5);
        obs.rotation += obs.rotationSpeed * deltaTime;
      }

      if (obs.x < -100) {
        this.obstacles.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.vx *= 0.98;
      p.vy *= 0.98;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private spawnObstacle(currentTime: number): void {
    const isNote = Math.random() < 0.4;

    if (isNote) {
      const y = this.groundY - Math.random() * (this.trackHeight * 0.5) - 30;
      this.obstacles.push({
        x: window.innerWidth + 50,
        y: y,
        width: this.noteRadius * 2,
        height: this.noteRadius * 2,
        type: 'note',
        color: '#FFD700',
        passed: false,
        collected: false,
        spawnTime: currentTime,
        scale: 0.8,
        rotation: 0,
        rotationSpeed: 0,
        shrink: false,
      });
    } else {
      this.obstacles.push({
        x: window.innerWidth + 50,
        y: this.groundY - this.obstacleSize,
        width: this.obstacleSize,
        height: this.obstacleSize,
        type: 'obstacle',
        color: '#FF0000',
        passed: false,
        collected: false,
        spawnTime: currentTime,
        scale: 0.8,
        rotation: 0,
        rotationSpeed: 0,
        shrink: false,
      });
    }
  }

  public spawnNoteParticles(x: number, y: number): void {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const angle = (-Math.PI / 4) + (Math.random() * Math.PI / 2);
      const speed = 100 + Math.random() * 50;
      const hue = Math.random() * 360;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: `hsl(${hue}, 80%, 60%)`,
        alpha: 1,
        size: 3 + Math.random() * 4,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
      });
    }

    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  public collectNote(obstacle: Obstacle): void {
    obstacle.collected = true;
    obstacle.shrink = true;
    obstacle.rotationSpeed = Math.PI * 4;
    this.spawnNoteParticles(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
  }

  public getCurrentSpeed(): number {
    const increments = Math.floor(this.elapsedTime / this.speedIncrementInterval);
    return this.baseSpeed + increments * this.speedIncrement;
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    for (const obs of this.obstacles) {
      if (obs.scale <= 0) continue;

      ctx.save();
      const centerX = obs.x + obs.width / 2;
      const centerY = obs.y + obs.height / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(obs.scale, obs.scale);
      if (obs.rotation !== 0) {
        ctx.rotate(obs.rotation);
      }
      ctx.translate(-centerX, -centerY);

      if (obs.type === 'note') {
        const radius = obs.width / 2;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#FFF8DC');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(1, '#DAA520');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const gradient = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
        gradient.addColorStop(0, '#FF6666');
        gradient.addColorStop(0.5, '#FF0000');
        gradient.addColorStop(1, '#CC0000');
        ctx.fillStyle = gradient;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

        ctx.strokeStyle = '#880000';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
      }

      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  public reset(): void {
    this.obstacles = [];
    this.particles = [];
    this.elapsedTime = 0;
    this.lastSpawnTime = 0;
  }
}
