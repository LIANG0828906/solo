import type { GameState, BuildingType, BuildableType, Asteroid } from './gameState';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const WAVE_INTERVAL = 60;
const ASTEROID_RESPAWN_TIME = 20;
const BUILD_ANIM_DURATION = 0.4;
const RESOURCE_PARTICLE_DURATION = 0.5;

export class GameLogic {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  update(dt: number): void {
    this.state.addTime(dt);
    
    this.updateWave(dt);
    this.updateCollection(dt);
    this.updateBuildings(dt);
    this.updateMeteors(dt);
    this.updateParticles(dt);
    this.updateAsteroids(dt);
    this.updateEnergy(dt);
    this.updateShield(dt);
    this.updateCrystalPulse(dt);
  }

  private updateWave(dt: number): void {
    if (!this.state.isWaveActive()) {
      let timer = this.state.getWaveTimer() - dt;
      
      if (timer <= 0) {
        this.spawnWave();
        this.state.setWaveActive(true);
        timer = WAVE_INTERVAL;
      }
      
      this.state.setWaveTimer(timer);
    } else {
      const meteors = this.state.getMeteors();
      if (meteors.length === 0) {
        this.state.setWaveActive(false);
        this.state.incrementWaveNumber();
      }
    }
  }

  private spawnWave(): void {
    const waveNumber = this.state.getWaveNumber();
    const count = Math.min(3 + Math.floor(waveNumber / 3), 8);
    const base = this.state.getBase();
    
    for (let i = 0; i < count; i++) {
      const spawnDelay = i * 0.5;
      
      setTimeout(() => {
        const fromTop = Math.random() > 0.4;
        let x: number, y: number;
        
        if (fromTop) {
          x = Math.random() * CANVAS_WIDTH;
          y = -30;
        } else {
          x = CANVAS_WIDTH + 30;
          y = 60 + Math.random() * (CANVAS_HEIGHT - 120);
        }
        
        const dx = base.x - x;
        const dy = base.y - y;
        const dist = Math.hypot(dx, dy);
        const speed = 100 + Math.random() * 50;
        
        const radius = 10 + Math.random() * 15;
        
        this.state.addMeteor({
          x,
          y,
          vx: (dx / dist) * speed,
          vy: (dy / dist) * speed,
          radius,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 3,
          startY: y
        });
      }, spawnDelay * 1000);
    }
  }

  private updateCollection(dt: number): void {
    const ship = this.state.getShip();
    
    if (!ship.isCollecting || ship.targetAsteroid === null) return;
    
    const asteroid = this.state.getAsteroidById(ship.targetAsteroid);
    if (!asteroid || !asteroid.active || asteroid.resources <= 0) {
      this.state.setShipCollecting(false, null);
      return;
    }
    
    const efficiency = this.state.getEfficiency();
    const collectRate = 5 * efficiency;
    const collectAmount = collectRate * dt;
    
    const actualCollect = Math.min(collectAmount, asteroid.resources);
    asteroid.resources -= actualCollect;
    
    if (Math.random() < 0.3) {
      this.spawnResourceParticle(asteroid.x, asteroid.y);
    }
    
    if (asteroid.resources <= 0) {
      asteroid.active = false;
      asteroid.respawnTimer = ASTEROID_RESPAWN_TIME;
      this.state.setShipCollecting(false, null);
    }
  }

  private spawnResourceParticle(fromX: number, fromY: number): void {
    const base = this.state.getBase();
    
    const dx = base.x - fromX;
    const dy = base.y - fromY;
    const dist = Math.hypot(dx, dy);
    const speed = dist / RESOURCE_PARTICLE_DURATION;
    
    this.state.addParticle({
      x: fromX,
      y: fromY,
      vx: (dx / dist) * speed + (Math.random() - 0.5) * 20,
      vy: (dy / dist) * speed + (Math.random() - 0.5) * 20,
      life: RESOURCE_PARTICLE_DURATION,
      maxLife: RESOURCE_PARTICLE_DURATION,
      color: '#FFD700',
      size: 6,
      type: 'resource'
    });
    
    setTimeout(() => {
      this.state.addCrystals(1);
    }, RESOURCE_PARTICLE_DURATION * 1000);
  }

  private updateBuildings(dt: number): void {
    const buildings = this.state.getBuildings();
    
    buildings.forEach(building => {
      if (building.buildProgress < 1) {
        building.buildProgress = Math.min(1, building.buildProgress + dt / BUILD_ANIM_DURATION);
        building.scale = this.easeOutBack(building.buildProgress);
        
        if (building.buildProgress >= 1) {
          this.onBuildingComplete(building.type);
        }
      }
    });
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  private onBuildingComplete(type: BuildingType): void {
    if (type === 'energyTower') {
      this.state.increaseEfficiency(0.1);
    } else if (type === 'shieldGenerator') {
      this.state.setShieldActive(true);
    } else if (type === 'warehouse') {
      this.state.increaseStorage(20);
    }
  }

  private updateMeteors(dt: number): void {
    const meteors = this.state.getMeteors();
    const base = this.state.getBase();
    
    for (let i = meteors.length - 1; i >= 0; i--) {
      const meteor = meteors[i];
      
      meteor.x += meteor.vx * dt;
      meteor.y += meteor.vy * dt;
      meteor.rotation += meteor.rotationSpeed * dt;
      
      if (meteor.y > -20) {
        if (Math.random() < 0.5) {
          this.state.addParticle({
            x: meteor.x - meteor.vx * 0.02,
            y: meteor.y - meteor.vy * 0.02,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 0.3,
            maxLife: 0.3,
            color: '#FF6B35',
            size: 3,
            type: 'trail'
          });
        }
      }
      
      const distToBase = Math.hypot(meteor.x - base.x, meteor.y - base.y);
      
      if (this.state.isShieldActive() && distToBase < 60 + meteor.radius) {
        this.state.damageShield(20);
        this.spawnExplosion(meteor.x, meteor.y);
        this.state.removeMeteor(meteor.id);
        continue;
      }
      
      if (!this.state.isShieldActive() && distToBase < base.radius + meteor.radius) {
        this.state.removeMeteor(meteor.id);
        this.spawnExplosion(meteor.x, meteor.y);
        continue;
      }
      
      if (meteor.x < -50 || meteor.x > CANVAS_WIDTH + 50 || meteor.y > CANVAS_HEIGHT + 50) {
        this.state.removeMeteor(meteor.id);
      }
    }
  }

  private spawnExplosion(x: number, y: number): void {
    const count = 4 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      
      this.state.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        color: Math.random() > 0.5 ? '#FF6B35' : '#FFD700',
        size: 4 + Math.random() * 4,
        type: 'explosion'
      });
    }
  }

  private updateParticles(dt: number): void {
    const particles = this.state.getParticles();
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      
      if (particle.type === 'explosion') {
        particle.vx *= 0.95;
        particle.vy *= 0.95;
      }
      
      if (particle.type === 'resource') {
        const base = this.state.getBase();
        const dx = base.x - particle.x;
        const dy = base.y - particle.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 5) {
          const homingForce = 200;
          particle.vx += (dx / dist) * homingForce * dt;
          particle.vy += (dy / dist) * homingForce * dt;
        }
      }
      
      if (particle.life <= 0) {
        this.state.removeParticle(particle.id);
      }
    }
  }

  private updateAsteroids(dt: number): void {
    const asteroids = this.state.getAsteroids();
    
    asteroids.forEach(asteroid => {
      if (!asteroid.active && asteroid.respawnTimer > 0) {
        asteroid.respawnTimer -= dt;
        
        if (asteroid.respawnTimer <= 0) {
          asteroid.active = true;
          asteroid.resources = asteroid.maxResources;
        }
      }
    });
  }

  private updateEnergy(dt: number): void {
    const efficiency = this.state.getEfficiency();
    const energyGain = 2 * efficiency * dt;
    this.state.addEnergy(energyGain);
  }

  private updateShield(dt: number): void {
    this.state.regenerateShield(dt);
    this.state.decreaseShieldFlashTimer(dt);
    
    if (this.state.hasShieldGenerator() && !this.state.isShieldActive()) {
      if (this.state.getShieldHealth() >= 20) {
        this.state.setShieldActive(true);
      }
    }
  }

  private updateCrystalPulse(dt: number): void {
    const pulse = this.state.getCrystalPulse();
    if (pulse > 0) {
      this.state.setCrystalPulse(Math.max(0, pulse - dt * 5));
    }
  }

  handleMouseDown(x: number, y: number): { action: string; data?: any } {
    if (this.state.isBuildMenuOpen()) {
      const result = this.checkBuildMenuClick(x, y);
      if (result) {
        return result;
      }
      this.state.setBuildMenuOpen(false);
      return { action: 'none' };
    }
    
    const base = this.state.getBase();
    const distToBase = Math.hypot(x - base.x, y - base.y);
    
    if (distToBase < base.radius + 10) {
      this.state.setBuildMenuOpen(true);
      return { action: 'openBuildMenu' };
    }
    
    const ship = this.state.getShip();
    const distToShip = Math.hypot(x - ship.x, y - ship.y);
    
    if (distToShip < 20) {
      this.state.setShipDragging(true);
      this.state.setShipCollecting(false, null);
      return { action: 'startDragShip' };
    }
    
    return { action: 'none' };
  }

  handleMouseMove(x: number, y: number): void {
    const ship = this.state.getShip();
    
    if (ship.isDragging) {
      const clampedX = Math.max(20, Math.min(CANVAS_WIDTH - 20, x));
      const clampedY = Math.max(60, Math.min(CANVAS_HEIGHT - 20, y));
      this.state.setShipPosition(clampedX, clampedY);
      
      const angle = Math.atan2(y - ship.y, x - ship.x);
      this.state.getShip().angle = angle;
      
      const nearestAsteroid = this.findNearestActiveAsteroid(clampedX, clampedY);
      if (nearestAsteroid) {
        const dist = Math.hypot(clampedX - nearestAsteroid.x, clampedY - nearestAsteroid.y);
        if (dist < nearestAsteroid.radius + 15) {
          if (ship.targetAsteroid !== nearestAsteroid.id) {
            this.state.setShipCollecting(true, nearestAsteroid.id);
          }
        }
      }
    }
    
    if (this.state.isBuildMenuOpen()) {
      const hovered = this.checkBuildMenuHover(x, y);
      this.state.setHoveredButton(hovered);
    }
  }

  handleMouseUp(x: number, y: number): void {
    const ship = this.state.getShip();
    
    if (ship.isDragging) {
      this.state.setShipDragging(false);
      
      const nearestAsteroid = this.findNearestActiveAsteroid(x, y);
      if (nearestAsteroid) {
        const dist = Math.hypot(x - nearestAsteroid.x, y - nearestAsteroid.y);
        if (dist < nearestAsteroid.radius + 20) {
          this.state.setShipCollecting(true, nearestAsteroid.id);
          return;
        }
      }
      
      this.state.setShipCollecting(false, null);
    }
  }

  private findNearestActiveAsteroid(x: number, y: number): Asteroid | null {
    const asteroids = this.state.getAsteroids();
    let nearest: Asteroid | null = null;
    let minDist = Infinity;
    
    asteroids.forEach(asteroid => {
      if (!asteroid.active || asteroid.resources <= 0) return;
      
      const dist = Math.hypot(x - asteroid.x, y - asteroid.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = asteroid;
      }
    });
    
    return nearest;
  }

  private checkBuildMenuHover(x: number, y: number): BuildableType | null {
    const base = this.state.getBase();
    const dx = x - base.x;
    const dy = y - base.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    
    if (dist < 50 || dist > 90) return null;
    
    const startAngle = -Math.PI / 2 - Math.PI / 3;
    const buttons: BuildableType[] = ['energyTower', 'shieldGenerator', 'warehouse'];
    
    for (let i = 0; i < 3; i++) {
      const angleStart = startAngle + (i / 3) * Math.PI * 2 / 3 * 1.5;
      const angleEnd = angleStart + Math.PI / 4;
      
      let normAngle = angle;
      if (normAngle < angleStart - Math.PI) normAngle += Math.PI * 2;
      if (normAngle > angleEnd + Math.PI) normAngle -= Math.PI * 2;
      
      if (normAngle >= angleStart && normAngle <= angleEnd) {
        return buttons[i];
      }
    }
    
    return null;
  }

  private checkBuildMenuClick(x: number, y: number): { action: string; data?: any } | null {
    const hovered = this.checkBuildMenuHover(x, y);
    
    if (hovered) {
      const cost = this.state.getBuildCost(hovered);
      if (this.state.getCrystals() >= cost) {
        this.buildStructure(hovered);
        this.state.setBuildMenuOpen(false);
        return { action: 'build', data: { type: hovered } };
      } else {
        return { action: 'notEnoughResources' };
      }
    }
    
    return null;
  }

  private buildStructure(type: BuildableType): void {
    const cost = this.state.getBuildCost(type);
    
    if (!this.state.spendCrystals(cost)) return;
    
    const buildings = this.state.getBuildings();
    const existingAngles = buildings.map(b => b.angle);
    
    let angle = -Math.PI / 2;
    const attempts = 12;
    for (let i = 0; i < attempts; i++) {
      const testAngle = -Math.PI / 2 + (i / attempts) * Math.PI * 2;
      let tooClose = false;
      
      for (const existingAngle of existingAngles) {
        const angleDiff = Math.abs(this.normalizeAngle(testAngle - existingAngle));
        if (angleDiff < Math.PI / 6) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        angle = testAngle;
        break;
      }
    }
    
    this.state.addBuilding(type, angle);
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  isPointInShip(x: number, y: number): boolean {
    const ship = this.state.getShip();
    return Math.hypot(x - ship.x, y - ship.y) < 20;
  }

  isPointInBase(x: number, y: number): boolean {
    const base = this.state.getBase();
    return Math.hypot(x - base.x, y - base.y) < base.radius + 10;
  }
}
