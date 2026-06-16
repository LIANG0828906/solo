import type {
  GameState,
  MineCart,
  Crystal,
  Bat,
  GasCloud,
  Particle,
  SonicBullet,
  Position,
} from './GameState';
import { PathGenerator } from './PathGenerator';
import { v4 as uuidv4 } from 'uuid';

export class GameEngine {
  private canvasWidth: number;
  private canvasHeight: number;
  private pathGenerator: PathGenerator;
  public state: GameState;

  private particlePool: Particle[] = [];
  private batPool: Bat[] = [];
  private crystalPool: Crystal[] = [];
  private gasCloudPool: GasCloud[] = [];

  private nextForkDistance: number = 3000;
  private readonly forkInterval: number = 3000;
  private readonly lightTweenDuration: number = 0.2;
  private readonly lightSpotDistance: number = 200;
  private readonly crystalLitThreshold: number = 0.5;
  private readonly stunDuration: number = 1.5;
  private readonly forkCountdown: number = 7;
  private readonly transitionDuration: number = 0.8;
  private readonly maxParticles: number = 100;
  private readonly mineCartSpeedThreshold: number = 200;

  private crystalLitTimers: Map<string, number> = new Map();
  private spawnTimers: {
    crystal: number;
    bat: number;
    gas: number;
  } = {
    crystal: 0,
    bat: 0,
    gas: 0,
  };

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.pathGenerator = new PathGenerator();
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const initialPath = this.pathGenerator.generatePath();
    const centerY = this.canvasHeight / 2;

    const mineCart: MineCart = {
      position: { x: 150, y: centerY },
      durability: 100,
      targetY: centerY,
      lightAngle: 0,
      targetLightAngle: 0,
      attachedBats: 0,
    };

    return {
      isRunning: true,
      isGameOver: false,
      score: 0,
      crystalsCollected: 0,
      batsKilled: 0,
      survivalTime: 0,
      distanceTraveled: 0,
      scrollSpeed: 150,

      mineCart,
      crystals: [],
      bats: [],
      gasClouds: [],
      particles: [],
      sonicBullets: [],

      currentPath: initialPath,
      forkState: {
        active: false,
        position: 0,
        timer: 0,
        leftPath: initialPath,
        rightPath: initialPath,
        selectedPath: null,
      },
      screenShake: {
        active: false,
        amplitude: 0,
        duration: 0,
        timer: 0,
        offset: { x: 0, y: 0 },
      },
      pathTransition: {
        active: false,
        duration: 0,
        timer: 0,
        progress: 0,
      },

      lightSpot: {
        x: mineCart.position.x + this.lightSpotDistance,
        y: mineCart.position.y,
        radius: 60,
      },
    };
  }

  public update(deltaTime: number): void {
    if (this.state.isGameOver || !this.state.isRunning) return;

    this.state.survivalTime += deltaTime;
    this.state.distanceTraveled += this.state.scrollSpeed * deltaTime;

    this.updateMineCart(deltaTime);
    this.updateCrystals(deltaTime);
    this.updateBats(deltaTime);
    this.updateGasClouds(deltaTime);
    this.updateParticles(deltaTime);
    this.updateSonicBullets(deltaTime);

    this.checkCollisions();
    this.checkFork();

    this.updateScreenShake(deltaTime);
    this.updatePathTransition(deltaTime);

    if (this.state.mineCart.durability <= 0) {
      this.state.isGameOver = true;
    }
  }

  public updateMineCart(deltaTime: number): void {
    const { mineCart, currentPath } = this.state;
    const lerpFactor = 1 - Math.exp(-deltaTime * 8);

    mineCart.position.y += (mineCart.targetY - mineCart.position.y) * lerpFactor;

    const tweenProgress = Math.min(1, deltaTime / this.lightTweenDuration);
    mineCart.lightAngle +=
      (mineCart.targetLightAngle - mineCart.lightAngle) * tweenProgress;

    const angleRad = (mineCart.lightAngle * Math.PI) / 180;
    this.state.lightSpot.x =
      mineCart.position.x + Math.cos(angleRad) * this.lightSpotDistance;
    this.state.lightSpot.y =
      mineCart.position.y + Math.sin(angleRad) * this.lightSpotDistance;

    const topBound = currentPath.topBoundary(mineCart.position.x);
    const bottomBound = currentPath.bottomBoundary(mineCart.position.x);
    const pathHeight = bottomBound - topBound;
    const middleTop = topBound + pathHeight * 0.2;
    const middleBottom = bottomBound - pathHeight * 0.2;

    mineCart.position.y = Math.max(middleTop, Math.min(middleBottom, mineCart.position.y));
    mineCart.targetY = Math.max(middleTop, Math.min(middleBottom, mineCart.targetY));
  }

  public updateCrystals(deltaTime: number): void {
    const { crystals, lightSpot } = this.state;

    for (let i = crystals.length - 1; i >= 0; i--) {
      const crystal = crystals[i];
      const dx = crystal.position.x - lightSpot.x;
      const dy = crystal.position.y - lightSpot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < lightSpot.radius) {
        crystal.isLit = true;
        crystal.glowIntensity = 0.8 + Math.sin(Date.now() * 0.01) * 0.4;

        const timer = this.crystalLitTimers.get(crystal.id) || 0;
        const newTimer = timer + deltaTime;
        this.crystalLitTimers.set(crystal.id, newTimer);

        if (newTimer >= this.crystalLitThreshold) {
          this.collectCrystal(crystal);
          crystals.splice(i, 1);
          this.crystalLitTimers.delete(crystal.id);
          this.returnCrystalToPool(crystal);
        }
      } else {
        crystal.isLit = false;
        crystal.glowIntensity = 0;
        this.crystalLitTimers.delete(crystal.id);
      }
    }

    this.spawnTimers.crystal += deltaTime;
    const spawnInterval = 1 / (this.state.currentPath.crystalDensity * 2);
    if (this.spawnTimers.crystal >= spawnInterval) {
      this.spawnCrystal();
      this.spawnTimers.crystal = 0;
    }
  }

  private collectCrystal(crystal: Crystal): void {
    for (let i = 0; i < 6; i++) {
      const particle = this.getParticleFromPool();
      const angle = (i / 6) * Math.PI * 2;
      particle.id = uuidv4();
      particle.position = { ...crystal.position };
      particle.velocity = {
        x: Math.cos(angle) * 50,
        y: Math.sin(angle) * 50 - 100,
      };
      particle.type = 'crystal';
      particle.life = 1;
      particle.maxLife = 1;
      particle.rotation = 0;
      particle.color = '#00ffff';
      this.state.particles.push(particle);
    }

    this.state.crystalsCollected++;
    this.state.score += 100;
    crystal.isCollected = true;
  }

  public updateBats(deltaTime: number): void {
    const { bats, lightSpot, mineCart } = this.state;

    for (const bat of bats) {
      if (bat.isStunned) {
        bat.stunTimer -= deltaTime;
        bat.rotation += deltaTime * 10;
        bat.position.y += 100 * deltaTime;

        if (bat.stunTimer <= 0) {
          bat.isStunned = false;
          bat.rotation = 0;
        }
        continue;
      }

      if (bat.isAttached) {
        bat.position.x = mineCart.position.x - 30;
        bat.position.y = mineCart.position.y + 10;
        mineCart.durability -= 2 * deltaTime;
        continue;
      }

      bat.sinePhase += deltaTime * 3;
      bat.position.x -= this.state.scrollSpeed * deltaTime;
      bat.position.y += Math.sin(bat.sinePhase) * 50 * deltaTime;

      const dx = bat.position.x - lightSpot.x;
      const dy = bat.position.y - lightSpot.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < lightSpot.radius) {
        bat.isStunned = true;
        bat.stunTimer = this.stunDuration;
      }
    }

    this.state.bats = bats.filter((bat) => bat.position.x > -100);

    this.spawnTimers.bat += deltaTime;
    const spawnInterval = 8 / (this.state.currentPath.batIntensity * 3);
    if (this.spawnTimers.bat >= spawnInterval) {
      this.spawnBatSwarm();
      this.spawnTimers.bat = 0;
    }
  }

  public updateGasClouds(deltaTime: number): void {
    const { gasClouds } = this.state;

    for (const cloud of gasClouds) {
      cloud.position.x -= this.state.scrollSpeed * deltaTime;
      cloud.warningIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
    }

    this.state.gasClouds = gasClouds.filter((cloud) => cloud.position.x > -200);

    this.spawnTimers.gas += deltaTime;
    if (this.spawnTimers.gas >= 5) {
      this.spawnGasCloud();
      this.spawnTimers.gas = 0;
    }
  }

  public updateParticles(deltaTime: number): void {
    const { particles, mineCart } = this.state;

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;

      if (particle.type === 'crystal') {
        particle.velocity.y += 200 * deltaTime;
      }

      particle.rotation += deltaTime * 5;
      particle.life -= deltaTime;

      if (particle.type === 'crystal') {
        const dx = particle.position.x - mineCart.position.x;
        const dy = particle.position.y - (mineCart.position.y - 20);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 30) {
          this.returnParticleToPool(particle);
          particles.splice(i, 1);
          continue;
        }
      }

      if (particle.life <= 0) {
        this.returnParticleToPool(particle);
        particles.splice(i, 1);
      }
    }

    while (particles.length > this.maxParticles) {
      const removed = particles.shift();
      if (removed) {
        this.returnParticleToPool(removed);
      }
    }
  }

  public updateSonicBullets(deltaTime: number): void {
    const { sonicBullets, bats } = this.state;

    for (let i = sonicBullets.length - 1; i >= 0; i--) {
      const bullet = sonicBullets[i];
      bullet.radius += bullet.speed * deltaTime;

      for (let j = bats.length - 1; j >= 0; j--) {
        const bat = bats[j];
        if (!bat.isStunned) continue;

        const dx = bat.position.x - bullet.position.x;
        const dy = bat.position.y - bullet.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bullet.radius && distance > bullet.radius - 20) {
          this.state.batsKilled++;
          this.state.score += 50;
          this.returnBatToPool(bat);
          bats.splice(j, 1);
        }
      }

      if (bullet.radius >= bullet.maxRadius) {
        sonicBullets.splice(i, 1);
      }
    }
  }

  public checkCollisions(): void {
    const { mineCart, gasClouds, bats } = this.state;

    for (const cloud of gasClouds) {
      const dx = mineCart.position.x - cloud.position.x;
      const dy = mineCart.position.y - cloud.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < cloud.radius + 20) {
        mineCart.durability -= 30;
        this.triggerScreenShake(8, 0.3);
        this.createExplosionParticles(cloud.position);
      }
    }

    const cartVelocityY = Math.abs(mineCart.targetY - mineCart.position.y);
    if (cartVelocityY > this.mineCartSpeedThreshold) {
      for (const bat of bats) {
        if (bat.isAttached) {
          bat.isAttached = false;
          bat.velocity = { x: -200, y: (Math.random() - 0.5) * 200 };
          mineCart.attachedBats = Math.max(0, mineCart.attachedBats - 1);
        }
      }
    }

    for (const bat of bats) {
      if (bat.isStunned || bat.isAttached) continue;

      const dx = mineCart.position.x - bat.position.x;
      const dy = mineCart.position.y - bat.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 30) {
        mineCart.durability -= 10;
        bat.isAttached = true;
        mineCart.attachedBats++;
      }
    }
  }

  private createExplosionParticles(position: Position): void {
    for (let i = 0; i < 15; i++) {
      const particle = this.getParticleFromPool();
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 200 + 100;
      particle.id = uuidv4();
      particle.position = { ...position };
      particle.velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
      particle.type = 'explosion';
      particle.life = 0.8;
      particle.maxLife = 0.8;
      particle.rotation = 0;
      particle.color = '#ff6600';
      this.state.particles.push(particle);
    }
  }

  public checkFork(): void {
    const { forkState, distanceTraveled } = this.state;

    if (!forkState.active && distanceTraveled >= this.nextForkDistance) {
      const fork = this.pathGenerator.generateFork();
      forkState.active = true;
      forkState.position = distanceTraveled;
      forkState.timer = this.forkCountdown;
      forkState.leftPath = fork.left;
      forkState.rightPath = fork.right;
      forkState.selectedPath = null;
    }

    if (forkState.active && !forkState.selectedPath) {
      forkState.timer -= 1 / 60;
      if (forkState.timer <= 0) {
        this.selectPath('right');
      }
    }
  }

  public selectPath(side: 'left' | 'right'): void {
    if (!this.state.forkState.active) return;
    this.state.forkState.selectedPath = side;
    this.startPathTransition();
  }

  public startPathTransition(): void {
    const { pathTransition } = this.state;
    pathTransition.active = true;
    pathTransition.duration = this.transitionDuration;
    pathTransition.timer = 0;
    pathTransition.progress = 0;
  }

  public triggerScreenShake(amplitude: number, duration: number): void {
    const { screenShake } = this.state;
    screenShake.active = true;
    screenShake.amplitude = amplitude;
    screenShake.duration = duration;
    screenShake.timer = duration;
  }

  public updateScreenShake(deltaTime: number): void {
    const { screenShake } = this.state;

    if (!screenShake.active) return;

    screenShake.timer -= deltaTime;

    if (screenShake.timer <= 0) {
      screenShake.active = false;
      screenShake.offset = { x: 0, y: 0 };
      return;
    }

    const intensity = screenShake.timer / screenShake.duration;
    screenShake.offset.x = (Math.random() - 0.5) * 2 * screenShake.amplitude * intensity;
    screenShake.offset.y = (Math.random() - 0.5) * 2 * screenShake.amplitude * intensity;
  }

  public updatePathTransition(deltaTime: number): void {
    const { pathTransition, forkState } = this.state;

    if (!pathTransition.active) return;

    pathTransition.timer += deltaTime;
    pathTransition.progress = pathTransition.timer / pathTransition.duration;

    if (pathTransition.progress >= 1) {
      pathTransition.active = false;
      pathTransition.progress = 0;

      if (forkState.selectedPath) {
        this.state.currentPath =
          forkState.selectedPath === 'left'
            ? forkState.leftPath
            : forkState.rightPath;
      }

      forkState.active = false;
      forkState.selectedPath = null;
      this.nextForkDistance = this.state.distanceTraveled + this.forkInterval;
    }
  }

  public fireSonicBullet(): void {
    const bullet: SonicBullet = {
      id: uuidv4(),
      position: { ...this.state.mineCart.position },
      radius: 0,
      maxRadius: 300,
      speed: 400,
    };
    this.state.sonicBullets.push(bullet);
  }

  public spawnCrystal(): void {
    const crystal = this.getCrystalFromPool();
    const { currentPath } = this.state;

    crystal.id = uuidv4();
    crystal.position = {
      x: this.canvasWidth + 50,
      y:
        currentPath.topBoundary(this.canvasWidth) +
        Math.random() *
          (currentPath.bottomBoundary(this.canvasWidth) -
            currentPath.topBoundary(this.canvasWidth)),
    };
    crystal.isLit = false;
    crystal.isCollected = false;
    crystal.glowIntensity = 0;

    this.state.crystals.push(crystal);
  }

  public spawnBatSwarm(): void {
    const count = Math.floor(Math.random() * 4) + 5;
    const baseY = this.canvasHeight / 2;

    for (let i = 0; i < count; i++) {
      const bat = this.getBatFromPool();
      bat.id = uuidv4();
      bat.position = {
        x: this.canvasWidth + 50 + i * 30,
        y: baseY + (Math.random() - 0.5) * 200,
      };
      bat.velocity = { x: 0, y: 0 };
      bat.isStunned = false;
      bat.stunTimer = 0;
      bat.isAttached = false;
      bat.sinePhase = Math.random() * Math.PI * 2;
      bat.rotation = 0;

      this.state.bats.push(bat);
    }
  }

  public spawnGasCloud(): void {
    const cloud = this.getGasCloudFromPool();
    const { currentPath } = this.state;

    cloud.id = uuidv4();
    cloud.position = {
      x: this.canvasWidth + 100,
      y:
        currentPath.topBoundary(this.canvasWidth) +
        Math.random() *
          (currentPath.bottomBoundary(this.canvasWidth) -
            currentPath.topBoundary(this.canvasWidth)),
    };
    cloud.radius = 40 + Math.random() * 30;
    cloud.warningIntensity = 0.5;

    this.state.gasClouds.push(cloud);
  }

  public setMineCartTargetY(y: number): void {
    const { currentPath, mineCart } = this.state;
    const topBound = currentPath.topBoundary(mineCart.position.x);
    const bottomBound = currentPath.bottomBoundary(mineCart.position.x);
    const pathHeight = bottomBound - topBound;
    const middleTop = topBound + pathHeight * 0.2;
    const middleBottom = bottomBound - pathHeight * 0.2;

    mineCart.targetY = Math.max(middleTop, Math.min(middleBottom, y));
  }

  public adjustLightAngle(delta: number): void {
    const { mineCart } = this.state;
    mineCart.targetLightAngle = Math.max(
      -30,
      Math.min(60, mineCart.targetLightAngle + delta)
    );
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.crystalLitTimers.clear();
    this.spawnTimers = { crystal: 0, bat: 0, gas: 0 };
    this.nextForkDistance = this.forkInterval;
  }

  private getParticleFromPool(): Particle {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop()!;
    }
    return {
      id: '',
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      type: 'crystal',
      life: 0,
      maxLife: 0,
      rotation: 0,
      color: '',
    };
  }

  private returnParticleToPool(particle: Particle): void {
    this.particlePool.push(particle);
  }

  private getBatFromPool(): Bat {
    if (this.batPool.length > 0) {
      return this.batPool.pop()!;
    }
    return {
      id: '',
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      isStunned: false,
      stunTimer: 0,
      isAttached: false,
      sinePhase: 0,
      rotation: 0,
    };
  }

  private returnBatToPool(bat: Bat): void {
    this.batPool.push(bat);
  }

  private getCrystalFromPool(): Crystal {
    if (this.crystalPool.length > 0) {
      return this.crystalPool.pop()!;
    }
    return {
      id: '',
      position: { x: 0, y: 0 },
      isLit: false,
      isCollected: false,
      glowIntensity: 0,
    };
  }

  private returnCrystalToPool(crystal: Crystal): void {
    this.crystalPool.push(crystal);
  }

  private getGasCloudFromPool(): GasCloud {
    if (this.gasCloudPool.length > 0) {
      return this.gasCloudPool.pop()!;
    }
    return {
      id: '',
      position: { x: 0, y: 0 },
      radius: 0,
      warningIntensity: 0,
    };
  }

  private returnGasCloudToPool(cloud: GasCloud): void {
    this.gasCloudPool.push(cloud);
  }
}
