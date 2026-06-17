export interface Asteroid {
  id: number;
  x: number;
  y: number;
  radius: number;
  resources: number;
  maxResources: number;
  respawnTimer: number;
  active: boolean;
  noiseSeed: number;
}

export type BuildingType = 'energyTower' | 'shieldGenerator' | 'warehouse' | 'miningFacility';
export type BuildableType = 'energyTower' | 'shieldGenerator' | 'warehouse';

export interface Building {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  angle: number;
  scale: number;
  buildProgress: number;
}

export interface Meteor {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  startY: number;
}

export type ParticleType = 'resource' | 'explosion' | 'trail' | 'star';

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: ParticleType;
}

export interface Star {
  x: number;
  y: number;
  radius: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  isTwinkling: boolean;
}

export interface BuildCost {
  energyTower: number;
  shieldGenerator: number;
  warehouse: number;
}

export interface GameStateData {
  resources: {
    crystals: number;
    energy: number;
    maxEnergy: number;
    storageCapacity: number;
  };
  base: {
    x: number;
    y: number;
    radius: number;
    pulsePhase: number;
  };
  ship: {
    x: number;
    y: number;
    isDragging: boolean;
    isCollecting: boolean;
    targetAsteroid: number | null;
    collectProgress: number;
    angle: number;
  };
  asteroids: Asteroid[];
  buildings: Building[];
  meteors: Meteor[];
  particles: Particle[];
  stars: Star[];
  wave: {
    timer: number;
    waveNumber: number;
    isActive: boolean;
  };
  shield: {
    active: boolean;
    health: number;
    maxHealth: number;
    regenRate: number;
    flashTimer: number;
  };
  buildMenu: {
    open: boolean;
    hoveredButton: BuildableType | null;
  };
  efficiency: number;
  time: number;
  crystalPulse: number;
  buildCosts: BuildCost;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MAX_PARTICLES = 50;

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      radius: randomRange(0.5, 2),
      brightness: randomRange(0.3, 1),
      twinkleSpeed: randomRange(0.5, 2),
      twinkleOffset: Math.random() * Math.PI * 2,
      isTwinkling: false
    });
  }
  for (let i = 0; i < 5; i++) {
    stars.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      radius: randomRange(1, 2),
      brightness: 1,
      twinkleSpeed: randomRange(1, 2),
      twinkleOffset: Math.random() * Math.PI * 2,
      isTwinkling: true
    });
  }
  return stars;
}

function generateAsteroids(count: number): Asteroid[] {
  const asteroids: Asteroid[] = [];
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  
  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    let attempts = 0;
    do {
      x = randomRange(60, CANVAS_WIDTH - 60);
      y = randomRange(80, CANVAS_HEIGHT - 60);
      attempts++;
    } while (
      Math.hypot(x - centerX, y - centerY) < 120 &&
      attempts < 50
    );
    
    const radius = randomRange(10, 20);
    asteroids.push({
      id: i,
      x,
      y,
      radius,
      resources: Math.floor(radius * 2),
      maxResources: Math.floor(radius * 2),
      respawnTimer: 0,
      active: true,
      noiseSeed: Math.random() * 1000
    });
  }
  return asteroids;
}

export class GameState {
  private state: GameStateData;
  private particleIdCounter = 0;
  private meteorIdCounter = 0;
  private buildingIdCounter = 1;

  constructor() {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    
    this.state = {
      resources: {
        crystals: 100,
        energy: 50,
        maxEnergy: 100,
        storageCapacity: 100
      },
      base: {
        x: centerX,
        y: centerY,
        radius: 40,
        pulsePhase: 0
      },
      ship: {
        x: centerX - 80,
        y: centerY,
        isDragging: false,
        isCollecting: false,
        targetAsteroid: null,
        collectProgress: 0,
        angle: 0
      },
      asteroids: generateAsteroids(randomRange(10, 20)),
      buildings: [
        {
          id: 0,
          type: 'miningFacility',
          x: centerX + 70,
          y: centerY,
          angle: 0,
          scale: 1,
          buildProgress: 1
        }
      ],
      meteors: [],
      particles: [],
      stars: generateStars(),
      wave: {
        timer: 60,
        waveNumber: 1,
        isActive: false
      },
      shield: {
        active: false,
        health: 100,
        maxHealth: 100,
        regenRate: 2,
        flashTimer: 0
      },
      buildMenu: {
        open: false,
        hoveredButton: null
      },
      efficiency: 1,
      time: 0,
      crystalPulse: 0,
      buildCosts: {
        energyTower: 50,
        shieldGenerator: 80,
        warehouse: 30
      }
    };
  }

  getState(): GameStateData {
    return this.state;
  }

  getCrystals(): number {
    return this.state.resources.crystals;
  }

  addCrystals(amount: number): void {
    this.state.resources.crystals = Math.min(
      this.state.resources.crystals + amount,
      this.state.resources.storageCapacity
    );
    this.state.crystalPulse = 1;
  }

  spendCrystals(amount: number): boolean {
    if (this.state.resources.crystals >= amount) {
      this.state.resources.crystals -= amount;
      return true;
    }
    return false;
  }

  getEnergy(): number {
    return this.state.resources.energy;
  }

  getMaxEnergy(): number {
    return this.state.resources.maxEnergy;
  }

  addEnergy(amount: number): void {
    this.state.resources.energy = Math.min(
      this.state.resources.energy + amount,
      this.state.resources.maxEnergy
    );
  }

  getStorageCapacity(): number {
    return this.state.resources.storageCapacity;
  }

  increaseStorage(amount: number): void {
    this.state.resources.storageCapacity += amount;
    this.state.resources.maxEnergy += amount * 0.5;
  }

  getEfficiency(): number {
    return this.state.efficiency;
  }

  increaseEfficiency(amount: number): void {
    this.state.efficiency += amount;
  }

  getWaveTimer(): number {
    return this.state.wave.timer;
  }

  setWaveTimer(value: number): void {
    this.state.wave.timer = value;
  }

  isWaveActive(): boolean {
    return this.state.wave.isActive;
  }

  setWaveActive(active: boolean): void {
    this.state.wave.isActive = active;
  }

  getWaveNumber(): number {
    return this.state.wave.waveNumber;
  }

  incrementWaveNumber(): void {
    this.state.wave.waveNumber++;
  }

  getShip() {
    return this.state.ship;
  }

  setShipPosition(x: number, y: number): void {
    this.state.ship.x = x;
    this.state.ship.y = y;
  }

  setShipDragging(dragging: boolean): void {
    this.state.ship.isDragging = dragging;
  }

  setShipCollecting(collecting: boolean, targetId: number | null): void {
    this.state.ship.isCollecting = collecting;
    this.state.ship.targetAsteroid = targetId;
    if (collecting) {
      this.state.ship.collectProgress = 0;
    }
  }

  getAsteroids(): Asteroid[] {
    return this.state.asteroids;
  }

  getAsteroidById(id: number): Asteroid | undefined {
    return this.state.asteroids.find(a => a.id === id);
  }

  getBuildings(): Building[] {
    return this.state.buildings;
  }

  addBuilding(type: BuildingType, angle: number): Building {
    const distance = 70 + this.state.buildings.length * 10;
    const x = this.state.base.x + Math.cos(angle) * distance;
    const y = this.state.base.y + Math.sin(angle) * distance;
    
    const building: Building = {
      id: this.buildingIdCounter++,
      type,
      x,
      y,
      angle,
      scale: 0,
      buildProgress: 0
    };
    
    this.state.buildings.push(building);
    return building;
  }

  getMeteors(): Meteor[] {
    return this.state.meteors;
  }

  addMeteor(meteor: Omit<Meteor, 'id'>): Meteor {
    const m: Meteor = {
      ...meteor,
      id: this.meteorIdCounter++
    };
    this.state.meteors.push(m);
    return m;
  }

  removeMeteor(id: number): void {
    const index = this.state.meteors.findIndex(m => m.id === id);
    if (index !== -1) {
      this.state.meteors.splice(index, 1);
    }
  }

  getParticles(): Particle[] {
    return this.state.particles;
  }

  addParticle(particle: Omit<Particle, 'id'>): Particle | null {
    if (this.state.particles.length >= MAX_PARTICLES) {
      if (this.state.particles.length > 0) {
        this.state.particles.shift();
      } else {
        return null;
      }
    }
    
    const p: Particle = {
      ...particle,
      id: this.particleIdCounter++
    };
    this.state.particles.push(p);
    return p;
  }

  removeParticle(id: number): void {
    const index = this.state.particles.findIndex(p => p.id === id);
    if (index !== -1) {
      this.state.particles.splice(index, 1);
    }
  }

  getStars(): Star[] {
    return this.state.stars;
  }

  getBase() {
    return this.state.base;
  }

  isShieldActive(): boolean {
    return this.state.shield.active;
  }

  setShieldActive(active: boolean): void {
    this.state.shield.active = active;
  }

  getShieldHealth(): number {
    return this.state.shield.health;
  }

  getShieldMaxHealth(): number {
    return this.state.shield.maxHealth;
  }

  damageShield(amount: number): void {
    this.state.shield.health = Math.max(0, this.state.shield.health - amount);
    this.state.shield.flashTimer = 0.2;
    if (this.state.shield.health <= 0) {
      this.state.shield.active = false;
    }
  }

  regenerateShield(dt: number): void {
    if (this.state.shield.active && this.state.shield.health < this.state.shield.maxHealth) {
      this.state.shield.health = Math.min(
        this.state.shield.maxHealth,
        this.state.shield.health + this.state.shield.regenRate * dt
      );
    }
  }

  getShieldFlashTimer(): number {
    return this.state.shield.flashTimer;
  }

  decreaseShieldFlashTimer(dt: number): void {
    if (this.state.shield.flashTimer > 0) {
      this.state.shield.flashTimer = Math.max(0, this.state.shield.flashTimer - dt);
    }
  }

  isBuildMenuOpen(): boolean {
    return this.state.buildMenu.open;
  }

  setBuildMenuOpen(open: boolean): void {
    this.state.buildMenu.open = open;
    if (!open) {
      this.state.buildMenu.hoveredButton = null;
    }
  }

  getHoveredButton(): BuildableType | null {
    return this.state.buildMenu.hoveredButton;
  }

  setHoveredButton(button: BuildableType | null): void {
    this.state.buildMenu.hoveredButton = button;
  }

  getTime(): number {
    return this.state.time;
  }

  addTime(dt: number): void {
    this.state.time += dt;
  }

  getCrystalPulse(): number {
    return this.state.crystalPulse;
  }

  setCrystalPulse(value: number): void {
    this.state.crystalPulse = value;
  }

  getBuildCosts(): BuildCost {
    return this.state.buildCosts;
  }

  getBuildCost(type: BuildableType): number {
    return this.state.buildCosts[type];
  }

  hasShieldGenerator(): boolean {
    return this.state.buildings.some(b => b.type === 'shieldGenerator' && b.buildProgress >= 1);
  }

  getWarehouseCount(): number {
    return this.state.buildings.filter(b => b.type === 'warehouse' && b.buildProgress >= 1).length;
  }

  getEnergyTowerCount(): number {
    return this.state.buildings.filter(b => b.type === 'energyTower' && b.buildProgress >= 1).length;
  }
}
