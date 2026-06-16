import { CanvasRenderer } from './renderer';
import { KeyboardInput, InputState } from './input';
import {
  Ship,
  Ore,
  SpaceDebris,
  Particle,
  NebulaLayer,
  Shockwave,
  Rarity,
  checkCollision,
  lineCircleIntersect
} from './entities';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderer: CanvasRenderer;
  private input: KeyboardInput;
  
  private ship: Ship;
  private ores: Ore[] = [];
  private debris: SpaceDebris[] = [];
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private nebulaLayers: NebulaLayer[] = [];
  
  private score: number = 0;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;
  
  private worldSize: number = 2000;
  private debrisTimer: number = 0;
  private nextDebrisInterval: number = 0;
  private harvestingOre: Ore | null = null;
  
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  
  private readonly THRUSTER_ACCELERATION = 500;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new CanvasRenderer(canvas);
    this.input = new KeyboardInput(canvas);
    
    this.ship = new Ship(this.worldSize / 2, this.worldSize / 2);
    
    this.init();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private init(): void {
    this.score = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.debrisTimer = 0;
    this.nextDebrisInterval = 8 + Math.random() * 4;
    this.harvestingOre = null;
    
    this.ship = new Ship(this.worldSize / 2, this.worldSize / 2);
    this.ores = [];
    this.debris = [];
    this.particles = [];
    this.shockwaves = [];
    
    this.generateOres();
    this.generateNebula();
    
    this.renderer.clearGameOverHandler();
  }

  private generateOres(): void {
    const oreCount = 20 + Math.floor(Math.random() * 11);
    
    for (let i = 0; i < oreCount; i++) {
      const rarityRoll = Math.random();
      let rarity: Rarity;
      
      if (rarityRoll < 0.6) {
        rarity = 'common';
      } else if (rarityRoll < 0.9) {
        rarity = 'rare';
      } else {
        rarity = 'legendary';
      }
      
      const x = 100 + Math.random() * (this.worldSize - 200);
      const y = 100 + Math.random() * (this.worldSize - 200);
      
      const ore = new Ore(x, y, rarity);
      this.ores.push(ore);
    }
  }

  private generateNebula(): void {
    this.nebulaLayers = [
      new NebulaLayer(15, this.worldSize, '#4a235a', 0.02),
      new NebulaLayer(12, this.worldSize, '#6c3483', -0.015),
      new NebulaLayer(10, this.worldSize, '#884ea0', 0.01)
    ];
  }

  private resizeCanvas(): void {
    this.renderer.setCanvasSize(window.innerWidth, window.innerHeight);
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop = (): void => {
    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    deltaTime = Math.min(deltaTime, 1 / 30);
    
    if (!this.isGameOver && !this.isPaused) {
      this.update(deltaTime);
    }
    
    this.render();
    
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    const inputState = this.input.getState();
    
    this.updateShip(deltaTime, inputState);
    this.updateOres(deltaTime);
    this.updateDebris(deltaTime);
    this.updateParticles(deltaTime);
    this.updateShockwaves(deltaTime);
    this.updateNebula(deltaTime);
    this.updateMining(deltaTime, inputState);
    this.updateDebrisSpawner(deltaTime);
    this.checkCollisions();
    
    this.renderer.setCamera(this.ship.x, this.ship.y);
    
    const screenPos = this.renderer.worldToScreen(this.ship.x, this.ship.y);
    const worldMouse = this.renderer.screenToWorld(
      inputState.mouseScreenX,
      inputState.mouseScreenY
    );
    this.input.setMouseWorldPosition(worldMouse.x, worldMouse.y);
  }

  private updateShip(deltaTime: number, input: InputState): void {
    let ax = 0;
    let ay = 0;
    
    if (input.up) ay -= this.THRUSTER_ACCELERATION;
    if (input.down) ay += this.THRUSTER_ACCELERATION;
    if (input.left) ax -= this.THRUSTER_ACCELERATION;
    if (input.right) ax += this.THRUSTER_ACCELERATION;
    
    this.ship.update(deltaTime, { x: ax, y: ay });
    
    this.ship.x = Math.max(0, Math.min(this.worldSize, this.ship.x));
    this.ship.y = Math.max(0, Math.min(this.worldSize, this.ship.y));
    
    if (input.up || input.down || input.left || input.right) {
      this.spawnThrusterParticles();
    }
  }

  private spawnThrusterParticles(): void {
    const angle = this.ship.angle + Math.PI;
    const spread = 0.3;
    
    for (let i = 0; i < 2; i++) {
      const randomAngle = angle + (Math.random() - 0.5) * spread;
      const speed = 100 + Math.random() * 100;
      
      const particle = new Particle(
        this.ship.x + Math.cos(angle) * 15,
        this.ship.y + Math.sin(angle) * 15,
        Math.cos(randomAngle) * speed + this.ship.velocity.x * 0.3,
        Math.sin(randomAngle) * speed + this.ship.velocity.y * 0.3,
        0.4 + Math.random() * 0.3,
        4 + Math.random() * 3,
        '#ffaa00'
      );
      this.particles.push(particle);
    }
  }

  private updateOres(deltaTime: number): void {
    this.ores.forEach((ore) => {
      ore.update(deltaTime, this.worldSize);
    });
    
    this.ores = this.ores.filter((ore) => {
      if (ore.isHarvested()) {
        this.score += ore.getScore();
        this.spawnHarvestCompleteParticles(ore);
        return false;
      }
      return true;
    });
    
    if (this.harvestingOre && this.harvestingOre.isHarvested()) {
      this.harvestingOre = null;
    }
  }

  private spawnHarvestCompleteParticles(ore: Ore): void {
    const color = ore.getColor();
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      
      const particle = new Particle(
        ore.x,
        ore.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.6 + Math.random() * 0.4,
        3 + Math.random() * 4,
        color
      );
      this.particles.push(particle);
    }
  }

  private updateDebris(deltaTime: number): void {
    this.debris.forEach((d) => d.update(deltaTime));
    
    this.debris = this.debris.filter((d) => {
      if (d.isWarning) return true;
      return !d.isOffScreen(this.worldSize, this.worldSize);
    });
  }

  private updateParticles(deltaTime: number): void {
    this.particles = this.particles.filter((p) => {
      return !p.update(deltaTime);
    });
  }

  private updateShockwaves(deltaTime: number): void {
    this.shockwaves = this.shockwaves.filter((s) => {
      return !s.update(deltaTime);
    });
  }

  private updateNebula(deltaTime: number): void {
    this.nebulaLayers.forEach((layer) => layer.update(deltaTime));
  }

  private updateMining(deltaTime: number, input: InputState): void {
    if (!input.mining) {
      if (this.harvestingOre) {
        this.harvestingOre.isBeingHarvested = false;
        this.harvestingOre = null;
      }
      return;
    }
    
    const worldMouse = this.renderer.screenToWorld(
      input.mouseScreenX,
      input.mouseScreenY
    );
    
    if (!this.harvestingOre) {
      let closestOre: Ore | null = null as Ore | null;
      let closestDist = Infinity;
      
      for (let i = 0; i < this.ores.length; i++) {
        const ore = this.ores[i];
        if (lineCircleIntersect(
          this.ship.x, this.ship.y,
          worldMouse.x, worldMouse.y,
          ore.x, ore.y, ore.radius
        )) {
          const dist = Math.sqrt(
            (ore.x - this.ship.x) ** 2 + (ore.y - this.ship.y) ** 2
          );
          if (dist < closestDist) {
            closestDist = dist;
            closestOre = ore;
          }
        }
      }
      
      if (closestOre !== null && closestDist < 400) {
        closestOre.isBeingHarvested = true;
        this.harvestingOre = closestOre;
      }
    }
    
    if (this.harvestingOre) {
      const dist = Math.sqrt(
        (this.harvestingOre.x - this.ship.x) ** 2 +
        (this.harvestingOre.y - this.ship.y) ** 2
      );
      
      if (dist > 500) {
        this.harvestingOre.isBeingHarvested = false;
        this.harvestingOre = null;
      } else {
        this.spawnHarvestParticles(this.harvestingOre);
      }
    }
  }

  private spawnHarvestParticles(ore: Ore): void {
    const angle = Math.atan2(this.ship.y - ore.y, this.ship.x - ore.x);
    const spread = 0.5;
    
    for (let i = 0; i < 2; i++) {
      const randomAngle = angle + (Math.random() - 0.5) * spread;
      const speed = 80 + Math.random() * 60;
      
      const particle = new Particle(
        ore.x + (Math.random() - 0.5) * ore.radius,
        ore.y + (Math.random() - 0.5) * ore.radius,
        Math.cos(randomAngle) * speed,
        Math.sin(randomAngle) * speed,
        0.3 + Math.random() * 0.3,
        2 + Math.random() * 2,
        ore.getColor()
      );
      this.particles.push(particle);
    }
  }

  private updateDebrisSpawner(deltaTime: number): void {
    this.debrisTimer += deltaTime;
    
    if (this.debrisTimer >= this.nextDebrisInterval) {
      this.spawnDebris();
      this.debrisTimer = 0;
      this.nextDebrisInterval = 8 + Math.random() * 4;
    }
  }

  private spawnDebris(): void {
    const side = Math.floor(Math.random() * 4);
    let startX: number, startY: number;
    const margin = 100;
    const speed = 150 + Math.random() * 100;
    
    const targetX = this.ship.x + (Math.random() - 0.5) * 600;
    const targetY = this.ship.y + (Math.random() - 0.5) * 600;
    
    switch (side) {
      case 0:
        startX = this.ship.x - this.canvas.width / 2 - margin;
        startY = this.ship.y - this.canvas.height / 2 - margin + Math.random() * (this.canvas.height + margin * 2);
        break;
      case 1:
        startX = this.ship.x + this.canvas.width / 2 + margin;
        startY = this.ship.y - this.canvas.height / 2 - margin + Math.random() * (this.canvas.height + margin * 2);
        break;
      case 2:
        startX = this.ship.x - this.canvas.width / 2 - margin + Math.random() * (this.canvas.width + margin * 2);
        startY = this.ship.y - this.canvas.height / 2 - margin;
        break;
      default:
        startX = this.ship.x - this.canvas.width / 2 - margin + Math.random() * (this.canvas.width + margin * 2);
        startY = this.ship.y + this.canvas.height / 2 + margin;
        break;
    }
    
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / dist;
    const dirY = dy / dist;
    
    const debris = new SpaceDebris(startX, startY, dirX, dirY, speed, this.worldSize);
    this.debris.push(debris);
  }

  private checkCollisions(): void {
    this.debris.forEach((d) => {
      if (d.isWarning) return;
      
      if (checkCollision(d, this.ship)) {
        if (this.ship.takeDamage()) {
          this.spawnDamageShockwave();
          
          if (this.ship.health <= 0) {
            this.gameOver();
          }
        }
      }
      
      this.ores.forEach((ore) => {
        if (checkCollision(d, ore)) {
          ore.harvestProgress = Math.min(1, ore.harvestProgress + 0.3);
          ore.radius = ore.baseRadius * (1 - ore.harvestProgress * 0.7);
          this.spawnOreHitParticles(ore);
        }
      });
    });
  }

  private spawnDamageShockwave(): void {
    const healthIndex = this.ship.health;
    const diamondSize = 18;
    const gap = 8;
    const startX = this.canvas.width - 30;
    const startY = 35;
    
    const x = startX - healthIndex * (diamondSize + gap);
    const y = startY;
    
    const shockwave = new Shockwave(x, y, 30, 0.5, '#ffcc66');
    this.shockwaves.push(shockwave);
  }

  private spawnOreHitParticles(ore: Ore): void {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      
      const particle = new Particle(
        ore.x,
        ore.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.4 + Math.random() * 0.3,
        2 + Math.random() * 3,
        ore.getColor()
      );
      this.particles.push(particle);
    }
  }

  private gameOver(): void {
    this.isGameOver = true;
  }

  private restartGame(): void {
    this.init();
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawNebula(this.nebulaLayers, this.worldSize);
    
    this.ores.forEach((ore) => this.renderer.drawOre(ore));
    
    const inputState = this.input.getState();
    if (inputState.mining) {
      let targetX = inputState.mouseWorldX;
      let targetY = inputState.mouseWorldY;
      
      if (this.harvestingOre) {
        targetX = this.harvestingOre.x;
        targetY = this.harvestingOre.y;
      }
      
      this.renderer.drawMiningBeam(
        this.ship.x, this.ship.y,
        targetX, targetY,
        true
      );
    }
    
    this.debris.forEach((d) => this.renderer.drawDebris(d));
    
    const thrusterParticles = this.particles.filter(
      (p) => p.color === '#ffaa00'
    );
    const harvestParticles = this.particles.filter(
      (p) => p.color !== '#ffaa00'
    );
    
    this.renderer.drawThrusterParticles(thrusterParticles);
    this.renderer.drawHarvestParticles(harvestParticles);
    
    this.renderer.drawShip(this.ship);
    
    this.renderer.drawScore(this.score);
    this.renderer.drawHealth(this.ship.health, this.ship.maxHealth, this.shockwaves);
    
    if (this.isGameOver) {
      this.renderer.drawGameOver(this.score, () => this.restartGame());
    }
    
    if (this.renderer.renderComplete) {
      this.renderer.renderComplete();
    }
  }
}

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);
game.start();
