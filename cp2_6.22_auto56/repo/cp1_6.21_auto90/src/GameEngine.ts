import { DungeonGenerator } from './DungeonGenerator';
import { RaycasterRenderer } from './RaycasterRenderer';
import { UIOverlay } from './UIOverlay';
import { Dungeon, Player, GameState, Room, Fireball, InputState, RoomType } from './types';

const MOVE_SPEED = 3.0;
const FIREBALL_SPEED = 300;
const FIREBALL_COOLDOWN = 0.3;
const TRANSITION_DURATION = 0.5;

export class GameEngine {
  private container: HTMLElement;
  private ui: UIOverlay;
  private raycaster: RaycasterRenderer;

  private dungeon: Dungeon | null = null;
  private player: Player;
  private gameState: GameState;
  private transitionTimer: number;
  private targetRoomX: number;
  private targetRoomY: number;

  private fireballs: Fireball[];
  private fireballIdCounter: number;
  private fireballCooldown: number;

  private lastTime: number;
  private fps: number;
  private frameCount: number;
  private fpsTimer: number;
  private animFrameId: number | null;

  private deltaXAccum: number;

  constructor(container: HTMLElement) {
    this.container = container;
    this.ui = new UIOverlay(container);
    const gameCanvas = this.ui.getGameCanvas();
    this.raycaster = new RaycasterRenderer(gameCanvas);

    this.player = this.createInitialPlayer();
    this.gameState = GameState.TOPDOWN;
    this.transitionTimer = 0;
    this.targetRoomX = 0;
    this.targetRoomY = 0;

    this.fireballs = [];
    this.fireballIdCounter = 0;
    this.fireballCooldown = 0;

    this.lastTime = performance.now();
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.animFrameId = null;

    this.deltaXAccum = 0;

    this.setupCallbacks();
    this.generateDungeon(Date.now());
    this.startGameLoop();
  }

  private createInitialPlayer(): Player {
    return {
      x: 2.5,
      y: 2.5,
      angle: 0,
      currentRoomX: 0,
      currentRoomY: 0,
      treasuresCollected: 0,
      bobOffset: 0,
      bobTimer: 0
    };
  }

  private setupCallbacks(): void {
    this.ui.setOnGenerate((seed: number) => {
      this.generateDungeon(seed);
    });

    this.ui.setOnRoomClick((x: number, y: number) => {
      if (this.gameState !== GameState.TOPDOWN || !this.dungeon) return;

      const roomPos = this.ui.getTopdownRoomAt(x, y, this.dungeon);
      if (roomPos) {
        this.enterRoom(roomPos.gridX, roomPos.gridY);
      }
    });

    this.ui.setOnBackToTopdown(() => {
      if (this.gameState === GameState.FIRSTPERSON) {
        this.returnToTopdown();
      }
    });
  }

  private generateDungeon(seed: number): void {
    const generator = new DungeonGenerator(seed, 6, 6);
    this.dungeon = generator.generate();

    this.player = this.createInitialPlayer();
    this.player.currentRoomX = this.dungeon.coreRoom.x;
    this.player.currentRoomY = this.dungeon.coreRoom.y;

    const coreRoom = this.dungeon.rooms[this.player.currentRoomY][this.player.currentRoomX];
    const roomSize = coreRoom.wallMap.length;
    this.player.x = Math.floor(roomSize / 2) + 0.5;
    this.player.y = Math.floor(roomSize / 2) + 0.5;

    coreRoom.explored = true;

    this.ui.setSeed(seed);
    this.gameState = GameState.TOPDOWN;
    this.fireballs = [];
    this.fireballCooldown = 0;
  }

  private enterRoom(gridX: number, gridY: number): void {
    if (!this.dungeon) return;

    const room = this.dungeon.rooms[gridY][gridX];
    if (room.type === RoomType.EMPTY) return;

    this.targetRoomX = gridX;
    this.targetRoomY = gridY;
    this.gameState = GameState.TRANSITION;
    this.transitionTimer = 0;
  }

  private returnToTopdown(): void {
    this.gameState = GameState.TRANSITION;
    this.transitionTimer = 0;
    this.targetRoomX = this.player.currentRoomX;
    this.targetRoomY = this.player.currentRoomY;
    this.ui.toggleMap(false);
  }

  private completeTransition(): void {
    if (!this.dungeon) return;

    if (this.gameState === GameState.TRANSITION) {
      if (this.transitionTimer >= TRANSITION_DURATION / 2) {
        if (this.player.currentRoomX !== this.targetRoomX ||
            this.player.currentRoomY !== this.targetRoomY) {
          this.player.currentRoomX = this.targetRoomX;
          this.player.currentRoomY = this.targetRoomY;

          const room = this.dungeon.rooms[this.targetRoomY][this.targetRoomX];
          const roomSize = room.wallMap.length;
          this.player.x = Math.floor(roomSize / 2) + 0.5;
          this.player.y = Math.floor(roomSize / 2) + 0.5;
          room.explored = true;

          if (room.type === RoomType.TREASURE && room.treasures > 0) {
            this.player.treasuresCollected++;
            room.treasures = 0;
          }

          this.gameState = GameState.FIRSTPERSON;
        } else {
          this.gameState = GameState.TOPDOWN;
        }
      }
    }
  }

  private startGameLoop(): void {
    const loop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      this.update(deltaTime);
      this.render();

      this.frameCount++;
      this.fpsTimer += deltaTime;
      if (this.fpsTimer >= 1) {
        this.fps = Math.round(this.frameCount / this.fpsTimer);
        this.frameCount = 0;
        this.fpsTimer = 0;
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(loop);
  }

  private update(deltaTime: number): void {
    if (!this.dungeon) return;

    if (this.gameState === GameState.TRANSITION) {
      this.transitionTimer += deltaTime;
      this.completeTransition();
      return;
    }

    const currentRoom = this.dungeon.rooms[this.player.currentRoomY][this.player.currentRoomX];
    const input = this.ui.getInputState();

    this.deltaXAccum += (input as any).deltaX || 0;

    if (this.gameState === GameState.FIRSTPERSON) {
      this.updatePlayer(deltaTime, input, currentRoom);
      this.updateFireballs(deltaTime, currentRoom);
      this.updateEnemies(deltaTime, currentRoom);
      this.checkRoomTransition(currentRoom);
      this.updateBob(deltaTime, input);
    }

    if (currentRoom.clearFlashTimer > 0) {
      currentRoom.clearFlashTimer -= deltaTime;
    }

    this.ui.update(deltaTime, this.dungeon, this.player, currentRoom, this.gameState);
  }

  private updatePlayer(deltaTime: number, input: InputState, room: Room): void {
    this.player.angle += this.deltaXAccum;
    this.deltaXAccum = 0;

    let dx = 0;
    let dy = 0;

    if (input.w) {
      dx += Math.cos(this.player.angle) * MOVE_SPEED * deltaTime;
      dy += Math.sin(this.player.angle) * MOVE_SPEED * deltaTime;
    }
    if (input.s) {
      dx -= Math.cos(this.player.angle) * MOVE_SPEED * deltaTime;
      dy -= Math.sin(this.player.angle) * MOVE_SPEED * deltaTime;
    }
    if (input.a) {
      dx += Math.cos(this.player.angle - Math.PI / 2) * MOVE_SPEED * deltaTime;
      dy += Math.sin(this.player.angle - Math.PI / 2) * MOVE_SPEED * deltaTime;
    }
    if (input.d) {
      dx += Math.cos(this.player.angle + Math.PI / 2) * MOVE_SPEED * deltaTime;
      dy += Math.sin(this.player.angle + Math.PI / 2) * MOVE_SPEED * deltaTime;
    }

    const newX = this.player.x + dx;
    const newY = this.player.y + dy;
    const roomSize = room.wallMap.length;

    const gridX = Math.floor(newX);
    const gridY = Math.floor(newY);

    if (gridX >= 0 && gridX < roomSize && gridY >= 0 && gridY < roomSize) {
      if (room.wallMap[gridY][gridX] !== 1) {
        this.player.x = newX;
        this.player.y = newY;
      }
    }

    if (this.fireballCooldown > 0) {
      this.fireballCooldown -= deltaTime;
    }

    if (input.mouseDown && this.fireballCooldown <= 0 && room.cleared !== undefined) {
      this.shootFireball();
      this.fireballCooldown = FIREBALL_COOLDOWN;
    }
  }

  private updateBob(deltaTime: number, input: InputState): void {
    const isMoving = input.w || input.a || input.s || input.d;
    if (isMoving) {
      this.player.bobTimer += deltaTime * 8;
      this.player.bobOffset = Math.sin(this.player.bobTimer) * 2;
    } else {
      this.player.bobOffset *= Math.pow(0.01, deltaTime);
    }
  }

  private shootFireball(): void {
    const speed = FIREBALL_SPEED / 60;
    this.fireballs.push({
      id: this.fireballIdCounter++,
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(this.player.angle) * speed,
      vy: Math.sin(this.player.angle) * speed,
      active: true
    });
  }

  private updateFireballs(_deltaTime: number, room: Room): void {
    const roomSize = room.wallMap.length;

    for (const fireball of this.fireballs) {
      if (!fireball.active) continue;

      fireball.x += fireball.vx;
      fireball.y += fireball.vy;

      const gridX = Math.floor(fireball.x);
      const gridY = Math.floor(fireball.y);

      if (gridX < 0 || gridX >= roomSize || gridY < 0 || gridY >= roomSize ||
          room.wallMap[gridY][gridX] === 1) {
        fireball.active = false;
        continue;
      }

      for (const enemy of room.enemies) {
        if (!enemy.alive) continue;

        const dist = Math.sqrt((fireball.x - enemy.x) ** 2 + (fireball.y - enemy.y) ** 2);
        if (dist < 0.5) {
          fireball.active = false;
          enemy.hp--;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            enemy.deathTimer = 0.3;
          }
          break;
        }
      }
    }

    this.fireballs = this.fireballs.filter(f => f.active);
  }

  private updateEnemies(deltaTime: number, room: Room): void {
    for (const enemy of room.enemies) {
      if (!enemy.alive) {
        if (enemy.deathTimer > 0) {
          enemy.deathTimer -= deltaTime;
        }
        continue;
      }

      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5 && dist > 0.5) {
        const speed = 0.8 * deltaTime;
        const moveX = (dx / dist) * speed;
        const moveY = (dy / dist) * speed;

        const roomSize = room.wallMap.length;
        const newX = enemy.x + moveX;
        const newY = enemy.y + moveY;
        const gridX = Math.floor(newX);
        const gridY = Math.floor(newY);

        if (gridX >= 0 && gridX < roomSize && gridY >= 0 && gridY < roomSize &&
            room.wallMap[gridY][gridX] !== 1) {
          enemy.x = newX;
          enemy.y = newY;
        }
      }
    }

    const aliveEnemies = room.enemies.filter(e => e.alive).length;
    if (aliveEnemies === 0 && !room.cleared && room.type === RoomType.MONSTER) {
      room.cleared = true;
      room.clearFlashTimer = 0.5;
    }
  }

  private checkRoomTransition(room: Room): void {
    if (!this.dungeon) return;

    const roomSize = room.wallMap.length;
    let newRoomX = this.player.currentRoomX;
    let newRoomY = this.player.currentRoomY;

    if (this.player.x < 0 && room.connections.west) {
      newRoomX--;
      this.player.x = roomSize - 0.1;
    } else if (this.player.x >= roomSize && room.connections.east) {
      newRoomX++;
      this.player.x = 0.1;
    } else if (this.player.y < 0 && room.connections.north) {
      newRoomY--;
      this.player.y = roomSize - 0.1;
    } else if (this.player.y >= roomSize && room.connections.south) {
      newRoomY++;
      this.player.y = 0.1;
    }

    if (newRoomX !== this.player.currentRoomX || newRoomY !== this.player.currentRoomY) {
      if (newRoomX >= 0 && newRoomX < this.dungeon.gridWidth &&
          newRoomY >= 0 && newRoomY < this.dungeon.gridHeight) {
        const newRoom = this.dungeon.rooms[newRoomY][newRoomX];
        if (newRoom.type !== RoomType.EMPTY) {
          this.player.currentRoomX = newRoomX;
          this.player.currentRoomY = newRoomY;
          newRoom.explored = true;

          if (newRoom.type === RoomType.TREASURE && newRoom.treasures > 0) {
            this.player.treasuresCollected++;
            newRoom.treasures = 0;
          }
        }
      }
    }
  }

  private render(): void {
    if (!this.dungeon) return;

    const currentRoom = this.dungeon.rooms[this.player.currentRoomY][this.player.currentRoomX];

    if (this.gameState === GameState.FIRSTPERSON) {
      this.raycaster.render(
        currentRoom,
        this.player,
        currentRoom.enemies,
        this.fireballs,
        1,
        1
      );
    }

    if (this.gameState === GameState.TRANSITION) {
      const progress = this.transitionTimer / TRANSITION_DURATION;
      this.ui.renderTransition(progress);
    }

    this.renderFPS();
  }

  private renderFPS(): void {
    const canvas = this.ui.getGameCanvas();
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`FPS: ${this.fps}`, canvas.width - 10, 20);
  }

  destroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}

const app = document.getElementById('app');
if (app) {
  new GameEngine(app);
} else {
  console.error('Could not find app container');
}
