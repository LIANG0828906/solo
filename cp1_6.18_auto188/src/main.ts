import { MazeEngine, GRID_SIZE, CELL_SIZE, Frequency } from './core/MazeEngine';
import { SonarEngine } from './core/SonarEngine';
import { RenderEngine } from './core/RenderEngine';
import { AudioEngine } from './core/AudioEngine';

class Game {
  private canvas: HTMLCanvasElement;
  private maze!: MazeEngine;
  private sonar!: SonarEngine;
  private renderer!: RenderEngine;
  private audio: AudioEngine;
  private selectedFrequency: Frequency = 'mid';
  private lastTime: number = 0;
  private running: boolean = false;
  private gameStarted: boolean = false;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.audio = new AudioEngine();
    this.initGame();
    this.setupEvents();
    this.startLoop();
  }

  private initGame(): void {
    this.maze = new MazeEngine(this.canvas.width, this.canvas.height);
    this.sonar = new SonarEngine(this.maze);
    this.renderer = new RenderEngine(this.canvas, this.maze, this.sonar);
    this.renderer.resize();
  }

  private setupEvents(): void {
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.renderer.resize();
    });

    this.canvas.addEventListener('click', (e: MouseEvent) => {
      this.audio.init();
      this.audio.resume();

      if (this.maze.player.dead || this.maze.player.won) {
        this.initGame();
        this.gameStarted = true;
        this.audio.startAmbient();
        return;
      }

      if (!this.gameStarted) {
        this.gameStarted = true;
        this.audio.startAmbient();
        return;
      }

      const mx = e.clientX;
      const my = e.clientY;

      const freqBtn = this.renderer.getFrequencyButtonAt(mx, my);
      if (freqBtn !== null) {
        const freqs: Frequency[] = ['low', 'mid', 'high'];
        this.selectedFrequency = freqs[freqBtn];
        this.audio.playPulse(this.selectedFrequency);
        return;
      }

      const adj = this.maze.getAdjacentCell(mx, my);
      if (!adj) return;

      const dx = adj.gx - this.maze.player.gridX;
      const dy = adj.gy - this.maze.player.gridY;
      const isAdjacent = Math.abs(dx) + Math.abs(dy) === 1;

      if (isAdjacent) {
        const moved = this.maze.movePlayerTo(adj.gx, adj.gy);
        if (moved) {
          this.audio.playFootstep();
        }
      } else {
        const angle = this.maze.getClickDirection(mx, my);
        const pulse = this.sonar.emitPulse(
          this.maze.player.pixelX,
          this.maze.player.pixelY,
          angle,
          this.selectedFrequency
        );
        this.audio.playPulse(this.selectedFrequency);
        const hit = this.maze.findWallHit(this.maze.player.pixelX, this.maze.player.pixelY, angle);
        if (hit) {
          this.maze.addReflection(hit.hitX, hit.hitY, angle, hit.wallMaterial);
          const dist = Math.sqrt(
            (hit.hitX - this.maze.player.pixelX) ** 2 +
            (hit.hitY - this.maze.player.pixelY) ** 2
          );
          this.audio.playWallHit(hit.wallMaterial);
          const cell = this.maze.grid[hit.cellY]?.[hit.cellX];
          if (cell?.content?.type === 'chest' && !cell.content.collected) {
            this.maze.addChestReveal(hit.cellX, hit.cellY);
          }
        }
      }
    });

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.maze.player.moving || this.maze.player.dead || this.maze.player.won) return;
      let dx = 0, dy = 0;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': dy = -1; break;
        case 'ArrowDown': case 's': case 'S': dy = 1; break;
        case 'ArrowLeft': case 'a': case 'A': dx = -1; break;
        case 'ArrowRight': case 'd': case 'D': dx = 1; break;
        case '1': this.selectedFrequency = 'low'; this.audio.playPulse('low'); return;
        case '2': this.selectedFrequency = 'mid'; this.audio.playPulse('mid'); return;
        case '3': this.selectedFrequency = 'high'; this.audio.playPulse('high'); return;
        default: return;
      }
      const nx = this.maze.player.gridX + dx;
      const ny = this.maze.player.gridY + dy;
      const moved = this.maze.movePlayerTo(nx, ny);
      if (moved) {
        this.audio.init();
        this.audio.resume();
        this.audio.playFootstep();
      }
    });
  }

  private startLoop(): void {
    this.lastTime = performance.now();
    this.running = true;
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      this.update(dt);
      this.renderer.render(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private update(dt: number): void {
    if (!this.gameStarted) return;
    this.maze.update(dt);
    this.sonar.update(dt);

    const p = this.maze.player;
    if (!p.moving) {
      const cell = this.maze.grid[p.gridY]?.[p.gridX];
      if (cell?.content?.type === 'chest' && !cell.content.collected) {
        cell.content.collected = true;
        const hpMap: Record<string, number> = { normal: 10, rare: 20, legendary: 30 };
        p.hp = Math.min(p.maxHp, p.hp + hpMap[cell.content.chestType]);
        p.chestsCollected++;
        this.audio.playChestCollect(cell.content.chestType);
        if (p.chestsCollected >= this.maze.totalChests) {
          this.maze.exitOpen = true;
        }
      }
    }
  }
}

new Game();
