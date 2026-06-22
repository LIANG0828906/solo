import { TILE_SIZE, Particle } from './types';
import { GameMap } from './Map';
import { Player } from './Player';
import { Monster } from './Monster';
import { Renderer } from './Renderer';
import { audioManager } from './Audio';

class Game {
  private canvas: HTMLCanvasElement;
  private map: GameMap;
  private player: Player;
  private monsters: Monster[] = [];
  private renderer: Renderer;
  private lastTime: number = 0;
  private floor: number = 1;
  private gameOver: boolean = false;
  private keysPressed: Set<string> = new Set();
  private pendingNextFloor: boolean = false;
  private transitionComplete: boolean = false;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.map = new GameMap();
    this.player = new Player(this.map.getPlayerSpawn());
    this.renderer = new Renderer(this.canvas);
    
    this.spawnMonsters();
    this.bindEvents();
    this.renderer.triggerTransition('out');
    this.gameLoop(performance.now());
  }

  private spawnMonsters(): void {
    this.monsters = [];
    const spawnPoints = this.map.getMonsterSpawnPoints();
    for (const point of spawnPoints) {
      this.monsters.push(new Monster(point));
    }
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      if (this.gameOver) return;
      if (this.renderer.isTransitioning()) return;
      
      e.preventDefault();
      this.keysPressed.add(e.key.toLowerCase());
      this.handleInput(e.key.toLowerCase());
    });

    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.key.toLowerCase());
    });

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });
  }

  private handleInput(key: string): void {
    if (this.gameOver || this.player.isMoving()) return;

    let moved = false;

    switch (key) {
      case 'arrowup':
      case 'w':
        moved = this.player.move('up', this.map);
        break;
      case 'arrowdown':
      case 's':
        moved = this.player.move('down', this.map);
        break;
      case 'arrowleft':
      case 'a':
        moved = this.player.move('left', this.map);
        break;
      case 'arrowright':
      case 'd':
        moved = this.player.move('right', this.map);
        break;
      case ' ':
        this.handleAttack();
        break;
      case 'r':
        if (this.gameOver) {
          this.restart();
        }
        break;
    }

    if (moved) {
      this.checkChestParticles();
      this.checkExit();
    }
  }

  private handleAttack(): void {
    const attackResult = this.player.attack();
    if (attackResult.hit) {
      const playerPos = this.player.getPosition();
      const attackX = playerPos.x + attackResult.direction.x;
      const attackY = playerPos.y + attackResult.direction.y;

      for (const monster of this.monsters) {
        if (monster.isDead() || monster.isDying()) continue;
        const monsterPos = monster.getPosition();
        if (monsterPos.x === attackX && monsterPos.y === attackY) {
          monster.takeDamage(attackResult.direction, this.map);
          
          if (monster.isDying()) {
            this.player.addScore(50);
            this.spawnScoreParticles(monsterPos.x * TILE_SIZE + TILE_SIZE / 2, monsterPos.y * TILE_SIZE + TILE_SIZE / 2, 50);
          }
        }
      }
    }
  }

  private checkChestParticles(): void {
    for (const chest of this.map.getChests()) {
      if (chest.opening && chest.openProgress > 0.3 && chest.openProgress < 0.4) {
        this.spawnScoreParticles(chest.x * TILE_SIZE + TILE_SIZE / 2, chest.y * TILE_SIZE + TILE_SIZE / 2, 100);
      }
    }
  }

  private spawnScoreParticles(x: number, y: number, value: number): void {
    const colors = ['#f1c40f', '#f39c12', '#e74c3c', '#2ecc71', '#3498db'];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle: Particle = {
        x: x,
        y: y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3 - 2,
        life: 800,
        maxLife: 800,
        color: colors[Math.floor(Math.random() * colors.length)],
        value: i === 0 ? value : 0
      };
      this.renderer.addParticle(particle);
    }
  }

  private checkExit(): void {
    if (this.player.isAtExit(this.map)) {
      this.pendingNextFloor = true;
      this.renderer.triggerTransition('in');
      audioManager.playNextFloor();
    }
  }

  private nextFloor(): void {
    this.floor++;
    this.map.generate();
    this.player.reset(this.map.getPlayerSpawn());
    this.spawnMonsters();
    this.pendingNextFloor = false;
    this.transitionComplete = false;
    this.renderer.triggerTransition('out');
  }

  private restart(): void {
    this.floor = 1;
    this.gameOver = false;
    this.map.generate();
    this.player.reset(this.map.getPlayerSpawn());
    this.spawnMonsters();
    this.renderer.triggerTransition('out');
  }

  private gameLoop(currentTime: number): void {
    requestAnimationFrame((t) => this.gameLoop(t));

    const deltaTime = Math.min(currentTime - this.lastTime, 50);
    this.lastTime = currentTime;

    if (!this.gameOver) {
      this.update(deltaTime, currentTime);
    }

    this.renderer.render(this.map, this.player, this.monsters, currentTime, this.floor);

    if (this.gameOver) {
      this.renderGameOver();
    }
  }

  private update(deltaTime: number, currentTime: number): void {
    this.renderer.update(deltaTime);
    this.map.update(currentTime);
    this.player.update(deltaTime, this.map);

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      const result = monster.update(deltaTime, this.map, this.player);
      
      if (result.screenShake) {
        this.renderer.triggerScreenShake(200);
      }

      if (monster.isDead()) {
        this.monsters.splice(i, 1);
      }
    }

    if (this.player.getHealth() <= 0) {
      this.gameOver = true;
    }

    if (this.pendingNextFloor && !this.renderer.isTransitioning() && !this.transitionComplete) {
      this.transitionComplete = true;
      setTimeout(() => this.nextFloor(), 200);
    }

    this.checkHeldKeys();
  }

  private checkHeldKeys(): void {
    if (this.gameOver || this.player.isMoving() || this.renderer.isTransitioning()) return;

    for (const key of this.keysPressed) {
      let moved = false;
      switch (key) {
        case 'arrowup':
        case 'w':
          moved = this.player.move('up', this.map);
          break;
        case 'arrowdown':
        case 's':
          moved = this.player.move('down', this.map);
          break;
        case 'arrowleft':
        case 'a':
          moved = this.player.move('left', this.map);
          break;
        case 'arrowright':
        case 'd':
          moved = this.player.move('right', this.map);
          break;
      }
      if (moved) {
        this.checkChestParticles();
        this.checkExit();
        break;
      }
    }
  }

  private renderGameOver(): void {
    const ctx = this.canvas.getContext('2d')!;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 40);

    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText(`最终分数: ${this.player.getScore()}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
    ctx.fillText(`到达第 ${this.floor} 层`, this.canvas.width / 2, this.canvas.height / 2 + 45);

    ctx.fillStyle = '#aaa';
    ctx.font = '18px monospace';
    ctx.fillText('按 R 键重新开始', this.canvas.width / 2, this.canvas.height / 2 + 90);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
