import {
  Player,
  Monster,
  Room,
  Tile,
  ElementType,
  ElementBadge,
  UIState,
  Rune,
  Crystal,
  Skill,
  GRID_SIZE,
  TILE_SIZE,
  ROOM_SIZE,
  PLAYER_SIZE,
  WALL_THICKNESS,
  ELEMENT_COLORS
} from './types';
import { ParticleSystem } from './ParticleSystem';
import { RenderManager } from './RenderManager';
import { AudioManager } from './AudioManager';

export class Game {
  private canvas: HTMLCanvasElement;
  private renderManager: RenderManager;
  private particleSystem: ParticleSystem;
  private audioManager: AudioManager;

  private player: Player;
  private monsters: Monster[] = [];
  private room: Room;
  private elementBadge: ElementBadge | null = null;
  private uiState: UIState;

  private keys: Set<string> = new Set();
  private floor = 1;
  private nextMonsterId = 0;
  private gameStarted = false;
  private gameOver = false;

  private lastTime = 0;
  private frameCount = 0;
  private fpsTime = 0;
  private currentFps = 0;
  private animationId: number | null = null;

  private trailTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderManager = new RenderManager(canvas);
    this.particleSystem = new ParticleSystem();
    this.audioManager = new AudioManager();

    this.player = this.createPlayer();
    this.room = this.generateRoom();
    this.spawnMonsters(8);

    this.uiState = {
      showModal: true,
      modalContent: '携带三块元素水晶，攀登异界共鸣塔！',
      modalScale: 0.5,
      modalOpacity: 0,
      modalPhase: 'enter',
      modalTimer: 0
    };

    this.setupInput();
  }

  private createPlayer(): Player {
    const crystals: Crystal[] = [
      this.createCrystal('fire'),
      this.createCrystal('ice'),
      this.createCrystal('electric')
    ];

    return {
      position: { x: ROOM_SIZE / 2, y: ROOM_SIZE / 2 },
      velocity: { x: 0, y: 0 },
      activeElement: 'none',
      color: ELEMENT_COLORS.none,
      targetColor: ELEMENT_COLORS.none,
      colorTransitionTime: 200,
      colorTransitionProgress: 1,
      health: 100,
      maxHealth: 100,
      crystals,
      runes: [],
      invincible: false,
      invincibleTime: 0
    };
  }

  private createCrystal(element: ElementType): Crystal {
    const skills: Skill[] = [
      { id: 's1', name: '基础共鸣', description: '水晶能量+20%', unlocked: false, runeCount: 0 },
      { id: 's2', name: '符文守护', description: '解锁环绕符文', unlocked: false, runeCount: 4 }
    ];

    return {
      element,
      energy: 100,
      maxEnergy: 100,
      level: 1,
      skills
    };
  }

  private generateRoom(): Room {
    const startTime = performance.now();
    const tiles: Tile[][] = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      tiles[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const isEdge =
          x === 0 ||
          y === 0 ||
          x === GRID_SIZE - 1 ||
          y === GRID_SIZE - 1;

        const isInnerWall = !isEdge && Math.random() < 0.12 &&
          !(x > GRID_SIZE / 2 - 3 && x < GRID_SIZE / 2 + 3 && y > GRID_SIZE / 2 - 3 && y < GRID_SIZE / 2 + 3);

        const type = isEdge || isInnerWall ? 'wall' : 'floor';
        const colorVariation = Math.random() * 10;
        const baseR = type === 'wall' ? 58 : 58;
        const baseG = type === 'wall' ? 58 : 58;
        const baseB = type === 'wall' ? 74 : 74;
        const darken = type === 'wall' ? 0 : Math.random() * 15;

        const r = Math.floor(baseR + colorVariation - darken);
        const g = Math.floor(baseG + colorVariation - darken);
        const b = Math.floor(baseB + colorVariation - darken * 0.5);

        tiles[y][x] = {
          x,
          y,
          type,
          color: `rgb(${r}, ${g}, ${b})`
        };
      }
    }

    const walls: { x: number; y: number; width: number; height: number }[] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (tiles[y][x].type === 'wall') {
          walls.push({
            x: x * TILE_SIZE,
            y: y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE
          });
        }
      }
    }

    const elapsed = performance.now() - startTime;
    console.log(`地牢生成耗时: ${elapsed.toFixed(2)}ms`);

    this.renderManager.invalidateMapCache();

    return {
      width: ROOM_SIZE,
      height: ROOM_SIZE,
      tiles,
      walls
    };
  }

  private spawnMonsters(count: number): void {
    this.monsters = [];
    const shapes: Monster['shape'][] = ['triangle', 'square', 'pentagon', 'hexagon'];
    const elements: ElementType[] = ['fire', 'ice', 'electric'];

    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      let attempts = 0;
      do {
        x = (Math.random() * (GRID_SIZE - 4) + 2) * TILE_SIZE;
        y = (Math.random() * (GRID_SIZE - 4) + 2) * TILE_SIZE;
        attempts++;
      } while (
        (Math.abs(x - this.player.position.x) < 150 &&
          Math.abs(y - this.player.position.y) < 150) ||
        this.isWallAt(x, y) ||
        attempts > 50
      );

      const element = elements[Math.floor(Math.random() * elements.length)];
      const color = this.generateMonsterColor();

      this.monsters.push({
        id: this.nextMonsterId++,
        position: { x, y },
        velocity: { x: 0, y: 0 },
        element,
        color,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: 10 + Math.random() * 8,
        health: 30 + this.floor * 10,
        maxHealth: 30 + this.floor * 10,
        speed: 40 + Math.random() * 30 + this.floor * 5,
        lastAttackTime: 0
      });
    }
  }

  private generateMonsterColor(): string {
    const hue = Math.floor(Math.random() * 360);
    const sat = 60 + Math.random() * 30;
    const light = 40 + Math.random() * 20;
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }

  private isWallAt(x: number, y: number): boolean {
    const gx = Math.floor(x / TILE_SIZE);
    const gy = Math.floor(y / TILE_SIZE);
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return true;
    return this.room.tiles[gy][gx].type === 'wall';
  }

  private checkWallCollision(
    x: number,
    y: number,
    size: number
  ): { collides: boolean; newX: number; newY: number } {
    const half = size / 2;
    let newX = x;
    let newY = y;

    if (this.isWallAt(x - half, y) || this.isWallAt(x + half, y)) {
      newX = x;
    }
    if (this.isWallAt(x, y - half) || this.isWallAt(x, y + half)) {
      newY = y;
    }

    const corners = [
      { x: x - half, y: y - half },
      { x: x + half, y: y - half },
      { x: x - half, y: y + half },
      { x: x + half, y: y + half }
    ];

    for (const corner of corners) {
      if (this.isWallAt(corner.x, corner.y)) {
        return { collides: true, newX, newY };
      }
    }

    const boundaryMin = WALL_THICKNESS + half;
    const boundaryMax = ROOM_SIZE - WALL_THICKNESS - half;
    newX = Math.max(boundaryMin, Math.min(boundaryMax, newX));
    newY = Math.max(boundaryMin, Math.min(boundaryMax, newY));

    return { collides: false, newX, newY };
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());

      if (['q', 'e', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
        this.switchElement(e.key.toLowerCase());
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    this.canvas.addEventListener('click', () => {
      if (!this.gameStarted) {
        this.startGame();
      } else if (this.gameOver) {
        this.restartGame();
      }
    });
  }

  private switchElement(key: string): void {
    if (!this.gameStarted || this.gameOver) return;

    const elements: ElementType[] = ['fire', 'ice', 'electric'];
    const currentIndex = elements.indexOf(this.player.activeElement);

    let nextIndex: number;
    if (key === 'q') {
      nextIndex = (currentIndex - 1 + elements.length) % elements.length;
    } else {
      nextIndex = (currentIndex + 1) % elements.length;
    }

    const newElement = elements[nextIndex];
    this.player.activeElement = newElement;
    this.player.targetColor = ELEMENT_COLORS[newElement];
    this.player.colorTransitionProgress = 0;

    this.elementBadge = {
      element: newElement,
      scale: 1,
      opacity: 0.8,
      duration: 0,
      maxDuration: 500,
      phase: 'scaleUp'
    };

    this.audioManager.playElementSwitch(newElement as 'fire' | 'ice' | 'electric');
  }

  private startGame(): void {
    this.gameStarted = true;
    this.gameOver = false;
    this.uiState.modalPhase = 'exit';
    this.uiState.modalTimer = 0;
    this.audioManager.init();
  }

  private restartGame(): void {
    this.floor = 1;
    this.player = this.createPlayer();
    this.room = this.generateRoom();
    this.spawnMonsters(8);
    this.particleSystem.clear();
    this.gameOver = false;
    this.elementBadge = null;

    this.uiState = {
      showModal: true,
      modalContent: '新的冒险开始了！',
      modalScale: 0.5,
      modalOpacity: 0,
      modalPhase: 'enter',
      modalTimer: 0
    };
  }

  private nextFloor(): void {
    this.floor++;
    this.room = this.generateRoom();
    this.player.position = { x: ROOM_SIZE / 2, y: ROOM_SIZE / 2 };
    this.spawnMonsters(8 + this.floor * 2);
    this.particleSystem.clear();

    this.uiState = {
      showModal: true,
      modalContent: `进入第 ${this.floor} 层！怪物更强了...`,
      modalScale: 0.5,
      modalOpacity: 0,
      modalPhase: 'enter',
      modalTimer: 0
    };
    this.gameStarted = false;
  }

  private update(deltaTime: number): void {
    if (!this.gameStarted || this.gameOver) {
      this.particleSystem.update(deltaTime);
      return;
    }

    const dt = deltaTime / 1000;
    const speed = 180;

    let vx = 0;
    let vy = 0;

    if (this.keys.has('w')) vy -= 1;
    if (this.keys.has('s')) vy += 1;
    if (this.keys.has('a')) vx -= 1;
    if (this.keys.has('d')) vx += 1;

    if (vx !== 0 && vy !== 0) {
      const inv = 1 / Math.sqrt(2);
      vx *= inv;
      vy *= inv;
    }

    this.player.velocity.x = vx * speed;
    this.player.velocity.y = vy * speed;

    let newX = this.player.position.x + this.player.velocity.x * dt;
    let newY = this.player.position.y + this.player.velocity.y * dt;

    const xCollision = this.checkWallCollision(newX, this.player.position.y, PLAYER_SIZE);
    if (!xCollision.collides) {
      this.player.position.x = xCollision.newX;
    }

    const yCollision = this.checkWallCollision(this.player.position.x, newY, PLAYER_SIZE);
    if (!yCollision.collides) {
      this.player.position.y = yCollision.newY;
    }

    if (vx !== 0 || vy !== 0) {
      this.trailTimer += deltaTime;
      if (this.trailTimer >= 30) {
        this.trailTimer = 0;
        this.particleSystem.createTrailParticle(
          { ...this.player.position },
          this.player.activeElement
        );
      }
    }

    if (this.player.invincible) {
      this.player.invincibleTime -= deltaTime;
      if (this.player.invincibleTime <= 0) {
        this.player.invincible = false;
      }
    }

    this.updateMonsters(deltaTime);
    this.checkCollisions();

    const shardResult = this.particleSystem.collectShard(this.player.position, 25);
    if (shardResult.count > 0 && shardResult.element !== 'none') {
      this.collectShard(shardResult.element, shardResult.count);
      this.audioManager.playPickup();
    }

    this.particleSystem.update(deltaTime);

    if (this.elementBadge) {
      if (this.elementBadge.duration >= this.elementBadge.maxDuration) {
        this.elementBadge = null;
      }
    }

    for (const crystal of this.player.crystals) {
      crystal.energy = Math.min(crystal.maxEnergy, crystal.energy + 5 * dt);
    }

    if (this.monsters.length === 0) {
      this.nextFloor();
    }
  }

  private updateMonsters(deltaTime: number): void {
    const dt = deltaTime / 1000;

    for (const monster of this.monsters) {
      const dx = this.player.position.x - monster.position.x;
      const dy = this.player.position.y - monster.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 50) {
        monster.velocity.x = (dx / dist) * monster.speed;
        monster.velocity.y = (dy / dist) * monster.speed;
      } else {
        monster.velocity.x *= 0.9;
        monster.velocity.y *= 0.9;
      }

      let newX = monster.position.x + monster.velocity.x * dt;
      let newY = monster.position.y + monster.velocity.y * dt;

      const xCollision = this.checkWallCollision(newX, monster.position.y, monster.size);
      if (!xCollision.collides) {
        monster.position.x = xCollision.newX;
      }

      const yCollision = this.checkWallCollision(monster.position.x, newY, monster.size);
      if (!yCollision.collides) {
        monster.position.y = yCollision.newY;
      }
    }
  }

  private checkCollisions(): void {
    const now = Date.now();

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      const dx = this.player.position.x - monster.position.x;
      const dy = this.player.position.y - monster.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const collisionDist = PLAYER_SIZE / 2 + monster.size;

      if (dist < collisionDist) {
        const attackElement =
          this.player.activeElement === 'none' ? monster.element : this.player.activeElement;

        this.particleSystem.createExplosion(
          { x: monster.position.x, y: monster.position.y },
          attackElement,
          40
        );
        this.audioManager.playExplosion();
        this.audioManager.playAttack();

        const damage = this.player.activeElement === 'none' ? 15 : 30;
        monster.health -= damage;

        const knockback = 50;
        monster.position.x -= (dx / dist) * knockback;
        monster.position.y -= (dy / dist) * knockback;

        if (!this.player.invincible && now - monster.lastAttackTime > 1000) {
          this.player.health -= 10;
          this.player.invincible = true;
          this.player.invincibleTime = 1000;
          monster.lastAttackTime = now;
          this.audioManager.playHurt();

          if (this.player.health <= 0) {
            this.gameOver = true;
            this.audioManager.playGameOver();
            this.uiState = {
              showModal: true,
              modalContent: `你倒在了第 ${this.floor} 层...\n点击重新开始`,
              modalScale: 0.5,
              modalOpacity: 0,
              modalPhase: 'enter',
              modalTimer: 0
            };
          }
        }

        if (monster.health <= 0) {
          if (Math.random() < 0.25) {
            this.particleSystem.createShardParticle(
              { ...monster.position },
              monster.element
            );
          }
          this.monsters.splice(i, 1);
        }
      }
    }
  }

  private collectShard(element: ElementType, count: number): void {
    const crystal = this.player.crystals.find((c) => c.element === element);
    if (!crystal) return;

    crystal.energy = Math.min(crystal.maxEnergy, crystal.energy + count * 20);

    if (crystal.energy >= crystal.maxEnergy) {
      crystal.energy = 0;
      crystal.level++;
      crystal.maxEnergy = Math.floor(crystal.maxEnergy * 1.2);
      this.audioManager.playLevelUp();

      const lockedSkill = crystal.skills.find((s) => !s.unlocked);
      if (lockedSkill) {
        lockedSkill.unlocked = true;
        this.addRunes(element, lockedSkill.runeCount);
      }
    }
  }

  private addRunes(element: ElementType, count: number): void {
    const existingCount = this.player.runes.filter((r) => r.element === element).length;
    for (let i = 0; i < count; i++) {
      const rune: Rune = {
        angle: ((i + existingCount) / count) * Math.PI * 2,
        orbitRadius: 20 + Math.random() * 5,
        speed: Math.PI * 2 / 2,
        element
      };
      this.player.runes.push(rune);
    }
  }

  private render(deltaTime: number): void {
    this.renderManager.clear();
    this.renderManager.renderRoom(this.room);
    this.particleSystem.draw(this.canvas.getContext('2d')!);
    this.renderManager.renderMonsters(this.monsters);
    this.renderManager.renderPlayer(this.player, deltaTime);
    this.renderManager.renderElementBadge(this.elementBadge, deltaTime);
    this.renderManager.renderUI(
      this.player,
      this.floor,
      this.monsters.length,
      this.currentFps
    );
    this.renderManager.renderModal(this.uiState, deltaTime);
  }

  private gameLoop = (timestamp: number): void => {
    const deltaTime = this.lastTime ? Math.min(timestamp - this.lastTime, 50) : 16;
    this.lastTime = timestamp;

    this.frameCount++;
    this.fpsTime += deltaTime;
    if (this.fpsTime >= 1000) {
      this.currentFps = (this.frameCount * 1000) / this.fpsTime;
      this.frameCount = 0;
      this.fpsTime = 0;
    }

    this.update(deltaTime);
    this.render(deltaTime);

    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  start(): void {
    this.lastTime = 0;
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
