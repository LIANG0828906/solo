import { generateDungeon, MapData, TileType } from './mapGen';
import { Player, Monster, tryCollectGem } from './entities';
import { Renderer, isTouchDevice } from './effects';

type GameState = 'playing' | 'gameover' | 'win';

class Game {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  map!: MapData;
  player!: Player;
  monsters: Monster[] = [];
  collectedGems: Set<string> = new Set();
  gameState: GameState = 'playing';
  lastTime: number = 0;
  pendingDir: { dx: number; dy: number } | null = null;
  touch: boolean;
  fireworksSpawned: boolean = false;
  fireworksTimer: number = 0;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
    if (!canvas) throw new Error('找不到 canvas 元素');
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.touch = isTouchDevice();

    this.initGame();
    this.bindEvents();

    window.addEventListener('resize', () => this.renderer.resize(this.map));
    requestAnimationFrame(this.loop.bind(this));
  }

  initGame(): void {
    this.map = generateDungeon();
    this.player = new Player(this.map.startPos.x, this.map.startPos.y);
    this.monsters = [];
    this.collectedGems = new Set();
    this.gameState = 'playing';
    this.fireworksSpawned = false;
    this.fireworksTimer = 0;
    this.pendingDir = null;

    for (const spawn of this.map.monsterSpawns) {
      const monster = new Monster(spawn.x, spawn.y);
      const patrol = Monster.generatePatrolPath(this.map, spawn.x, spawn.y, 3);
      monster.setPatrolPath(patrol);
      this.monsters.push(monster);
    }

    this.renderer.resize(this.map);
  }

  bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      if (this.gameState !== 'playing') {
        if (e.code === 'Space') {
          this.initGame();
        }
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
      }
    });

    this.canvas.addEventListener('click', () => {
      if (this.gameState !== 'playing') {
        this.initGame();
      }
    });

    if (this.touch) {
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.gameState !== 'playing') {
          this.initGame();
          return;
        }

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const btnSize = Math.min(w, h) * 0.12;
        const margin = btnSize * 0.5;
        const dpadX = margin + btnSize;
        const dpadY = h - margin - btnSize * 1.5;

        const dirs = [
          { dx: 0, dy: -1, ox: 0, oy: -1 },
          { dx: -1, dy: 0, ox: -1, oy: 0 },
          { dx: 1, dy: 0, ox: 1, oy: 0 },
          { dx: 0, dy: 1, ox: 0, oy: 1 },
        ];

        for (const d of dirs) {
          const bx = dpadX + d.ox * btnSize;
          const by = dpadY + d.oy * btnSize;
          if (
            x >= bx - btnSize / 2 &&
            x <= bx + btnSize / 2 &&
            y >= by - btnSize / 2 &&
            y <= by + btnSize / 2
          ) {
            this.pendingDir = { dx: d.dx, dy: d.dy };
            break;
          }
        }
      }, { passive: false });
    }
  }

  update(dt: number): void {
    if (this.gameState !== 'playing') {
      this.renderer.updateParticles(dt);
      if (this.gameState === 'win') {
        this.fireworksTimer -= dt;
        if (this.fireworksTimer <= 0) {
          const w = this.canvas.clientWidth;
          const h = this.canvas.clientHeight;
          this.renderer.spawnFireworks(w / 2, h / 2);
          this.fireworksTimer = 0.8;
        }
      }
      return;
    }

    this.renderer.updateParticles(dt);

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
    this.renderer.drawHUD(
      this.collectedGems.size,
      this.map.gemPositions.length,
      this.gameState
    );

    if (this.touch && this.gameState === 'playing') {
      this.renderer.drawTouchControls();
    }

    if (this.gameState === 'gameover' || this.gameState === 'win') {
      this.renderer.drawGameOver(this.gameState === 'win');
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
