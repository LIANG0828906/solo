import { generateDungeon, MapData, TileType } from './mapGen';
import { Player, Monster, tryCollectGem, Direction } from './entities';
import { Renderer, isTouchDevice } from './effects';

type GameState = 'start' | 'playing' | 'gameover' | 'win';

const SWIPE_THRESHOLD = 20;
const MESSAGE_RESET_DELAY = 2;

class Game {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  map!: MapData;
  player!: Player;
  monsters: Monster[] = [];
  collectedGems: Set<string> = new Set();
  gameState: GameState = 'start';
  lastTime: number = 0;
  pendingDir: { dx: number; dy: number } | null = null;
  touch: boolean;
  fireworksSpawned: boolean = false;
  fireworksTimer: number = 0;
  startPhase: number = 0;
  messageTimer: number = 0;
  messagePhase: number = 0;
  swipeStartX: number = 0;
  swipeStartY: number = 0;
  swipeActive: boolean = false;
  swipeConsumed: boolean = false;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
    if (!canvas) throw new Error('找不到 canvas 元素');
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.touch = isTouchDevice();

    this.map = generateDungeon();
    this.renderer.resize(this.map);
    this.resetEntities();
    this.bindEvents();

    window.addEventListener('resize', () => this.renderer.resize(this.map));
    requestAnimationFrame(this.loop.bind(this));
  }

  private resetEntities(): void {
    this.player = new Player(this.map.startPos.x, this.map.startPos.y);
    this.monsters = [];
    this.collectedGems = new Set();
    this.fireworksSpawned = false;
    this.fireworksTimer = 0;
    this.pendingDir = null;
    this.messageTimer = 0;
    this.messagePhase = 0;
    this.swipeActive = false;
    this.swipeConsumed = false;

    for (const spawn of this.map.monsterSpawns) {
      const monster = new Monster(spawn.x, spawn.y);
      const patrol = Monster.generatePatrolPath(this.map, spawn.x, spawn.y, 3);
      monster.setPatrolPath(patrol);
      this.monsters.push(monster);
    }
  }

  initGame(): void {
    this.map = generateDungeon();
    this.resetEntities();
    this.gameState = 'playing';
    this.renderer.resize(this.map);
  }

  private startFromIdle(): void {
    if (this.gameState === 'start') {
      this.gameState = 'playing';
      return;
    }
    if (this.gameState === 'gameover' || this.gameState === 'win') {
      this.initGame();
    }
  }

  private resolveSwipe(dx: number, dy: number): { dx: number; dy: number; dir: Direction } | null {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) return null;
    if (absX > absY) {
      return { dx: dx > 0 ? 1 : -1, dy: 0, dir: dx > 0 ? 'right' : 'left' };
    } else {
      return { dx: 0, dy: dy > 0 ? 1 : -1, dir: dy > 0 ? 'down' : 'up' };
    }
  }

  bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      if (this.gameState !== 'playing') {
        this.startFromIdle();
        return;
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.pendingDir = { dx: 0, dy: -1 };
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.pendingDir = { dx: 0, dy: 1 };
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.pendingDir = { dx: -1, dy: 0 };
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.pendingDir = { dx: 1, dy: 0 };
          e.preventDefault();
          break;
        default:
          break;
      }
    });

    this.canvas.addEventListener('click', () => {
      this.startFromIdle();
    });

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (this.gameState !== 'playing') {
        this.startFromIdle();
        return;
      }
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.swipeStartX = touch.clientX - rect.left;
      this.swipeStartY = touch.clientY - rect.top;
      this.swipeActive = true;
      this.swipeConsumed = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (this.gameState !== 'playing' || !this.swipeActive || this.swipeConsumed) return;
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const cx = touch.clientX - rect.left;
      const cy = touch.clientY - rect.top;
      const dx = cx - this.swipeStartX;
      const dy = cy - this.swipeStartY;
      const result = this.resolveSwipe(dx, dy);
      if (result) {
        this.pendingDir = { dx: result.dx, dy: result.dy };
        this.renderer.notifySwipe(result.dir);
        this.swipeConsumed = true;
        this.swipeActive = false;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (this.gameState !== 'playing') {
        this.startFromIdle();
        return;
      }
      if (this.swipeActive && !this.swipeConsumed) {
        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        const cx = touch.clientX - rect.left;
        const cy = touch.clientY - rect.top;
        const dx = cx - this.swipeStartX;
        const dy = cy - this.swipeStartY;
        const result = this.resolveSwipe(dx, dy);
        if (result) {
          this.pendingDir = { dx: result.dx, dy: result.dy };
          this.renderer.notifySwipe(result.dir);
          this.swipeConsumed = true;
        }
      }
      this.swipeActive = false;
    };

    this.canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', onTouchEnd, { passive: false });
  }

  update(dt: number): void {
    this.renderer.updateParticles(dt);

    if (this.gameState === 'start') {
      this.startPhase += dt;
      return;
    }

    if (this.gameState === 'gameover' || this.gameState === 'win') {
      this.messagePhase += dt;
      this.messageTimer += dt;
      if (this.gameState === 'win') {
        this.fireworksTimer -= dt;
        if (this.fireworksTimer <= 0) {
          const w = this.canvas.clientWidth;
          const h = this.canvas.clientHeight;
          this.renderer.spawnFireworks(w / 2, h / 2);
          this.fireworksTimer = 0.8;
        }
      }
      if (this.messageTimer >= MESSAGE_RESET_DELAY) {
        this.initGame();
      }
      return;
    }

    if (this.pendingDir && !this.player.isMoving) {
      this.player.startMove(this.pendingDir.dx, this.pendingDir.dy, this.map);
      this.pendingDir = null;
    }

    this.player.update(dt);

    const collected = tryCollectGem(this.map, this.player, this.collectedGems);
    if (collected) {
      this.renderer.spawnCollectEffect(collected.x, collected.y);
      this.map.grid[collected.y][collected.x] = TileType.FLOOR;
    }

    for (const monster of this.monsters) {
      monster.updateAI(dt, this.map, this.player);
      if (monster.checkCollision(this.player)) {
        this.gameState = 'gameover';
        this.messagePhase = 0;
        this.messageTimer = 0;
        return;
      }
    }

    const allCollected = this.collectedGems.size >= this.map.gemPositions.length;
    if (
      allCollected &&
      !this.player.isMoving &&
      this.player.gridX === this.map.exitPos.x &&
      this.player.gridY === this.map.exitPos.y
    ) {
      this.gameState = 'win';
      this.messagePhase = 0;
      this.messageTimer = 0;
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      this.renderer.spawnFireworks(w / 2, h / 2);
      this.fireworksTimer = 0.6;
    }
  }

  render(): void {
    this.renderer.clear();
    const allCollected = this.collectedGems.size >= this.map.gemPositions.length;
    this.renderer.drawMap(this.map, allCollected);
    this.renderer.drawGems(this.map, this.collectedGems);
    this.renderer.drawPlayer(this.player);
    for (const monster of this.monsters) {
      this.renderer.drawMonster(monster);
    }
    this.renderer.drawParticles();

    this.renderer.drawGemPanel(this.collectedGems.size, this.map.gemPositions.length);
    if (this.gameState === 'playing') {
      this.renderer.drawStatusTip(this.collectedGems.size, this.map.gemPositions.length);
    }

    if (this.gameState === 'playing') {
      this.renderer.drawSwipeHint();
    }

    if (this.gameState === 'gameover') {
      this.renderer.drawCenterMessage('游戏结束', 'gameover', this.messagePhase);
    } else if (this.gameState === 'win') {
      this.renderer.drawCenterMessage('通关！', 'win', this.messagePhase);
    } else if (this.gameState === 'start') {
      this.renderer.drawStartScreen(this.startPhase);
    }
  }

  loop(timestamp: number): void {
    if (this.lastTime === 0) this.lastTime = timestamp;
    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    dt = Math.min(dt, 0.05);

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }
}

new Game();
