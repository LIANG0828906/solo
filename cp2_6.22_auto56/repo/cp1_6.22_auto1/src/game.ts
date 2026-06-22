import { Hero, Team, Position } from './hero';
import { Renderer } from './renderer';
import {
  BOARD_COLS,
  BOARD_ROWS,
  HeroConfig,
  HERO_CONFIGS,
  ENEMY_HERO_IDS
} from './config';

export enum GamePhase {
  PREPARING = 'preparing',
  FIGHTING = 'fighting',
  FINISHED = 'finished'
}

export interface GameState {
  phase: GamePhase;
  board: (Hero | null)[][];
  playerHeroes: Hero[];
  enemyHeroes: Hero[];
  winner: Team | null;
  round: number;
}

class Game {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private state: GameState;
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private selectedHero: Hero | null = null;
  private lastZoomTime: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.renderer = new Renderer(this.canvas);
    this.state = this.createInitialState();
    this.setupEventHandlers();
    this.spawnInitialEnemies();
    this.start();
  }

  private createInitialState(): GameState {
    const board: (Hero | null)[][] = [];
    for (let row = 0; row < BOARD_ROWS; row++) {
      board[row] = [];
      for (let col = 0; col < BOARD_COLS; col++) {
        board[row][col] = null;
      }
    }

    return {
      phase: GamePhase.PREPARING,
      board,
      playerHeroes: [],
      enemyHeroes: [],
      winner: null,
      round: 0
    };
  }

  private setupEventHandlers(): void {
    this.renderer.onHeroPlaced = (config: HeroConfig, pos: Position) => {
      this.placeHero(config, pos, 'player');
    };

    this.renderer.onStartBattle = () => {
      this.startBattle();
    };

    this.renderer.onReset = () => {
      this.reset();
    };

    this.renderer.onHeroClicked = (hero: Hero) => {
      this.onHeroClicked(hero);
    };
  }

  private spawnInitialEnemies(): void {
    const positions: Position[] = [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 3, col: 0 },
      { row: 0, col: 1 },
      { row: 2, col: 1 }
    ];

    for (let i = 0; i < ENEMY_HERO_IDS.length && i < positions.length; i++) {
      const config = HERO_CONFIGS.find(h => h.id === ENEMY_HERO_IDS[i]);
      if (config) {
        this.placeHero(config, positions[i], 'enemy');
      }
    }
  }

  private placeHero(config: HeroConfig, pos: Position, team: Team): boolean {
    if (this.state.phase !== GamePhase.PREPARING) return false;
    if (this.state.board[pos.row][pos.col] !== null) return false;

    const hero = new Hero(config, team, pos);
    hero.startPlaceAnimation();

    this.state.board[pos.row][pos.col] = hero;
    if (team === 'player') {
      this.state.playerHeroes.push(hero);
    } else {
      this.state.enemyHeroes.push(hero);
    }

    return true;
  }

  private _removeHero(hero: Hero): void {
    this.state.board[hero.position.row][hero.position.col] = null;
    if (hero.team === 'player') {
      this.state.playerHeroes = this.state.playerHeroes.filter(h => h.id !== hero.id);
    } else {
      this.state.enemyHeroes = this.state.enemyHeroes.filter(h => h.id !== hero.id);
    }
  }

  private onHeroClicked(hero: Hero): void {
    const now = performance.now();
    if (now - this.lastZoomTime < 500) return;
    this.lastZoomTime = now;

    if (this.selectedHero === hero) {
      this.selectedHero = null;
      this.renderer.resetCamera();
    } else {
      this.selectedHero = hero;
      this.renderer.zoomToHero(hero);
    }
  }

  private startBattle(): void {
    if (this.state.phase !== GamePhase.PREPARING) return;
    if (this.state.playerHeroes.length === 0) return;

    this.state.phase = GamePhase.FIGHTING;
    this.state.round = 0;
    this.renderer.resetCamera();
  }

  private reset(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.state = this.createInitialState();
    this.selectedHero = null;
    this.renderer.uiState.showResult = false;
    this.renderer.uiState.resultAnimationProgress = 0;
    this.renderer.resetCamera();
    this.spawnInitialEnemies();
    this.lastTime = performance.now();
    this.start();
  }

  private start(): void {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private gameLoop(currentTime: number): void {
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime, currentTime);
    this.render(currentTime);
  }

  private update(deltaTime: number, currentTime: number): void {
    this.renderer.update(deltaTime, currentTime);

    const allHeroes = [...this.state.playerHeroes, ...this.state.enemyHeroes];
    for (const hero of allHeroes) {
      hero.updatePlaceAnimation(deltaTime);
      hero.updateEffects(currentTime);
      hero.updateBuff(currentTime);
    }

    if (this.state.phase === GamePhase.FIGHTING) {
      this.updateBattle(deltaTime, currentTime);
    }
  }

  private updateBattle(_deltaTime: number, currentTime: number): void {
    const playerAlive = this.state.playerHeroes.filter(h => h.isAlive);
    const enemyAlive = this.state.enemyHeroes.filter(h => h.isAlive);

    if (playerAlive.length === 0 || enemyAlive.length === 0) {
      this.endBattle();
      return;
    }

    this.state.round++;

    const allHeroes = [...playerAlive, ...enemyAlive];

    for (const hero of allHeroes) {
      if (!hero.isAlive) continue;

      const allies = hero.team === 'player' ? this.state.playerHeroes : this.state.enemyHeroes;
      const enemies = hero.team === 'player' ? this.state.enemyHeroes : this.state.playerHeroes;

      if (hero.canUseSkill(currentTime)) {
        hero.useSkill(currentTime, allies, enemies);
      }

      if (hero.canAttack(currentTime)) {
        const target = hero.findTarget(enemies);
        if (target && hero.getDistance(target) <= hero.config.attackRange) {
          hero.performAttack(target, currentTime);
        }
      }
    }
  }

  private endBattle(): void {
    this.state.phase = GamePhase.FINISHED;

    const playerAlive = this.state.playerHeroes.filter(h => h.isAlive).length;
    const enemyAlive = this.state.enemyHeroes.filter(h => h.isAlive).length;

    if (playerAlive > 0 && enemyAlive === 0) {
      this.state.winner = 'player';
    } else if (enemyAlive > 0 && playerAlive === 0) {
      this.state.winner = 'enemy';
    } else {
      this.state.winner = playerAlive >= enemyAlive ? 'player' : 'enemy';
    }

    this.renderer.showResultAnimation(this.state.winner, playerAlive, enemyAlive);
  }

  private render(currentTime: number): void {
    const allHeroes = [...this.state.playerHeroes, ...this.state.enemyHeroes];
    this.renderer.render(allHeroes, currentTime, this.state.phase);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
