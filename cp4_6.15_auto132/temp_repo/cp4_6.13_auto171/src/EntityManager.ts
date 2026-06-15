export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  thrusterParticles: Particle[];
}

export type EnemyType = 'diamond' | 'circle' | 'triangle';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  angle: number;
  amplitude: number;
  frequency: number;
  startY: number;
  spawnTime: number;
}

export type BulletQuality = 'perfect' | 'good' | 'miss';

export interface Bullet {
  id: number;
  x: number;
  y: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  quality: BulletQuality;
  isPerfect: boolean;
  trail: Vector2[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  blinkSpeed: number;
  blinkOffset: number;
}

export interface Explosion {
  x: number;
  y: number;
  particles: Particle[];
  startTime: number;
  duration: number;
}

export interface BeatPulse {
  x: number;
  y: number;
  maxRadius: number;
  currentRadius: number;
  alpha: number;
  startTime: number;
  duration: number;
}

export interface EntityState {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  particles: Particle[];
  stars: Star[];
  explosions: Explosion[];
  beatPulses: BeatPulse[];
}

export class EntityManager {
  private state: EntityState;
  private nextId: number = 0;
  private canvasWidth: number;
  private canvasHeight: number;
  private lastEnemySpawn: number = 0;
  private enemySpawnInterval: number = 1500;
  private difficulty: number = 1;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.state = this.createInitialState();
  }

  private createInitialState(): EntityState {
    const player: Player = {
      x: 100,
      y: this.canvasHeight / 2,
      width: 40,
      height: 30,
      speed: 300,
      health: 100,
      maxHealth: 100,
      thrusterParticles: []
    };

    const stars = this.createStars();

    return {
      player,
      enemies: [],
      bullets: [],
      particles: [],
      stars,
      explosions: [],
      beatPulses: []
    };
  }

  private createStars(): Star[] {
    const stars: Star[] = [];
    const starCount = Math.floor((this.canvasWidth * this.canvasHeight) / 8000);
    
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: 1 + Math.random() * 2,
        baseAlpha: 0.3 + Math.random() * 0.5,
        alpha: 0.3 + Math.random() * 0.5,
        blinkSpeed: 0.5 + Math.random() * 1.5,
        blinkOffset: Math.random() * Math.PI * 2
      });
    }
    
    return stars;
  }

  getState(): EntityState {
    return this.state;
  }

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    if (this.state.stars.length < 50) {
      this.state.stars = this.createStars();
    }
  }

  update(deltaTime: number, currentTime: number, playerInput: { up: boolean; down: boolean; left: boolean; right: boolean }): void {
    this.updatePlayer(deltaTime, playerInput);
    this.updateEnemies(deltaTime, currentTime);
    this.updateBullets(deltaTime);
    this.updateParticles(deltaTime);
    this.updateExplosions(deltaTime);
    this.updateBeatPulses(deltaTime);
    this.updateStars(deltaTime);
    this.updateThrusterParticles(deltaTime);
    this.checkCollisions();
    this.spawnEnemies(currentTime);
  }

  private updatePlayer(deltaTime: number, input: { up: boolean; down: boolean; left: boolean; right: boolean }): void {
    const player = this.state.player;
    const moveSpeed = player.speed * deltaTime;

    if (input.up) player.y -= moveSpeed;
    if (input.down) player.y += moveSpeed;
    if (input.left) player.x -= moveSpeed;
    if (input.right) player.x += moveSpeed;

    player.x = Math.max(player.width / 2, Math.min(this.canvasWidth / 3, player.x));
    player.y = Math.max(player.height / 2, Math.min(this.canvasHeight - player.height / 2, player.y));
  }

  private updateThrusterParticles(deltaTime: number): void {
    const player = this.state.player;
    
    for (let i = player.thrusterParticles.length - 1; i >= 0; i--) {
      const p = player.thrusterParticles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      p.alpha = p.life / p.maxLife;
      
      if (p.life <= 0) {
        player.thrusterParticles.splice(i, 1);
      }
    }

    while (player.thrusterParticles.length < 6) {
      const idx = player.thrusterParticles.length;
      const t = idx / 5;
      const r = Math.floor(255 * (1 - t) + 255 * t);
      const g = Math.floor(107 * (1 - t) + 165 * t);
      const b = Math.floor(107 * (1 - t) + 2 * t);
      const color = `rgb(${r}, ${g}, ${b})`;
      
      const particle: Particle = {
        x: player.x - player.width / 2 - Math.random() * 5,
        y: player.y + (Math.random() - 0.5) * 12,
        vx: -120 - Math.random() * 60,
        vy: (Math.random() - 0.5) * 40,
        life: 0.4,
        maxLife: 0.4,
        size: 4 + Math.random() * 2,
        color,
        alpha: 1
      };
      player.thrusterParticles.push(particle);
    }
  }

  private spawnEnemies(currentTime: number): void {
    if (currentTime - this.lastEnemySpawn < this.enemySpawnInterval) return;
    
    this.lastEnemySpawn = currentTime;
    
    const types: EnemyType[] = ['diamond', 'circle', 'triangle'];
    const typeWeights = this.difficulty > 2 ? [0.3, 0.4, 0.3] : [0.5, 0.3, 0.2];
    
    let rand = Math.random();
    let type: EnemyType = 'diamond';
    let cumulative = 0;
    for (let i = 0; i < types.length; i++) {
      cumulative += typeWeights[i];
      if (rand < cumulative) {
        type = types[i];
        break;
      }
    }

    const enemy = this.createEnemy(type, currentTime);
    this.state.enemies.push(enemy);
  }

  private createEnemy(type: EnemyType, spawnTime: number): Enemy {
    const y = 50 + Math.random() * (this.canvasHeight - 100);
    
    let baseSpeed = 80 + this.difficulty * 10;
    
    switch (type) {
      case 'diamond':
        return {
          id: this.nextId++,
          type,
          x: this.canvasWidth + 20,
          y,
          radius: 10,
          speed: baseSpeed,
          health: 1,
          maxHealth: 1,
          angle: 0,
          amplitude: 0,
          frequency: 0,
          startY: y,
          spawnTime
        };
      case 'circle':
        return {
          id: this.nextId++,
          type,
          x: this.canvasWidth + 20,
          y,
          radius: 12,
          speed: baseSpeed * 0.8,
          health: 2,
          maxHealth: 2,
          angle: 0,
          amplitude: 40 + Math.random() * 30,
          frequency: 1 + Math.random(),
          startY: y,
          spawnTime
        };
      case 'triangle':
        return {
          id: this.nextId++,
          type,
          x: this.canvasWidth + 20,
          y,
          radius: 9,
          speed: baseSpeed * 0.6,
          health: 3,
          maxHealth: 3,
          angle: 0,
          amplitude: 0,
          frequency: 0,
          startY: y,
          spawnTime
        };
      default:
        return {
          id: this.nextId++,
          type: 'diamond',
          x: this.canvasWidth + 20,
          y,
          radius: 10,
          speed: baseSpeed,
          health: 1,
          maxHealth: 1,
          angle: 0,
          amplitude: 0,
          frequency: 0,
          startY: y,
          spawnTime
        };
    }
  }

  private updateEnemies(deltaTime: number, currentTime: number): void {
    const player = this.state.player;

    for (let i = this.state.enemies.length - 1; i >= 0; i--) {
      const enemy = this.state.enemies[i];
      
      enemy.x -= enemy.speed * deltaTime;
      enemy.angle += deltaTime * 2;

      switch (enemy.type) {
        case 'circle':
          const elapsed = (currentTime - enemy.spawnTime) / 1000;
          enemy.y = enemy.startY + Math.sin(elapsed * enemy.frequency * Math.PI * 2) * enemy.amplitude;
          break;
        case 'triangle':
          const dy = player.y - enemy.y;
          enemy.y += Math.sign(dy) * Math.min(Math.abs(dy), enemy.speed * 0.5 * deltaTime);
          break;
      }

      if (enemy.x < -50) {
        this.state.enemies.splice(i, 1);
      }
    }
  }

  shoot(quality: BulletQuality, currentTime: number): Bullet | null {
    const player = this.state.player;
    
    let radius: number;
    let speed: number;
    let damage: number;
    let color: string;
    let trailLength: number;
    
    switch (quality) {
      case 'perfect':
        radius = 5;
        speed = 900;
        damage = 2;
        color = '#ffd700';
        trailLength = 10;
        break;
      case 'good':
        radius = 4;
        speed = 700;
        damage = 1;
        color = '#00d2ff';
        trailLength = 5;
        break;
      case 'miss':
      default:
        radius = 3;
        speed = 500;
        damage = 0.5;
        color = '#ff4757';
        trailLength = 3;
        break;
    }
    
    const bullet: Bullet = {
      id: this.nextId++,
      x: player.x + player.width / 2,
      y: player.y,
      speed,
      damage,
      radius,
      color,
      quality,
      isPerfect: quality === 'perfect',
      trail: []
    };

    for (let i = 0; i < trailLength; i++) {
      bullet.trail.push({ x: bullet.x, y: bullet.y });
    }

    this.state.bullets.push(bullet);
    return bullet;
  }

  private updateBullets(deltaTime: number): void {
    for (let i = this.state.bullets.length - 1; i >= 0; i--) {
      const bullet = this.state.bullets[i];
      
      bullet.trail.unshift({ x: bullet.x, y: bullet.y });
      const maxTrail = bullet.quality === 'perfect' ? 10 : bullet.quality === 'good' ? 5 : 3;
      if (bullet.trail.length > maxTrail) {
        bullet.trail.pop();
      }
      
      bullet.x += bullet.speed * deltaTime;

      if (bullet.x > this.canvasWidth + 50) {
        this.state.bullets.splice(i, 1);
      }
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      p.alpha = Math.max(0, p.life / p.maxLife);
      
      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  private updateExplosions(deltaTime: number): void {
    for (let i = this.state.explosions.length - 1; i >= 0; i--) {
      const explosion = this.state.explosions[i];
      
      for (const p of explosion.particles) {
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.life -= deltaTime;
        p.alpha = Math.max(0, p.life / p.maxLife);
        p.size *= 0.98;
      }

      const elapsed = (performance.now() - explosion.startTime) / 1000;
      if (elapsed >= explosion.duration) {
        this.state.explosions.splice(i, 1);
      }
    }
  }

  private updateBeatPulses(deltaTime: number): void {
    for (let i = this.state.beatPulses.length - 1; i >= 0; i--) {
      const pulse = this.state.beatPulses[i];
      const elapsed = (performance.now() - pulse.startTime) / 1000;
      const progress = elapsed / pulse.duration;
      
      pulse.currentRadius = pulse.maxRadius * progress;
      pulse.alpha = 0.6 * (1 - progress);

      if (progress >= 1) {
        this.state.beatPulses.splice(i, 1);
      }
    }
  }

  private updateStars(deltaTime: number): void {
    const time = performance.now() / 1000;
    
    for (const star of this.state.stars) {
      star.alpha = star.baseAlpha + Math.sin(time * star.blinkSpeed + star.blinkOffset) * 0.2;
      star.alpha = Math.max(0.3, Math.min(0.8, star.alpha));
    }
  }

  private checkCollisions(): void {
    const bulletsToRemove: number[] = [];
    const enemiesToRemove: number[] = [];

    for (let bi = this.state.bullets.length - 1; bi >= 0; bi--) {
      const bullet = this.state.bullets[bi];
      
      for (let ei = this.state.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.state.enemies[ei];
        
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < bullet.radius + enemy.radius) {
          enemy.health -= bullet.damage;
          bulletsToRemove.push(bi);

          if (enemy.health <= 0) {
            enemiesToRemove.push(ei);
            this.createExplosion(enemy.x, enemy.y, enemy.type);
          }
          break;
        }
      }
    }

    for (const bi of [...new Set(bulletsToRemove)].sort((a, b) => b - a)) {
      this.state.bullets.splice(bi, 1);
    }

    for (const ei of [...new Set(enemiesToRemove)].sort((a, b) => b - a)) {
      this.state.enemies.splice(ei, 1);
    }
  }

  private createExplosion(x: number, y: number, enemyType: EnemyType): void {
    const particles: Particle[] = [];
    const colors = this.getEnemyColors(enemyType);
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 80 + Math.random() * 60;
      
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4,
        maxLife: 0.4,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }

    this.state.explosions.push({
      x,
      y,
      particles,
      startTime: performance.now(),
      duration: 0.4
    });
  }

  private getEnemyColors(type: EnemyType): string[] {
    switch (type) {
      case 'diamond':
        return ['#ff4757', '#ff6b81', '#ffa502'];
      case 'circle':
        return ['#ffa502', '#ffcc00', '#ff6b81'];
      case 'triangle':
        return ['#2ed573', '#7bed9f', '#00d2ff'];
      default:
        return ['#ff4757', '#ff6b81'];
    }
  }

  addBeatPulse(): void {
    const diagonal = Math.sqrt(
      this.canvasWidth * this.canvasWidth + this.canvasHeight * this.canvasHeight
    );
    
    this.state.beatPulses.push({
      x: this.canvasWidth / 2,
      y: this.canvasHeight / 2,
      maxRadius: diagonal / 2,
      currentRadius: 0,
      alpha: 0.6,
      startTime: performance.now(),
      duration: 0.2
    });
  }

  setDifficulty(level: number): void {
    this.difficulty = level;
    this.enemySpawnInterval = Math.max(400, 1500 - level * 150);
  }

  getDifficulty(): number {
    return this.difficulty;
  }

  getPlayer(): Player {
    return this.state.player;
  }

  addStardustBurst(x: number, y: number): void {
    const colors = ['#ffd700', '#fff', '#00d2ff', '#ff6b81', '#a855f7'];
    
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1
      });
    }
  }

  addVictoryFireworks(): void {
    const colors = ['#ffd700', '#ff6b81', '#00d2ff', '#a855f7', '#2ed573'];
    
    for (let burst = 0; burst < 5; burst++) {
      setTimeout(() => {
        const bx = this.canvasWidth * (0.2 + Math.random() * 0.6);
        const by = this.canvasHeight * (0.2 + Math.random() * 0.6);
        
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 80 + Math.random() * 150;
          
          this.state.particles.push({
            x: bx,
            y: by,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1 + Math.random() * 0.5,
            maxLife: 1.5,
            size: 2 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1
          });
        }
      }, burst * 300);
    }
  }

  reset(): void {
    this.state = this.createInitialState();
    this.nextId = 0;
    this.lastEnemySpawn = 0;
    this.difficulty = 1;
  }

  getEnemiesDefeated(): number {
    return 0;
  }
}
