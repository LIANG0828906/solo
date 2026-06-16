import { v4 as uuidv4 } from 'uuid';
import { Player } from './Player';
import {
  TrashItem, TrashType, RecyclingStation, Obstacle, ObstacleType,
  Particle, GameEvent, ScreenShake,
  TRASH_SCORES,
} from './types';

const WORLD_W = 640;
const WORLD_H = 480;
const COLLECT_RADIUS = 40;
const MAX_OBJECTS = 30;

const TRASH_TYPES: TrashType[] = ['plastic', 'rubber', 'metal', 'fabric'];

export interface WorldSnapshot {
  playerX: number;
  playerY: number;
  playerSpeed: number;
  playerShield: number;
  playerMaxShield: number;
  playerBasketCapacity: number;
  playerCurrentItems: TrashType[];
  playerHitTimer: number;
  playerStripes: number;
  trashItems: TrashItem[];
  recyclingStations: RecyclingStation[];
  obstacles: Obstacle[];
  particles: Particle[];
  waterLevel: number;
  event: GameEvent | null;
  screenShake: ScreenShake;
  totalCollected: number;
}

export class World {
  player: Player;
  trashItems: TrashItem[] = [];
  recyclingStations: RecyclingStation[] = [];
  obstacles: Obstacle[] = [];
  particles: Particle[] = [];
  waterLevel = 0;
  event: GameEvent | null = null;
  screenShake: ScreenShake = { offsetX: 0, offsetY: 0, timer: 0 };
  totalCollected = 0;
  trashSpawnTimer = 0;
  obstacleSpawnTimer = 0;
  microbeTimer = 0;

  constructor() {
    this.player = new Player(WORLD_W / 2, WORLD_H / 2);
    this.initRecyclingStations();
    this.spawnInitialTrash();
  }

  private initRecyclingStations() {
    const types: TrashType[] = ['plastic', 'rubber', 'metal', 'fabric'];
    const stationW = 50;
    const gap = 20;
    const totalW = types.length * stationW + (types.length - 1) * gap;
    const startX = (WORLD_W - totalW) / 2;
    types.forEach((type, i) => {
      this.recyclingStations.push({
        type,
        x: startX + i * (stationW + gap),
        y: 10,
        width: stationW,
        height: 36,
        recycled: 0,
      });
    });
  }

  private spawnInitialTrash() {
    for (let i = 0; i < 8; i++) {
      this.spawnTrash();
    }
  }

  spawnTrash() {
    if (this.trashItems.length >= MAX_OBJECTS) return;
    const type = TRASH_TYPES[Math.floor(Math.random() * TRASH_TYPES.length)];
    this.trashItems.push({
      id: uuidv4(),
      type,
      x: 40 + Math.random() * (WORLD_W - 80),
      y: 60 + Math.random() * (WORLD_H - 100),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      collected: false,
      collecting: false,
      collectTimer: 0,
      scale: 1,
    });
  }

  spawnObstacle() {
    if (this.obstacles.length >= MAX_OBJECTS) return;
    const types: ObstacleType[] = ['reef', 'jellyfish', 'oil'];
    const type = types[Math.floor(Math.random() * types.length)];
    const obs: Obstacle = {
      id: uuidv4(),
      type,
      x: 40 + Math.random() * (WORLD_W - 80),
      y: 80 + Math.random() * (WORLD_H - 120),
      width: type === 'reef' ? 50 : type === 'oil' ? 60 : 0,
      height: type === 'reef' ? 40 : type === 'oil' ? 50 : 0,
      active: true,
      timer: type === 'jellyfish' ? 15 : 0,
      jellyfishes: undefined,
    };
    if (type === 'jellyfish') {
      const count = 5 + Math.floor(Math.random() * 4);
      obs.jellyfishes = [];
      for (let i = 0; i < count; i++) {
        obs.jellyfishes.push({
          x: obs.x + (Math.random() - 0.5) * 80,
          y: obs.y + (Math.random() - 0.5) * 60,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.5,
        });
      }
    }
    this.obstacles.push(obs);
  }

  triggerEvent() {
    this.event = {
      name: '水母入侵！',
      timer: 15,
      maxTimer: 15,
    };
    const count = 5 + Math.floor(Math.random() * 4);
    const baseX = 40 + Math.random() * (WORLD_W - 80);
    const baseY = 80 + Math.random() * (WORLD_H - 120);
    const obs: Obstacle = {
      id: uuidv4(),
      type: 'jellyfish',
      x: baseX,
      y: baseY,
      width: 0,
      height: 0,
      active: true,
      timer: 15,
      jellyfishes: [],
    };
    for (let i = 0; i < count; i++) {
      obs.jellyfishes!.push({
        x: baseX + (Math.random() - 0.5) * 80,
        y: baseY + (Math.random() - 0.5) * 60,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
      });
    }
    this.obstacles.push(obs);
  }

  tryCollect(): { pickedType: TrashType; score: number } | null {
    const px = this.player.state.x;
    const py = this.player.state.y;
    if (!this.player.canPickup()) return null;

    for (const item of this.trashItems) {
      if (item.collected || item.collecting) continue;
      const dx = item.x - px;
      const dy = item.y - py;
      if (dx * dx + dy * dy <= COLLECT_RADIUS * COLLECT_RADIUS) {
        item.collecting = true;
        item.collectTimer = 0.2;
        const score = this.player.pickup(item.type);
        this.totalCollected++;
        return { pickedType: item.type, score };
      }
    }
    return null;
  }

  tryDeposit(stationType: TrashType): { correctScore: number; penalty: number; correctCount: number; wrongCount: number } {
    const result = this.player.depositAll(stationType);
    let correctScore = 0;
    let penalty = 0;
    for (const item of result.correct) {
      correctScore += Math.floor(TRASH_SCORES[item] * 1.5);
    }
    for (const item of result.wrong) {
      penalty += TRASH_SCORES[item] * 2;
    }
    if (result.wrong.length > 0) {
      this.screenShake = { offsetX: 0, offsetY: 0, timer: 0.3 };
    }
    const station = this.recyclingStations.find(s => s.type === stationType);
    if (station) {
      station.recycled += result.correct.length;
    }
    return {
      correctScore,
      penalty,
      correctCount: result.correct.length,
      wrongCount: result.wrong.length,
    };
  }

  checkObstacleDamage(): boolean {
    const px = this.player.state.x;
    const py = this.player.state.y;
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      if (obs.type === 'jellyfish' && obs.jellyfishes) {
        for (const jf of obs.jellyfishes) {
          const dx = jf.x - px;
          const dy = jf.y - py;
          if (dx * dx + dy * dy < 25 * 25) {
            this.player.takeDamage(10);
            return true;
          }
        }
      } else if (obs.type === 'oil') {
        const dx = obs.x + obs.width / 2 - px;
        const dy = obs.y + obs.height / 2 - py;
        if (Math.abs(dx) < obs.width / 2 + 15 && Math.abs(dy) < obs.height / 2 + 15) {
          this.player.takeDamage(5);
          return true;
        }
      } else if (obs.type === 'reef') {
        const dx = obs.x + obs.width / 2 - px;
        const dy = obs.y + obs.height / 2 - py;
        if (Math.abs(dx) < obs.width / 2 + 15 && Math.abs(dy) < obs.height / 2 + 15) {
          this.player.takeDamage(3);
          return true;
        }
      }
    }
    return false;
  }

  checkStationHover(mx: number, my: number, camX: number, camY: number): TrashType | null {
    for (const station of this.recyclingStations) {
      const sx = station.x - camX;
      const sy = station.y - camY;
      if (mx >= sx && mx <= sx + station.width && my >= sy && my <= sy + station.height) {
        return station.type;
      }
    }
    return null;
  }

  spawnBubble() {
    const px = this.player.state.x;
    const py = this.player.state.y;
    this.particles.push({
      x: px + (Math.random() - 0.5) * 20,
      y: py + 15,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.5 - Math.random() * 1.0,
      life: 1.5 + Math.random(),
      maxLife: 1.5 + Math.random(),
      size: 2 + Math.random() * 3,
      alpha: 0.6,
      type: 'bubble',
    });
  }

  spawnMicrobe() {
    this.particles.push({
      x: Math.random() * WORLD_W,
      y: Math.random() * WORLD_H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      life: 3 + Math.random() * 4,
      maxLife: 3 + Math.random() * 4,
      size: 1 + Math.random() * 2,
      alpha: 0.3 + Math.random() * 0.3,
      type: 'microbe',
    });
  }

  update(dt: number) {
    this.player.update(dt);

    this.trashSpawnTimer += dt;
    if (this.trashSpawnTimer > 2.0) {
      this.trashSpawnTimer = 0;
      this.spawnTrash();
    }

    this.obstacleSpawnTimer += dt;
    if (this.obstacleSpawnTimer > 8.0) {
      this.obstacleSpawnTimer = 0;
      if (this.obstacles.length < 5) {
        this.spawnObstacle();
      }
    }

    this.microbeTimer += dt;
    if (this.microbeTimer > 0.5) {
      this.microbeTimer = 0;
      this.spawnMicrobe();
    }

    if (Math.random() < 0.05) {
      this.spawnBubble();
    }

    for (const item of this.trashItems) {
      if (item.collecting) {
        item.collectTimer -= dt;
        item.scale = Math.max(0, item.collectTimer / 0.2);
        if (item.collectTimer <= 0) {
          item.collected = true;
        }
      }
      item.rotation += item.rotationSpeed;
    }
    this.trashItems = this.trashItems.filter(item => !item.collected);

    for (const obs of this.obstacles) {
      if (obs.type === 'jellyfish' && obs.jellyfishes) {
        obs.timer -= dt;
        for (const jf of obs.jellyfishes) {
          jf.phase += jf.speed * dt;
          jf.x += Math.sin(jf.phase) * 0.5;
          jf.y += Math.cos(jf.phase * 0.7) * 0.3;
        }
        if (obs.timer <= 0) {
          obs.active = false;
        }
      }
    }
    this.obstacles = this.obstacles.filter(o => o.active);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.alpha = Math.max(0, (p.life / p.maxLife) * 0.6);
    }
    this.particles = this.particles.filter(p => p.life > 0);

    if (this.event) {
      this.event.timer -= dt;
      if (this.event.timer <= 0) {
        this.event = null;
      }
    }

    if (this.screenShake.timer > 0) {
      this.screenShake.timer -= dt;
      this.screenShake.offsetX = (Math.random() - 0.5) * 10;
      this.screenShake.offsetY = (Math.random() - 0.5) * 10;
      if (this.screenShake.timer <= 0) {
        this.screenShake = { offsetX: 0, offsetY: 0, timer: 0 };
      }
    }

    const newWaterLevel = Math.floor(this.totalCollected / 10);
    if (newWaterLevel > this.waterLevel) {
      this.waterLevel = newWaterLevel;
      this.triggerEvent();
    }
  }

  getSnapshot(): WorldSnapshot {
    return {
      playerX: this.player.state.x,
      playerY: this.player.state.y,
      playerSpeed: this.player.state.speed,
      playerShield: this.player.state.shield,
      playerMaxShield: this.player.state.maxShield,
      playerBasketCapacity: this.player.state.basketCapacity,
      playerCurrentItems: [...this.player.state.currentItems],
      playerHitTimer: this.player.state.shieldHitTimer,
      playerStripes: this.player.state.stripes,
      trashItems: this.trashItems.map(t => ({ ...t })),
      recyclingStations: this.recyclingStations.map(s => ({ ...s })),
      obstacles: this.obstacles.map(o => ({
        ...o,
        jellyfishes: o.jellyfishes ? o.jellyfishes.map(j => ({ ...j })) : undefined,
      })),
      particles: this.particles.map(p => ({ ...p })),
      waterLevel: this.waterLevel,
      event: this.event ? { ...this.event } : null,
      screenShake: { ...this.screenShake },
      totalCollected: this.totalCollected,
    };
  }
}
